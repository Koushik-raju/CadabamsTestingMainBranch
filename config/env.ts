/**
 * FILE: config/env.ts
 *
 * PURPOSE:
 *   Resolves runtime configuration by merging shared base values with
 *   environment-specific overrides for development and production.
 *
 * LOGIC OVERVIEW:
 *   1. Reads NEXT_PUBLIC_ENV to select the active env (defaults to "production").
 *   2. Merges baseConfig (values shared across all envs) with the selected
 *      envConfig (env-specific Razorpay key fallback).
 *   3. Exports named bindings for use throughout the app.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   BACKEND_URL     — API base URL; same for all envs, overridable via env var
 *   RAZORPAY_KEY_ID — Razorpay publishable key; test vs live depends on env
 *   zegoCloudUrl    — ZegoCloud video call URL
 *
 * DEPENDENCIES:
 *   process.env.NEXT_PUBLIC_* — injected by Next.js at build time
 *
 * LAST UPDATED: 2026-04-17 — removed all Firebase config (Firebase removed from project)
 */

const ENV =
  (process.env.NEXT_PUBLIC_ENV as "development" | "production") ?? "production";

const baseConfig = {
  BACKEND_URL:
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://backend-v2.cadabams.com",
  zegoCloudUrl:
    process.env.NEXT_PUBLIC_ZEGO_URL ??
    "https://next-video-call-demo-six.vercel.app",
};

const envConfigs = {
  development: {
    RAZORPAY_KEY_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_Ou8P829VSfUh1E",
  },
  production: {
    RAZORPAY_KEY_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_live_TbfeDut5Cuw7EK",
  },
};

export const appConfig = {
  ...baseConfig,
  ...envConfigs[ENV],
};

export const { BACKEND_URL, RAZORPAY_KEY_ID, zegoCloudUrl } = appConfig;
