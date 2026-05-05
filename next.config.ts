/**
 * FILE: next.config.ts
 *
 * PURPOSE:
 *   Next.js build and runtime configuration. Sets up image optimization, experimental features,
 *   security headers, cache headers for static assets, bundle analysis, and production optimizations.
 *
 * LOGIC OVERVIEW:
 *   - Strict mode and no trailing slashes
 *   - Image optimization with quality/format tuning for remotePatterns
 *   - Experimental optimizePackageImports for lucide-react and framer-motion
 *   - Disable source maps in production for faster builds and reduced bundle size
 *   - Disable X-Powered-By header for security
 *   - Inject security headers (X-Frame-Options, X-Content-Type-Options, Permissions-Policy, etc.)
 *   - Inject long-lived cache headers for immutable static assets
 *   - Wrap export with next/bundle-analyzer (enabled via ANALYZE=true env var)
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   nextConfig — NextConfig object
 *   withBundleAnalyzer — Higher-order config wrapper from @next/bundle-analyzer
 *   headers() — Async function returning array of header rules
 *
 * DEPENDENCIES:
 *   next
 *   @next/bundle-analyzer (devDependency)
 *
 * LAST UPDATED: 2026-05-05 — Phase 2: added bundle analyzer wrapper for performance optimization
 */
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "strapi-bucket-mindtalk-cadabams.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "cadabams-v2-storage.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "mindtalk-assets.s3.ap-south-1.amazonaws.com",
      },
      { protocol: "https", hostname: "mindtalkbuddy.com" },
      { protocol: "https", hostname: "admin.mindtalkbuddy.com" },
      { protocol: "https", hostname: "enterprise.mindtalkbuddy.com" },
      {
        protocol: "https",
        hostname: "physiotattava-website.s3.eu-central-1.amazonaws.com",
      },
      { protocol: "https", hostname: "crm.cadabams.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
