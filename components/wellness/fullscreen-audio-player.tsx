'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MindfulMinuteAudio } from '@/hooks/wellness/use-mindful-minutes';

interface FullscreenAudioPlayerProps {
  audios: MindfulMinuteAudio[];
  initialIndex: number;
  onClose: () => void;
  onTrackChange?: (index: number) => void;
}

function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const path = url.split('?')[0].toLowerCase();
  return path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov') || path.endsWith('.ogg');
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function FullscreenAudioPlayer({
  audios,
  initialIndex,
  onClose,
  onTrackChange,
}: FullscreenAudioPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = audios[currentIndex];

  // Slide-in on mount
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    };
    const onCanPlay = () => setIsLoading(false);
    const onEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next track
      if (currentIndex < audios.length - 1) {
        handleNext();
      }
    };
    const onError = () => setIsLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying, isLoading]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration || 0);
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    onTrackChange?.(newIndex);
  }, [currentIndex, onTrackChange]);

  const handleNext = useCallback(() => {
    if (currentIndex >= audios.length - 1) return;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    onTrackChange?.(newIndex);
  }, [currentIndex, audios.length, onTrackChange]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bgUrl = currentTrack?.backgroundVisualUrl;
  const hasBg = !!bgUrl;
  const bgIsVideo = isVideoUrl(bgUrl);

  if (!currentTrack) return null;

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {hasBg ? (
          <>
            {bgIsVideo ? (
              <video
                src={bgUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={bgUrl!}
                alt=""
                fill
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full text-white safe-top safe-bottom">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            aria-label="Close player"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">
              Now Playing
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>

        {/* Album art */}
        <div className="flex-1 flex items-center justify-center px-10 py-6">
          <div className="relative w-full max-w-xs aspect-square rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm shadow-2xl border border-white/20 flex items-center justify-center">
            {hasBg ? (
              bgIsVideo ? (
                <video
                  src={bgUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                />
              ) : (
                <Image
                  src={bgUrl!}
                  alt={currentTrack.title}
                  fill
                  className="object-cover rounded-3xl"
                />
              )
            ) : (
              <span className="text-8xl select-none">🎵</span>
            )}
          </div>
        </div>

        {/* Track info */}
        <div className="px-7 pb-4">
          <h2 className="text-2xl font-extrabold text-white leading-tight line-clamp-2">
            {currentTrack.title}
          </h2>
          {currentTrack.category && (
            <p className="text-white/60 text-sm mt-1 font-semibold">{currentTrack.category}</p>
          )}
          {/* Track counter */}
          <p className="text-white/40 text-xs mt-1">
            {currentIndex + 1} / {audios.length}
          </p>
        </div>

        {/* Progress */}
        <div className="px-7 pb-3">
          <Slider
            min={0}
            max={duration || 100}
            step={0.1}
            value={[currentTime]}
            onValueChange={seek}
            disabled={isLoading}
            className="w-full [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white"
            aria-label="Seek"
          />
          <div className="flex justify-between text-xs text-white/60 font-medium mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-7 pb-8">
          <div className="flex items-center justify-between">
            {/* Prev */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-full h-12 w-12"
              aria-label="Previous track"
            >
              <SkipBack className="h-6 w-6" />
            </Button>

            {/* Rewind */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              disabled={isLoading}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
              aria-label="Rewind 10s"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            {/* Play/Pause */}
            <Button
              onClick={togglePlay}
              disabled={isLoading}
              className="h-18 w-18 rounded-full bg-white text-primary hover:bg-white/90 shadow-2xl h-[72px] w-[72px]"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-7 w-7 fill-current" />
              ) : (
                <Play className="h-7 w-7 fill-current ml-0.5" />
              )}
            </Button>

            {/* Forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              disabled={isLoading}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
              aria-label="Forward 10s"
            >
              <RotateCw className="h-5 w-5" />
            </Button>

            {/* Next */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex >= audios.length - 1}
              className="text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-full h-12 w-12"
              aria-label="Next track"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
      />
    </div>
  );

  if (typeof window === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
}

// ─── Animated equalizer bars ─────────────────────────────────────────────────
export function EqualizerBars({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-end gap-[2px] h-4', className)} aria-hidden>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] bg-primary rounded-full animate-bounce"
          style={{
            height: `${40 + i * 20}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.8s',
          }}
        />
      ))}
    </span>
  );
}
