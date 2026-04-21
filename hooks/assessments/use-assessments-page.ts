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
 *   - mapAssessment: converts AssessmentResponseDto → AssessmentItem; no casts
 *     needed because extractString/extractNumber accept unknown directly.
 *   - useAssessmentsPage: infinite SWR hook over cmsAssessmentsControllerFindAll.
 *   - useAssignedAssessments: SWR hook over patientsControllerGetAssessments
 *     which now returns Array<CompletionResponseDto> directly (campus param
 *     removed). Each completion is mapped to AssignedAssessmentItem using the
 *     typed DTO fields — no coercions required.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   AssessmentItem          — mapped assessment shape used by page components
 *   AssignedAssessmentItem  — mapped shape for lead-assigned assessments
 *   mapAssessment           — DTO → AssessmentItem converter (exported for reuse)
 *   useAssessmentsPage      — infinite paginated hook
 *   useAssignedAssessments  — hook for a lead's assigned assessments
 *
 * DEPENDENCIES:
 *   cmsAssessmentsControllerFindAll     — SDK: fetch published assessments
 *   patientsControllerGetAssessments    — SDK: fetch lead-assigned assessments
 *
 * LAST UPDATED: 2026-04-21 — migrate useAssignedAssessments to CompletionResponseDto
 *   (campus param removed, response is now array)
 */

import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import {
  cmsAssessmentsControllerFindAll,
  patientsControllerGetAssessments,
} from '@/sdk/backend-v2';
import type { AssessmentResponseDto, CompletionResponseDto } from '@/sdk/backend-v2';
import { assessmentsKey, assignedAssessmentsKey } from '@/lib/swr-keys';
import { ASSESSMENT_CATEGORIES } from '@/components/assessment/assessment-category';

// ---------------------------------------------------------------------------
// Internal helpers — extract plain values from Strapi v5 JSON-like objects
// ---------------------------------------------------------------------------

function extractString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === 'string') return val.trim() || null;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    for (const key of ['en', 'value', 'text']) {
      if (typeof obj[key] === 'string') return (obj[key] as string).trim() || null;
    }
  }
  return String(val) || null;
}

function extractNumber(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    for (const key of ['en', 'value']) {
      if (typeof obj[key] === 'number') return obj[key] as number;
    }
  }
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// Types — kept for backward compatibility with pages/components; will be
// replaced by SDK types in task 2.7
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
  status: 'DRAFT' | 'PUBLISHED';
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
    // assessment.qa nested sub-questions and shared answer options (JSON from backend)
    questions: Array<{ question: string }> | null;
    answers: Array<{ answer: string }> | null;
    options: Array<{ id: string; label: string; value: string; order: number }>;
  }>;
}

export interface AssignedAssessmentItem {
  documentId: string;
  id: string | number | undefined;
  label: string;
  description: string;
  category: string[];
  assignedAt: string | undefined;
  status: string;
  isCompleted: boolean;
  lastUsed: string;
  forJourney: boolean;
  severity?: string;
  totalScore?: number;
  maxScore?: number;
}

export interface AssessmentCategories {
  recommendedAssessment: AssessmentItem | null;
  popularScreenings: AssessmentItem[];
  personalGrowth: AssessmentItem[];
}

export interface StrapiPage {
  items: AssessmentItem[];
  pagination: { total: number; limit: number; offset: number };
}

// ---------------------------------------------------------------------------
// Mapping — AssessmentResponseDto → AssessmentItem
// ---------------------------------------------------------------------------

