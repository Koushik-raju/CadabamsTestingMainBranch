/**
 * Worksheets listing — CMS browse + doctor-assigned bucket (mirrors assessments page hooks).
 */
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import {
  getAssignedBucketItems,
  getAssignmentMetadata,
} from "@/lib/patient-assigned-content-buckets";
import { assignedWorksheetsKey, worksheetsKey } from "@/lib/swr-keys";
import type { WorksheetResponseDto } from "@/sdk/backend-v2";
import {
  cmsWorksheetsControllerFindAll,
  patientAssignedContentControllerListAssigned,
} from "@/sdk/backend-v2";

function extractString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "string") return val.trim() || null;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    for (const key of ["en", "value", "text", "url", "href"]) {
      if (typeof obj[key] === "string") return (obj[key] as string).trim() || null;
    }
  }
  return String(val) || null;
}

function extractNumber(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    for (const key of ["en", "value"]) {
      if (typeof obj[key] === "number") return obj[key] as number;
    }
  }
  const n = Number(val);
  return isNaN(n) ? null : n;
}

export interface WorksheetItem {
  id: string;
  /** Strapi document id when present; use for patient submissions / assignments. */
  documentId: string | null;
  title: string;
  description: string | null;
  category: string[];
  label: string | null;
  hint: string | null;
  image: string | null;
  status: "DRAFT" | "PUBLISHED";
  visibleToAll: boolean;
  forJourney: boolean;
  landingTitle: {
    title: string | null;
    landingDescription: string | null;
    minutes: number | null;
    numberOfQuestion: string | null;
    badgeText: string | null;
    actionLabel: string | null;
    points: Array<{ id: string; icon: string | null; item: string | null }>;
  } | null;
  Questions: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string | null;
    hint: string | null;
    continueLabel: string | null;
    order: number;
    smileys: string[];
    count: number | null;
    label: string | null;
    prompt: string | null;
    choice: string | null;
    answer: string | null;
    text: string | null;
    keyValue: string | Record<string, unknown> | null;
    questions: Array<{ question: string }> | null;
    answers: Array<{ answer: string }> | null;
    options: Array<{ id: string; label: string; value: string; order: number }>;
  }>;
}

