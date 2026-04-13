export interface CoverImage {
  webImage?: { url?: string; alternativeText?: string };
  mobileImage?: { url?: string; alternativeText?: string };
}

export interface WellnessResource {
  id: string | number;
  documentId?: string;
  slug?: string;
  title?: string;
  subTitle?: string;
  content?: string;
  description?: string;
  category?: string | string[];
  duration?: string;
  image?: string;
  coverImage?: CoverImage;
  audioUrl?: string;
  videoUrl?: string;
  text?: ResourceBlock[];
  similarBlogs?: WellnessResource[];
  [key: string]: unknown;
}

export interface ResourceBlock {
  id: number;
  __component: string;
  [key: string]: unknown;
}

export interface MindfulMinuteAudio {
  id: string;
  documentId: string;
  title: string;
  audioUrl?: string;
  backgroundVisualUrl?: string;
  duration?: string;
  category?: string;
}

export interface VideoItem {
  id: number;
  documentId?: string;
  slug: string;
  title: string;
  category?: string[];
  coverImage?: {
    webImage?: { url?: string };
    mobileImage?: { url?: string };
  };
  videoUrl?: string;
  text?: unknown[];
}

export interface MindfulMinute {
  id: string;
  documentId?: string;
  slug: string;
  title: string;
  category?: string;
  coverImageUrl?: string;
  audios?: MindfulMinuteAudio[];
}

export interface MindfulMinutesListResponse {
  success: boolean;
  data: {
    items: MindfulMinute[];
    pagination: { total: number; limit: number; offset: number };
  };
}

export interface MindfulMinuteDetailResponse {
  success: boolean;
  data: MindfulMinute;
}
