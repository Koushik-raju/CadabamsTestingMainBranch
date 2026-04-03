export interface WellnessResource {
  id: string | number;
  title?: string;
  content?: string;
  category?: string;
  image?: string;
  [key: string]: unknown;
}
