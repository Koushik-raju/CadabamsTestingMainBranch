/**
 * FILE: app/(auth)/documents/page.tsx
 *
 * PURPOSE:
 *   Displays the user's uploaded documents with download and delete actions,
 *   and provides an upload button to add new files.
 *
 * LOGIC OVERVIEW:
 *   1. Fetches documents via useDocuments() (leadId-scoped SWR).
 *   2. Renders loading skeletons, error banner, empty state, or grouped list card.
 *   3. Upload button triggers hidden <input type="file"> via a ref.
 *   4. Download opens the file URL via Capacitor Browser on native, window.open on web.
 *   5. Delete shows a native confirm dialog before calling deleteDocument.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   documents    — DocumentData[] from useDocuments
 *   uploading    — local upload-in-progress flag
 *   leadId       — required for upload API; disables button if absent
 *
 * DEPENDENCIES:
 *   useDocuments — SWR hook for document list, upload, and delete
 *   DocumentCard — shared document row component
 *   PageHeader   — shared navigation header
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { DocumentCard, type DocumentData } from "@/components/documents/document-card";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "@/hooks/documents/use-documents";
import { Capacitor } from "@capacitor/core";
import { AlertCircle, FolderOpen, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

async function openDownloadUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function DocumentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    documents,
    isLoading,
    error: loadError,
    leadId,
    uploadDocument,
    deleteDocument,
  } = useDocuments();

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file);
    } catch {
      setError("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = useCallback(async (docObj: DocumentData) => {
    setDownloadingId(docObj.id);
    try {
      await openDownloadUrl(docObj.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download file.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleDelete = useCallback(
    async (docObj: DocumentData) => {
      const confirmed = window.confirm(`Delete "${docObj.name}"?`);
      if (!confirmed) return;

      setDeletingId(docObj.id);
      setError(null);
      try {
        await deleteDocument(docObj.id);
      } catch {
        setError("Failed to delete document. Please try again.");
      } finally {
        setDeletingId(null);
      }
    },
    [deleteDocument],
  );

  const userError = !leadId && !isLoading ? "User information not found" : null;

  return (
    <main className="min-h-screen bg-background pb-24" role="main" aria-label="My documents">
      <PageHeader
        title="My Documents"
        fallback="/"
        right={
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={handleUploadClick}
            disabled={uploading || !leadId}
            aria-label="Upload a document"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
        aria-hidden="true"
      />

      <div className="px-4 space-y-4">
        {/* Error banner */}
        {(error || loadError) && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive" role="alert">
                {error ?? "Failed to load documents. Please try again."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* User error */}
        {userError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Something went wrong</p>
              <p className="text-sm text-muted-foreground mt-1">{userError}</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </div>
        ) : isLoading ? (
          <Card>
            <CardContent className="py-2 divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/3 rounded" />
                  </div>
                  <Skeleton className="w-16 h-8 rounded-lg flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Upload reports, prescriptions, or any other files to keep them organised.
              </p>
            </div>
            <Button onClick={handleUploadClick} disabled={uploading} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">All Files</h2>
              <span className="text-xs text-muted-foreground">
                {documents.length} file{documents.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Card>
              <CardContent className="py-0 px-3" role="list" aria-label="Your documents">
                {documents.map((d, i) => (
                  <div key={d.id}>
                    <DocumentCard
                      doc={d}
                      index={i}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                      downloading={downloadingId === d.id}
                      deleting={deletingId === d.id}
                    />
                    {i < documents.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}
