/**
 * FILE: components/journey/featured-journey-card.tsx
 *
 * PURPOSE:
 *   Renders a single full-width hero card for a journey — used as a slide inside
 *   FeaturedJourneyCarousel on the Journeys page. Supports both trending (discovery)
 *   and enrolled variants via badge/CTA/progress props.
 *
 * LOGIC OVERVIEW:
 *   1. Renders background image + dark gradient overlay.
 *   2. Top-left badge: "Trending" by default, or "In Progress" for enrolled journeys.
 *   3. Meta row: day count (from progress.totalDays or props.dayCount) + second badge
 *      shows "Day X/Y" when progress is supplied, otherwise "Beginner".
 *   4. Title + description + primary CTA button. Clicking card or CTA routes to
 *      `/journeys/[id]`.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   id           — journey id used for routing
 *   name         — display name
 *   description  — optional short description (empty for enrolled journeys)
 *   imageUrl     — already-resolved image URL (caller runs fixImageUrl)
 *   dayCount     — total days to show in meta (fallback when no progress)
 *   badgeLabel   — top-left badge text (default "Trending")
 *   ctaLabel     — primary action label (default "Start Now →")
 *   progress     — when supplied, shows Day X/Y in the meta row
 *
 * DEPENDENCIES:
 *   next/navigation useRouter
 *   lucide-react icons
 *
 * LAST UPDATED: 2026-04-20 — refactored to primitive props; added badgeLabel, ctaLabel, progress
 */
'use client';

import { useRouter } from 'next/navigation';
import { Clock, BarChart2, TrendingUp } from 'lucide-react';

interface FeaturedJourneyCardProps {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  dayCount: number;
  badgeLabel?: string;
  ctaLabel?: string;
  progress?: { currentDay: number; totalDays: number };
}

export function FeaturedJourneyCard({
  id,
  name,
  description,
  imageUrl,
  dayCount,
  badgeLabel = 'Trending',
  ctaLabel = 'Start Now →',
  progress,
}: FeaturedJourneyCardProps) {
  const router = useRouter();
  const totalDays = progress?.totalDays ?? dayCount;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
      style={{ minHeight: 220 }}
      onClick={() => router.push(`/journeys/${id}`)}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
        <TrendingUp className="w-3 h-3" />
        {badgeLabel}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            {totalDays} Days
          </span>
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <BarChart2 className="w-3 h-3" />
            {progress ? `Day ${progress.currentDay}/${progress.totalDays}` : 'Beginner'}
          </span>
        </div>

        <h2 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1">
          {name}
        </h2>
        {description && (
          <p className="text-white/70 text-xs leading-snug line-clamp-2 mb-3">
            {description}
          </p>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/journeys/${id}`);
          }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
