'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { authControllerMe } from '@/sdk/backend-v2';
import { authMeKey } from '@/lib/swr-keys';
import { getAccessToken } from '@/lib/cookies';
import type { User } from '@/types';

function getSubFromToken(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub as string | undefined;
  } catch {
    return undefined;
  }
}

/** SWR hook — use when you need the raw profile object from the API */
export function useAuthMe() {
  const { data, error, isLoading } = useSWR(authMeKey(), async () => {
    const res = await authControllerMe();
    if (res.error) throw new Error(JSON.stringify(res.error));
    return res.data ?? null;
  });

  return { profile: data ?? null, isLoading, error };
}

interface AuthContextValue {
  user: User | null;
  /** Call after OTP verify — fetches profile via SDK and stores in state + localStorage */
  login: () => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => { throw new Error('AuthProvider not mounted'); },
  logout: async () => {},
});

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);

  // Restore session from localStorage on mount; re-fetch if lead_id is missing
  useEffect(() => {
    async function restoreSession() {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const stored = JSON.parse(raw) as User;
          if (stored.lead_id) {
            setUser(stored);
            return;
          }
        }
        // No stored user or lead_id missing — fetch from API
        const res = await authControllerMe();
        if (!res.data) return;
        const data = res.data as Record<string, unknown>;
        const token = await getAccessToken();
        const userData: User = {
          lead_id: (data.id ?? data.lead_id) as string | number,
          sub: token ? getSubFromToken(token) : undefined,
          phone_number: data.caller_mobile as string | undefined,
          name: (data.contact_name ?? data.partner_name) as string | undefined,
          email: data.caller_email as string | undefined,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch {
        localStorage.removeItem('user');
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (): Promise<User> => {
    const res = await authControllerMe();
    if (res.error || !res.data) throw new Error('Failed to fetch profile');
    const data = res.data as Record<string, unknown>;
    const token = await getAccessToken();
    const userData: User = {
      lead_id: (data.id ?? data.lead_id) as string | number,
      sub: token ? getSubFromToken(token) : undefined,
      phone_number: data.caller_mobile as string | undefined,
      name: (data.contact_name ?? data.partner_name) as string | undefined,
      email: data.caller_email as string | undefined,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  return { user, login, logout };
}

export const useAuth = () => useContext(AuthContext);
