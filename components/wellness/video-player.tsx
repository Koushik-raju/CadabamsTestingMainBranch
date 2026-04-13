'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isYouTube(src: string): boolean {
  return src.includes('youtube.com') || src.includes('youtu.be');
}

function getYouTubeEmbedUrl(src: string): string {
  const shortMatch = src.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=0&rel=0`;
  const longMatch = src.match(/[?&]v=([^&]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}?autoplay=0&rel=0`;
  return src;
}

export function VideoPlayer({ src, title, poster, className }: VideoPlayerProps) {
  if (!src) return null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // YouTube embed — no custom controls needed
  if (isYouTube(src)) {
    return (
      <div className={cn('rounded-2xl overflow-hidden bg-black aspect-video w-full', className)}>
        <iframe
          src={getYouTubeEmbedUrl(src)}
          title={title ?? 'Video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    setShowControls(true);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
      setShowControls(true);
    } else {
      v.play().then(() => { setIsPlaying(true); setHasStarted(true); resetHideTimer(); }).catch(() => {});
    }
  }, [isPlaying, resetHideTimer]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seek = useCallback((value: number[]) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value[0];
    setCurrentTime(value[0]);
    resetHideTimer();
  }, [resetHideTimer]);

  const skip = useCallback((secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + secs, 0), v.duration || 0);
    resetHideTimer();
  }, [resetHideTimer]);

  const requestFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if ((v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      (v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative bg-black aspect-video w-full group select-none', className)}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setIsLoading(false); }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        aria-label={title ?? 'Video'}
      />

      {/* Big play button before start */}
      {!hasStarted && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
            <Play className="h-9 w-9 text-primary fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-10 w-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end transition-opacity duration-200 pointer-events-none',
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        <div className="relative z-10 px-4 pb-3 space-y-2 pointer-events-auto">
          {/* Progress */}
          <div className="space-y-1">
            <Slider
              min={0}
              max={duration || 100}
              step={0.5}
              value={[currentTime]}
              onValueChange={seek}
              disabled={isLoading}
              className="w-full [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/30 [&_[data-slot=slider-range]]:bg-white h-1"
              aria-label="Video progress"
            />
            <div className="flex justify-between text-[11px] text-white/70 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {/* Rewind */}
            <button
              onClick={() => skip(-10)}
              disabled={isLoading}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-40"
              aria-label="Rewind 10s"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="text-white hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-40"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 fill-current" />
              ) : (
                <Play className="h-6 w-6 fill-current ml-0.5" />
              )}
            </button>

            {/* Forward */}
            <button
              onClick={() => skip(10)}
              disabled={isLoading}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-40"
              aria-label="Forward 10s"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <div className="flex-1" />

            {/* Fullscreen */}
            <button
              onClick={requestFullscreen}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
