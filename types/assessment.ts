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
