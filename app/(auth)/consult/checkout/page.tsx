/**
 * FILE: app/(auth)/consult/checkout/page.tsx
 *
 * PURPOSE:
 *   Checkout page for booking a consultation slot. Shows booking summary,
 *   payment amount, and processes payment via Razorpay.
 *
 * LOGIC OVERVIEW:
 *   1. Reads slotId, doctorId, and booking params from BookingContext.
 *   2. Fetches doctor details and slot price in parallel on mount.
 *   3. Opens a bottom sheet to select who the appointment is for (self or a relation).
 *   4. On confirm, calls crmControllerBookAppointment then crmControllerRazorpayPayment.
 *   5. Redirects to Razorpay short_url on success.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   doctor           — fetched CrmControllerGetDoctorByIdResponse
 *   price            — slot price in INR
 *   selectedRelation — chosen RelationshipResponseDto from the sheet
 *   CheckoutContent  — inner component wrapped in Suspense
 *
 * DEPENDENCIES:
 *   crmControllerGetDoctorById, crmControllerGetSlotPrice,
 *   crmControllerBookAppointment, crmControllerRazorpayPayment,
 *   crmControllerGetRelationships — SDK calls
 *   useBooking — BookingContext hook for slot/doctor/campus IDs
 *   PageHeader — shared navigation header
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import {
  AlertCircle,
  Check,
  ChevronRight,
  CreditCard,
  Loader2,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BookingSummaryCard } from "@/components/checkout/booking-summary-card";
import { PaymentSummaryCard } from "@/components/checkout/payment-summary-card";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useBooking } from "@/contexts/booking-context";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import type { CrmControllerGetDoctorByIdResponse, RelationshipResponseDto } from "@/sdk/backend-v2";
import {
  crmControllerBookAppointment,
  crmControllerGetDoctorById,
  crmControllerGetRelationships,
  crmControllerGetSlotPrice,
  crmControllerRazorpayPayment,
} from "@/sdk/backend-v2";

function _displayName(doctor: CrmControllerGetDoctorByIdResponse | null): string {
  if (!doctor) return "Doctor";
  const raw = (doctor.name || "").trim();
  const name = raw.includes(",") ? raw.split(",").pop()!.trim() : raw;
  return /^Dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

function isSelf(relation: RelationshipResponseDto): boolean {
  return relation.name.toLowerCase() === "self";
}

function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { slotId, doctorId, campusId, subCampusId, consultationTypeId, startDatetime } =
    useBooking();

  const [doctor, setDoctor] = useState<CrmControllerGetDoctorByIdResponse | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Relation sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStep, setSheetStep] = useState<"relation" | "name">("relation");
  const [relations, setRelations] = useState<RelationshipResponseDto[]>([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationsError, setRelationsError] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<RelationshipResponseDto | null>(null);
  const [patientNameInput, setPatientNameInput] = useState("");

  const isOnline = consultationTypeId === 2;

  useEffect(() => {
    if (!slotId || !doctorId) {
      router.replace("/find-therapist");
      return;
    }
    Promise.all([
      crmControllerGetDoctorById({ path: { id: doctorId } }),
      crmControllerGetSlotPrice({ path: { id: slotId } }),
    ])
      .then(([docRes, priceRes]) => {
        setDoctor(docRes.data ?? null);
        setPrice(priceRes.data?.price ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slotId, doctorId, router]);

  const openRelationSheet = () => {
    setSheetStep("relation");
    setSelectedRelation(null);
    setPatientNameInput("");
    setSheetOpen(true);

    if (relations.length === 0) {
      setRelationsLoading(true);
      setRelationsError(false);
      crmControllerGetRelationships({})
        .then((res) => setRelations(res.data ?? []))
        .catch(() => setRelationsError(true))
        .finally(() => setRelationsLoading(false));
    }
  };

  const handleRelationSelect = (relation: RelationshipResponseDto) => {
    setSelectedRelation(relation);
    if (isSelf(relation)) {
      // Book immediately with user's own name
      proceedWithBooking(user?.name ?? "", relation);
    } else {
      setSheetStep("name");
    }
  };

  const handleNameConfirm = () => {
    if (!patientNameInput.trim() || !selectedRelation) return;
    proceedWithBooking(patientNameInput.trim(), selectedRelation);
  };

  const proceedWithBooking = async (patientName: string, relation: RelationshipResponseDto) => {
    if (!slotId) return;
    setSheetOpen(false);
    setProcessing(true);
    setError(null);
    try {
      const resolvedCampusId = campusId ?? 1;
      const leadId = user?.lead_id ? Number(user.lead_id) : 0;
      const uid = user?.sub ?? "";
      const callerName = user?.name ?? "";

      await crmControllerBookAppointment({
        body: {
          slot_id: slotId,
          lead_id: leadId,
          campus_id: resolvedCampusId,
          sub_campus_id: subCampusId ?? undefined,
          consultation_type_id: consultationTypeId,
          caller_name: callerName,
          patient_name: patientName,
          appointment_type: "individual_appointment",
          payment_mode: "online",
        },
      });

      const payRes = await crmControllerRazorpayPayment({
        body: {
          slot_id: slotId,
          campus_id: resolvedCampusId,
          lead_id: leadId,
          uid,
        },
      });

      if (!payRes.data?.result.short_url)
        throw new Error("Payment initiation failed — no payment link received.");

      window.location.href = payRes.data?.result.short_url;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Payment initiation failed. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background">
      <PageHeader title="Confirm & Pay" fallback="/consult/find-therapist" />

      <div className="px-4 py-5 pb-32 max-w-2xl mx-auto space-y-4">
        <BookingSummaryCard doctor={doctor} startDatetime={startDatetime} isOnline={isOnline} />

        <PaymentSummaryCard price={price} />

        {user && (
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {String(user.caller_name ?? user.name ?? "You")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {String(user.caller_mobile ?? user.phone_number ?? "")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border space-y-2">
        <Button
          className="w-full rounded-full h-12 text-base font-semibold gap-2"
          disabled={processing || price === null}
          onClick={openRelationSheet}
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5" />
          )}
          {processing ? "Redirecting to Razorpay…" : `Pay ${price !== null ? `₹${price}` : ""}`}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Secured by Razorpay · 256-bit SSL
        </p>
      </div>

      {/* Relation / patient name sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8">
          {sheetStep === "relation" ? (
            <>
              <SheetHeader className="px-4 pb-3">
                <SheetTitle className="text-base font-bold text-foreground">
                  Who is this appointment for?
                </SheetTitle>
              </SheetHeader>

              {relationsLoading ? (
                <div className="px-4 space-y-0">
                  <Card>
                    <CardContent className="py-0 px-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-3 py-3">
                            <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                            <Skeleton className="h-4 w-32 rounded" />
                          </div>
                          {i < 3 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : relationsError ? (
                <div className="px-4 flex flex-col items-center gap-3 py-8 text-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">Failed to load options.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRelationsError(false);
                      setRelationsLoading(true);
                      crmControllerGetRelationships({})
                        .then((res) => setRelations(res.data ?? []))
                        .catch(() => setRelationsError(true))
                        .finally(() => setRelationsLoading(false));
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="px-4">
                  <Card>
                    <CardContent className="py-0 px-3">
                      {relations.map((relation, i) => (
                        <div key={relation.id}>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 py-3 transition-colors hover:bg-muted/50 active:bg-muted"
                            onClick={() => handleRelationSelect(relation)}
                          >
                            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-[var(--sh-1)]">
                              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="flex-1 text-sm font-medium text-foreground text-left">
                              {relation.name}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </button>
                          {i < relations.length - 1 && <Separator />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <>
              <SheetHeader className="px-4 pb-3">
                <SheetTitle className="text-base font-bold text-foreground">
                  Patient's name
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Enter the name of the {selectedRelation?.name.toLowerCase()} you are booking for.
                </p>
              </SheetHeader>

              <div className="px-4 space-y-4">
                <Input
                  placeholder="Full name"
                  value={patientNameInput}
                  onChange={(e) => setPatientNameInput(e.target.value)}
                  className="rounded-xl h-12"
                  autoFocus
                />
                <Button
                  className="w-full rounded-full h-12 text-base font-semibold gap-2"
                  disabled={!patientNameInput.trim()}
                  onClick={handleNameConfirm}
                >
                  <Check className="w-5 h-5" />
                  Confirm &amp; Pay
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground py-1 hover:text-foreground transition-colors"
                  onClick={() => setSheetStep("relation")}
                >
                  ← Back
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
