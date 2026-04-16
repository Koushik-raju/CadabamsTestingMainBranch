// Pure cookie functions — no React, works on server and client.
// Tokens and user profile are stored as JS-accessible browser cookies so the
// Next.js middleware (server/edge) can read them via request.cookies.

import { getCookie, setCookie, removeCookie, cookieExists } from './universal-cookies';
import {
  COOKIE_NAMES,
  ACCESS_TOKEN_OPTIONS,
  REFRESH_TOKEN_OPTIONS,
  USER_COOKIE_OPTIONS,
} from './constants';
import type { User } from '@/types';

// ── Access token ──────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return getCookie(COOKIE_NAMES.ACCESS_TOKEN);
}

export async function setAccessToken(token: string, maxAge?: number): Promise<boolean> {
  return setCookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
    ...ACCESS_TOKEN_OPTIONS,
    ...(maxAge !== undefined ? { maxAge } : {}),
  });
}

export async function removeAccessToken(): Promise<boolean> {
  return removeCookie(COOKIE_NAMES.ACCESS_TOKEN);
}

export async function hasAccessToken(): Promise<boolean> {
  return cookieExists(COOKIE_NAMES.ACCESS_TOKEN);
}

// ── Refresh token ─────────────────────────────────────────────────────────────

export async function getRefreshToken(): Promise<string | null> {
  return getCookie(COOKIE_NAMES.REFRESH_TOKEN);
}

export async function setRefreshToken(token: string): Promise<boolean> {
  return setCookie(COOKIE_NAMES.REFRESH_TOKEN, token, REFRESH_TOKEN_OPTIONS);
}

export async function removeRefreshToken(): Promise<boolean> {
  return removeCookie(COOKIE_NAMES.REFRESH_TOKEN);
}

export async function hasRefreshToken(): Promise<boolean> {
  return cookieExists(COOKIE_NAMES.REFRESH_TOKEN);
}

// ── Token pair ────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function setTokens(
  tokens: TokenPair,
  options?: { accessTokenOptions?: { maxAge?: number } },
): Promise<{ accessToken: boolean; refreshToken: boolean }> {
  const maxAge = options?.accessTokenOptions?.maxAge;
  const [accessToken, refreshToken] = await Promise.all([
    setAccessToken(tokens.accessToken, maxAge),
    setRefreshToken(tokens.refreshToken),
  ]);
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([removeAccessToken(), removeRefreshToken()]);
}

export async function isAuthenticated(): Promise<boolean> {
  return hasAccessToken();
}

// ── User profile ──────────────────────────────────────────────────────────────

export async function getUser(): Promise<User | null> {
  const raw = await getCookie(COOKIE_NAMES.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function setUser(user: User): Promise<boolean> {
  return setCookie(COOKIE_NAMES.USER, JSON.stringify(user), USER_COOKIE_OPTIONS);
}

export async function removeUser(): Promise<boolean> {
  return removeCookie(COOKIE_NAMES.USER);
}

// ── Redirect path ─────────────────────────────────────────────────────────────

export async function getRedirectPath(): Promise<string | null> {
  return getCookie(COOKIE_NAMES.REDIRECT_PATH);
}

export async function setRedirectPath(path: string): Promise<boolean> {
  return setCookie(COOKIE_NAMES.REDIRECT_PATH, path, { path: '/', sameSite: 'lax', maxAge: 60 * 5 });
}

export async function removeRedirectPath(): Promise<boolean> {
  return removeCookie(COOKIE_NAMES.REDIRECT_PATH);
}

// ── Clear all auth state ──────────────────────────────────────────────────────

export async function clearAuthState(): Promise<void> {
  await Promise.all([clearTokens(), removeUser(), removeRedirectPath()]);
}
