export type {
  CookieOptions,
  SetCookieOptions,
  GetCookieOptions,
  CookieEntry,
  CookieAdapter,
  SameSite,
} from './types';

export {
  COOKIE_NAMES,
  DURATIONS,
  DEFAULT_COOKIE_OPTIONS,
  ACCESS_TOKEN_OPTIONS,
  REFRESH_TOKEN_OPTIONS,
} from './constants';

export {
  getCookie,
  setCookie,
  removeCookie,
  cookieExists,
  getAllCookies,
  getManyCookies,
  setManyCookies,
  removeManyCookies,
} from './universal-cookies';

export {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  hasAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  hasRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
} from './auth-cookies';
export type { TokenPair } from './auth-cookies';

export { clientCookies } from './client-cookies';
export { serverCookies } from './server-cookies';