function parseJsonArrayField(val: unknown): unknown[] | null {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    try {
      const parsed: unknown = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function mapWorksheet(item: WorksheetResponseDto): WorksheetItem {
  const labelStr = extractString(item.label);
  const titleStr = item.title || labelStr || "";
  const row = item as WorksheetResponseDto & { documentId?: string | null };
  const documentId =
    typeof row.documentId === "string" && row.documentId.trim() ? row.documentId.trim() : null;

  return {
    id: item.id,
    documentId,
    title: extractString(item.landingTitle?.title) || labelStr || titleStr,
    description:
      extractString(item.description) || extractString(item.landingTitle?.landingDescription),
    category: item.category ?? [],
    label: labelStr,
    hint: extractString(item.hint),
    image: extractString(item.image),
    status: item.status,
    visibleToAll: item.visibleToAll ?? false,
    forJourney: item.forJourney ?? false,
    landingTitle: item.landingTitle
      ? {
          title: extractString(item.landingTitle.title),
          landingDescription: extractString(item.landingTitle.landingDescription),
          minutes: extractNumber(item.landingTitle.minutes),
          numberOfQuestion: extractString(item.landingTitle.numberOfQuestion),
          badgeText: extractString(item.landingTitle.badgeText),
          actionLabel: extractString(item.landingTitle.actionLabel),
          points: (item.landingTitle.points ?? []).map((p) => ({
            id: p.id,
            icon: extractString(p.icon),
            item: extractString(p.item),
          })),
        }
      : null,
    Questions: (item.Questions ?? []).map((q) => {
      const rawType = extractString(q.type) ?? "mcq";
      const isWorksheetSubmission =
        rawType.includes("worksheet-submission") || rawType.includes("worksheetsubmission");
      const questionsArr = parseJsonArrayField(q.questions);
      const answersArr = parseJsonArrayField(q.answers);

      return {
        id: q.id,
        type: rawType,
        title: extractString(q.title) ?? "",
        subtitle: extractString(q.subtitle),
        hint: extractString(q.hint),
        continueLabel: extractString(q.continueLabel),
        order: q.order ?? 0,
        smileys: q.smileys ?? [],
        count: extractNumber(q.count),
        label: extractString(q.label),
        prompt: extractString(q.prompt),
        choice: extractString(q.choice),
        answer: extractString(q.answer),
        text: isWorksheetSubmission
          ? extractString(q.text) ||
            extractString(q.prompt) ||
            extractString(q.subtitle) ||
            "Optional file upload is not required to complete this worksheet in the app. Tap Continue when you are ready to submit."
          : extractString(q.text),
        keyValue:
          q.keyValue && typeof q.keyValue === "object" ? q.keyValue : extractString(q.keyValue),
        questions: questionsArr
          ? questionsArr.filter(
              (e): e is { question: string } =>
                typeof (e as Record<string, unknown>)?.question === "string",
            )
          : null,
        answers: answersArr
          ? answersArr.filter(
              (e): e is { answer: string } =>
                typeof (e as Record<string, unknown>)?.answer === "string",
            )
          : null,
        options: (q.options ?? []).map((o, i) => ({
          id: String(o.label) + i,
          label: o.label,
          value: o.value,
          order: i,
        })),
      };
    }),
  };
}

const PAGE_SIZE = 100;

type WorksheetsPage = {
  items: WorksheetItem[];
  pagination: { total: number; limit: number; offset: number };
};

export function useWorksheets() {
  return useSWRInfinite(
    (pageIndex: number) => [worksheetsKey(), pageIndex * PAGE_SIZE, PAGE_SIZE],
    async ([, offset]): Promise<WorksheetsPage> => {
      const res = await cmsWorksheetsControllerFindAll({
        query: {
          limit: PAGE_SIZE,
          offset: offset as number,
          status: "PUBLISHED",
          visibleToAll: true,
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const data = res.data;
      const total = data?.total ?? 0;
      return {
        items: (data?.items ?? []).map(mapWorksheet),
        pagination: { total, limit: PAGE_SIZE, offset: offset as number },
      };
    },
    {
      dedupingInterval: 600_000,
      revalidateFirstPage: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 1,
      persistSize: true,
    },
  );
}

export function useFilteredWorksheets({
  search,
  category,
}: {
  search?: string | null;
  category?: string | null;
}) {
  const isActive = !!(search || category);
  const key = isActive ? [worksheetsKey(), "filtered", search ?? "", category ?? ""] : null;

  return useSWR(
    key,
    async () => {
      const res = await cmsWorksheetsControllerFindAll({
        query: {
          limit: PAGE_SIZE,
          offset: 0,
          status: "PUBLISHED",
          visibleToAll: true,
          search: search ?? undefined,
          category: category && category !== "All" ? category : undefined,
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return (res.data?.items ?? []).map(mapWorksheet);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 600_000,
      keepPreviousData: true,
      errorRetryCount: 1,
    },
  );
}

export interface AssignedWorksheetItem {
  id: string;
  documentId: string;
  title: string;
  description: string | null;
  category: string[];
  assignedAt: string | null;
  status: string | null;
  forJourney: boolean;
  hint: string | null;
  image: string | null;
}

function mapAssignedWorksheet(raw: unknown): AssignedWorksheetItem | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const meta = getAssignmentMetadata(obj);
  /** Prefer Prisma CMS worksheet id for /cms/worksheets/:id when Strapi documentId is absent on the row. */
  const documentId =
    (typeof obj.worksheetId === "string" && obj.worksheetId.trim()) ||
    (typeof obj.cmsWorksheetId === "string" && obj.cmsWorksheetId.trim()) ||
    (typeof meta?.worksheetId === "string" && meta.worksheetId.trim()) ||
    (typeof meta?.cmsWorksheetId === "string" && meta.cmsWorksheetId.trim()) ||
    (typeof meta?.documentId === "string" && meta.documentId.trim()) ||
    (typeof obj.documentId === "string" && obj.documentId.trim()) ||
    (typeof obj.id === "string" && obj.id) ||
    (obj.id != null ? String(obj.id) : "");
  if (!documentId) return null;

  const titleRaw = obj.title ?? obj.label;
  const title = typeof titleRaw === "string" ? titleRaw : "Untitled worksheet";
  const description = typeof obj.description === "string" ? obj.description : null;
  const categoryRaw = obj.category ?? meta?.category;
  const category = Array.isArray(categoryRaw)
    ? categoryRaw.filter((c): c is string => typeof c === "string")
    : typeof categoryRaw === "string"
      ? [categoryRaw]
      : [];

  return {
    id: documentId,
    documentId,
    title,
    description,
    category,
    assignedAt: typeof obj.assignedAt === "string" ? obj.assignedAt : null,
    status: typeof obj.status === "string" ? obj.status : null,
    forJourney: obj.forJourney === true || meta?.forJourney === true,
    hint:
      (typeof obj.hint === "string" && obj.hint) ||
      (typeof meta?.hint === "string" ? meta.hint : null),
    image:
      (typeof obj.image === "string" && obj.image) ||
      (typeof meta?.image === "string" ? meta.image : null),
  };
}

type AssignedContentResponse = {
  items?: unknown[];
  buckets?: Record<string, unknown[]>;
};

export function useAssignedWorksheets(leadId: string | null) {
  return useSWR<AssignedWorksheetItem[]>(
    leadId ? assignedWorksheetsKey(leadId) : null,
    async () => {
      const res = await patientAssignedContentControllerListAssigned({
        path: { campus: "cadabams" },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const data = res.data as AssignedContentResponse | undefined;
      const list = getAssignedBucketItems(data, "worksheets");
      const seen = new Set<string>();
      const mapped: AssignedWorksheetItem[] = [];
      for (const it of list) {
        const m = mapAssignedWorksheet(it);
        if (!m) continue;
        if (seen.has(m.documentId)) continue;
        seen.add(m.documentId);
        mapped.push(m);
      }
      return mapped;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60_000,
    },
  );
}

export function getWorksheetCategories(worksheets: WorksheetItem[]): string[] {
  const seen = new Set<string>();
  for (const w of worksheets) {
    for (const cat of w.category ?? []) {
      if (cat) seen.add(cat);
    }
  }
  return ["All", ...[...seen].sort()];
}
