/**
 * FILE: app/(auth)/packages/[id]/page.tsx
 *
 * PURPOSE:
 *   Detail page for a booked (managed) package. Shows package identity, cost,
 *   patient/campus details, session progress, and a Pay Now action for pending
 *   payment packages.
 *
 * LOGIC OVERVIEW:
 *   - Reads :id from params; finds the matching package in useManagedPackages().
 *   - Package name extracted from many2one package_id tuple via odooTuple.
 *   - Campus name extracted from many2one campus_id tuple.
 *   - Session lines (BookedPackageLineDto[]) show product name, speciality,
 *     status badge, and sequence number.
 *   - handlePayNow() calls initiatePackageOrder() to create a Razorpay Order, then
 *     opens Standard Checkout in-page via openRazorpayNative(). On success, refetches
 *     packages and navigates to /packages. Server-side confirmation via webhook.
 *   - Gradient hero header color is derived from getPackagePalette(booked_package_id).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   id          — booked_package_id from URL params
 *   pkg         — BookedPackageDto found from useManagedPackages
 *   payLoading  — tracks payment initiation state
 *   payError    — holds payment error message
 *   PackageDetailPage — default exported page
 *
 * DEPENDENCIES:
 *   useManagedPackages, initiatePackageOrder — from @/hooks/use-packages
 *   useAuth                                  — from @/hooks/use-auth
 *   openRazorpayNative                       — from @/lib/capacitor/razorpay
 *   odooTuple                                — from @/lib/odoo (safe many2one tuple access)
 *   BookedPackageLineDto                     — from @/sdk/backend-v2
 *
 * LAST UPDATED: 2026-05-08 — Branches Pay Now on NEXT_PUBLIC_PAYMENT_MODE (link redirect vs. in-app)
 */
"use client";

import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  ListOrdered,
  Loader2,
  MapPin,
  Package,
  PlayCircle,
  Stethoscope,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { BackButton } from "@/components/shared/navigation/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampuses } from "@/hooks/shared/campuses/use-campuses";
import { useAuth } from "@/hooks/use-auth";
import {
  initiatePackageOrder,
  initiatePackagePayment,
  useManagedPackages,
} from "@/hooks/use-packages";
import { openRazorpayNative } from "@/lib/capacitor/razorpay";
import { odooTuple } from "@/lib/odoo";
import { getPackagePalette } from "@/lib/package-colors";
import { isLinkMode } from "@/lib/payments/payment-mode";
import type { BookedPackageLineDto } from "@/sdk/backend-v2";

function getStageMeta(stage: string): { label: string; Icon: React.ElementType } {
  switch (stage) {
    case "in_progress":
      return { label: "Active", Icon: PlayCircle };
    case "confirm":
      return { label: "Confirmed", Icon: CheckCircle };
    case "booked":
      return { label: "Pending Payment", Icon: Clock };
    case "done":
      return { label: "Completed", Icon: CheckCircle2 };
    default:
      return { label: stage, Icon: Package };
  }
}

function getLineStatusBadge(status: string) {
  switch (status) {
    case "done":
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-green-50 text-green-700 border-green-200"
        >
          Done
        </Badge>
      );
    case "scheduled":
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-violet-50 text-violet-700 border-violet-200"
        >
          Scheduled
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"
        >
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          Open
        </Badge>
      );
  }
}

