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
  documentId: string;
  title: string;
  duration?: string;
  category?: string | string[];
  audio?: { url: string };
  backgroundVisual?: { url: string };
}

export interface MindfulMinute {
  id: number;
  documentId?: string;
  slug: string;
  title: string;
  duration?: string;
  category?: string[];
  coverImage?: CoverImage;
  audio?: MindfulMinuteAudio[];
}
