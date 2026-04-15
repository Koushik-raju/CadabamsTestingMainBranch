import useSWR from 'swr';
import { cmsJourneysControllerList } from '@/sdk/backend-v2';
import type { JourneyResponseDto } from '@/sdk/backend-v2';
import { journeysKey } from '@/lib/swr-keys';
import type { JourneyItem } from '@/types/journey';

// ---------------------------------------------------------------------------
// Mapping helper
// ---------------------------------------------------------------------------

function extractStringFromObj(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    // Try URL/src patterns for icons
    for (const key of ['url', 'src', 'href', 'en', 'text', 'value']) {
      if (typeof obj[key] === 'string') return obj[key] as string;
    }
  }
  return '';
}

export function mapV2Journey(dto: JourneyResponseDto): JourneyItem {
  return {
    id: dto.id,
    documentId: extractStringFromObj(dto.documentId),
    name: dto.name, // V2 name is already a plain string
    description: extractStringFromObj(dto.description) as never, // components use extractJourneyDescription
    icon: extractStringFromObj(dto.icon),
    iconId: dto.iconId,
    grade: dto.grade ?? [],
    isPremium: dto.isPremium ?? false,
    inDraft: dto.inDraft ?? false,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    achievements: dto.achievements ?? [],
    steps: (dto.steps ?? []).map((step) => ({
      id: step.id,
      strapiId: 0,
      journeyId: step.journeyId,
      orderNo: step.orderNo,
      title: step.title,
      description: extractStringFromObj(step.description) as never,
      icon: step.icon,
      iconId: step.iconId,
      tasks: (step.tasks ?? []).map((task) => ({
        id: task.id,
        strapiId: 0,
        stepId: task.stepId,
        order: task.order,
        taskType: extractStringFromObj(task.taskType),
        fillSelfJournal: task.fillSelfJournal,
        showAppointments: task.showAppointments,
        showFirstBooking: task.showFirstBooking,
        moodCheckIn: task.moodCheckIn,
        extraTaskTitle: extractStringFromObj(task.extraTaskTitle),
        audioIdsOrder: task.audioIds,
        assessmentIds: task.assessmentIds,
        worksheetIds: task.worksheetIds,
        videoIds: task.videoIds,
        subJournalingIds: task.subJournalingIds,
        assessments: [],
        worksheets: [],
        audios: [],
        subJournalings: [],
        videos: [],
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useJourneys(options?: { limit?: number; search?: string; category?: string }) {
  const key = journeysKey(options?.category, options?.search);

  const { data, isLoading, error } = useSWR(
    key,
    async () => {
      const res = await cmsJourneysControllerList({
        query: {
          limit: options?.limit ?? 50,
          status: 'PUBLISHED',
          search: options?.search,
        },
      });
      if (res.error) throw new Error(JSON.stringify(res.error));
      return (res.data?.items ?? []).map(mapV2Journey);
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 300_000,
    }
  );

  return { journeys: data ?? [], isLoading, error };
}