export default function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const { packages, isLoading, mutate: refetchPackages } = useManagedPackages();
  const { defaultCampusId } = useCampuses();
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const pkg = packages.find((p) => String(p.booked_package_id) === id);

  const handlePayNow = async () => {
    if (!pkg || !user?.lead_id) return;
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!rzpKey) {
      setPayError("Payment is not configured. Please contact support.");
      return;
    }
    setPayLoading(true);
    setPayError(null);
    try {
      // Link mode: hosted Razorpay Payment Link → redirect to short_url.
      if (isLinkMode()) {
        if (!defaultCampusId) {
          setPayError("Loading campus details. Please try again in a moment.");
          setPayLoading(false);
          return;
        }
        const envelope = await initiatePackagePayment({
          leadBookedPackageId: Number(pkg.booked_package_id),
          leadId: Number(user.lead_id),
          campusId: defaultCampusId,
        });
        const url = envelope.result?.short_url;
        if (!url) {
          setPayError("No payment link returned. Please try again.");
          setPayLoading(false);
          return;
        }
        window.location.href = url;
        return;
      }

      const order = await initiatePackageOrder({
        leadBookedPackageId: Number(pkg.booked_package_id),
        leadId: Number(user.lead_id),
      });

      const result = await openRazorpayNative({
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
        name: "Cadabam's Package",
        description: String(odooTuple(pkg.package_id, 1) ?? "Package"),
        prefill: {
          name: String(user.name ?? ""),
          email: user.email ? String(user.email) : undefined,
          contact: user.phone_number ? String(user.phone_number) : undefined,
        },
      });

      if (!result.success) {
        setPayError(result.error ?? "Payment was not completed.");
        setPayLoading(false);
        return;
      }

      await refetchPackages();
      router.replace("/packages");
    } catch (err: unknown) {
      setPayError((err as { message?: string })?.message ?? "Failed to process payment");
      setPayLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-52 w-full" />
        <div className="px-4 pt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <BackButton fallback="/packages" />
          <h1 className="text-xl font-bold text-foreground">Package Details</h1>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-lg font-semibold text-foreground">Package not found</p>
          <Button variant="outline" onClick={() => router.push("/packages")}>
            Back to Packages
          </Button>
        </div>
      </div>
    );
  }

  const palette = getPackagePalette(pkg.booked_package_id);
  const { label, Icon } = getStageMeta(pkg.package_stage);
  const packageName = String(odooTuple(pkg.package_id, 1) ?? "Package");
  const campusName = String(odooTuple(pkg.campus_id, 1) ?? "");
  const lines: BookedPackageLineDto[] = pkg.lines ?? [];
  const doneCount = lines.filter((l) => l.status === "done").length;

  const initials = packageName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className={`relative bg-gradient-to-br ${palette.gradient} pt-safe-top overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-6 w-48 h-48 rounded-full bg-white/5" />

        {/* Back button row */}
        <div className="relative flex items-center px-4 pt-4 pb-2">
          <BackButton fallback="/packages" className="text-white/80 hover:text-white" />
        </div>

        {/* Package identity */}
        <div className="relative px-5 pb-6 pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg text-white shrink-0">
              {initials}
            </div>
            <Badge
              className={`${palette.badgeBg} backdrop-blur-sm text-white border-0 hover:opacity-100 gap-1 text-xs font-semibold`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Badge>
          </div>
          <h1 className="text-white font-bold text-xl leading-snug mb-1">{packageName}</h1>
          <p className="text-white/60 text-xs">Booking #{pkg.booked_package_id}</p>
        </div>

        {/* Stats strip */}
        <div className="relative grid grid-cols-2 bg-black/10 border-t border-white/10 divide-x divide-white/10">
          <div className="flex items-center gap-2 px-5 py-3">
            <IndianRupee className="w-4 h-4 text-white/70 shrink-0" />
            <div>
              <p className="text-white font-bold text-base leading-tight">
                ₹{pkg.package_cost.toLocaleString("en-IN")}
              </p>
              <p className="text-white/60 text-[10px]">Package cost</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-5 py-3">
            <Calendar className="w-4 h-4 text-white/70 shrink-0" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">{pkg.date}</p>
              <p className="text-white/60 text-[10px]">Booked on</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="px-4 pt-4 pb-36 space-y-3">
        {/* Patient / Campus details */}
        {(campusName || pkg.patient_name || pkg.caller_name) && (
          <Card>
            <CardContent className="p-4 space-y-2.5">
              {campusName && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Campus
                    </p>
                    <p className="text-sm font-semibold text-foreground">{campusName}</p>
                  </div>
                </div>
              )}
              {campusName && (pkg.patient_name || pkg.caller_name) && <Separator />}
              {pkg.patient_name && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      Patient
                    </p>
                    <p className="text-sm font-semibold text-foreground">{pkg.patient_name}</p>
                  </div>
                </div>
              )}
              {pkg.caller_name && pkg.caller_name !== pkg.patient_name && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Booked by
                      </p>
                      <p className="text-sm font-semibold text-foreground">{pkg.caller_name}</p>
                    </div>
                  </div>
                </>
              )}
              {pkg.sequence_booking !== undefined && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                      <ListOrdered className="w-4 h-4 text-teal-600" />
                    </div>
                    <p className="text-sm text-foreground">
                      {pkg.sequence_booking
                        ? "Sequential booking enabled"
                        : "Flexible booking order"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sessions */}
        {lines.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Sessions</p>
                <Badge variant="secondary" className="text-xs font-medium">
                  {doneCount}/{lines.length} done
                </Badge>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${Math.round((doneCount / lines.length) * 100)}%` }}
                />
              </div>
              <div className="space-y-1">
                {lines.map((line, i) => (
                  <div
                    key={line.line_id ?? i}
                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-[11px] font-bold text-muted-foreground">
                      {line.sequence_no ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {String(odooTuple(line.product_id, 1) ?? "")}
                      </p>
                      {line.speciality_id && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Stethoscope className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {String(line.speciality_id?.[1] ?? "")}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getLineStatusBadge(line.status)}
                      {line.price_subtotal > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <IndianRupee className="w-2.5 h-2.5" />
                          {line.price_subtotal.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {payError && (
          <div className="flex items-center gap-2 text-destructive text-sm rounded-xl bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {payError}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-background/95 backdrop-blur border-t border-border space-y-2">
        {pkg.package_stage === "booked" && (
          <Button
            className={`w-full rounded-full h-12 text-base font-semibold gap-2 bg-gradient-to-r ${palette.ctaGradient} border-0 text-white`}
            onClick={handlePayNow}
            disabled={payLoading}
          >
            {payLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            {payLoading ? "Opening Razorpay…" : `Pay ₹${pkg.package_cost.toLocaleString("en-IN")}`}
          </Button>
        )}

        {(pkg.package_stage === "confirm" || pkg.package_stage === "in_progress") && (
          <Button
            className={`w-full rounded-full h-12 text-base font-semibold gap-2 bg-gradient-to-r ${palette.ctaGradient} border-0 text-white`}
            onClick={() => router.push("/consult/find-therapist")}
          >
            <CalendarPlus className="h-5 w-5" />
            Book a Session
          </Button>
        )}
      </div>
    </div>
  );
}
