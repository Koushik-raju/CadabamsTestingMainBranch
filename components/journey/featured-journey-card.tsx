'use client';

import { useRouter } from 'next/navigation';
import { Clock, BarChart2 } from 'lucide-react';
import { fixImageUrl } from '@/lib/utils';
import type { JourneyItem } from '@/types/journey';
import { extractJourneyName, extractJourneyDescription } from '@/types/journey';

interface FeaturedJourneyCardProps {
  journey: JourneyItem;
}

export function FeaturedJourneyCard({ journey }: FeaturedJourneyCardProps) {
  const router = useRouter();
  const id = journey.id;
  const name = extractJourneyName(journey.name);
  const description = extractJourneyDescription(journey.description);
  const imageUrl = fixImageUrl(journey.icon);
  const dayCount = journey.steps?.length ?? 30;

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
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Trending badge */}
      <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
        Trending
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Meta badges */}
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            {dayCount} Days
          </span>
          <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <BarChart2 className="w-3 h-3" />
            Beginner
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
          Start Now →
        </button>
      </div>
    </div>
  );
}
