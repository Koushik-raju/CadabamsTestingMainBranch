/**
 * FILE: components/documents/document-card.tsx
 *
 * PURPOSE:
 *   Renders a single document as a list row inside a grouped card, with download and delete actions.
 *
 * LOGIC OVERVIEW:
 *   Determines file type from MIME and extension, selects appropriate icon and gradient color.
 *   Formats file size and date for display.
 *   Renders a gradient file-type icon tile, document name, metadata, and action buttons.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   DocumentData        — document interface with id, name, url, type, size, createdAt
 *   getFileConfig       — determines gradient color and icon based on file type
 *   formatSize, formatDate — utility functions for display formatting
 *
 * DEPENDENCIES:
 *   lucide-react — file type icons
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { GlyphTile, type TintKey } from "@/components/shared/glyph-tile";
import { Button } from "@/components/ui/button";
import { Download, File, FileCode, FileImage, FileText, Trash2 } from "lucide-react";

export interface DocumentData {
  id: string;
  name: string;
  path?: string;
  size?: number;
  type?: string;
  url: string;
  createdAt?: string;
}

interface DocumentCardProps {
  doc: DocumentData;
  index: number;
  onDownload: (doc: DocumentData) => void;
  onDelete: (doc: DocumentData) => void;
  downloading?: boolean;
  deleting?: boolean;
}

function formatSize(size?: number): string {
  if (!size) return "";
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size > 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function formatDate(isoStr?: string): string {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileConfig(
  name: string,
  type?: string,
): { ext: string; tint: TintKey; Icon: React.ElementType } {
  const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
  const mime = type ?? "";

  if (mime.includes("pdf") || ext === "PDF") return { ext, tint: "pink", Icon: FileText };
  if (mime.includes("image") || ["JPG", "JPEG", "PNG", "GIF", "WEBP", "HEIC"].includes(ext))
    return { ext, tint: "blue", Icon: FileImage };
  if (mime.includes("word") || ["DOC", "DOCX"].includes(ext))
    return { ext, tint: "purple", Icon: FileText };
  if (["TXT", "CSV", "JSON", "XML"].includes(ext)) return { ext, tint: "peach", Icon: FileCode };
  return { ext, tint: "green", Icon: File };
}

export function DocumentCard({
  doc,
  index,
  onDownload,
  onDelete,
  downloading,
  deleting,
}: DocumentCardProps) {
  const displayName = doc.name || `Document #${index + 1}`;
  const { ext, tint, Icon } = getFileConfig(doc.name, doc.type);
  const size = formatSize(doc.size);
  const date = formatDate(doc.createdAt);

  return (
    <div className="flex items-center gap-3 py-3 px-1" role="listitem" aria-label={displayName}>
      <GlyphTile icon={Icon} tint={tint} size="lg" label={ext.slice(0, 4)} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-foreground truncate leading-snug"
          title={displayName}
        >
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[size, date].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/10"
          onClick={() => onDownload(doc)}
          disabled={downloading}
          aria-label={`Download ${displayName}`}
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(doc)}
          disabled={deleting}
          aria-label={`Delete ${displayName}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
