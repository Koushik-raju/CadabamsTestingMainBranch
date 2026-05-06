/**
 * Patient worksheet submissions + analyze — calls backend routes added in
 * mindtalk-doctors-backend (not yet in generated OpenAPI SDK).
 */
import { apiClient } from "@/api/backend-v2";

export const PATIENT_WORKSHEETS_CAMPUS = "cadabams" as const;

export type WorksheetAnswerPayload = {
  questionKey: string;
  order?: number;
  documentId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  aiModel?: string;
  aiSuccess?: boolean;
  aiSummary?: string;
  extractedContent?: string;
  uploadDate?: string;
};

export type WorksheetAnswerRow = {
  id: string;
  submissionId: string;
  questionKey: string;
  order: number;
  documentId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  fileUrl?: string | null;
  aiModel?: string | null;
  aiSuccess?: boolean | null;
  aiSummary?: string | null;
  extractedContent?: string | null;
  uploadDate?: string | null;
};

export type WorksheetSubmissionRow = {
  id: string;
  crmLeadId?: string | null;
  patientRef?: string | null;
  campus: string;
  worksheetKey?: string | null;
  documentId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  fileUrl?: string | null;
  aiModel?: string | null;
  aiSuccess?: boolean | null;
  aiSummary?: string | null;
  extractedContent?: string | null;
  strapiComponent?: string | null;
  submittedAt: string;
  uploadedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  answers?: WorksheetAnswerRow[];
};

export type CreateWorksheetSubmissionBody = {
  documentId?: string;
  worksheetKey?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  strapiComponent?: string;
  submittedAt?: string;
  uploadedAt?: string;
  answers?: WorksheetAnswerPayload[];
};

export async function listMyWorksheetSubmissions(params: {
  documentId?: string;
  worksheetKey?: string;
  hasAiSummary?: boolean;
}): Promise<WorksheetSubmissionRow[]> {
  const { data } = await apiClient.get<WorksheetSubmissionRow[]>(
    `/api/v1/${PATIENT_WORKSHEETS_CAMPUS}/patient-worksheets/submissions`,
    {
      params: {
        documentId: params.documentId,
        worksheetKey: params.worksheetKey,
        hasAiSummary: params.hasAiSummary ? "true" : undefined,
      },
    },
  );
  return Array.isArray(data) ? data : [];
}

export async function getMyWorksheetSubmission(id: string): Promise<WorksheetSubmissionRow> {
  const { data } = await apiClient.get<WorksheetSubmissionRow>(
    `/api/v1/${PATIENT_WORKSHEETS_CAMPUS}/patient-worksheets/submissions/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function createWorksheetSubmission(
  body: CreateWorksheetSubmissionBody,
): Promise<WorksheetSubmissionRow> {
  const { data } = await apiClient.post<WorksheetSubmissionRow>(
    `/api/v1/${PATIENT_WORKSHEETS_CAMPUS}/patient-worksheets/submissions`,
    body,
  );
  return data;
}

export async function analyzeWorksheetSubmission(
  submissionId: string,
): Promise<WorksheetSubmissionRow> {
  const { data } = await apiClient.post<WorksheetSubmissionRow>(
    `/api/v1/patient-worksheets/analyze/${encodeURIComponent(submissionId)}`,
  );
  return data;
}

export type PresignWorksheetUploadBody = {
  fileName: string;
  contentType?: string;
};

export type PresignWorksheetUploadResponse = {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  contentType: string;
  expiresInSeconds: number;
};

export async function presignWorksheetUpload(
  body: PresignWorksheetUploadBody,
): Promise<PresignWorksheetUploadResponse> {
  const { data } = await apiClient.post<PresignWorksheetUploadResponse>(
    `/api/v1/patient-worksheets/uploads/presign`,
    body,
    { params: { campus: PATIENT_WORKSHEETS_CAMPUS } },
  );
  return data;
}

export type SummarizeWorksheetUploadBody = {
  fileUrl: string;
  fileName: string;
  fileType?: string;
};

export type SummarizeWorksheetUploadResponse = {
  summary: string;
  aiModel: string;
};

export async function summarizeWorksheetUpload(
  body: SummarizeWorksheetUploadBody,
): Promise<SummarizeWorksheetUploadResponse> {
  const { data } = await apiClient.post<SummarizeWorksheetUploadResponse>(
    `/api/v1/patient-worksheets/uploads/summarize`,
    body,
    { params: { campus: PATIENT_WORKSHEETS_CAMPUS } },
  );
  return data;
}
