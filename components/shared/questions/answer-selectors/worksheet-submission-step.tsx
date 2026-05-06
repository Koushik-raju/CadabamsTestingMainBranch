"use client";

import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { presignWorksheetUpload, summarizeWorksheetUpload } from "@/lib/patient-worksheets-api";

const MAX_BYTES = 15 * 1024 * 1024;

/** True when `text` is an absolute http(s) URL (CMS template file, often S3 without “.pdf” in the path). */
export function isWorksheetTemplateUrl(text?: string): boolean {
  if (!text || !text.trim()) return false;
  const t = text.trim();
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface WorksheetSubmissionStepProps {
  title?: string;
  description?: string;
  /** Printable worksheet URL from CMS (`question.text`). */
  templateUrl?: string;
  answer: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  onComplete: (complete: boolean) => void;
}

export function WorksheetSubmissionStep({
  title,
  description,
  templateUrl,
  answer,
  onChange,
  onComplete,
}: WorksheetSubmissionStepProps) {
  const [uploading, setUploading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const templateRequired = isWorksheetTemplateUrl(templateUrl);

  const fileUrl = typeof answer.fileUrl === "string" ? answer.fileUrl.trim() : "";
  const fileName = typeof answer.fileName === "string" ? answer.fileName : "";

  useEffect(() => {
    if (templateRequired) {
      onComplete(!!fileUrl);
    } else {
      onComplete(true);
    }
  }, [templateRequired, fileUrl, onComplete]);

  const clearUpload = () => {
    setError(null);
    onChange({});
  };

  const handlePick = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`File is too large (max ${Math.round(MAX_BYTES / (1024 * 1024))} MB).`);
      return;
    }
    const contentType = file.type || "application/octet-stream";
    setUploading(true);
    try {
      const {
        uploadUrl,
        fileUrl: publicUrl,
        contentType: signedType,
      } = await presignWorksheetUpload({
        fileName: file.name,
        contentType,
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": signedType || contentType },
      });
      if (!put.ok) {
        const msg = await put.text().catch(() => "");
        throw new Error(msg || `Upload failed (${put.status})`);
      }

      const uploadDate = new Date().toISOString();
      const base = {
        fileUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: contentType,
        uploadDate,
        extractedContent: `Uploaded worksheet file: ${file.name}`,
      };
      onChange(base);

      setSummarizing(true);
      try {
        const { summary } = await summarizeWorksheetUpload({
          fileUrl: publicUrl,
          fileName: file.name,
          fileType: contentType,
        });
        onChange({ ...base, aiSummary: summary, aiSuccess: true });
      } catch {
        onChange({ ...base, aiSuccess: false });
      } finally {
        setSummarizing(false);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col px-5 pt-6 pb-4 w-full max-w-lg mx-auto gap-4">
      {title && <h2 className="text-xl font-bold text-foreground leading-snug">{title}</h2>}
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}

      {templateUrl && isWorksheetTemplateUrl(templateUrl) && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Step 1 — Download the worksheet</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Open or save the PDF, complete it offline, then upload your copy below.
          </p>
          <Button variant="outline" className="w-full rounded-xl gap-2" asChild>
            <a href={templateUrl} target="_blank" rel="noopener noreferrer" download>
              <Download className="w-4 h-4 shrink-0" />
              Download worksheet (PDF)
            </a>
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          {templateUrl && isWorksheetTemplateUrl(templateUrl)
            ? "Step 2 — Upload your completed file"
            : "Upload your completed worksheet"}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          PDF or images (JPG, PNG). Max {Math.round(MAX_BYTES / (1024 * 1024))} MB.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void handlePick(e.target.files?.[0] ?? null)}
        />

        {!fileUrl ? (
          <Button
            type="button"
            variant="default"
            className="w-full rounded-xl gap-2"
            disabled={uploading || summarizing}
            onClick={() => inputRef.current?.click()}
          >
            {uploading || summarizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? "Uploading…" : "Getting feedback…"}
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4 shrink-0" />
                Choose file
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
            <span className="text-sm text-foreground truncate flex-1" title={fileName}>
              {fileName || "Uploaded file"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={clearUpload}
              aria-label="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {typeof answer.aiSummary === "string" && answer.aiSummary.trim() && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Reflection</p>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {answer.aiSummary as string}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
