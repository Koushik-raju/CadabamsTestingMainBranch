'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle, FolderOpen } from 'lucide-react';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';
import { storage, firestore } from '@/lib/firebase';
import { BackButton } from '@/components/shared/navigation/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DocumentCard, type DocumentData } from '@/components/documents/document-card';

async function downloadDocument(docObj: DocumentData): Promise<void> {
  let downloadUrl = docObj.url;

  if (docObj.path) {
    try {
      const fileRef = storageRef(storage, docObj.path);
      downloadUrl = await getDownloadURL(fileRef);
    } catch {
      // fall through — use stored URL
    }
  }

  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: downloadUrl });
    return;
  }

  window.open(downloadUrl, '_blank', 'noopener,noreferrer');
}

export default function DocumentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [leadId, setLeadId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) { setUserError('User information not found'); return; }
      const parsed = JSON.parse(raw) as { lead_id?: string | number };
      if (parsed?.lead_id) {
        setLeadId(String(parsed.lead_id));
      } else {
        setUserError('User information not found');
      }
    } catch {
      setUserError('Authentication error. Please log in again.');
    }
  }, []);

  const fetchDocs = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(firestore, `crmLeads/${id}/documents`);
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setDocuments(
        snap.docs.map((d) => ({ ...(d.data() as Omit<DocumentData, 'id'>), id: d.id })),
      );
    } catch {
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (leadId) fetchDocs(leadId);
  }, [leadId, fetchDocs]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !leadId) return;

    setUploading(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const path = `crmLeads/${leadId}/${timestamp}_${file.name}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      const docRef = await addDoc(collection(firestore, `crmLeads/${leadId}/documents`), {
        name: file.name,
        path,
        size: file.size,
        type: file.type,
        url,
        createdAt: new Date().toISOString(),
      });

      setDocuments((prev) => [
        { id: docRef.id, name: file.name, path, size: file.size, type: file.type, url, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    } catch {
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (docObj: DocumentData) => {
    setDownloadingId(docObj.id);
    try {
      await downloadDocument(docObj);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (docObj: DocumentData) => {
    if (!leadId) return;
    const confirmed = window.confirm(`Delete "${docObj.name}"?`);
    if (!confirmed) return;

    setDeletingId(docObj.id);
    setError(null);
    try {
      if (docObj.path) await deleteObject(storageRef(storage, docObj.path));
      await deleteDoc(doc(firestore, `crmLeads/${leadId}/documents/${docObj.id}`));
      setDocuments((prev) => prev.filter((d) => d.id !== docObj.id));
    } catch {
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24" role="main" aria-label="My documents">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <BackButton fallback="/" />
        <h1 className="flex-1 text-lg font-bold text-foreground">My Documents</h1>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl gap-1.5"
          onClick={handleUploadClick}
          disabled={uploading || !leadId}
          aria-label="Upload a document"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

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
        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive" role="alert">{error}</p>
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
            <Button variant="outline" onClick={() => router.push('/')}>Go Home</Button>
          </div>
        ) : loading ? (
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
              <span className="text-xs text-muted-foreground">{documents.length} file{documents.length !== 1 ? 's' : ''}</span>
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
