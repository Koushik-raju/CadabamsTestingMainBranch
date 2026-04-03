'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { DevicePlatform, SafeAreaInsets } from '@/types';

interface DeviceContextValue {
  platform: DevicePlatform;
  isNative: boolean;
  safeArea: SafeAreaInsets;
}

export const DeviceContext = createContext<DeviceContextValue>({
  platform: 'web',
  isNative: false,
  safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
});

export function useDeviceProvider(): DeviceContextValue {
  const [platform, setPlatform] = useState<DevicePlatform>('web');
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const p = Capacitor.getPlatform() as DevicePlatform;
        setPlatform(p);
      } catch {
        setPlatform('web');
      }
    })();
  }, []);

  return { platform, isNative: platform !== 'web', safeArea };
}

export const useDevice = () => useContext(DeviceContext);
