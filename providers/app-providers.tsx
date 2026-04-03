'use client';

import { SWRProvider } from './swr-provider';
import { ThemeProvider } from './theme-provider';
import { DeviceProvider } from './device-provider';
import { AuthProvider } from './auth-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <ThemeProvider>
        <DeviceProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </DeviceProvider>
      </ThemeProvider>
    </SWRProvider>
  );
}
