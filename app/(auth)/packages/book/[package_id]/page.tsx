/**
 * FILE: app/(auth)/packages/book/[package_id]/page.tsx
 *
 * PURPOSE:
 *   Package booking confirmation page reached from /packages/browse/:id.
 *   Reads the selected package from sessionStorage and processes payment.
 *
 * LOGIC OVERVIEW:
 *   1. Reads packageId from URL param and validates against sessionStorage package.
 *   2. If mismatch, redirects to /packages/book-package.
 *   3. If the package has a journey_document_id, fetches the journey via SDK
 *      (cmsJourneysControllerGetById) for the overview description.
 *   4. On confirm: calls bookPackage, then initiatePackageOrder to create a
 *      Razorpay Order, then opens Razorpay Standard Checkout in-page via
 *      openRazorpayNative (web SDK or Capacitor plugin).
 *   5. On success: refetches packages and routes to /packages. Server-side
 *      payment confirmation is handled by Razorpay → backend webhook.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   pkg          — PackageResponseDto from sessionStorage
 *   packageId    — URL param, used to validate stored package
 *   isLoading    — payment processing state
 *
 * DEPENDENCIES:
 *   bookPackage, initiatePackageOrder — from @/hooks/use-packages
 *   openRazorpayNative — @/lib/capacitor/razorpay (web + native checkout)
 *   useJourneyDetail — SWR wrapper around cmsJourneysControllerGetById
 *   extractJourneyDescription — flattens Strapi rich-text to plain string
 *   useAuth — user identity
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-05-08 — Migrated from Razorpay payment-link redirect to Razorpay Order + Standard Checkout
 */
"use client";

import { BookOpen, CreditCard, IndianRupee, Loader2, Package, Shield } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useJourneyDetail } from "@/hooks/journeys/use-journey-detail";
import { useCampuses } from "@/hooks/shared/campuses/use-campuses";
import { useAuth } from "@/hooks/use-auth";
import { bookPackage, initiatePackageOrder, useManagedPackages } from "@/hooks/use-packages";
import { openRazorpayNative } from "@/lib/capacitor/razorpay";
import type { PackageResponseDto } from "@/sdk/backend-v2";
import { extractJourneyDescription } from "@/types/journey";

function getPackageFromSession(): PackageResponseDto | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("selected_package");
    return raw ? (JSON.parse(raw) as PackageResponseDto) : null;
  } catch {
    return null;
  }
}

function BookPackageContent({ packageId }: { packageId: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const [pkg, setPkg] = useState<PackageResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getPackageFromSession();
    if (stored && String(stored.id) === packageId) {
      setPkg(stored);
    } else {
      router.replace("/packages/book-package");
    }
  }, [packageId, router]);

  const journeyId =
    ((pkg as Record<string, unknown> | null)?.journey_document_id as string | null) ?? null;

  const { journey, isLoading: journeyLoading } = useJourneyDetail(journeyId);
  const description = extractJourneyDescription(journey?.description);

  const { mutate: refetchPackages } = useManagedPackages();
  const { defaultCampusId } = useCampuses();

  const handleCheckout = async () => {
    if (!pkg || !user?.lead_id) return;
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!rzpKey) {
      setError("Payment is not configured. Please contact support.");
      return;
    }
    if (!defaultCampusId) {
      setError("Loading campus details. Please try again in a moment.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const patientName = String(user.name ?? "");
      const { booking_id } = await bookPackage({
        package_id: pkg.id,
        caller_name: patientName,
        patient_name: patientName,
        lead_id: Number(user.lead_id),
        campus_id: defaultCampusId,
        sequence_booking: false,
        package_stage: "booked",
        payment_mode: "online",
        date: new Date().toISOString().split("T")[0],
      });

      const order = await initiatePackageOrder({
        leadBookedPackageId: booking_id,
        leadId: Number(user.lead_id),
      });

      /*
       * Standard Checkout opens an in-page modal (web) or native sheet
       * (Capacitor). Server-side payment confirmation is handled by the
       * Razorpay → backend webhook; the new /razorpay/order/callback path
       * is not yet exposed via the SDK, so we don't call it here.
       */
      const result = await openRazorpayNative({
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        name: pkg.package_name,
        description: `Package #${pkg.id}`,
        prefill: {
          name: patientName,
          email: user.email ? String(user.email) : undefined,
          contact: user.phone_number ? String(user.phone_number) : undefined,
        },
      });

      if (!result.success) {
        setError(result.error ?? "Payment was not completed.");
        return;
      }

      await refetchPackages();
      router.replace("/packages");
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? "Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  if (!pkg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background pb-24">
      <PageHeader
        title="Book Package"
        subtitle="Review and confirm your selection"
        fallback={`/packages/browse/${packageId}`}
      />

      <div className="px-4 space-y-4">
        <Card className="border-border">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground">{pkg.package_name}</h2>
                <p className="text-sm text-muted-foreground">ID: #{pkg.id}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-xl">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Total Amount</p>
                  <p className="text-xs text-muted-foreground">Inclusive of all charges</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-primary">
                ₹{pkg.amount_total.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-3xl bg-muted/50">
              <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Secure Payment</p>
                <p className="text-xs text-muted-foreground">
                  Your payment is processed securely through Razorpay. We do not store your card
                  details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(journeyId || journeyLoading || description) && (
          <Card className="border-border">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Journey Overview</h3>
              </div>
              {journeyLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                  <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              ) : description ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Journey description is unavailable for this package.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-foreground mb-3">Payment Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Package Cost</span>
              <span className="text-foreground">₹{pkg.amount_total.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxes &amp; Fees</span>
              <span className="text-foreground">Included</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">Total Amount</span>
              <span className="text-primary text-lg">
                ₹{pkg.amount_total.toLocaleString("en-IN")}
              </span>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button size="lg" className="w-full gap-2" onClick={handleCheckout} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay ₹{pkg.amount_total.toLocaleString("en-IN")}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center pb-4">
          By proceeding, you agree to our terms and conditions.
          <br />
          Secure payment powered by Razorpay.
        </p>
      </div>
    </div>
  );
}

export default function BookPackagePage() {
  const params = useParams();
  const packageId = params.package_id as string;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <BookPackageContent packageId={packageId} />
    </Suspense>
  );
}
