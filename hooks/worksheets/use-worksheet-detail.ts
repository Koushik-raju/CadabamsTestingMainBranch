/**
 * FILE: hooks/worksheets/use-worksheet-detail.ts
 *
 * PURPOSE:
 *   SWR hooks + mutation helpers for the patient worksheets feature: read a CMS
 *   worksheet template, list/create/get patient submissions, and trigger LLM
 *   analysis. All backend I/O goes through the generated SDK in
 *   `@/sdk/backend-v2`.
 *
 * LOGIC OVERVIEW:
 *   - useWorksheetById(id): SWR call to cmsWorksheetsControllerFindOne, mapped
 *     to a flat WorksheetItem via mapWorksheet.
 *   - useWorksheetSubmissions(worksheetId): lists the current patient's
 *     submissions filtered by Strapi documentId via
 *     patientWorksheetsControllerListMine.
 *   - submitWorksheet(worksheetId, answers): walks the per-step answer record,
 *     normalises each step into a WorksheetAnswerInputDto (extracting either
 *     the picked value, an uploaded-file description, or stringified rest),
 *     then POSTs via patientWorksheetsControllerCreateSubmission and returns
 *     the new submission id.
 *   - analyzeWorksheet(submissionId): runs LLM analysis via
 *     patientWorksheetsAnalysisControllerAnalyze and returns the refreshed row.
 *   - presignWorksheetUpload({ fileName, contentType }): POST to
 *     patientWorksheetsControllerPresignUpload, returning the S3 PUT URL +
 *     stable file URL the upload UI uses to upload the file binary.
 *   - summarizeWorksheetUpload({ fileUrl, fileName, fileType }): POST to
 *     patientWorksheetsControllerSummarizeUpload for a short LLM
 *     acknowledgment after upload.
 *   - useWorksheetSubmissionById(submissionId): GET one submission via
 *     patientWorksheetsControllerGetSubmission.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   PATIENT_WORKSHEETS_CAMPUS — fixed campus slug used for all submission calls
 *   useWorksheetById          — SWR hook returning { data, isLoading, error }
 *   useWorksheetSubmissions   — SWR hook returning the patient's submissions
 *   submitWorksheet           — mutation, returns the new submission id
 *   analyzeWorksheet          — mutation, returns updated WorksheetSubmissionResponseDto
 *   presignWorksheetUpload    — mutation, returns S3 PUT URL + stable file URL
 *   summarizeWorksheetUpload  — mutation, returns short LLM summary after upload
 *   useWorksheetSubmissionById — SWR hook for a single submission
 *
 * DEPENDENCIES:
 *   SWR; SDK functions cmsWorksheetsControllerFindOne,
 *   patientWorksheetsControllerListMine,
 *   patientWorksheetsControllerCreateSubmission,
 *   patientWorksheetsControllerGetSubmission,
 *   patientWorksheetsAnalysisControllerAnalyze; SDK types
 *   WorksheetResponseDto, WorksheetSubmissionResponseDto,
 *   WorksheetAnswerInputDto, CreateWorksheetSubmissionDto.
 *
 * LAST UPDATED: 2026-05-06 — migrated off lib/patient-worksheets-api to the generated SDK.
 */
import useSWR from "swr";
import {
  worksheetByIdKey,
  worksheetSubmissionByIdKey,
  worksheetSubmissionsKey,
} from "@/lib/swr-keys";
import {
  type CreateWorksheetSubmissionDto,
  cmsWorksheetsControllerFindOne,
  type PresignWorksheetUploadResponseDto,
  patientWorksheetsAnalysisControllerAnalyze,
  patientWorksheetsControllerCreateSubmission,
  patientWorksheetsControllerGetSubmission,
  patientWorksheetsControllerListMine,
  patientWorksheetsControllerPresignUpload,
  patientWorksheetsControllerSummarizeUpload,
  type SummarizeWorksheetUploadResponseDto,
  type WorksheetAnswerInputDto,
  type WorksheetResponseDto,
  type WorksheetSubmissionResponseDto,
} from "@/sdk/backend-v2";

import { mapWorksheet, type WorksheetItem } from "./use-worksheets-page";

// Re-exported so consumer pages can use the SDK type via the hook layer.
export type { WorksheetItem, WorksheetSubmissionResponseDto };

const PATIENT_WORKSHEETS_CAMPUS = "cadabams" as const;

export function useWorksheetById(id: string | null) {
  const {
    data: raw,
    isLoading,
    error,
  } = useSWR(id ? worksheetByIdKey(id) : null, async (): Promise<WorksheetResponseDto | null> => {
    const res = await cmsWorksheetsControllerFindOne({ path: { id: id! } });
    if (res.error) throw new Error(JSON.stringify(res.error));
    return res.data ?? null;
  });

  const worksheet: WorksheetItem | null = raw ? mapWorksheet(raw) : null;

  return { data: worksheet, isLoading, error };
}

