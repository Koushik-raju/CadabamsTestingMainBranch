/**
 * FILE: components/journey/journey-discovery-card.tsx
 *
 * PURPOSE:
 *   Card component for rendering a journey discovery item in the journeys list.
 *   Displays journey name, day count, media type badge, and premium indicator.
 *
 * LOGIC OVERVIEW:
 *   Accepts a journey object and derives display values: name via getSafeString
 *   (extracts text from rich text blocks), day count from steps, media type by
 *   checking for audio/worksheet/interactive tasks, and image URL from icon or
 *   banner. Renders as a clickable Card that navigates to the journey detail.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   journey          — discovery journey item with name, steps, icon, isPremium
 *   className        — optional additional Card classes
 *   JourneyDiscoveryCard — default export component
 *   getSafeString    — helper to extract text from rich text blocks
 *   getMediaType     — helper to classify task content (audio/journal/interactive)
 *
 * DEPENDENCIES:
 *   Card, CardContent, CardHeader — @/components/ui/card
 *   Badge — @/components/ui/badge
 *   PremiumBadge — components/journey/premium-badge
 *   lucide-react Clock icon
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn, fixImageUrl } from "@/lib/utils";
import type { JourneyItem, JourneyRichText } from "@/types/journey";
import { PremiumBadge } from "./premium-badge";

export type DiscoveryJourney = JourneyItem & {
  category?: string;
  isFeatured?: boolean;
  banner?: { url?: string };
};

interface JourneyDiscoveryCardProps {
  journey: DiscoveryJourney;
  className?: string;
}

function getSafeString(val: unknown): string {
  if (typeof val === "string") return val;
  if (!val) return "";
  if (Array.isArray(val)) {
    for (const block of val as JourneyRichText[]) {
      if (block.children) {
        for (const child of block.children) {
          if (child.text) return child.text;
          if (child.children) {
            for (const nested of child.children) {
              if (nested.text) return nested.text;
            }
          }
        }
      }
    }
  }
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    return String(o.name ?? o.title ?? o.text ?? "");
  }
  return String(val);
}

function getMediaType(journey: DiscoveryJourney): string {
  const tasks = journey.steps?.flatMap((s) => s.tasks ?? []) ?? [];
  if (tasks.some((t) => t.audios && t.audios.length > 0)) return "Audio";
  if (tasks.some((t) => t.worksheets && (t.worksheets as unknown[]).length > 0)) return "Journal";
  return "Interactive";
}

export function JourneyDiscoveryCard({ journey, className }: JourneyDiscoveryCardProps) {
  const router = useRouter();
  const journeyId = journey.id;
  const name = getSafeString(journey.name);
  const dayCount = journey.steps?.length ?? 30;
  const imageUrl = fixImageUrl(
    journey.icon ?? (journey as { banner?: { url?: string } }).banner?.url,
  );
  const isPremium = journey.isPremium ?? false;
  const mediaType = getMediaType(journey);

  const handleClick = () => {
    router.push(`/journeys/${journeyId}`);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-[var(--sh-2)] transition-shadow border border-border overflow-hidden pt-0",
        className,
      )}
      onClick={handleClick}
    >
      <CardHeader className="relative h-24 m-0 p-0 w-full bg-muted overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        {isPremium && (
          <div className="absolute top-2 left-2">
            <PremiumBadge size="sm" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-2 pt-0 mt-0">
        <h4 className="font-bold text-xs text-foreground leading-snug truncate">{name}</h4>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{dayCount} Days</span>
          <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto">
            {mediaType}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
