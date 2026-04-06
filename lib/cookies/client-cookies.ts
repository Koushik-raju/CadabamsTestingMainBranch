import type {
  CookieAdapter,
  CookieEntry,
  CookieOptions,
  GetCookieOptions,
  SetCookieOptions,
} from './types';

function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof document.cookie === 'string'
  );
}

function parseCookies(): Map<string, string> {
  const map = new Map<string, string>();
  if (!isBrowser()) return map;
  for (const pair of document.cookie.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    if (key) map.set(key, val);
  }
  return map;
}

function serialiseOptions(opts: CookieOptions): string {
  const parts: string[] = [];
  if (opts.path) parts.push(`path=${opts.path}`);
  if (opts.domain) parts.push(`domain=${opts.domain}`);
  if (opts.maxAge !== undefined) parts.push(`max-age=${opts.maxAge}`);
  if (opts.expires) parts.push(`expires=${opts.expires.toUTCString()}`);
  if (opts.secure) parts.push('secure');
  if (opts.sameSite) parts.push(`samesite=${opts.sameSite}`);
  return parts.length ? `; ${parts.join('; ')}` : '';
}

function get(name: string, options?: GetCookieOptions): string | null {
  try {
    if (!isBrowser()) return null;
    const raw = parseCookies().get(name) ?? null;
    if (raw === null) return null;
    return (options?.decode ?? true) ? decodeURIComponent(raw) : raw;
  } catch {
    return null;
  }
}

function set(name: string, value: string, options?: SetCookieOptions): boolean {
  try {
    if (!isBrowser()) return false;
    if (options?.serverOnly) {
      console.warn(`[cookies] "${name}" is serverOnly — skipping client set.`);
      return false;
    }
    const encoded = (options?.encode ?? true) ? encodeURIComponent(value) : value;
    document.cookie = `${name}=${encoded}${serialiseOptions(options ?? {})}`;
    return true;
  } catch {
    return false;
  }
}

function remove(name: string, options?: CookieOptions): boolean {
  try {
    if (!isBrowser()) return false;
    document.cookie = `${name}=; max-age=0; expires=${new Date(0).toUTCString()}; path=${options?.path ?? '/'}${options?.domain ? `; domain=${options.domain}` : ''}`;
    return true;
  } catch {
    return false;
  }
}

function exists(name: string): boolean {
  try {
    return isBrowser() ? parseCookies().has(name) : false;
  } catch {
    return false;
  }
}

function getAll(): CookieEntry[] {
  try {
    if (!isBrowser()) return [];
    return Array.from(parseCookies(), ([n, v]) => ({
      name: n,
      value: decodeURIComponent(v),
    }));
  } catch {
    return [];
  }
}

export const clientCookies: CookieAdapter = { get, set, remove, exists, getAll };