export function mapAssessment(item: AssessmentResponseDto): AssessmentItem {
  const labelStr = extractString(item.label);
  const titleStr = item.title || labelStr || '';

  return {
    id: item.id,
    title:
      extractString(item.landingTitle?.title) ||
      labelStr ||
      titleStr,
    description:
      extractString(item.description) ||
      extractString(item.landingTitle?.landingDescription),
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
      type: extractString(q.type) ?? 'mcq',
      title: extractString(q.title) ?? '',
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
      keyValue: q.keyValue && typeof q.keyValue === 'object' ? q.keyValue : extractString(q.keyValue),
      questions: Array.isArray(q.questions)
        ? q.questions.filter((e): e is { question: string } => typeof (e as Record<string, unknown>)?.question === 'string')
        : null,
      answers: Array.isArray(q.answers)
        ? q.answers.filter((e): e is { answer: string } => typeof (e as Record<string, unknown>)?.answer === 'string')
        : null,
      options: (q.options ?? []).map((o, i) => ({
        id: `${q.id}-opt-${i}`,
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
// Categorization logic (unchanged)
// ---------------------------------------------------------------------------

const CLINICAL_SCREENING_CATS = new Set([
  'depression', 'anxiety', 'stress', 'sleep', 'mood-disorder',
  'bipolar-disorder', 'ptsd', 'trauma', 'ocd', 'adhd', 'schizophrenia',
  'psychosis', 'dementia', 'alzheimers', 'dual-diagnosis', 'personality-disorder',
  'conduct-disorder', 'cerebral-palsy', 'intellectual-disability',
  'developmental-delay', 'autism', 'learning-disability', 'perinatal-mental-health',
  'drug-addiction', 'alcohol-addiction', 'addiction', 'eating-disorder',
  'gender-identity-disorder',
]);

const PERSONAL_GROWTH_CATS = new Set([
  'self-love', 'love', 'relationship-issues', 'family-issues',
  'Relationship Beliefs', 'Rewiring Patterns', 'Self-Care Planning',
  'Gaming Disorder', 'Addiction', 'general', 'Healthcare', 'Medical',
  'AI', 'Dna', 'Sun',
]);

export function categorizeAssessments(
  items: AssessmentItem[]
): AssessmentCategories {
  if (items.length === 0) {
    return { recommendedAssessment: null, popularScreenings: [], personalGrowth: [] };
  }
  const recommended = items[0];
  const rest = items.slice(1);
  const popular: AssessmentItem[] = [];
  const growth: AssessmentItem[] = [];
  const unmatched: AssessmentItem[] = [];

  for (const a of rest) {
    const cats = a.category ?? [];
    const isClinical = cats.some(
      (c) => CLINICAL_SCREENING_CATS.has(c) || CLINICAL_SCREENING_CATS.has(c.toLowerCase())
    );
    const isGrowth = cats.some(
      (c) => PERSONAL_GROWTH_CATS.has(c) || PERSONAL_GROWTH_CATS.has(c.toLowerCase())
    );
    if (isClinical) popular.push(a);
    else if (isGrowth) growth.push(a);
    else unmatched.push(a);
  }
  unmatched.forEach((a, i) => {
    if (i % 2 === 0) popular.push(a);
    else growth.push(a);
  });

  return { recommendedAssessment: recommended, popularScreenings: popular, personalGrowth: growth };
}

export function getDynamicCategories(assessments: AssessmentItem[]): string[] {
  const seen = new Set<string>();
  for (const a of assessments) {
    for (const cat of a.category ?? []) {
      if (cat) seen.add(cat);
    }
  }
  const inCanonicalOrder = ASSESSMENT_CATEGORIES.filter(
    (c) => c !== 'All' && seen.has(c)
  );
  const extras = [...seen].filter((c) => !ASSESSMENT_CATEGORIES.includes(c));
  return ['All', ...inCanonicalOrder, ...extras];
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100;

export function useAssessments() {
  return useSWRInfinite(
    (pageIndex: number) => [assessmentsKey(), pageIndex * PAGE_SIZE, PAGE_SIZE],
    async ([, offset]) => {
      const res = await cmsAssessmentsControllerFindAll({
        query: {
          limit: PAGE_SIZE,
          offset: offset as number,
          status: 'PUBLISHED',
          publicView: true,
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const data = res.data;
      const items = (data?.items ?? []).map(mapAssessment);
      return {
        items,
        pagination: data?.pagination ?? { total: 0, limit: PAGE_SIZE, offset: offset as number },
      } as StrapiPage;
    },
    {
      dedupingInterval: 600_000,
      revalidateFirstPage: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 1,
      persistSize: true,
    }
  );
}

export function useFilteredAssessments({
  search,
  category,
}: {
  search?: string | null;
  category?: string | null;
}) {
  const isActive = !!(search || category);
  const key = isActive
    ? [assessmentsKey(), 'filtered', search ?? '', category ?? '']
    : null;

  return useSWR(
    key,
    async () => {
      const res = await cmsAssessmentsControllerFindAll({
        query: {
          limit: PAGE_SIZE,
          offset: 0,
          status: 'PUBLISHED',
          search: search ?? undefined,
          publicView: true,
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return (res.data?.items ?? [])
        .filter((item) => {
          if (category && category !== 'All') {
            return (item.category ?? []).some(
              (c: string) => c.toLowerCase() === category.toLowerCase()
            );
          }
          return true;
        })
        .map(mapAssessment);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 600_000,
      keepPreviousData: true,
      errorRetryCount: 1,
    }
  );
}

export function useAssignedAssessments(leadId: string | null) {
  return useSWR(
    leadId ? assignedAssessmentsKey(leadId) : null,
    async () => {
      const res = await patientsControllerGetAssessments({
        path: { patientId: leadId! },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      const items = res.data ?? [];
      return items.map(
        (completion: CompletionResponseDto): AssignedAssessmentItem => ({
          documentId: completion.assessmentKey,
          id: completion.id,
          label: completion.assessmentTitle || completion.assessmentKey,
          description: '',
          category: [],
          assignedAt: completion.completedAt,
          status: 'completed',
          isCompleted: true,
          lastUsed: completion.completedAt,
          forJourney: false,
          severity: completion.severity,
          totalScore: completion.totalScore,
          maxScore: completion.maxScore,
        })
      );
    }
  );
}
