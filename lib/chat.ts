export interface MastraThread {
  id: string;
  title?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  metadata?: Record<string, unknown>;
}

export function normalizeThread(thread: MastraThread): MastraThread {
  return {
    ...thread,
    createdAt: thread.createdAt ? new Date(thread.createdAt) : undefined,
    updatedAt: thread.updatedAt ? new Date(thread.updatedAt) : undefined,
  };
}

export function formatDate(date?: Date | string): string {
  if (!date) return "Unknown date";

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown date";
  }
}
