import type { CookieOptions } from './types';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_profile',
  REDIRECT_PATH: 'redirect_path',
} as const;

export const DURATIONS = {
  /** 15 minutes */
  ACCESS_TOKEN: 15 * 60,
  /** 7 days */
  REFRESH_TOKEN: 7 * 24 * 60 * 60,
} as const;

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

export const ACCESS_TOKEN_OPTIONS: CookieOptions = {
  path: '/',
  httpOnly: false,
  serverOnly: false,
  secure: false,
  sameSite: 'lax',
  maxAge: DURATIONS.ACCESS_TOKEN,
};

export const REFRESH_TOKEN_OPTIONS: CookieOptions = {
  path: '/',
  httpOnly: false,
  serverOnly: false,
  secure: false,
  sameSite: 'lax',
  maxAge: DURATIONS.REFRESH_TOKEN,
};

export const USER_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  httpOnly: false,
  serverOnly: false,
  secure: false,
  sameSite: 'lax',
  maxAge: DURATIONS.REFRESH_TOKEN, // same lifetime as refresh token
};
