'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPatientsMe } from '@/sdk/auth-and-crm/sdk.gen';
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
        // No stored user or lead_id missing — try to fetch from API
        const { data } = await getPatientsMe();
        if (!data) return;
        const token = await getAccessToken();
        const userData: User = {
          lead_id: data.id,
          sub: token ? getSubFromToken(token) : undefined,
          phone_number: data.caller_mobile,
          name: data.contact_name || data.partner_name,
          email: data.caller_email,
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
    const { data, error } = await getPatientsMe();
    if (error || !data) throw new Error('Failed to fetch profile');

    const token = await getAccessToken();
    const userData: User = {
      lead_id: data.id,
      sub: token ? getSubFromToken(token) : undefined,
      phone_number: data.caller_mobile,
      name: data.contact_name || data.partner_name,
      email: data.caller_email,
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
