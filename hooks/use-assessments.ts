import useSWR, { SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { getApiV1Assessments, getApiV1AssessmentsById } from '@/sdk/strapi';
import type { GetApiV1AssessmentsResponses } from '@/sdk/strapi';
import { swrConfig } from '@/lib/swr-config';

const assessmentFetcher = async (query: { limit: number; offset: number; status?: 'ALL' | 'DRAFT' | 'PUBLISHED' }) => {
  const response = await getApiV1Assessments({ query });
  console.log('[use-assessments] Raw response:', JSON.stringify(response, null, 2).slice(0, 500));
  return response.data;
};

const assessmentByIdFetcher = async (id: string) => {
  const response = await getApiV1AssessmentsById({ path: { id } });
  console.log('[use-assessment-by-id] Raw response:', JSON.stringify(response, null, 2).slice(0, 500));
  return response.data;
};

export interface AssessmentItem {
  id: string;
  title: string;
  description: string | null;
  category: string[];
  label: string | null;
  hint: string | null;
  image: string | null;
  status: 'DRAFT' | 'PUBLISHED';
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

export function useAssessments(options?: { limit?: number; status?: 'ALL' | 'DRAFT' | 'PUBLISHED' }) {
  const limit = options?.limit ?? 10;
  const status = options?.status ?? 'PUBLISHED';

  return useSWRInfinite(
    (pageIndex: number) => ['assessments', pageIndex * limit, limit, status],
    ([, offset, , status]) => assessmentFetcher({ limit, offset, status }),
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
    swrConfig,
  );
}
