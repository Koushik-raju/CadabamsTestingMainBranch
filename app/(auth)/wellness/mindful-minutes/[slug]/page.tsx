/**
 * FILE: app/(auth)/wellness/mindful-minutes/[slug]/page.tsx
 *
 * PURPOSE:
 *   Detail page for a single mindful minute collection. Lists all audio tracks
 *   and allows playback via a fullscreen audio player overlay.
 *
 * LOGIC OVERVIEW:
 *   1. Reads slug from URL params, fetches collection via useMindfulMinuteDetail().
 *   2. Sorts audios by createdAt (oldest/newest first toggle).
 *   3. Filters audios by search query.
 *   4. Tapping a card or "Play all" opens FullscreenAudioPlayer at the selected index.
 *   5. Player auto-advances to the next track on completion.
 *   6. When opened from a journey task (via destinationPath), reads
 *      `?audioId=` and auto-opens the player on that track, and reads
 *      `journeyEnrollmentId` / `journeyTaskId` / `journeyId` so the
 *      track's completion can be reported back via useJourneyTaskContinuation.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   sortOrder        — 'asc' (oldest first) | 'desc' (newest first)
 *   activeIndex      — index of the currently playing/selected audio
 *   playerOpen       — whether the fullscreen player is visible
 *   filteredAudios   — audios after sort + search filter
 *
 * DEPENDENCIES:
 *   useMindfulMinuteDetail(slug) — SWR hook for single collection
 *   FullscreenAudioPlayer        — fullscreen player overlay component
 *
 * LAST UPDATED: 2026-05-08 — replaced custom right-slot search bar with PageHeader built-in search props
 */

"use client";

import { ChevronDown, ChevronUp, Play } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EqualizerBars,
  FullscreenAudioPlayer,
} from "@/components/wellness/fullscreen-audio-player";
import { useJourneyTaskContinuation } from "@/hooks/journeys/use-journey-task-continuation";
import { useMindfulMinuteDetail } from "@/hooks/wellness/use-mindful-minute-detail";
import type { MindfulMinuteAudio } from "@/hooks/wellness/use-mindful-minutes";

type SortOrder = "asc" | "desc";

