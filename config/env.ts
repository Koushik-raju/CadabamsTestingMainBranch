/**
 * FILE: config/env.ts
 *
 * PURPOSE:
 *   Single source of truth for all environment variables used across the app.
 *   Resolves runtime configuration by merging shared base values with
 *   environment-specific overrides for development and production.
 *
 * LOGIC OVERVIEW:
 *   1. Reads NEXT_PUBLIC_ENV to select the active env (defaults to "production").
 *   2. Merges baseConfig (values shared across all envs) with the selected
 *      envConfig (env-specific Razorpay key fallback).
 *   3. Exports a single CONFIG object — access values as CONFIG.VARIABLE_NAME.
 *   All process.env reads are centralised here — no other file should read
 *   process.env directly (except standalone scripts with their own dotenv).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   CONFIG.BACKEND_URL        — API base URL; same for all envs, overridable via env var
 *   CONFIG.RAZORPAY_KEY_ID    — Razorpay publishable key; test vs live depends on env
 *   CONFIG.ZEGO_CLOUD_URL     — ZegoCloud video call URL
 *   CONFIG.MASTRA_BACKEND_URL — Mastra AI backend URL for the chat feature
 *   CONFIG.MASTRA_AGENT_ID    — Mastra agent identifier for the chat feature
 *   CONFIG.IS_PRODUCTION      — true when NODE_ENV is "production"
 *
 * DEPENDENCIES:
 *   process.env.NEXT_PUBLIC_* — injected by Next.js at build time
 *   process.env.NODE_ENV      — set by Node.js / Next.js automatically
 *
 * LAST UPDATED: 2026-04-17 — export single CONFIG object; rename zegoCloudUrl → ZEGO_CLOUD_URL
 */
import "dotenv/config"
const ENV =
  (process.env.NEXT_PUBLIC_ENV as "development" | "production") ?? "production";

const baseConfig = {
  BACKEND_URL:
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://backend-v2.cadabams.com",
  ZEGO_CLOUD_URL:
    process.env.NEXT_PUBLIC_ZEGO_URL ??
    "https://next-video-call-demo-six.vercel.app",
  MASTRA_BACKEND_URL:
    process.env.NEXT_PUBLIC_MASTRA_BACKEND_URL ??
    "http://localhost:4111/super-agent",
  MASTRA_AGENT_ID: process.env.NEXT_PUBLIC_MASTRA_AGENT_ID ?? "super-agent",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
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

export const CONFIG = {
  ...baseConfig,
  ...envConfigs[ENV],
};
