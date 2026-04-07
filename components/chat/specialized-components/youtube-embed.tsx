"use client";

import { useEffect } from "react";

interface YoutubeEmbedProps {
  videoId: string;
}

export function YoutubeEmbed({ videoId }: YoutubeEmbedProps) {
  useEffect(() => {
    import("lite-youtube-embed");
    import("lite-youtube-embed/src/lite-yt-embed.css");
  }, []);

  return (
    <div className="mt-2 w-full overflow-hidden rounded-xl border border-border">
      {/* @ts-expect-error – lite-youtube is a custom element */}
      <lite-youtube videoid={videoId} />
    </div>
  );
}
