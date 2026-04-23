import { CONFIG } from "@/config/env";
/**
 * FILE: lib/cookies/constants.ts
 *
 * PURPOSE:
 *   Defines cookie names, TTL durations, and default cookie option objects
 *   used throughout the auth cookie management layer.
 *
 * LOGIC OVERVIEW:
 *   Exports constant objects consumed by cookie read/write helpers. The
 *   `secure` flag on DEFAULT_COOKIE_OPTIONS derives from IS_PRODUCTION so
 *   cookies are only marked secure in production (HTTPS) environments.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   COOKIE_NAMES           — canonical cookie name strings (access token, refresh, user, redirect)
 *   DURATIONS              — TTL values in seconds (ACCESS_TOKEN: 15 min, REFRESH_TOKEN: 7 days)
 *   DEFAULT_COOKIE_OPTIONS — base options applied to general cookies; secure in production only
 *   ACCESS_TOKEN_OPTIONS   — options for the short-lived access token cookie
 *   REFRESH_TOKEN_OPTIONS  — options for the long-lived refresh token cookie
 *   USER_COOKIE_OPTIONS    — options for the user profile cookie (same lifetime as refresh token)
 *
 * DEPENDENCIES:
 *   IS_PRODUCTION — from config/env.ts; true when NODE_ENV is "production"
 *
 * LAST UPDATED: 2026-04-17 — import IS_PRODUCTION from config/env.ts instead of reading process.env directly
 */
import type { CookieOptions } from "./types";

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user_profile",
  REDIRECT_PATH: "redirect_path",
} as const;

export const DURATIONS = {
  /** 15 minutes */
  ACCESS_TOKEN: 15 * 60,
  /** 7 days */
  REFRESH_TOKEN: 7 * 24 * 60 * 60,
} as const;

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  secure: CONFIG.IS_PRODUCTION,
  sameSite: "lax",
};

export const ACCESS_TOKEN_OPTIONS: CookieOptions = {
  path: "/",
  httpOnly: false,
  serverOnly: false,
  secure: false,
  sameSite: "lax",
  maxAge: DURATIONS.ACCESS_TOKEN,
};

export const REFRESH_TOKEN_OPTIONS: CookieOptions = {
  path: "/",
  httpOnly: false,
  serverOnly: false,
  secure: false,
  sameSite: "lax",
  maxAge: DURATIONS.REFRESH_TOKEN,
};

export const USER_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  httpOnly: false,
  serverOnly: false,
  secure: false,
  sameSite: "lax",
  maxAge: DURATIONS.REFRESH_TOKEN, // same lifetime as refresh token
};
