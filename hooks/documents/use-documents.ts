"use client";

import type { DocumentData } from "@/components/documents/document-card";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import {
  userDocumentsControllerDelete,
  userDocumentsControllerList,
  userDocumentsControllerPresignUpload,
  userDocumentsControllerUploadComplete,
} from "@/sdk/backend-v2";
import useSWR from "swr";

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

    // 2. PUT file directly to S3
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

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
