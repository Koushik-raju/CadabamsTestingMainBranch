'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, User2, Eye, Download, Pill, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import type { Prescription } from '@/types/package';

interface PrescriptionCardProps {
  prescription: Prescription;
  index: number;
  onView: () => void;
  onDownload: () => void;
  downloadingId?: number | null;
}

function getStateBadgeVariant(state?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (state?.toLowerCase()) {
    case 'active':
      return 'default';
    case 'expired':
      return 'destructive';
    case 'pending':
      return 'outline';
    default:
      return 'secondary';
  }
}

export function PrescriptionCard({
  prescription,
  index,
  onView,
  onDownload,
  downloadingId,
}: PrescriptionCardProps) {
  const displayName = prescription.display_name ?? prescription.name ?? `Prescription #${index + 1}`;
  const isDownloading = downloadingId === prescription.id;

  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground leading-snug flex-1 min-w-0">
            {displayName}
          </CardTitle>
          {prescription.state && (
            <Badge variant={getStateBadgeVariant(prescription.state)} className="shrink-0 capitalize text-xs">
              {prescription.state}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {prescription.date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>{dayjs(prescription.date).format('DD MMM YYYY')}</span>
            </div>
          )}
          {prescription.doctor && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User2 className="w-4 h-4 shrink-0" />
              <span>{prescription.doctor[1]}</span>
            </div>
          )}
          {prescription.prescription_line && prescription.prescription_line.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pill className="w-4 h-4 shrink-0" />
              <span>
                {prescription.prescription_line.length}{' '}
                {prescription.prescription_line.length === 1 ? 'medicine' : 'medicines'} prescribed
              </span>
            </div>
          )}
        </div>

        {!prescription.prescription_line?.length && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-muted-foreground text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            No medicines listed
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={onDownload}
            disabled={isDownloading}
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={onView}
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
