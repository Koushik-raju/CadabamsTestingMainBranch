'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  /** CRM lead ID (set after signup / enriched after login) */
  leadId?: number;
  name?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  sendOtp: (
    phone: string,
    type?: 'login' | 'signup',
    email?: string,
  ) => Promise<void>;
  login: (phone: string, otp: string) => Promise<AuthUser>;
  signup: (params: {
    phone: string;
    otp: string;
    firstName: string;
    lastName: string;
    email?: string;
    countryCode?: number;
    dob?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

type AuthContextValue = AuthState & AuthActions;

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error ?? 'Request failed'), { status: res.status, data: json });
  return json as T;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Hydrate with server-side user data (read from session in a Server Component
   * and passed down). Avoids an extra client-side fetch on first load.
   */
  initialUser?: AuthUser | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  const sendOtp = useCallback(async (
    phone: string,
    type: 'login' | 'signup' = 'login',
    email?: string,
  ) => {
    setIsLoading(true);
    try {
      await apiFetch('/api/auth/send-otp', { phone, type, email });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (phone: string, otp: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      // Route handler strips tokens and returns only user info
      const data = await apiFetch<{ message: string; success: boolean } & AuthUser>(
        '/api/auth/verify-login',
        { phone, otp },
      );
      const nextUser: AuthUser = { ...data };
      setUser(nextUser);
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (params: {
    phone: string;
    otp: string;
    firstName: string;
    lastName: string;
    email?: string;
    countryCode?: number;
    dob?: string;
  }): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ name: string; success: boolean; lead_id: number } & AuthUser>(
        '/api/auth/signup/verify',
        params,
      );
      const nextUser: AuthUser = { name: data.name, leadId: data.lead_id, ...data };
      setUser(nextUser);
      return nextUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiFetch('/api/auth/logout');
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        sendOtp,
        login,
        signup,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
