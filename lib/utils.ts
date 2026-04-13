import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STRAPI_BASE = 'https://mindtalkbuddy.com';

export function fixImageUrl(url: unknown): string {
  if (!url) return '/journey/default.png';
  if (typeof url === 'string') {
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/uploads/')) return `${STRAPI_BASE}${url}`;
    return url;
  }
  if (typeof url === 'object') {
    const u = url as { url?: string };
    if (u.url) return fixImageUrl(u.url);
  }
  return '/journey/default.png';
}
