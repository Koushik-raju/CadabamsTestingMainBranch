/**
 * FILE: hooks/assessments/use-assessments-page.ts
 *
 * PURPOSE:
 *   SWR hooks and mapping logic for the assessments listing page and assigned
 *   assessments. Transforms raw SDK DTOs into typed AssessmentItem shapes for
 *   use by page components.
 *
 * LOGIC OVERVIEW:
 *   - extractString / extractNumber: safely pull plain values from Strapi v5
 *     rich-text objects (which arrive as { [key: string]: unknown } | null).
 *     Still required because AssessmentResponseDto / AssessmentQuestionResponseDto
 *     fields remain typed as { [key: string]: unknown } in the generated SDK.
 *   - mapAssessment: converts AssessmentResponseDto → AssessmentItem; uses
 *     option.id directly from SDK (stable CUID, no longer synthesized).
 *   - useAssessments: infinite SWR hook over cmsAssessmentsControllerFindAll.
 *   - useFilteredAssessments: SWR hook that delegates search, category, sort,
 *     and duration filtering entirely to the backend query params — no
 *     client-side filter/sort logic.
 *   - useAssignedAssessments: SWR hook over patientAssignedContentControllerListAssigned.
 *     Returns the doctor-assigned assessments stored in the patient's
 *     LeadContentAssignment row (assignments.assessments bucket), mapped to a
 *     typed AssignedAssessmentItem[] for the UI. Mirrors the reference frontned
 *     "Assigned Assessments" Firestore flow but reads from Postgres via the
 *     /patient/assigned-content endpoint.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AssessmentItem            — mapped assessment shape (flattened Strapi rich-text)
 *   AssignedAssessmentItem    — flattened doctor-assigned assessment shape
 *   mapAssessment             — DTO → AssessmentItem converter (exported for reuse)
 *   useAssessments            — infinite paginated hook
 *   useFilteredAssessments    — server-filtered hook (search/category/sort/duration)
 *   useAssignedAssessments    — hook returning AssignedAssessmentItem[] for the lead
 *   getDynamicCategories      — derives category list from loaded assessments
 *
 * DEPENDENCIES:
 *   cmsAssessmentsControllerFindAll                  — SDK: fetch published assessments
 *   patientAssignedContentControllerListAssigned     — SDK: fetch lead's assigned content row
 *
 * LAST UPDATED: 2026-04-28 — switch My Assessments tab from completions
 *   (patientsControllerGetAssessments) to doctor-assigned assessments
 *   (patient/assigned-content) so the data matches the reference frontned tab.
 */

import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { ASSESSMENT_CATEGORIES } from "@/components/assessment/assessment-category";
import { assessmentsKey, assignedAssessmentsKey } from "@/lib/swr-keys";
import type { AssessmentPaginationDto, AssessmentResponseDto } from "@/sdk/backend-v2";
import {
  cmsAssessmentsControllerFindAll,
  patientAssignedContentControllerListAssigned,
} from "@/sdk/backend-v2";

// ---------------------------------------------------------------------------
// Internal helpers — extract plain values from Strapi v5 JSON-like objects
// ---------------------------------------------------------------------------

function extractString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "string") return val.trim() || null;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    for (const key of ["en", "value", "text"]) {
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

// ---------------------------------------------------------------------------
// AssessmentItem — mapped shape with flattened Strapi rich-text fields.
// AssessmentResponseDto fields are { [key: string]: unknown } in the SDK;
// this type gives pages/components clean string | number | null values.
// ---------------------------------------------------------------------------

export interface AssessmentItem {
  id: string;
  title: string;
  description: string | null;
  category: string[];
  label: string | null;
  hint: string | null;
  image: string | null;
  citationText: string | null;
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

// ---------------------------------------------------------------------------
// Mapping — AssessmentResponseDto → AssessmentItem
// ---------------------------------------------------------------------------

export function mapAssessment(item: AssessmentResponseDto): AssessmentItem {
  const labelStr = extractString(item.label);
  const titleStr = item.title || labelStr || "";

  return {
    id: item.id,
    title: extractString(item.landingTitle?.title) || labelStr || titleStr,
    description:
      extractString(item.description) || extractString(item.landingTitle?.landingDescription),
    category: item.category ?? [],
    label: labelStr,
    hint: extractString(item.hint),
    image: extractString(item.image),
    citationText: extractString(item.citationText),
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
    Questions: (item.Questions ?? []).map((q) => ({
      id: q.id,
      type: extractString(q.type) ?? "mcq",
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
      text: extractString(q.text),
      keyValue:
        q.keyValue && typeof q.keyValue === "object" ? q.keyValue : extractString(q.keyValue),
      questions: Array.isArray(q.questions)
        ? q.questions.filter(
            (e): e is { question: string } =>
              typeof (e as Record<string, unknown>)?.question === "string",
          )
        : null,
      answers: Array.isArray(q.answers)
        ? q.answers.filter(
            (e): e is { answer: string } =>
              typeof (e as Record<string, unknown>)?.answer === "string",
          )
        : null,
      options: (q.options ?? []).map((o, i) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        order: i,
      })),
    })),
  };
}

