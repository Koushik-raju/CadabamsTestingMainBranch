/**
 * Worksheet detail + patient submissions (backend patient-worksheets API).
 */
import useSWR from "swr";
import {
  analyzeWorksheetSubmission,
  type CreateWorksheetSubmissionBody,
  createWorksheetSubmission,
  getMyWorksheetSubmission,
  listMyWorksheetSubmissions,
  type WorksheetAnswerPayload,
  type WorksheetSubmissionRow,
} from "@/lib/patient-worksheets-api";
import {
  worksheetByIdKey,
  worksheetSubmissionByIdKey,
  worksheetSubmissionsKey,
} from "@/lib/swr-keys";
import type { WorksheetResponseDto } from "@/sdk/backend-v2";
import { cmsWorksheetsControllerFindOne } from "@/sdk/backend-v2";
import { mapWorksheet, type WorksheetItem } from "./use-worksheets-page";

export type { WorksheetItem };

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
    async (): Promise<WorksheetSubmissionRow[]> => {
      return listMyWorksheetSubmissions({ documentId: worksheetId! });
    },
  );
}

export async function submitWorksheet(
  worksheetId: string,
  answers: Record<string, unknown>,
): Promise<string> {
  const answerRows = Object.entries(answers).map(([questionKey, value]) => {
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

    const row: WorksheetAnswerPayload = {
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
  });

  const body: CreateWorksheetSubmissionBody = {
    documentId: worksheetId,
    submittedAt: new Date().toISOString(),
    answers: answerRows,
  };

  const row = await createWorksheetSubmission(body);
  if (!row?.id) throw new Error("Worksheet submission response missing id");
  return row.id;
}

export async function analyzeWorksheet(submissionId: string): Promise<WorksheetSubmissionRow> {
  return analyzeWorksheetSubmission(submissionId);
}

export function useWorksheetSubmissionById(submissionId: string | null) {
  return useSWR(submissionId ? worksheetSubmissionByIdKey(submissionId) : null, async () =>
    getMyWorksheetSubmission(submissionId!),
  );
}
