export type SameSite = 'strict' | 'lax' | 'none';

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: SameSite;
  /**
   * If true, cookie is httpOnly and can only be managed from server contexts
   * (Server Components, Route Handlers, Server Actions, Middleware).
   */
  serverOnly?: boolean;
}

export interface CookieEntry {
  name: string;
  value: string;
}

export interface SetCookieOptions extends CookieOptions {
  encode?: boolean;
}

export interface GetCookieOptions {
  decode?: boolean;
}

export interface CookieAdapter {
  get(name: string, options?: GetCookieOptions): string | null;
  set(name: string, value: string, options?: SetCookieOptions): boolean;
  remove(name: string, options?: CookieOptions): boolean;
  exists(name: string): boolean;
  getAll(): CookieEntry[];
}
