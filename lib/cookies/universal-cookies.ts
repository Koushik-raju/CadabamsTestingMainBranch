import { clientCookies } from './client-cookies';
import { serverCookies } from './server-cookies';
import type { CookieEntry, CookieOptions, GetCookieOptions, SetCookieOptions } from './types';

function isServer(): boolean {
  return typeof window === 'undefined';
}

export async function getCookie(name: string, options?: GetCookieOptions): Promise<string | null> {
  try {
    return isServer()
      ? await serverCookies.get(name, options)
      : clientCookies.get(name, options);
  } catch {
    return null;
  }
}

export async function setCookie(
  name: string,
  value: string,
  options?: SetCookieOptions,
): Promise<boolean> {
  try {
    if (isServer()) return await serverCookies.set(name, value, options);
    if (options?.serverOnly || options?.httpOnly) {
      console.warn(`[cookies] "${name}" is httpOnly/serverOnly — cannot set from client.`);
      return false;
    }
    return clientCookies.set(name, value, options);
  } catch {
    return false;
  }
}

export async function removeCookie(name: string, options?: CookieOptions): Promise<boolean> {
  try {
    return isServer()
      ? await serverCookies.remove(name, options)
      : clientCookies.remove(name, options);
  } catch {
    return false;
  }
}

export async function cookieExists(name: string): Promise<boolean> {
  try {
    return isServer()
      ? await serverCookies.exists(name)
      : clientCookies.exists(name);
  } catch {
    return false;
  }
}

export async function getAllCookies(): Promise<CookieEntry[]> {
  try {
    return isServer() ? await serverCookies.getAll() : clientCookies.getAll();
  } catch {
    return [];
  }
}

export async function getManyCookies(
  names: string[],
  options?: GetCookieOptions,
): Promise<Record<string, string | null>> {
  const values = await Promise.all(names.map((n) => getCookie(n, options)));
  return Object.fromEntries(names.map((n, i) => [n, values[i]]));
}

export async function setManyCookies(
  cookies: { name: string; value: string; options?: SetCookieOptions }[],
): Promise<boolean[]> {
  return Promise.all(cookies.map((c) => setCookie(c.name, c.value, c.options)));
}

export async function removeManyCookies(
  names: string[],
  options?: CookieOptions,
): Promise<boolean[]> {
  return Promise.all(names.map((n) => removeCookie(n, options)));
}
