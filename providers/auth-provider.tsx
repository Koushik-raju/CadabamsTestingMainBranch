'use client';

import { AuthContext, useAuthProvider } from '@/hooks/use-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthProvider();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