export function useWorksheetSubmissions(worksheetId: string | null) {
  return useSWR(
    worksheetId ? worksheetSubmissionsKey(worksheetId) : null,
    async (): Promise<WorksheetSubmissionResponseDto[]> => {
      const res = await patientWorksheetsControllerListMine({
        path: { campus: PATIENT_WORKSHEETS_CAMPUS },
        query: { documentId: worksheetId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return Array.isArray(res.data) ? res.data : [];
    },
  );
}

export async function submitWorksheet(
  worksheetId: string,
  answers: Record<string, unknown>,
): Promise<string> {
  /*
   * Each entry in `answers` is the per-step answer object the question UI
   * accumulated. We collapse it into a WorksheetAnswerInputDto:
   *   - If the patient uploaded a file, store the file metadata + a textual
   *     description in extractedContent.
   *   - Otherwise pick the first meaningful field on the answer (selected /
   *     text / value / etc.) and stringify objects.
   *   - If nothing was captured but we have the question text, fall back to a
   *     "no response captured" placeholder so the row is still informative.
   * questionText / stepOrder are control fields, not part of the DTO.
   */
  const answerRows: WorksheetAnswerInputDto[] = Object.entries(answers).map(
    ([questionKey, value]) => {
      const v = value as Record<string, unknown>;
      const { questionText, stepOrder, ...rest } = v;
      const qt = typeof questionText === "string" ? questionText : "";

      const hasFile = typeof rest.fileUrl === "string" && !!String(rest.fileUrl).trim();

      const pick =
        rest.selected ??
        rest.text ??
        (rest as { transcription?: unknown }).transcription ??
        rest.value ??
        rest.level ??
        rest.subAnswers ??
        rest.extractedContent ??
        rest.aiSummary ??
        rest.accepted ??
        (rest as { generate?: unknown }).generate;

      let extractedContent: string;
      if (hasFile) {
        const lines = [
          "Patient uploaded a completed worksheet file.",
          typeof rest.fileName === "string" && `File name: ${rest.fileName}`,
          typeof rest.fileType === "string" && `File type: ${rest.fileType}`,
          typeof rest.aiSummary === "string" &&
            rest.aiSummary.trim() &&
            `Reflection: ${rest.aiSummary}`,
        ].filter(Boolean) as string[];
        extractedContent = lines.join("\n");
      } else if (pick !== undefined && pick !== null && pick !== "") {
        if (Array.isArray(pick) || (typeof pick === "object" && pick !== null)) {
          extractedContent = JSON.stringify(pick);
        } else {
          extractedContent = String(pick);
        }
      } else if (Object.keys(rest).length > 0) {
        extractedContent = JSON.stringify(rest);
      } else if (qt) {
        extractedContent = `(no response captured) — ${qt}`;
      } else {
        extractedContent = "";
      }

      const row: WorksheetAnswerInputDto = {
        questionKey,
        order: typeof stepOrder === "number" ? stepOrder : undefined,
        extractedContent,
      };

      if (hasFile) {
        row.fileUrl = String(rest.fileUrl).trim();
        row.fileName = typeof rest.fileName === "string" ? rest.fileName : undefined;
        row.fileSize = typeof rest.fileSize === "number" ? rest.fileSize : undefined;
        row.fileType = typeof rest.fileType === "string" ? rest.fileType : undefined;
        row.uploadDate = typeof rest.uploadDate === "string" ? rest.uploadDate : undefined;
        row.aiSummary = typeof rest.aiSummary === "string" ? rest.aiSummary : undefined;
        if (typeof rest.aiSuccess === "boolean") row.aiSuccess = rest.aiSuccess;
      }

      return row;
    },
  );

  const body: CreateWorksheetSubmissionDto = {
    documentId: worksheetId,
    submittedAt: new Date().toISOString(),
    answers: answerRows,
  };

  const res = await patientWorksheetsControllerCreateSubmission({
    path: { campus: PATIENT_WORKSHEETS_CAMPUS },
    body,
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  const row = res.data;
  if (!row?.id) throw new Error("Worksheet submission response missing id");
  return row.id;
}

export async function analyzeWorksheet(
  submissionId: string,
): Promise<WorksheetSubmissionResponseDto> {
  const res = await patientWorksheetsAnalysisControllerAnalyze({
    path: { submissionId },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (!res.data) throw new Error("Analyze returned no data");
  return res.data;
}

export async function presignWorksheetUpload(args: {
  fileName: string;
  contentType?: string;
}): Promise<PresignWorksheetUploadResponseDto> {
  const res = await patientWorksheetsControllerPresignUpload({
    path: { campus: PATIENT_WORKSHEETS_CAMPUS },
    body: { fileName: args.fileName, contentType: args.contentType },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (!res.data) throw new Error("Presign returned no data");
  return res.data;
}

export async function summarizeWorksheetUpload(args: {
  fileUrl: string;
  fileName: string;
  fileType?: string;
}): Promise<SummarizeWorksheetUploadResponseDto> {
  const res = await patientWorksheetsControllerSummarizeUpload({
    path: { campus: PATIENT_WORKSHEETS_CAMPUS },
    body: { fileUrl: args.fileUrl, fileName: args.fileName, fileType: args.fileType },
  });
  if (res.error) throw new Error(JSON.stringify(res.error));
  if (!res.data) throw new Error("Summarize returned no data");
  return res.data;
}

export function useWorksheetSubmissionById(submissionId: string | null) {
  return useSWR(
    submissionId ? worksheetSubmissionByIdKey(submissionId) : null,
    async (): Promise<WorksheetSubmissionResponseDto> => {
      const res = await patientWorksheetsControllerGetSubmission({
        path: { campus: PATIENT_WORKSHEETS_CAMPUS, id: submissionId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      if (!res.data) throw new Error("Submission not found");
      return res.data;
    },
  );
}
