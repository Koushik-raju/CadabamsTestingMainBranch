"use client";

import { YoutubeEmbed } from "./youtube-embed";

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com") {
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    // invalid URL
  }
  return null;
}

function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s<>"')\]]+/g) ?? [];
}

interface MessageEnrichmentsProps {
  text: string;
}

export function MessageEnrichments({ text }: MessageEnrichmentsProps) {
  const unique = [
    ...new Set(
      extractUrls(text)
        .map(extractYouTubeId)
        .filter((id): id is string => id !== null),
    ),
  ];

  if (unique.length === 0) return null;

  return (
    <div className="mt-1 flex flex-col gap-2 w-full max-w-[80%]">
      {unique.map((id) => (
        <YoutubeEmbed key={id} videoId={id} />
      ))}
    </div>
  );
}
