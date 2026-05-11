/**
 * Sanitizes post-auth redirect targets. Same-origin relative paths only;
 * allowlisted prefixes prevent open redirects.
 */

const MAX_LEN = 2048;

function pathOnly(fullPath: string): string {
  const q = fullPath.indexOf("?");
  return q === -1 ? fullPath : fullPath.slice(0, q);
}

function isAllowedConsultPath(path: string): boolean {
  if (path === "/consult/checkout") return true;
  if (path.startsWith("/consult/booking/")) return true;
  if (path === "/consult/find-therapist" || path.startsWith("/consult/find-therapist/"))
    return true;
  return false;
}

/** Returns a safe relative URL (may include query string) or null. */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || s.length > MAX_LEN) return null;
  if (!s.startsWith("/")) return null;
  if (s.startsWith("//")) return null;
  if (s.includes("://")) return null;
  if (s.includes("\\") || s.includes("\0")) return null;

  const path = pathOnly(s);
  if (!isAllowedConsultPath(path)) return null;
  return s;
}
