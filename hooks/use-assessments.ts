import useSWR, { SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { doc, getDoc } from 'firebase/firestore';
import { ref, get, push } from 'firebase/database';
import { firestore, database } from '@/lib/firebase';
import { getApiV1Assessments, getApiV1AssessmentsById } from '@/sdk/strapi';
import type { GetApiV1AssessmentsResponses } from '@/sdk/strapi';
import { swrConfig } from '@/lib/swr-config';
import { backendClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';

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
    description: item.description || item.landingTitle?.landingDescription || null,
    category: item.category,
    label: item.label,
    hint: item.hint,
    image: item.image,
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

export function categorizeAssessments(items: AssessmentItem[]): AssessmentCategories {
  if (items.length === 0) {
    return { recommendedAssessment: null, popularScreenings: [], personalGrowth: [] };
  }

  const first = items[0];
  const remaining = items.slice(1);

  const hasCategories = remaining.some((a) => (a.category || []).length > 0);

  let popular: AssessmentItem[] = [];
  let growth: AssessmentItem[] = [];

  if (hasCategories) {
    popular = remaining.filter((a) => {
      const cats = (a.category || []).map((c) => String(c).toLowerCase());
      return cats.some(
        (c) =>
          c.includes('anxiety') ||
          c.includes('depression') ||
          c.includes('stress') ||
          c.includes('sleep') ||
          c.includes('mental')
      );
    });

    growth = remaining.filter((a) => {
      const cats = (a.category || []).map((c) => String(c).toLowerCase());
      return (
        cats.length > 0 &&
        !cats.some(
          (c) =>
            c.includes('anxiety') ||
            c.includes('depression') ||
            c.includes('stress') ||
            c.includes('sleep') ||
            c.includes('mental')
        )
      );
    });

    const uncategorized = remaining.filter((a) => !(a.category || []).length);

    if (popular.length === 0 && growth.length === 0) {
      const halfIndex = Math.ceil(uncategorized.length / 2);
      popular = uncategorized.slice(0, halfIndex);
      growth = uncategorized.slice(halfIndex);
    } else if (popular.length === 0) {
      popular = uncategorized;
    } else if (growth.length === 0) {
      growth = uncategorized;
    }
  } else {
    const halfIndex = Math.ceil(remaining.length / 2);
    popular = remaining.slice(0, halfIndex);
    growth = remaining.slice(halfIndex);
  }

  return {
    recommendedAssessment: first,
    popularScreenings: popular,
    personalGrowth: growth,
  };
}

function deriveScoreSummary(submissions: AssessmentSubmission[]): { label: string; value: string } | null {
  if (submissions.length === 0) return null;
  const latest = submissions[0];
  const entries = Object.entries(latest.data).filter(([key]) => key !== 'date' && !key.startsWith('_'));
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

async function checkAssessmentCompletion(leadId: string, assessmentId: string): Promise<string | null> {
  try {
    const snap = await get(ref(database, `assessments/${leadId}/${assessmentId}`));
    if (!snap.exists()) return null;
    const values = Object.values(snap.val() as Record<string, { date?: string }>);
    const dates = values.map((v) => v.date).filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  } catch {
    return null;
  }
}

async function fetchAssignedAssessmentsFromFirestore(leadId: string): Promise<AssignedAssessmentItem[]> {
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
      const lastCompletion = documentId ? await checkAssessmentCompletion(leadId, documentId) : null;
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

async function fetchSubmissionsFromRTDB(leadId: string, assessmentId: string): Promise<AssessmentSubmission[]> {
  const snap = await get(ref(database, `assessments/${leadId}/${assessmentId}`));
  if (!snap.exists()) return [];
  const data = snap.val() as Record<string, { date?: string; [key: string]: unknown }>;
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

const assessmentFetcher = async (query: {
  limit: number;
  offset: number;
  status?: 'ALL' | 'DRAFT' | 'PUBLISHED';
  search?: string;
  visibleToAll?: boolean;
  forJourney?: boolean;
}) => {
  const response = await getApiV1Assessments({ query: query as never });
  return response.data?.data;
};

const assessmentByIdFetcher = async (id: string) => {
  const response = await getApiV1AssessmentsById({ path: { id } });
  return response.data?.data;
};

const filteredAssessmentFetcher = async (search: string): Promise<AssessmentItem[]> => {
  const response = await getApiV1Assessments({
    query: {
      limit: 50,
      offset: 0,
      status: 'PUBLISHED',
      search,
      visibleToAll: true,
      forJourney: false,
    } as never,
  });
  return (
    response.data?.data?.items
      ?.filter((item: { status?: string }) => item.status === 'PUBLISHED')
      .map(mapStrapiAssessment) || []
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAssessments(options?: {
  limit?: number;
  status?: 'ALL' | 'DRAFT' | 'PUBLISHED';
  search?: string;
}) {
  const limit = options?.limit ?? 10;
  const status = options?.status ?? 'PUBLISHED';
  const search = options?.search;

  return useSWRInfinite(
    (pageIndex: number) => ['assessments', pageIndex * limit, limit, status, search],
    ([, offset, , status, search]) =>
      assessmentFetcher({ limit, offset, status, search, visibleToAll: true, forJourney: false }),
    {
      ...swrConfig,
      revalidateFirstPage: false,
      persistSize: true,
    }
  );
}

export function useAssessmentById(id: string | null, config?: SWRConfiguration) {
  return useSWR(
    id ? ['assessment', id] : null,
    () => assessmentByIdFetcher(id!),
    { ...swrConfig, ...config }
  );
}

export function useFilteredAssessments(query: string | null) {
  return useSWR(
    query ? ['assessments-filtered', query] : null,
    () => filteredAssessmentFetcher(query!),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
}

export function useAssignedAssessments(leadId: string | null) {
  return useSWR(
    leadId ? ['assigned-assessments', leadId] : null,
    () => fetchAssignedAssessmentsFromFirestore(leadId!),
    swrConfig
  );
}

export function useAssessmentSubmissions(leadId: string | null, assessmentId: string | null) {
  return useSWR(
    leadId && assessmentId ? ['assessment-submissions', leadId, assessmentId] : null,
    () => fetchSubmissionsFromRTDB(leadId!, assessmentId!),
    swrConfig
  );
}

export function useAssessmentScoreSummary(leadId: string | null, assessmentId: string | null) {
  const { data: submissions, ...rest } = useAssessmentSubmissions(leadId, assessmentId);
  return { scoreSummary: deriveScoreSummary(submissions || []), submissions, ...rest };
}

// ---------------------------------------------------------------------------
// Submit assessment (dual-write: Firebase RTDB + backend)
// ---------------------------------------------------------------------------

export async function submitAssessment(
  leadId: string,
  assessmentId: string,
  answers: Record<string, unknown>
): Promise<void> {
  const payload: Record<string, unknown> = { date: new Date().toISOString(), ...answers };

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
