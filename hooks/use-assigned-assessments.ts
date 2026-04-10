import useSWR from 'swr';
import { getAssignedAssessments } from '@/services/assessment.service';
import { swrConfig } from '@/lib/swr-config';

export function useAssignedAssessments(leadId: string | null) {
  return useSWR(
    leadId ? ['assigned-assessments', leadId] : null,
    () => getAssignedAssessments(leadId!),
    swrConfig,
  );
}
