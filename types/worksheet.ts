export interface Worksheet {
  id: string | number;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface WorksheetSubmission {
  id?: string | number;
  worksheet_id: string | number;
  answers: Record<string, unknown>;
}
