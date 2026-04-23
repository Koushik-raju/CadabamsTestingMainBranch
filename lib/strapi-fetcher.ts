/**
 * Thin fetcher for the public Strapi CMS API (mindtalkbuddy.com/api).
 * This is a separate service from the backend SDK (console.mindtalkbuddy.com).
 * No auth required — content is public.
 */

const STRAPI_BASE = "https://mindtalkbuddy.com/api";
const STRAPI_ADMIN_BASE = "https://admin.mindtalkbuddy.com";

async function strapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Strapi fetch failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export function getStrapiImageUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url.split("?")[0];
  return `${STRAPI_ADMIN_BASE}${url}`.split("?")[0];
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StrapiPagination {
  total: number;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  pageCount?: number;
}

type WellnessResource = import("@/hooks/wellness/use-wellness-resources").WellnessResource;
type VideoItem = import("@/hooks/wellness/use-videos").VideoItem;

export interface StrapiWellnessListResponse {
  data: WellnessResource[];
  meta?: { pagination?: StrapiPagination };
}

// ─── Wellness Resources (blogs) ──────────────────────────────────────────────

export interface WellnessResourcesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
}

/** Fetch paginated wellness resources from the /blogs endpoint */
export async function fetchWellnessResourcesList(params: WellnessResourcesParams = {}): Promise<{
  resources: WellnessResource[];
  pagination: StrapiPagination;
}> {
  const { page = 1, pageSize = 12, search = "", category = "" } = params;

  const qs = new URLSearchParams();
  qs.set("pLevel", "5");
  qs.set("pagination[page]", String(page));
  qs.set("pagination[pageSize]", String(pageSize));
  if (search.trim()) qs.set("filters[title][$containsi]", search.trim());
  if (category && category !== "All") qs.set("filters[category][$containsi]", category);

  const json = await strapiGet<StrapiWellnessListResponse>(`/blogs?${qs.toString()}`);
  return {
    resources: json.data ?? [],
    pagination: json.meta?.pagination ?? {
      total: 0,
      page,
      pageSize,
      pageCount: 0,
    },
  };
}

/** Fetch a single wellness resource by slug */
export async function fetchWellnessResourceBySlug(slug: string): Promise<WellnessResource | null> {
  const json = await strapiGet<StrapiWellnessListResponse>(
    `/blogs?filters[slug][$eq][0]=${encodeURIComponent(slug)}&pLevel=5`,
  );
  return json?.data?.[0] ?? null;
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export interface StrapiVideoListResponse {
  data: VideoItem[];
}

/** Strip markdown headings/formatting from a string */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // ## headings
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // **bold** / *italic*
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1") // __bold__ / _italic_
    .replace(/`([^`]+)`/g, "$1") // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [link](url)
    .trim();
}

/** Fetch collection videos */
export async function fetchVideos(): Promise<VideoItem[]> {
  const json = await strapiGet<StrapiVideoListResponse>(
    "/videos?pLevel&filters[type][$eq]=Collection%20Video",
  );
  if (!Array.isArray(json?.data)) throw new Error("Invalid video data format");
  return json.data.map((v) => ({ ...v, title: stripMarkdown(v.title) }));
}

/** Fetch a single video by slug */
export async function fetchVideoBySlug(slug: string): Promise<VideoItem | null> {
  const json = await strapiGet<StrapiVideoListResponse>(
    `/videos?filters[slug][$eq]=${encodeURIComponent(slug)}&pLevel=5`,
  );
  const item = json?.data?.[0] ?? null;
  if (!item) return null;
  return { ...item, title: stripMarkdown(item.title) };
}