// Keep old name as alias for backward compatibility
export const mapStrapiAssessment = mapAssessment;

// ---------------------------------------------------------------------------
// getDynamicCategories — derives category list from loaded assessments
// ---------------------------------------------------------------------------

export function getDynamicCategories(assessments: AssessmentItem[]): string[] {
  const seen = new Set<string>();
  for (const a of assessments) {
    for (const cat of a.category ?? []) {
      if (cat) seen.add(cat);
    }
  }
  const inCanonicalOrder = ASSESSMENT_CATEGORIES.filter((c) => c !== "All" && seen.has(c));
  const extras = [...seen].filter((c) => !ASSESSMENT_CATEGORIES.includes(c));
  return ["All", ...inCanonicalOrder, ...extras];
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100;

type AssessmentsPage = {
  items: AssessmentItem[];
  pagination: AssessmentPaginationDto;
};

export function useAssessments() {
  return useSWRInfinite(
    (pageIndex: number) => [assessmentsKey(), pageIndex * PAGE_SIZE, PAGE_SIZE],
    async ([, offset]): Promise<AssessmentsPage> => {
      const res = await cmsAssessmentsControllerFindAll({
        query: {
          limit: PAGE_SIZE,
          offset: offset as number,
          status: "PUBLISHED",
          publicView: true,
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const data = res.data;
      return {
        items: (data?.items ?? []).map(mapAssessment),
        pagination: data?.pagination ?? { total: 0, limit: PAGE_SIZE, offset: offset as number },
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

export function useFilteredAssessments({
  search,
  category,
  sortBy,
  sortOrder,
  minMinutes,
  maxMinutes,
}: {
  search?: string | null;
  category?: string | null;
  sortBy?: string | null;
  sortOrder?: "asc" | "desc" | null;
  minMinutes?: number | null;
  maxMinutes?: number | null;
}) {
  const isActive = !!(search || category || sortBy || minMinutes != null || maxMinutes != null);
  const key = isActive
    ? [
        assessmentsKey(),
        "filtered",
        search ?? "",
        category ?? "",
        sortBy ?? "",
        sortOrder ?? "",
        minMinutes ?? "",
        maxMinutes ?? "",
      ]
    : null;

  return useSWR(
    key,
    async () => {
      const res = await cmsAssessmentsControllerFindAll({
        query: {
          limit: PAGE_SIZE,
          offset: 0,
          status: "PUBLISHED",
          publicView: true,
          search: search ?? undefined,
          category: category && category !== "All" ? category : undefined,
          sortBy: sortBy ?? undefined,
          sortOrder: sortOrder ?? undefined,
          minMinutes: minMinutes ?? undefined,
          maxMinutes: maxMinutes ?? undefined,
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return (res.data?.items ?? []).map(mapAssessment);
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

// Doctor-assigned assessments — fetched from LeadContentAssignment.assignments.assessments.
// The backend endpoint returns at most one row per CRM lead; we flatten its
// `assignments.assessments` bucket into a typed list. Mirrors the reference
// frontned `assignedAssessmentService.getAssignedAssessments` Firestore flow,
// but uses the Postgres-backed `/patient/assigned-content` endpoint instead.
export interface AssignedAssessmentItem {
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

type AssignedContentResponse = {
  crmLeadId: number | string;
  campus: string | null;
  items: Array<{
    id?: string;
    crmLeadId?: number | string;
    campus?: string | null;
    assignments?: {
      assessments?: unknown[];
      worksheets?: unknown[];
      [k: string]: unknown;
    };
  }>;
};

function mapAssignedAssessment(raw: unknown): AssignedAssessmentItem | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const documentId =
    (typeof obj.documentId === "string" && obj.documentId) ||
    (typeof obj.id === "string" && obj.id) ||
    (obj.id != null ? String(obj.id) : "");
  if (!documentId) return null;

  const titleRaw = obj.title ?? obj.label;
  const title = typeof titleRaw === "string" ? titleRaw : "Untitled Assessment";
  const description = typeof obj.description === "string" ? obj.description : null;
  const categoryRaw = obj.category;
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
    forJourney: obj.forJourney === true,
    hint: typeof obj.hint === "string" ? obj.hint : null,
    image: typeof obj.image === "string" ? obj.image : null,
  };
}

export function useAssignedAssessments(leadId: string | null) {
  return useSWR<AssignedAssessmentItem[]>(
    leadId ? assignedAssessmentsKey(leadId) : null,
    async () => {
      const res = await patientAssignedContentControllerListAssigned({
        path: { campus: "cadabams" },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const data = res.data as AssignedContentResponse | undefined;
      const row = data?.items?.[0];
      const list = row?.assignments?.assessments ?? [];
      const seen = new Set<string>();
      const mapped: AssignedAssessmentItem[] = [];
      for (const it of list) {
        const m = mapAssignedAssessment(it);
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
