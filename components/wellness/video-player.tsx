'use client';

import { useRef, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  className?: string;
}

function isYouTube(src: string): boolean {
  return src.includes('youtube.com') || src.includes('youtu.be');
}

function getYouTubeEmbedUrl(src: string): string {
  // Handle youtu.be short links
  const shortMatch = src.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // Handle youtube.com/watch?v=
  const longMatch = src.match(/[?&]v=([^&]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`;
  return src;
}

export function VideoPlayer({ src, title, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (isYouTube(src)) {
    const embedUrl = getYouTubeEmbedUrl(src);
    return (
      <div className={cn('rounded-2xl overflow-hidden bg-black aspect-video w-full', className)}>
        <iframe
          src={embedUrl}
          title={title ?? 'Video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const requestFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  return (
    <div className={cn('relative rounded-2xl overflow-hidden bg-black aspect-video w-full group', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        className="w-full h-full object-cover"
        onEnded={() => setIsPlaying(false)}
        aria-label={title ?? 'Video'}
      />

      {/* Controls overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <Button
          onClick={togglePlay}
          size="icon"
          variant="ghost"
          className="h-16 w-16 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 fill-current" />
          ) : (
            <Play className="h-8 w-8 fill-current" />
          )}
        </Button>
      </div>

      <button
        onClick={requestFullscreen}
        className="absolute bottom-3 right-3 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70 transition-colors"
        aria-label="Fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
