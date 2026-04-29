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
 *   3. Optionally fetches journey description.
 *   4. On confirm: calls bookPackage then initiatePackagePayment, then redirects to short_url.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   pkg          — PackageResponseDto from sessionStorage
 *   packageId    — URL param, used to validate stored package
 *   isLoading    — payment processing state
 *
 * DEPENDENCIES:
 *   bookPackage, initiatePackagePayment — from @/hooks/use-packages
 *   useAuth — user identity
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { bookPackage, initiatePackagePayment } from "@/hooks/use-packages";
import type { PackageResponseDto } from "@/sdk/backend-v2";
import { BookOpen, CreditCard, IndianRupee, Loader2, Package, Shield } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

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

function BookPackageContent({ packageId }: { packageId: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const [pkg, setPkg] = useState<PackageResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
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

  const description = useMemo(() => extractDescription(journeyData), [journeyData]);

  const handleCheckout = async () => {
    if (!pkg || !user?.lead_id) return;
    setIsLoading(true);
    setError(null);
    try {
      const patientName = String(user.name ?? "");
      const { booking_id } = await bookPackage({
        package_id: pkg.id,
        caller_name: patientName,
        patient_name: patientName,
        lead_id: Number(user.lead_id),
        campus_id: 1,
        sequence_booking: false,
        package_stage: "booked",
        payment_mode: "online",
        date: new Date().toISOString().split("T")[0],
      });
      const payData = await initiatePackagePayment({
        leadBookedPackageId: booking_id,
        leadId: Number(user.lead_id),
      });
      window.location.href = payData.result.short_url;
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
