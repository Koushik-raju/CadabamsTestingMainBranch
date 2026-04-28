/**
 * FILE: app/(auth)/prescriptions/page.tsx
 *
 * PURPOSE:
 *   Displays the current patient's prescription list fetched from the CRM SDK.
 *
 * LOGIC OVERVIEW:
 *   1. Calls usePrescriptions() to fetch a flat PrescriptionItemDto[] via SWR.
 *   2. Renders loading skeletons, error alert, empty state, or grouped list card.
 *   3. On "Download PDF" tap, opens the prescription's download_url in a new tab.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   prescriptions — PrescriptionItemDto[] from usePrescriptions hook
 *   handleDownload — opens download_url for the tapped prescription
 *
 * DEPENDENCIES:
 *   usePrescriptions — SWR hook backed by crmControllerGetPrescriptions
 *   PrescriptionCard — renders a single prescription row
 *   PageHeader       — shared navigation header
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */

"use client";

import { PrescriptionCard } from "@/components/prescription/prescription-card";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrescriptions } from "@/hooks/prescriptions/use-prescriptions";
import type { PrescriptionItemDto } from "@/sdk/backend-v2";
import dayjs from "dayjs";
import { AlertCircle, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrescriptionsPage() {
  const router = useRouter();
  const { prescriptions, isLoading, error, mutate } = usePrescriptions();

  const handleDownload = (prescription: PrescriptionItemDto) => {
    if (prescription.download_url) {
      window.open(prescription.download_url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="My Prescriptions"
        subtitle={dayjs().format("ddd, DD MMM YYYY")}
        fallback="/home"
      />

      <div className="px-4">
        {/* Loading skeletons */}
        {isLoading && (
          <Card>
            <CardContent className="py-0 px-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 py-3">
                    <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3 rounded" />
                      <Skeleton className="h-3 w-1/3 rounded" />
                    </div>
                    <Skeleton className="w-28 h-8 rounded-xl" />
                  </div>
                  {i < 3 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {!isLoading && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              Failed to load prescriptions. Please try again.
              <Button size="sm" variant="outline" onClick={() => mutate()} className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty */}
        {!isLoading && !error && prescriptions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No Prescriptions Found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Your prescriptions will appear here after your doctor consultations.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/home")}>
              Go Home
            </Button>
          </div>
        )}

        {/* Grouped prescription list */}
        {!isLoading && !error && prescriptions.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">Prescriptions</h2>
              <span className="text-xs text-muted-foreground">{prescriptions.length} total</span>
            </div>
            <Card>
              <CardContent className="py-0 px-3">
                {prescriptions.map((prescription, index) => (
                  <div key={prescription.id ?? index}>
                    <PrescriptionCard
                      prescription={prescription}
                      index={index}
                      onDownload={() => handleDownload(prescription)}
                    />
                    {index < prescriptions.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
