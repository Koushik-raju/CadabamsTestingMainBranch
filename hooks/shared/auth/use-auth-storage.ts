"use client";

// Thin React hook wrapping the cookie-based auth storage functions.
// Use this in client components. Use the functions from @/lib/cookies directly
// in server components, route handlers, and middleware.

import {
  clearAuthState,
  clearTokens,
  getAccessToken,
  getRedirectPath,
  getRefreshToken,
  getUser,
  hasAccessToken,
  isAuthenticated,
  removeAccessToken,
  removeRedirectPath,
  removeRefreshToken,
  removeUser,
  setAccessToken,
  setRedirectPath,
  setRefreshToken,
  setTokens,
  setUser,
} from "@/lib/cookies";
import type { TokenPair } from "@/lib/cookies";
import type { User } from "@/types";
import { useCallback } from "react";

export function useAuthStorage() {
  return {
    // tokens
    getAccessToken: useCallback(() => getAccessToken(), []),
    setAccessToken: useCallback((t: string, maxAge?: number) => setAccessToken(t, maxAge), []),
    removeAccessToken: useCallback(() => removeAccessToken(), []),
    hasAccessToken: useCallback(() => hasAccessToken(), []),
    getRefreshToken: useCallback(() => getRefreshToken(), []),
    setRefreshToken: useCallback((t: string) => setRefreshToken(t), []),
    removeRefreshToken: useCallback(() => removeRefreshToken(), []),
    setTokens: useCallback(
      (p: TokenPair, opts?: { accessTokenOptions?: { maxAge?: number } }) => setTokens(p, opts),
      [],
    ),
    clearTokens: useCallback(() => clearTokens(), []),
    isAuthenticated: useCallback(() => isAuthenticated(), []),
    // user
    getUser: useCallback(() => getUser(), []),
    setUser: useCallback((u: User) => setUser(u), []),
    removeUser: useCallback(() => removeUser(), []),
    // redirect path
    getRedirectPath: useCallback(() => getRedirectPath(), []),
    setRedirectPath: useCallback((p: string) => setRedirectPath(p), []),
    removeRedirectPath: useCallback(() => removeRedirectPath(), []),
    // clear everything
    clearAuthState: useCallback(() => clearAuthState(), []),
  };
}
