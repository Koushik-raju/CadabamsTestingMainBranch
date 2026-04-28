/**
 * FILE: components/journey/journey-card.tsx
 *
 * PURPOSE:
 *   Active enrolled journey row card — shows icon, name, day progress,
 *   streak count (with soft-land language), and an orange progress bar.
 *
 * LOGIC OVERVIEW:
 *   1. Progress percentage from journey.progress or computed from currentDay/totalDays.
 *   2. Streak chip uses "keep going" language (never "broke" per design system rule).
 *   3. Orange filled progress bar with percentage shown in --mt-orange-500.
 *   4. Clicking the card navigates to /journeys/[id]/details.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   journey — ActiveJourney shape with id, name, icon, currentDay, totalDays, streak, isPremium
 *
 * DEPENDENCIES:
 *   PremiumBadge, lucide-react, useRouter
 *
 * LAST UPDATED: 2026-04-28 — Design system migration: orange progress bar, tint tile,
 *   soft-land streak, sentence-case labels, removed border/ring from card
 */

"use client";

import { ChevronRight, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import { PremiumBadge } from "./premium-badge";

export interface ActiveJourney {
  journeyId: string;
  name: string;
  icon?: string;
  currentDay: number;
  totalDays: number;
  streak: number;
  isPremium: boolean;
  progress?: number;
  lastUpdated?: string;
}

interface JourneyCardProps {
  journey: ActiveJourney;
  className?: string;
}

export function JourneyCard({ journey, className }: JourneyCardProps) {
  const router = useRouter();

  const progressPercent =
    journey.progress ?? Math.round((journey.currentDay / Math.max(journey.totalDays, 1)) * 100);

  return (
    <div
      className={[
        "bg-white rounded-[18px] p-4 cursor-pointer active:scale-[0.97] transition-transform duration-[140ms]",
        "shadow-[0_2px_6px_rgba(15,23,42,0.05),0_6px_16px_rgba(15,23,42,0.04)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => router.push(`/journeys/${journey.journeyId}/details`)}
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Icon tile */}
        {journey.icon ? (
          <div className="relative w-12 h-12 flex-shrink-0 rounded-[12px] overflow-hidden">
            <img src={journey.icon} alt={journey.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="w-12 h-12 flex-shrink-0 rounded-[12px] flex items-center justify-center"
            style={{ background: "#F1EBFF" }}
          >
            <span className="text-xl">🗺️</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-[15px] text-[#0E1726] truncate">{journey.name}</h3>
            {journey.isPremium && <PremiumBadge size="sm" />}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span style={{ color: "#F97316" }}>Day {journey.currentDay || 1}</span>
            <span className="text-[#C7CCD3]">·</span>
            <span className="text-[#6B7280] mt-numeric">{progressPercent}% done</span>
            {journey.streak > 0 && (
              <>
                <span className="text-[#C7CCD3]">·</span>
                <span className="flex items-center gap-0.5" style={{ color: "#E8620A" }}>
                  <Flame className="w-3 h-3" />
                  {journey.streak}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#9AA0AB" }} />
      </div>

      {/* Orange progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#F4F2EE" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: "#F97316" }}
        />
      </div>
    </div>
  );
}
