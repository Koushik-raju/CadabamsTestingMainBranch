import type {
  CookieEntry,
  CookieOptions,
  GetCookieOptions,
  SetCookieOptions,
} from './types';

async function getNextCookieStore() {
  try {
    const { cookies } = await import('next/headers');
    return await cookies();
  } catch {
    return null;
  }
}

function isServer(): boolean {
  return typeof window === 'undefined';
}

async function get(name: string, options?: GetCookieOptions): Promise<string | null> {
  try {
    if (!isServer()) return null;
    const store = await getNextCookieStore();
    const cookie = store?.get(name);
    if (!cookie) return null;
    return cookie.value;
  } catch {
    return null;
  }
}

async function set(name: string, value: string, options?: SetCookieOptions): Promise<boolean> {
  try {
    if (!isServer()) return false;
    const store = await getNextCookieStore();
    if (!store) return false;
    store.set({
      name,
      value,
      path: options?.path ?? '/',
      domain: options?.domain,
      maxAge: options?.maxAge,
      expires: options?.expires,
      secure: options?.secure,
      httpOnly: options?.httpOnly ?? options?.serverOnly ?? false,
      sameSite: options?.sameSite,
    });
    return true;
  } catch {
    // .set() throws in read-only contexts (Server Components)
    return false;
  }
}

async function remove(name: string, options?: CookieOptions): Promise<boolean> {
  try {
    if (!isServer()) return false;
    const store = await getNextCookieStore();
    if (!store) return false;
    store.set({
      name,
      value: '',
      path: options?.path ?? '/',
      domain: options?.domain,
      maxAge: 0,
      expires: new Date(0),
    });
    return true;
  } catch {
    return false;
  }
}

async function exists(name: string): Promise<boolean> {
  try {
    if (!isServer()) return false;
    const store = await getNextCookieStore();
    return store?.has(name) ?? false;
  } catch {
    return false;
  }
}

async function getAll(): Promise<CookieEntry[]> {
  try {
    if (!isServer()) return [];
    const store = await getNextCookieStore();
    if (!store) return [];
    return store.getAll().map((c) => ({
      name: c.name,
      value: decodeURIComponent(c.value),
    }));
  } catch {
    return [];
  }
}

export const serverCookies = { get, set, remove, exists, getAll };
