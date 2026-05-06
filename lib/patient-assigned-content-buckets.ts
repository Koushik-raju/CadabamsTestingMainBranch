/**
 * Patient assigned-content API returns `{ items, buckets }` where each bucket
 * is an array of assignment rows. Older code expected `items[0].assignments`.
 */

export type AssignedContentBucketKey = "assessments" | "worksheets";

export function getAssignedBucketItems(data: unknown, bucket: AssignedContentBucketKey): unknown[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;

  const buckets = root.buckets;
  if (buckets && typeof buckets === "object") {
    const list = (buckets as Record<string, unknown>)[bucket];
    if (Array.isArray(list)) return list;
  }

  const items = root.items;
  if (Array.isArray(items) && items.length > 0) {
    const row = items[0];
    if (row && typeof row === "object") {
      const assignments = (row as Record<string, unknown>).assignments;
      if (assignments && typeof assignments === "object") {
        const list = (assignments as Record<string, unknown>)[bucket];
        if (Array.isArray(list)) return list;
      }
    }
  }

  return [];
}

export function getAssignmentMetadata(
  obj: Record<string, unknown>,
): Record<string, unknown> | null {
  const m = obj.metadata;
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}
