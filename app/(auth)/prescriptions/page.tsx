'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/shared/navigation/back-button';
import { PrescriptionCard } from '@/components/prescription/prescription-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ClipboardList, AlertCircle } from 'lucide-react';
import { usePrescriptions } from '@/hooks/prescriptions/use-prescriptions';
import { BASE_URL_HOS } from '@/config/env';
import dayjs from 'dayjs';
import type { Prescription } from '@/types/package';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { prescriptions, isLoading, error, mutate } = usePrescriptions();

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleView = (prescription: Prescription) => {
    if (prescription.prescription_line && prescription.prescription_line.length > 0) {
      const ids = prescription.prescription_line.join(',');
      router.push(`/prescription-overview?lineItems=${ids}`);
    } else {
      router.push('/prescription-overview');
    }
  };

  const handleDownload = async (prescription: Prescription) => {
    if (!prescription.id) return;
    try {
      setDownloadingId(prescription.id);
      setDownloadError(null);
      const url = `${BASE_URL_HOS}/download/prescription/form/${prescription.id}`;
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setDownloadError('Failed to download prescription. Please try again.');
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <BackButton fallback="/home" />
          <div>
            <h1 className="text-xl font-bold text-foreground">My Prescriptions</h1>
            <p className="text-sm text-muted-foreground">{dayjs().format('ddd, DD MMM YYYY')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Download error */}
        {downloadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{downloadError}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading prescriptions...</p>
          </div>
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
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">No Prescriptions Found</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your prescriptions will appear here after your doctor consultations.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/home')}>
              Go Home
            </Button>
          </div>
        )}

        {/* Prescription list */}
        {!isLoading && !error && prescriptions.length > 0 && (
          <div className="space-y-3">
            {prescriptions.map((prescription, index) => (
              <PrescriptionCard
                key={prescription.id ?? index}
                prescription={prescription}
                index={index}
                onView={() => handleView(prescription)}
                onDownload={() => handleDownload(prescription)}
                downloadingId={downloadingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
