import qs from 'qs';
import useSWR, { SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { doc, getDoc } from 'firebase/firestore';
import { ref, get, push } from 'firebase/database';
import { firestore, database } from '@/lib/firebase';
import { getApiV1AssessmentsById } from '@/sdk/strapi';
import type { GetApiV1AssessmentsResponses } from '@/sdk/strapi';
import { client } from '@/sdk/strapi/client.gen';
import { swrConfig } from '@/lib/swr-config';
import { backendClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

// Base $and filter clauses — grouped for Strapi v5 compatibility
const BASE_FILTER_CLAUSES = [
  { status: { $eq: 'PUBLISHED' } },
  { citationText: { $notNull: true } },
] as const;

async function strapiGetAssessments(params: Record<string, unknown>) {
  // Separate `populate` to prevent qs encoding `*` → `%2A` which Strapi won't recognise
  const { populate, ...rest } = params as Record<string, unknown> & { populate?: unknown };
  const queryString = qs.stringify(rest, { encodeValuesOnly: true });
  const populatePart = populate !== undefined ? `&populate=${populate}` : '';
  const fullUrl = `/api/v1/assessments/?${queryString}${populatePart}`;
  console.log('[ASSESS:1] URL', fullUrl);
  const response = await client.get({ url: fullUrl });
  console.log('[ASSESS:2] response.data keys', response.data ? Object.keys(response.data as object) : response.data);
  const payload = (response.data as { data?: GetApiV1AssessmentsResponses[200]['data'] })?.data;
  console.log('[ASSESS:3] payload', payload ? `items=${payload.items?.length} pagination=${JSON.stringify(payload.pagination)}` : payload);
  return payload;
}

// ---------------------------------------------------------------------------
// Types
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
}

export interface AssessmentSubmission {
  date: string;
  data: Record<string, unknown>;
}

export interface AssessmentCategories {
  recommendedAssessment: AssessmentItem | null;
  popularScreenings: AssessmentItem[];
  personalGrowth: AssessmentItem[];
}

// ---------------------------------------------------------------------------
// Data mapping & manipulation helpers
// ---------------------------------------------------------------------------

export function mapStrapiAssessment(
  item: GetApiV1AssessmentsResponses[200]['data']['items'][0]
): AssessmentItem {
  return {
    id: item.id,
    title: item.landingTitle?.title || item.label || item.title,
    description:
      item.description || item.landingTitle?.landingDescription || null,
    category: item.category,
    label: item.label,
    hint: item.hint,
    image: item.image,
    citationText: item.citationText ?? null,
    status: item.status,
    visibleToAll: item.visibleToAll ?? false,
    forJourney: item.forJourney ?? false,
    landingTitle: item.landingTitle
      ? {
          title: item.landingTitle.title,
          landingDescription: item.landingTitle.landingDescription,
          minutes: item.landingTitle.minutes,
          numberOfQuestion: item.landingTitle.numberOfQuestion,
          badgeText: item.landingTitle.badgeText,
          actionLabel: item.landingTitle.actionLabel,
          points: item.landingTitle.points,
        }
      : null,
    Questions: item.Questions,
  };
}

// Clinical screening tools — standardised, validated instruments used by clinicians
// to detect and measure severity of a specific condition.
const CLINICAL_SCREENING_CATS = new Set([
  'depression',
  'anxiety',
  'stress',
  'sleep',
  'mood-disorder',
  'bipolar-disorder',
  'ptsd',
  'trauma',
  'ocd',
  'adhd',
  'schizophrenia',
  'psychosis',
  'dementia',
  'alzheimers',
  'dual-diagnosis',
  'personality-disorder',
  'conduct-disorder',
  'cerebral-palsy',
  'intellectual-disability',
  'developmental-delay',
  'autism',
  'learning-disability',
  'perinatal-mental-health',
  'drug-addiction',
  'alcohol-addiction',
  'addiction',
  'eating-disorder',
  'gender-identity-disorder',
]);

// Self-discovery / personal-growth tools — reflective exercises, habit awareness,
// relationship patterns, and lifestyle wellbeing (not purely clinical diagnosis).
const PERSONAL_GROWTH_CATS = new Set([
  'self-love',
  'love',
  'relationship-issues',
  'family-issues',
  'Relationship Beliefs',
  'Rewiring Patterns',
  'Self-Care Planning',
  'Gaming Disorder',
  'Addiction',
  'general',
  'Healthcare',
  'Medical',
  'AI',
  'Dna',
  'Sun',
]);

export function categorizeAssessments(
  items: AssessmentItem[]
): AssessmentCategories {
  if (items.length === 0) {
    return {
      recommendedAssessment: null,
      popularScreenings: [],
      personalGrowth: [],
    };
  }

  const recommended = items[0];
  const rest = items.slice(1);

  const popular: AssessmentItem[] = [];
  const growth: AssessmentItem[] = [];
  const unmatched: AssessmentItem[] = [];

  for (const a of rest) {
    const cats = a.category ?? [];
    // Check exact match first, then lowercase match
    const isClinical = cats.some(
      (c) =>
        CLINICAL_SCREENING_CATS.has(c) ||
        CLINICAL_SCREENING_CATS.has(c.toLowerCase())
    );
    const isGrowth = cats.some(
      (c) =>
        PERSONAL_GROWTH_CATS.has(c) || PERSONAL_GROWTH_CATS.has(c.toLowerCase())
    );

    if (isClinical) {
      popular.push(a);
    } else if (isGrowth) {
      growth.push(a);
    } else {
      unmatched.push(a);
    }
  }

  // Distribute unmatched items to keep sections balanced
  unmatched.forEach((a, i) => {
    if (i % 2 === 0) popular.push(a);
    else growth.push(a);
  });

  return {
    recommendedAssessment: recommended,
    popularScreenings: popular,
    personalGrowth: growth,
  };
}

function deriveScoreSummary(
  submissions: AssessmentSubmission[]
): { label: string; value: string } | null {
  if (submissions.length === 0) return null;
  const latest = submissions[0];
  const entries = Object.entries(latest.data).filter(
    ([key]) => key !== 'date' && !key.startsWith('_')
  );
  const numericScores: number[] = [];
  entries.forEach(([, value]) => {
    const entryData = value as Record<string, unknown>;
    const selected = entryData?.selected;
    if (typeof selected === 'number') numericScores.push(selected);
  });
  if (numericScores.length === 0) return null;
  const avg = numericScores.reduce((a, b) => a + b, 0) / numericScores.length;
  const percentage = Math.round((avg / 5) * 100);
  let label = 'Low';
  if (percentage >= 80) label = 'High';
  else if (percentage >= 60) label = 'Moderate';
  else if (percentage >= 40) label = 'Low';
  else label = 'Very Low';
  return { label, value: `${label} (${percentage}%)` };
}

// ---------------------------------------------------------------------------
// Firebase helpers (internal)
// ---------------------------------------------------------------------------

async function checkAssessmentCompletion(
  leadId: string,
  assessmentId: string
): Promise<string | null> {
  try {
    const snap = await get(
      ref(database, `assessments/${leadId}/${assessmentId}`)
    );
    if (!snap.exists()) return null;
    const values = Object.values(
      snap.val() as Record<string, { date?: string }>
    );
    const dates = values.map((v) => v.date).filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )[0];
  } catch {
    return null;
  }
}

