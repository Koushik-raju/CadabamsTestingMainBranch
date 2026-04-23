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
