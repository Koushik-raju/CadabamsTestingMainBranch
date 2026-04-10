export interface Assessment {
  id: string | number;
  name?: string;
  type?: string;
  questions?: AssessmentQuestion[];
  [key: string]: unknown;
}

export interface AssessmentQuestion {
  id: string | number;
  question: string;
  options?: string[];
  type?: string;
}

export interface AssessmentResult {
  score?: number;
  category?: string;
  recommendations?: string[];
}

export interface AssessmentPoint {
  id: string;
  landingPageId: string;
  icon?: unknown;
  item: string;
}

export interface AssessmentLandingTitle {
  id: string;
  assessmentId: string;
  title?: unknown;
  landingDescription?: string;
  footer?: string;
  minutes?: number;
  numberOfQuestion?: string;
  badgeText?: unknown;
  actionLabel?: unknown;
  points?: AssessmentPoint[];
}

export interface AssessmentOption {
  id: string;
  questionId: string;
  label: string;
  value: string | number;
  order: number;
}

export interface AssessmentQuestionItem {
  id: string;
  assessmentId: string;
  type: string;
  title?: string;
  subtitle?: unknown;
  hint?: unknown;
  continueLabel?: string;
  order?: number;
  smileys?: unknown[];
  count?: unknown;
  label?: unknown;
  prompt?: string;
  choice?: unknown;
  answer?: unknown;
  text?: string;
  questions?: Array<{ question: string }>;
  answers?: Array<{ answer: string }>;
  citationText?: unknown;
  options?: AssessmentOption[];
}

export interface AssessmentJourneyTask {
  id: string;
  strapiId: number;
  stepId: string;
  order: number;
  taskType?: unknown;
  fillSelfJournal?: boolean;
  showAppointments?: boolean;
  showFirstBooking?: boolean;
  moodCheckIn?: boolean;
  extraTaskTitle?: unknown;
  extraTaskDescription?: unknown;
  audioIdsOrder?: unknown[];
  postAudioAssessmentId?: unknown;
}

export interface AssessmentItem {
  id: string;
  title: string;
  description?: string;
  category?: string[];
  grade?: unknown[];
  forJourney?: boolean;
  visibleToAll?: boolean;
  label?: string;
  hint?: string;
  citationText?: string;
  image?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  landingTitle?: AssessmentLandingTitle;
  journeyTasks?: AssessmentJourneyTask[];
  postAudioJourneyTasks?: unknown[];
  Questions?: AssessmentQuestionItem[];
  documentId?: string;
}

export interface AssessmentDetailResponse {
  success: boolean;
  data: AssessmentItem;
}

export interface AssessmentListResponse {
  success: boolean;
  data: {
    items: AssessmentItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
}

export function extractTextFromRich(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (obj.text && typeof obj.text === 'string') return obj.text;
  }
  return '';
}