async function fetchAssignedAssessmentsFromFirestore(
  leadId: string
): Promise<AssignedAssessmentItem[]> {
  const docRef = doc(firestore, 'patient_assignments', leadId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return [];

  const data = docSnap.data();
  const assignments: Array<{
    id?: string | number;
    documentId?: string;
    title?: string;
    description?: string;
    category?: string | string[];
    assignedAt?: string;
    status?: string;
    forJourney?: boolean;
  }> = data.assessments || [];

  return Promise.all(
    assignments.map(async (assigned) => {
      const documentId = String(assigned.id || assigned.documentId || '');
      const lastCompletion = documentId
        ? await checkAssessmentCompletion(leadId, documentId)
        : null;
      return {
        documentId,
        id: assigned.id,
        label: assigned.title || 'Untitled Assessment',
        description: assigned.description || '',
        category: assigned.category
          ? Array.isArray(assigned.category)
            ? assigned.category
            : [assigned.category]
          : [],
        assignedAt: assigned.assignedAt,
        status: assigned.status || 'assigned',
        forJourney: assigned.forJourney || false,
        isCompleted: !!lastCompletion,
        lastUsed: lastCompletion || '1970-01-01T00:00:00Z',
      };
    })
  );
}

async function fetchSubmissionsFromRTDB(
  leadId: string,
  assessmentId: string
): Promise<AssessmentSubmission[]> {
  const snap = await get(
    ref(database, `assessments/${leadId}/${assessmentId}`)
  );
  if (!snap.exists()) return [];
  const data = snap.val() as Record<
    string,
    { date?: string; [key: string]: unknown }
  >;
  return Object.values(data)
    .filter(Boolean)
    .map((entry) => ({
      date: (entry.date as string) || new Date().toISOString(),
      data: entry,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ---------------------------------------------------------------------------
// SWR fetchers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100;

export interface StrapiPage {
  items: AssessmentItem[];
  pagination: { total: number; limit: number; offset: number };
}

async function fetchAssessmentPage(offset: number): Promise<StrapiPage> {
  const data = await strapiGetAssessments({
    pagination: { limit: PAGE_SIZE, start: offset },
    filters: { $and: BASE_FILTER_CLAUSES },
    populate: '*',
  });
  const raw = data?.items ?? [];
  console.log('[ASSESS:4] raw items from API', raw.length);
  const items = raw
    .filter((item: { citationText?: string | null }) => item.citationText != null)
    .map(mapStrapiAssessment);
  console.log('[ASSESS:5] mapped items', items.length);
  return {
    items,
    pagination: data?.pagination ?? { total: 0, limit: PAGE_SIZE, offset },
  };
}

const assessmentByIdFetcher = async (id: string) => {
  const response = await getApiV1AssessmentsById({ path: { id } });
  return response.data?.data;
};

async function fetchFilteredAssessments({
  search,
  category,
}: {
  search?: string;
  category?: string;
}): Promise<AssessmentItem[]> {
  const data = await strapiGetAssessments({
    pagination: { limit: PAGE_SIZE, start: 0 },
    ...(search ? { search } : {}),
    filters: {
      $and: [
        ...BASE_FILTER_CLAUSES,
        ...(category ? [{ category: { $containsi: category } }] : []),
      ],
    },
    populate: '*',
  });
  return (data?.items ?? [])
    .filter((item: { citationText?: string | null }) => item.citationText != null)
    .map(mapStrapiAssessment);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAssessments(_options?: unknown) {
  return useSWRInfinite(
    (pageIndex: number) => ['assessments', pageIndex * PAGE_SIZE, PAGE_SIZE],
    ([, offset]) => fetchAssessmentPage(offset as number),
    {
      ...swrConfig,
      dedupingInterval: 600_000, // 10 min — one fetch per key per session
      revalidateFirstPage: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 1, // don't hammer on 429
      persistSize: true,
    }
  );
}

export function useAssessmentById(
  id: string | null,
  config?: SWRConfiguration
) {
  return useSWR(
    id ? ['assessment', id] : null,
    () => assessmentByIdFetcher(id!),
    { ...swrConfig, ...config }
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
  // Both params included in key so search+category combos cache independently
  const key = isActive
    ? ['assessments-filtered', search ?? '', category ?? '']
    : null;

  return useSWR(
    key,
    () =>
      fetchFilteredAssessments({
        search: search ?? undefined,
        category: category ?? undefined,
      }),
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
    leadId ? ['assigned-assessments', leadId] : null,
    () => fetchAssignedAssessmentsFromFirestore(leadId!),
    swrConfig
  );
}

export function useAssessmentSubmissions(
  leadId: string | null,
  assessmentId: string | null
) {
  return useSWR(
    leadId && assessmentId
      ? ['assessment-submissions', leadId, assessmentId]
      : null,
    () => fetchSubmissionsFromRTDB(leadId!, assessmentId!),
    swrConfig
  );
}

export function useAssessmentScoreSummary(
  leadId: string | null,
  assessmentId: string | null
) {
  const { data: submissions, ...rest } = useAssessmentSubmissions(
    leadId,
    assessmentId
  );
  return {
    scoreSummary: deriveScoreSummary(submissions || []),
    submissions,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Dynamic category derivation
// ---------------------------------------------------------------------------

import { ASSESSMENT_CATEGORIES } from '@/components/assessment/assessment-category';

/**
 * Derives the ordered category list from loaded assessments.
 * - Preserves the canonical order from ASSESSMENT_CATEGORIES
 * - Appends any categories from the API not in the static list
 * - Returns ["All", ...rest] — always starts with "All"
 */
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
// Submit assessment (dual-write: Firebase RTDB + backend)
// ---------------------------------------------------------------------------

export async function submitAssessment(
  leadId: string,
  assessmentId: string,
  answers: Record<string, unknown>
): Promise<void> {
  const payload: Record<string, unknown> = {
    date: new Date().toISOString(),
    ...answers,
  };

  if (leadId && assessmentId) {
    const dbRef = ref(database, `assessments/${leadId}/${assessmentId}`);
    await push(dbRef, payload);
  }

  await backendClient.post(endpoints.saveAssessment, {
    lead_id: leadId,
    assessment_id: assessmentId,
    answers: payload,
  });
}
