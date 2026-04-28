/**
 * FILE: components/journey/featured-journey-card.tsx
 *
 * PURPOSE:
 *   Full-width hero card for a journey — used as a carousel slide on the Journeys page.
 *   Full-bleed background image, dark gradient overlay, bottom-aligned text + CTA.
 *
 * LOGIC OVERVIEW:
 *   1. Background image fills the card; a dark-to-transparent gradient sits above it.
 *   2. Top-left badge: "Trending" by default, or custom badgeLabel (e.g. "In progress").
 *   3. Meta row: total days + progress chip (Day X/Y when enrolled, "Beginner" otherwise).
 *   4. Title + optional description + orange mt-primary CTA button.
 *   5. Clicking card or CTA routes to /journeys/[id].
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   id           — journey id used for routing
 *   name         — display name (sentence case)
 *   description  — optional short description
 *   imageUrl     — resolved image URL
 *   dayCount     — total days shown in meta
 *   badgeLabel   — top-left badge text
 *   ctaLabel     — primary action label
 *   progress     — when supplied, shows Day X/Y in meta row
 *
 * DEPENDENCIES:
 *   next/navigation useRouter, lucide-react
 *
 * LAST UPDATED: 2026-04-28 — Design system migration: orange CTA button, 28px radius,
 *   white-on-dark text, sentence-case labels, removed teal gradient
 */
"use client";

import { BarChart2, Clock, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

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
  badgeLabel = "Trending",
  ctaLabel = "Start now →",
  progress,
}: FeaturedJourneyCardProps) {
  const router = useRouter();
  const totalDays = progress?.totalDays ?? dayCount;

  return (
    <div
      className="relative w-full overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-[140ms]"
      style={{ minHeight: 220, borderRadius: 28 }}
      onClick={() => router.push(`/journeys/${id}`)}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      {/* Dark gradient overlay — bottom-heavy so text is legible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      {/* Top-left badge */}
      <div
        className="absolute top-3.5 left-3.5 flex items-center gap-1 text-white text-[10px] font-bold px-2.5 py-1 rounded-full"
        style={{ background: "#F97316", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }}
      >
        <TrendingUp className="w-3 h-3" />
        {badgeLabel}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Meta chips */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            {totalDays} days
          </span>
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
            <BarChart2 className="w-3 h-3" />
            {progress ? `Day ${progress.currentDay} of ${progress.totalDays}` : "Beginner"}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-white font-bold text-[20px] leading-snug tracking-tight line-clamp-2 mb-1">
          {name}
        </h2>
        {description && (
          <p className="text-white/70 text-[13px] leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/journeys/${id}`);
          }}
          className="flex items-center gap-1.5 text-white text-[13px] font-bold px-5 py-2.5 rounded-full transition-transform duration-[140ms] active:scale-95"
          style={{
            background: "#F97316",
            boxShadow: "0 8px 18px rgba(249,115,22,0.28)",
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
