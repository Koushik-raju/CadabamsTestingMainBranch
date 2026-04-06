import { getCookie, setCookie, removeCookie, cookieExists } from './universal-cookies';
import {
  COOKIE_NAMES,
  ACCESS_TOKEN_OPTIONS,
  REFRESH_TOKEN_OPTIONS,
} from './constants';
import type { SetCookieOptions } from './types';

// ── Access token (client + server readable) ───────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return getCookie(COOKIE_NAMES.ACCESS_TOKEN);
}

export async function setAccessToken(
  token: string,
  overrides?: Partial<SetCookieOptions>,
): Promise<boolean> {
  return setCookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
    ...ACCESS_TOKEN_OPTIONS,
    ...overrides,
  });
}

export async function removeAccessToken(): Promise<boolean> {
  return removeCookie(COOKIE_NAMES.ACCESS_TOKEN, { path: ACCESS_TOKEN_OPTIONS.path });
}

export async function hasAccessToken(): Promise<boolean> {
  return cookieExists(COOKIE_NAMES.ACCESS_TOKEN);
}

// ── Refresh token (server-only, httpOnly) ─────────────────────────────────────

/** Always returns null on the client — cookie is httpOnly. */
export async function getRefreshToken(): Promise<string | null> {
  return getCookie(COOKIE_NAMES.REFRESH_TOKEN);
}

export async function setRefreshToken(
  token: string,
  overrides?: Partial<SetCookieOptions>,
): Promise<boolean> {
  return setCookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    ...REFRESH_TOKEN_OPTIONS,
    ...overrides,
  });
}

export async function removeRefreshToken(): Promise<boolean> {
  return removeCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: REFRESH_TOKEN_OPTIONS.path });
}

/** Always returns false on the client — cookie is httpOnly. */
export async function hasRefreshToken(): Promise<boolean> {
  return cookieExists(COOKIE_NAMES.REFRESH_TOKEN);
}

// ── Pair helpers ──────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Store both tokens at once (e.g. after login).
 * Must be called from a server context — refresh token is httpOnly.
 */
export async function setTokens(
  tokens: TokenPair,
  overrides?: {
    accessTokenOptions?: Partial<SetCookieOptions>;
    refreshTokenOptions?: Partial<SetCookieOptions>;
  },
): Promise<{ accessToken: boolean; refreshToken: boolean }> {
  const [accessResult, refreshResult] = await Promise.all([
    setAccessToken(tokens.accessToken, overrides?.accessTokenOptions),
    setRefreshToken(tokens.refreshToken, overrides?.refreshTokenOptions),
  ]);
  return { accessToken: accessResult, refreshToken: refreshResult };
}

/** Clear both tokens (e.g. on logout). */
export async function clearTokens(): Promise<{ accessToken: boolean; refreshToken: boolean }> {
  const [accessResult, refreshResult] = await Promise.all([
    removeAccessToken(),
    removeRefreshToken(),
  ]);
  return { accessToken: accessResult, refreshToken: refreshResult };
}

/**
 * Returns true if the user is probably authenticated.
 * On the server, also checks refresh token so we can still refresh.
 */
export async function isAuthenticated(): Promise<boolean> {
  const hasAccess = await hasAccessToken();
  if (typeof window === 'undefined') {
    return hasAccess || (await hasRefreshToken());
  }
  return hasAccess;
}
