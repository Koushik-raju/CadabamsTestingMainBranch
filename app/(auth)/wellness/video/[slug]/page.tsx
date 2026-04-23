"use client";

import { BackButton } from "@/components/shared/navigation/back-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/wellness/video-player";
import { useVideoDetail } from "@/hooks/wellness/use-video-detail";
import { getStrapiImageUrl } from "@/lib/strapi-fetcher";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VideoDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { video, isLoading, error } = useVideoDetail(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
          <Skeleton className="h-5 w-48 bg-white/10" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-full max-w-3xl bg-white/10" style={{ aspectRatio: "16/9" }} />
        </div>
        <div className="px-5 py-4 space-y-2">
          <Skeleton className="h-5 w-3/4 bg-white/10" />
          <Skeleton className="h-4 w-1/3 bg-white/10" />
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="text-muted-foreground">Video not found.</p>
        <Button asChild variant="outline">
          <Link href="/wellness/video">Back to Videos</Link>
        </Button>
      </div>
    );
  }

  if (!video.videoUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="text-muted-foreground">This video is not available yet.</p>
        <Button asChild variant="outline">
          <Link href="/wellness/video">Back to Videos</Link>
        </Button>
      </div>
    );
  }

  const posterUrl =
    getStrapiImageUrl(video.coverImage?.webImage?.url ?? video.coverImage?.mobileImage?.url) ??
    undefined;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur safe-top">
        <BackButton fallback="/wellness/video" className="text-white/80 hover:text-white" />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-lg truncate">{video.title}</h1>
          {video.category && video.category.length > 0 && (
            <p className="text-white/50 text-xs mt-0.5">{video.category.join(" · ")}</p>
          )}
        </div>
      </div>

      {/* Video player — vertically centred */}
      <div className="flex-1 flex items-center bg-black">
        <div className="w-full">
          <VideoPlayer
            src={video.videoUrl}
            title={video.title}
            poster={posterUrl}
            className="rounded-none"
          />
        </div>
      </div>

      {/* Footer info */}
      <div className="px-5 py-5 bg-black/90 safe-bottom space-y-3">
        <h2 className="text-white font-extrabold text-base leading-snug">{video.title}</h2>
        {video.category && video.category.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.category.map((cat) => (
              <span
                key={cat}
                className="text-[11px] bg-white/10 text-white/70 px-2.5 py-1 rounded-full font-bold"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
        <Button
          asChild
          variant="ghost"
          className="text-white/50 hover:text-white text-xs p-0 h-auto"
        >
          <Link href="/wellness/video">← All Videos</Link>
        </Button>
      </div>
    </div>
  );
}
