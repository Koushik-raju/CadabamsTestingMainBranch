export interface JourneyRichText {
  type: string;
  children: Array<{
    text?: string;
    type?: string;
    children?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  format?: string;
}

export interface JourneyAudio {
  id: string;
  documentId: string;
  title: string;
  description?: unknown;
  audioUrl: string;
  backgroundVisualUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  mindfulMinuteId: string;
  mindfulMinuteOrder: number;
}

export interface JourneyAssessment {
  id: string;
  title: string;
  description?: string;
  category?: unknown[];
  grade?: unknown[];
  forJourney?: boolean;
  visibleToAll?: boolean;
  label?: string;
  hint?: unknown;
  citationText?: unknown;
  image?: unknown;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  strapiId?: string;
}

export interface JourneyTask {
  id: string;
  strapiId: number;
  stepId: string;
  order: number;
  taskType?: unknown;
  fillSelfJournal?: boolean;
  showAppointments?: boolean;
  showFirstBooking?: boolean;
  moodCheckIn?: boolean;
  extraTaskTitle?: string;
  extraTaskDescription?: JourneyRichText[];
  audioIdsOrder?: string[];
  postAudioAssessmentId?: unknown;
  assessments?: JourneyAssessment[];
  worksheets?: unknown[];
  audios?: JourneyAudio[];
  subJournalings?: unknown[];
  videos?: unknown[];
  postAudioAssessment?: JourneyAssessment;
}

export interface JourneyStep {
  id: string;
  strapiId: number;
  journeyId: string;
  orderNo: number;
  title: string;
  description: JourneyRichText[];
  icon?: unknown;
  iconId?: unknown;
  extraTaskTitle?: unknown;
  extraTaskDescription?: unknown;
  mediaIcon?: unknown;
  tasks: JourneyTask[];
}

export interface JourneyItem {
  id: string;
  documentId: string;
  name: string;
  description: JourneyRichText[];
  icon: string;
  iconId?: unknown;
  grade?: unknown[];
  isPremium: boolean;
  inDraft: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  mediaIcon?: unknown;
  achievements?: unknown[];
  steps: JourneyStep[];
  subJournalings?: unknown[];
}

export interface JourneysListResponse {
  success: boolean;
  data: {
    items: JourneyItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
}

export interface JourneyDetailResponse {
  success: boolean;
  data: JourneyItem;
}

export function extractJourneyName(name: JourneyRichText[] | string | undefined): string {
  if (!name) return '';
  if (typeof name === 'string') return name;
  if (Array.isArray(name)) {
    for (const block of name) {
      if (block.children) {
        for (const child of block.children) {
          if (child.text) return child.text;
          if (child.children) {
            for (const nested of child.children) {
              if (nested.text) return nested.text;
            }
          }
        }
      }
    }
  }
  return '';
}

export function extractJourneyDescription(desc: JourneyRichText[] | string | undefined): string {
  return extractJourneyName(desc);
}
