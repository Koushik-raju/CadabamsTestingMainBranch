/**
 * FILE: components/prescription/prescription-card.tsx
 *
 * PURPOSE:
 *   Renders a single prescription as a list row inside a grouped card.
 *
 * LOGIC OVERVIEW:
 *   Displays a gradient PDF icon tile, prescription name, and formatted date.
 *   Renders a "Download PDF" button that opens download_url in a new tab.
 *   Falls back to a disabled state when no download_url is present.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   prescription — PrescriptionItemDto from the CRM SDK
 *   index        — used for fallback display name
 *   onDownload   — callback that opens the prescription PDF
 *
 * DEPENDENCIES:
 *   @/sdk/backend-v2 — PrescriptionItemDto type
 *   dayjs            — date formatting
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { GlyphTile } from "@/components/shared/glyph-tile";
import { Button } from "@/components/ui/button";
import type { PrescriptionItemDto } from "@/sdk/backend-v2";
import dayjs from "dayjs";
import { Download, FileText } from "lucide-react";

interface PrescriptionCardProps {
  prescription: PrescriptionItemDto;
  index: number;
  onDownload: () => void;
}

export function PrescriptionCard({ prescription, index, onDownload }: PrescriptionCardProps) {
  const displayName = prescription.name || `Prescription #${index + 1}`;
  const hasDownload = Boolean(prescription.download_url);

  return (
    <div className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/50 active:bg-muted">
      <GlyphTile icon={FileText} tint="pink" />

      {/* Name + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
        {prescription.create_date && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayjs(prescription.create_date).format("DD MMM YYYY")}
          </p>
        )}
        {prescription.source && (
          <p className="text-xs text-muted-foreground truncate">{prescription.source}</p>
        )}
      </div>

      {/* Download CTA */}
      <Button
        size="sm"
        variant={hasDownload ? "default" : "outline"}
        disabled={!hasDownload}
        onClick={onDownload}
        className="flex-shrink-0 gap-1.5 rounded-xl text-xs"
      >
        <Download className="w-3.5 h-3.5" />
        Download PDF
      </Button>
    </div>
  );
}
