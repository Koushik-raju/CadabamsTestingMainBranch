/**
 * FILE: app/(auth)/packages/selected-package/page.tsx
 *
 * PURPOSE:
 *   Package checkout confirmation page. Reads the selected package from
 *   sessionStorage, optionally fetches a journey description, and processes
 *   payment via Razorpay.
 *
 * LOGIC OVERVIEW:
 *   1. Reads package from sessionStorage on mount; redirects to /packages/book-package if absent.
 *   2. Optionally fetches a journey description from the JOURNEY_BASE_URL if journeyId is set.
 *   3. On confirm: calls bookPackage, then branches on NEXT_PUBLIC_PAYMENT_MODE —
 *      link mode redirects to a hosted short_url, inapp mode opens Razorpay
 *      Standard Checkout via openRazorpayNative.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   pkg          — PackageResponseDto from sessionStorage
 *   journeyData  — optional journey description fetched from CMS
 *   isLoading    — payment processing state
 *
 * DEPENDENCIES:
 *   bookPackage, initiatePackagePayment — from @/hooks/packages/use-packages
 *   useAuth — user identity for lead_id and caller_name
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-05-08 — Branches on NEXT_PUBLIC_PAYMENT_MODE: link redirect vs. Standard Checkout
 */
"use client";

import { BookOpen, CreditCard, IndianRupee, Loader2, Package, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  bookPackage,
  initiatePackageOrder,
  initiatePackagePayment,
  useManagedPackages,
} from "@/hooks/packages/use-packages";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { useCampuses } from "@/hooks/shared/campuses/use-campuses";
import { openRazorpayNative } from "@/lib/capacitor/razorpay";
import { isLinkMode } from "@/lib/payments/payment-mode";
import type { PackageResponseDto } from "@/sdk/backend-v2";

const JOURNEY_BASE_URL = "https://mindtalkbuddy.com/api/mindful-journeys";

function getPackageFromSession(): PackageResponseDto | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("selected_package");
    return raw ? (JSON.parse(raw) as PackageResponseDto) : null;
  } catch {
    return null;
  }
}

interface JourneyData {
  attributes?: {
    description?: unknown;
    summary?: unknown;
    shortDescription?: unknown;
    overview?: unknown;
  };
  description?: unknown;
  summary?: unknown;
  shortDescription?: unknown;
  overview?: unknown;
}

function flattenText(val: unknown, depth = 0): string {
  if (depth > 5 || !val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val))
    return val
      .map((v) => flattenText(v, depth + 1))
      .filter(Boolean)
      .join("\n")
      .trim();
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (obj.type === "text" && obj.text) return String(obj.text);
    if (obj.children) return flattenText(obj.children, depth + 1);
    return Object.values(obj)
      .map((v) => flattenText(v, depth + 1))
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return "";
}

function extractDescription(data: JourneyData | null): string {
  if (!data) return "";
  const src = data.attributes ?? data;
  for (const key of ["description", "summary", "shortDescription", "overview"] as const) {
    const text = flattenText((src as Record<string, unknown>)[key]);
    if (text) return text;
  }
  return "";
}

function SelectedPackageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [pkg, setPkg] = useState<PackageResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getPackageFromSession();
    if (!stored) {
      router.replace("/packages/book-package");
    } else {
      setPkg(stored);
    }
  }, [router]);

  const journeyId =
    searchParams.get("journeyId") ??
    ((pkg as Record<string, unknown> | null)?.journey_document_id as string | null) ??
    ((pkg as Record<string, unknown> | null)?.journey_id
      ? String((pkg as Record<string, unknown>).journey_id)
      : null);

  useEffect(() => {
    if (!journeyId) return;
    let cancelled = false;
    (async () => {
      setJourneyLoading(true);
      try {
        const res = await fetch(`${JOURNEY_BASE_URL}/${encodeURIComponent(journeyId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { data?: JourneyData };
        if (!cancelled) setJourneyData(json.data ?? null);
      } catch {
        if (!cancelled) setJourneyData(null);
      } finally {
        if (!cancelled) setJourneyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [journeyId]);

  const { mutate: refetchPackages } = useManagedPackages();
  const { defaultCampusId } = useCampuses();

  const description = useMemo(() => extractDescription(journeyData), [journeyData]);

  const handleCheckout = async () => {
    if (!pkg || !user?.lead_id) return;
    if (!defaultCampusId) {
      setError("Loading campus details. Please try again in a moment.");
      return;
    }
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    setIsLoading(true);
    setError(null);
    try {
      const patientName = String(user.name ?? "");
      const leadId = Number(user.lead_id);

      const { booking_id } = await bookPackage({
        package_id: pkg.id,
        caller_name: patientName,
        patient_name: patientName,
        lead_id: leadId,
        campus_id: defaultCampusId,
        sequence_booking: false,
        package_stage: "booked",
        payment_mode: "online",
        date: new Date().toISOString().split("T")[0],
      });

      // Link mode: fetch a hosted Payment Link and redirect.
      if (isLinkMode()) {
        const payData = await initiatePackagePayment({
          leadBookedPackageId: booking_id,
          leadId,
          campusId: defaultCampusId,
        });
        await refetchPackages();
        if (!payData.result?.short_url) {
          setError("No payment link returned. Please try again.");
          setIsLoading(false);
          return;
        }
        window.location.href = payData.result.short_url;
        return;
      }

      // In-app mode: create an Order and open Standard Checkout.
      if (!rzpKey) {
        setError("Payment is not configured. Please contact support.");
        setIsLoading(false);
        return;
      }
      const order = await initiatePackageOrder({
        leadBookedPackageId: booking_id,
        leadId,
      });
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
        setIsLoading(false);
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
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Package Details"
        subtitle="Review and confirm your selection"
        fallback="/packages/book-package"
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

export default function SelectedPackagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SelectedPackageContent />
    </Suspense>
  );
}
