'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPatientsMe } from '@/sdk/auth-and-crm/sdk.gen';
import type { User } from '@/types';

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

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      setUser(JSON.parse(raw) as User);
    } catch {
      localStorage.removeItem('user');
    }
  }, []);

  const login = useCallback(async (): Promise<User> => {
    const { data, error } = await getPatientsMe();
    if (error || !data) throw new Error('Failed to fetch profile');

    const userData: User = {
      lead_id: data.id,
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