export default function MindfulMinuteDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slugOrId = typeof params?.slug === "string" ? params.slug : "";
  const { mindfulMinute, isLoading, error } = useMindfulMinuteDetail(slugOrId);

  // Journey continuation — active only when the URL carries
  // journeyEnrollmentId/journeyTaskId AND the context agrees.
  const continuation = useJourneyTaskContinuation("AUDIO");
  const deepLinkedAudioId = searchParams?.get("audioId") ?? null;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const autoOpenedRef = useRef(false);
  const journeyDoneRef = useRef(false);

  const sortedAudios = useMemo((): MindfulMinuteAudio[] => {
    const list = mindfulMinute?.audios ?? [];
    return [...list].sort((a, b) => {
      const da = Date.parse(a.createdAt);
      const db = Date.parse(b.createdAt);
      return sortOrder === "asc" ? da - db : db - da;
    });
  }, [mindfulMinute, sortOrder]);

  const filteredAudios = useMemo(() => {
    if (!searchQuery) return sortedAudios;
    return sortedAudios.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [sortedAudios, searchQuery]);

  const handleAudioTap = (idx: number) => {
    setActiveIndex(idx);
    setPlayerOpen(true);
  };

  // Auto-open the fullscreen player on the deep-linked audio once the
  // collection has loaded. Guarded so list re-renders don't re-open after
  // the user closes the player.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (!deepLinkedAudioId) return;
    if (!filteredAudios.length) return;
    const idx = filteredAudios.findIndex((a) => a.id === deepLinkedAudioId);
    if (idx >= 0) {
      autoOpenedRef.current = true;
      setActiveIndex(idx);
      setPlayerOpen(true);
    }
  }, [deepLinkedAudioId, filteredAudios]);

  // When the player closes after a journey-driven deep link, report the
  // track as the completion proof. Guarded so we only fire once per mount.
  const handlePlayerClose = async () => {
    setPlayerOpen(false);
    if (!continuation.active || journeyDoneRef.current) return;
    const audio = activeIndex != null ? filteredAudios[activeIndex] : null;
    const audioId = audio?.id ?? deepLinkedAudioId;
    if (!audioId) return;
    journeyDoneRef.current = true;
    try {
      await continuation.markCompleted(
        { kind: "AUDIO", audioId },
        { proofPreview: audio?.title ?? undefined },
      );
    } catch (err) {
      console.error("[MindfulMinuteDetailPage] journey completion failed", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-3 border border-border rounded-2xl">
              <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !mindfulMinute) {
    const isNotFound = !mindfulMinute || error?.message === "not_found";
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p className="font-bold text-foreground text-lg">
          {isNotFound ? "404" : "Something went wrong"}
        </p>
        <p className="text-muted-foreground">
          {isNotFound ? "This mindful minute could not be found." : error?.message}
        </p>
        <Button asChild variant="outline">
          <Link href="/wellness/mindful-minutes">Back to Mindful Minutes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fullscreen player portal */}
      {playerOpen && activeIndex !== null && filteredAudios.length > 0 && (
        <FullscreenAudioPlayer
          audios={filteredAudios}
          initialIndex={activeIndex}
          onClose={handlePlayerClose}
          onTrackChange={(idx) => setActiveIndex(idx)}
          onTrackCompleted={async (_idx, audio) => {
            if (!continuation.active || journeyDoneRef.current) return;
            journeyDoneRef.current = true;
            // Close the fullscreen player so the user can see the
            // "Return to journey" banner — otherwise the player's
            // auto-advance to the next track keeps the overlay visible
            // and the FAB is stacked behind it.
            setPlayerOpen(false);
            try {
              await continuation.markCompleted(
                { kind: "AUDIO", audioId: audio.id },
                { proofPreview: audio.title },
              );
            } catch (err) {
              journeyDoneRef.current = false;
              console.error("[MindfulMinuteDetailPage] auto-complete failed", err);
            }
          }}
        />
      )}

      <PageHeader
        title={mindfulMinute.title}
        subtitle={`${filteredAudios.length} sessions available`}
        fallback="/wellness/mindful-minutes"
        className="z-10 bg-background border-b border-border px-4 py-3"
        searchValue={searchQuery}
        searchPlaceholder="Search…"
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery("")}
      />

      {/* Journey continuation banner — explicit mark-complete for audio task */}
      {continuation.active && (
        <div className="mx-4 mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Journey task in progress</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Listen to a session, then mark it done to return.
            </p>
          </div>
          <Button
            size="sm"
            disabled={journeyDoneRef.current}
            onClick={async () => {
              const audio =
                (activeIndex != null ? filteredAudios[activeIndex] : null) ??
                (deepLinkedAudioId
                  ? filteredAudios.find((a) => a.id === deepLinkedAudioId)
                  : null) ??
                filteredAudios[0] ??
                null;
              if (!audio) return;
              journeyDoneRef.current = true;
              try {
                await continuation.markCompleted(
                  { kind: "AUDIO", audioId: audio.id },
                  { proofPreview: audio.title },
                );
              } catch (err) {
                journeyDoneRef.current = false;
                console.error("[MindfulMinuteDetailPage] mark-complete failed", err);
              }
            }}
          >
            Mark done
          </Button>
        </div>
      )}

      <main className="flex-1 px-4 py-4 space-y-5 max-w-2xl mx-auto w-full pb-20">
        {/* Sort control + Play all */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            className="text-sm font-bold text-muted-foreground flex items-center gap-1 active:opacity-70"
          >
            {sortOrder === "asc" ? "Oldest first" : "Newest first"}
            {sortOrder === "asc" ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          {filteredAudios.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl gap-1.5 h-8 text-xs font-bold"
              onClick={() => {
                setActiveIndex(0);
                setPlayerOpen(true);
              }}
            >
              <Play className="w-3 h-3 fill-current" />
              Play all
            </Button>
          )}
        </div>

        {/* Audio list */}
        <div className="space-y-3">
          {filteredAudios.map((audio, idx) => {
            const isActive = playerOpen && activeIndex === idx;
            return (
              <div
                key={audio.documentId ?? idx}
                onClick={() => handleAudioTap(idx)}
                className="bg-card border border-border rounded-2xl cursor-pointer active:scale-[0.99] transition-transform shadow-[var(--sh-1)]"
              >
                <div className="p-3.5 flex items-center gap-4">
                  {/* Icon / equalizer */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    {isActive ? <EqualizerBars /> : <span className="text-xl">🎵</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-[15px] truncate">
                      {audio.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold">
                        Track {idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary font-bold text-[13px] mt-2">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isActive ? "Now playing" : "Play"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAudios.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No audio sessions found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
