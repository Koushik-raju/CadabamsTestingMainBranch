/**
 * Patient assigned-content API (`GET …/patient/assigned-content`) returns
 * `AssignmentListView` from the Nest backend: `{ campus, crmLeadId, items, buckets }`.
 * `buckets` is always present — same rows as `items`, grouped by bucket key
 * (see `LeadAssignmentsService.listForLead` + `groupIntoBuckets`).
 */

export type AssignedContentBucketKey =
  | "assessments"
  | "worksheets"
  | "journeys"
  | "audio"
  | "video"
  | "wellness";

export function getAssignedBucketItems(data: unknown, bucket: AssignedContentBucketKey): unknown[] {
  if (!data || typeof data !== "object") return [];
  const buckets = (data as Record<string, unknown>).buckets;
  if (!buckets || typeof buckets !== "object") return [];
  const list = (buckets as Record<string, unknown>)[bucket];
  return Array.isArray(list) ? list : [];
}

export function getAssignmentMetadata(
  obj: Record<string, unknown>,
): Record<string, unknown> | null {
  const m = obj.metadata;
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}
