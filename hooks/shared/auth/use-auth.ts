"use client";

import { logoutPatient } from "@/lib/auth";
import { clearAuthState, getAccessToken, getUser, setUser } from "@/lib/cookies";
import { authMeKey } from "@/lib/swr-keys";
import { authControllerMe } from "@/sdk/backend-v2";
import type { User } from "@/types";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import useSWR from "swr";

function getSubFromToken(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub as string | undefined;
  } catch {
    return undefined;
  }
}

async function fetchAndBuildUser(): Promise<User | null> {
  const res = await authControllerMe();
  if (res.error || !res.data) return null;
  const data = res.data as Record<string, unknown>;
  const token = await getAccessToken();
  const userData: User = {
    lead_id: (data.id ?? data.lead_id) as string | number,
    sub: token ? getSubFromToken(token) : undefined,
    phone_number: data.caller_mobile as string | undefined,
    name: (data.contact_name ?? data.partner_name) as string | undefined,
    email: data.caller_email as string | undefined,
  };
  await setUser(userData);
  return userData;
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
  /** Call after OTP verify — fetches profile and stores in cookie */
  login: () => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: async () => {},
});

export function useAuthProvider(): AuthContextValue {
  const [user, setUserState] = useState<User | null>(null);

  // Restore session from cookie on mount; re-fetch from API if lead_id is missing
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await getUser();
        if (stored?.lead_id) {
          setUserState(stored);
          return;
        }
        // No stored user or lead_id missing — fetch from API
        const userData = await fetchAndBuildUser();
        if (userData) setUserState(userData);
      } catch {
        await clearAuthState();
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (): Promise<User> => {
    const userData = await fetchAndBuildUser();
    if (!userData) throw new Error("Failed to fetch profile");
    setUserState(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await logoutPatient();
    await clearAuthState();
    setUserState(null);
  }, []);

  return { user, login, logout };
}

export const useAuth = () => useContext(AuthContext);
