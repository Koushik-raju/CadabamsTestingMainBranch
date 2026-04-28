/**
 * FILE: app/(auth)/zego/page.tsx
 *
 * PURPOSE:
 *   Zego video call page. Server component that wraps ZegoClient in a Suspense boundary
 *   with a loading fallback. Reads roomID from query params.
 *
 * LOGIC OVERVIEW:
 *   1. Async server component that awaits searchParams.
 *   2. Extracts roomID from params (optional, may be empty).
 *   3. Renders ZegoClient inside Suspense with loading spinner fallback.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   roomId — extracted from searchParams.roomID, passed to ZegoClient
 *
 * DEPENDENCIES:
 *   ./zego-client — client component managing Zego SDK integration
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
import { Suspense } from "react";
import { ZegoClient } from "./zego-client";

interface ZegoPageProps {
  searchParams: Promise<{ roomID?: string }>;
}

export default async function ZegoPage({ searchParams }: ZegoPageProps) {
  const params = await searchParams;
  const roomId = params.roomID ?? "";

  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center min-h-screen bg-primary"
          role="status"
          aria-label="Loading video call"
        >
          <p className="text-white text-lg font-semibold animate-pulse">Connecting to call…</p>
        </div>
      }
    >
      <ZegoClient roomId={roomId} />
    </Suspense>
  );
}
