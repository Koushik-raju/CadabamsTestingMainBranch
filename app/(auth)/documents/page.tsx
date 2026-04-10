'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Upload,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';
import { storage, firestore } from '@/lib/firebase';
import { BackButton } from '@/components/shared/navigation/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentCard, type DocumentData } from '@/components/documents/document-card';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

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

  // Web: open in new tab (avoids file-saver dependency requirement)
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

  // Read leadId from localStorage
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

  // Fetch documents from Firestore
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

  // Upload
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

      const newDoc: DocumentData = {
        id: docRef.id,
        name: file.name,
        path,
        size: file.size,
        type: file.type,
        url,
        createdAt: new Date().toISOString(),
      };
      setDocuments((prev) => [newDoc, ...prev]);
    } catch {
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download
  const handleDownload = async (docObj: DocumentData) => {
    setDownloadingId(docObj.id);
    try {
      await downloadDocument(docObj);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to download file.';
      setError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  // Delete
  const handleDelete = async (docObj: DocumentData) => {
    if (!leadId) return;
    const confirmed = window.confirm(`Delete "${docObj.name}"?`);
    if (!confirmed) return;

    setDeletingId(docObj.id);
    setError(null);
    try {
      if (docObj.path) {
        await deleteObject(storageRef(storage, docObj.path));
      }
      await deleteDoc(doc(firestore, `crmLeads/${leadId}/documents/${docObj.id}`));
      setDocuments((prev) => prev.filter((d) => d.id !== docObj.id));
    } catch {
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="My documents">
      {/* Header */}
      <header className="bg-primary pb-4 px-4 rounded-b-[2.5rem] shadow-md">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <BackButton
              fallback="/"
              className="text-white hover:bg-white/20"
            />
            <div>
              <h1 className="text-white text-xl font-bold">My Documents</h1>
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                <span>{todayLabel()}</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={handleUploadClick}
            disabled={uploading || !leadId}
            aria-label="Upload a document"
          >
            <Upload className="w-4 h-4 mr-1" aria-hidden="true" />
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
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {/* Error banner */}
        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />
              <p className="text-sm text-destructive" role="alert">{error}</p>
            </CardContent>
          </Card>
        )}

        {userError ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" aria-hidden="true" />
              <p className="text-muted-foreground" role="alert">{userError}</p>
              <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading documents">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">No documents yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload consultation reports, prescriptions, or other files to keep them organised.
                </p>
              </div>
              <Button onClick={handleUploadClick} disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div role="list" className="space-y-3" aria-label="Your documents">
            {documents.map((d, i) => (
              <DocumentCard
                key={d.id}
                doc={d}
                index={i}
                onDownload={handleDownload}
                onDelete={handleDelete}
                downloading={downloadingId === d.id}
                deleting={deletingId === d.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
