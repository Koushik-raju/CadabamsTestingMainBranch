"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Video } from "lucide-react";
import { useState } from "react";

interface ZegoClientProps {
  roomId: string;
}

export function ZegoClient({ roomId }: ZegoClientProps) {
  const [iframeError, setIframeError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // roomId is expected to be the full Zego call URL passed from the app
  const isValidUrl = roomId.startsWith("http://") || roomId.startsWith("https://");

  if (!isValidUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="py-10 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-foreground">Invalid Call Link</h2>
              <p className="text-sm text-muted-foreground mt-1">
                The video call link is missing or invalid. Please join from your appointment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (iframeError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="py-10 text-center space-y-4">
            <Video className="w-12 h-12 text-primary mx-auto" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-foreground">Ready to Join</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your video call is ready. Click below to open it.
              </p>
            </div>
            <Button
              onClick={() => window.open(roomId, "_blank", "noopener,noreferrer")}
              className="w-full"
            >
              <Video className="w-4 h-4 mr-2" aria-hidden="true" />
              Open Video Call
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Loading indicator */}
      {!isLoaded && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-primary z-10 gap-4"
          role="status"
          aria-live="polite"
        >
          <Video className="w-12 h-12 text-white animate-pulse" aria-hidden="true" />
          <p className="text-white text-lg font-semibold">Connecting to call…</p>
        </div>
      )}

      {/* ZegoCloud iframe */}
      <iframe
        src={roomId}
        className="w-full h-full border-0"
        allow="camera; microphone; autoplay; fullscreen; display-capture"
        allowFullScreen
        title="Video consultation call"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIframeError(true)}
      />
    </div>
  );
}
