"use client";

import { useDevice } from "./use-device";

export function useCapacitor() {
  const { platform, isNative } = useDevice();
  return { platform, isNative, isIos: platform === "ios", isAndroid: platform === "android" };
}
