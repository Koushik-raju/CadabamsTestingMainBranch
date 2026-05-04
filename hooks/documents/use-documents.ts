/**
 * FILE: hooks/documents/use-documents.ts
 *
 * PURPOSE:
 *   SWR hook for fetching, uploading, and deleting user documents via the backend S3
 *   presigned-URL flow.
 *
 * LOGIC OVERVIEW:
 *   1. List: SWR fetches all UPLOADED documents for the current user's lead ID. Each document
 *      includes a 1-hour presigned GET URL returned by the backend.
 *   2. uploadDocument:
 *      a. Calls presign-upload to get a presigned PUT URL and a documentId.
 *      b. PUTs the binary directly to S3. Response status is checked — an S3 error (403, 400)
 *         throws immediately so upload-complete is never called with a missing object.
 *      c. Calls upload-complete; backend runs HeadObject to verify before marking UPLOADED.
 *      d. Revalidates the SWR list.
 *   3. deleteDocument: calls the delete endpoint and optimistically removes the item from
 *      the SWR cache without a network round-trip.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   useDocuments   — main export; returns { documents, isLoading, error, uploadDocument, deleteDocument }
 *   CAMPUS         — hardcoded campus slug used for all calls
 *
 * DEPENDENCIES:
 *   userDocumentsControllerPresignUpload, userDocumentsControllerUploadComplete,
 *   userDocumentsControllerList, userDocumentsControllerDelete (sdk/backend-v2)
 *   SWR
 *
 * LAST UPDATED: 2026-04-24 — check S3 PUT response status before calling upload-complete
 */
"use client";

import useSWR from "swr";
import type { DocumentData } from "@/components/documents/document-card";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import {
  userDocumentsControllerDelete,
  userDocumentsControllerList,
  userDocumentsControllerPresignUpload,
  userDocumentsControllerUploadComplete,
} from "@/sdk/backend-v2";

const CAMPUS = "cadabams" as const;

function documentsKey(crmLeadId: string | null) {
  if (!crmLeadId) return null;
  return `/documents/${crmLeadId}`;
}

export function useDocuments() {
  const { user } = useAuth();
  const leadId = user?.lead_id ? String(user.lead_id) : null;

  const { data, isLoading, error, mutate } = useSWR(
    documentsKey(leadId),
    async () => {
      const res = await userDocumentsControllerList({
        path: { campus: CAMPUS },
        query: { crmLeadId: leadId! },
      });
      const docs = res.data?.documents ?? [];
      return docs.map(
        (d): DocumentData => ({
          id: d.id,
          name: d.name,
          type: d.type,
          size: typeof d.size === "number" ? d.size : undefined,
          url: d.url,
          createdAt: d.createdAt,
        }),
      );
    },
    { revalidateOnFocus: false },
  );

  async function uploadDocument(file: File): Promise<DocumentData> {
    if (!leadId) throw new Error("User not authenticated");

    // 1. Presign upload
    const presignRes = await userDocumentsControllerPresignUpload({
      path: { campus: CAMPUS },
      body: {
        crmLeadId: leadId,
        fileName: file.name,
        contentType: file.type as
          | "application/pdf"
          | "image/jpeg"
          | "image/jpg"
          | "image/png"
          | "application/msword"
          | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          | "text/plain",
        sizeBytes: file.size,
      },
    });
    const { uploadUrl, documentId } = presignRes.data!;

    // 2. PUT file directly to S3.
    // Must check response.ok — fetch does not throw on 4xx/5xx, so a silent
    // 403 (signature mismatch, CORS, IAM) would let us fall through to
    // upload-complete and mark a non-existent object as UPLOADED.
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!putRes.ok) {
      throw new Error(`File upload to storage failed (${putRes.status}). Please try again.`);
    }

    // 3. Mark upload complete
    const completeRes = await userDocumentsControllerUploadComplete({
      path: { campus: CAMPUS, documentId },
    });
    const dto = completeRes.data!;

    const newDoc: DocumentData = {
      id: dto.id,
      name: dto.name,
      type: dto.mimeType,
      size: typeof dto.sizeBytes === "number" ? dto.sizeBytes : undefined,
      url: "",
      createdAt: dto.createdAt,
    };

    await mutate();
    return newDoc;
  }

  async function deleteDocument(documentId: string): Promise<void> {
    await userDocumentsControllerDelete({
      path: { campus: CAMPUS, documentId },
    });
    await mutate((prev) => prev?.filter((d) => d.id !== documentId) ?? [], {
      revalidate: false,
    });
  }

  return {
    documents: data ?? [],
    isLoading,
    error,
    leadId,
    mutate,
    uploadDocument,
    deleteDocument,
  };
}
