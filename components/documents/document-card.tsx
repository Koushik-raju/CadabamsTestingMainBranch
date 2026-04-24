"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
): {
  ext: string;
  gradient: string;
  Icon: React.ElementType;
} {
  const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
  const mime = type ?? "";

  if (mime.includes("pdf") || ext === "PDF")
    return { ext, gradient: "from-red-500 to-rose-600", Icon: FileText };
  if (mime.includes("image") || ["JPG", "JPEG", "PNG", "GIF", "WEBP", "HEIC"].includes(ext))
    return { ext, gradient: "from-sky-500 to-blue-600", Icon: FileImage };
  if (mime.includes("word") || ["DOC", "DOCX"].includes(ext))
    return { ext, gradient: "from-indigo-500 to-violet-600", Icon: FileText };
  if (["TXT", "CSV", "JSON", "XML"].includes(ext))
    return { ext, gradient: "from-slate-400 to-slate-600", Icon: FileCode };
  return { ext, gradient: "from-teal-500 to-emerald-600", Icon: File };
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
  const { ext, gradient, Icon } = getFileConfig(doc.name, doc.type);
  const size = formatSize(doc.size);
  const date = formatDate(doc.createdAt);

  return (
    <div className="flex items-center gap-3 py-3 px-1" role="listitem" aria-label={displayName}>
      {/* Colored file-type icon */}
      <div
        className={cn(
          "relative w-12 h-12 rounded-2xl bg-gradient-to-br flex-shrink-0 flex flex-col items-center justify-center overflow-hidden shadow-sm",
          gradient,
        )}
      >
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/10" />
        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
        <span className="text-[8px] font-bold text-white/80 leading-none mt-0.5">
          {ext.slice(0, 4)}
        </span>
      </div>

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
