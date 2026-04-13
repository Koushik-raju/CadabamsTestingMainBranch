'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from './premium-badge';
import { cn } from '@/lib/utils';
import { fixImageUrl } from '@/lib/utils';
import type { JourneyRichText } from '@/types/journey';
import type { JourneyItem } from '@/types/journey';
import Image from 'next/image';

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
  if (typeof val === 'string') return val;
  if (!val) return '';
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
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>;
    return String(o.name ?? o.title ?? o.text ?? '');
  }
  return String(val);
}

function getMediaType(journey: DiscoveryJourney): string {
  const tasks = journey.steps?.flatMap((s) => s.tasks ?? []) ?? [];
  if (tasks.some((t) => t.audios && t.audios.length > 0)) return 'Audio';
  if (tasks.some((t) => t.worksheets && (t.worksheets as unknown[]).length > 0))
    return 'Journal';
  return 'Interactive';
}

export function JourneyDiscoveryCard({
  journey,
  className,
}: JourneyDiscoveryCardProps) {
  const router = useRouter();
  const journeyId = journey.id;
  const name = getSafeString(journey.name);
  const dayCount = journey.steps?.length ?? 30;
  const imageUrl = fixImageUrl(
    journey.icon ?? (journey as { banner?: { url?: string } }).banner?.url
  );
  const isPremium = journey.isPremium ?? false;
  const mediaType = getMediaType(journey);

  const handleClick = () => {
    router.push(`/journeys/${journeyId}/details`);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border border-border overflow-hidden pt-0',
        className
      )}
      onClick={handleClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <CardHeader className="relative h-24 m-0 p-0 w-full bg-muted">
        <Image
          src={imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover m-0 p-0"
          height={36}
          width={208}
        />
        {isPremium && (
          <div className="absolute top-2 left-2">
            <PremiumBadge size="sm" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-2 pt-0 mt-0">
        <h4 className="font-bold text-xs text-foreground leading-snug truncate">
          {name}
        </h4>
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
