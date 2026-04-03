'use client';

import { DeviceContext, useDeviceProvider } from '@/hooks/use-device';

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const value = useDeviceProvider();
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}
