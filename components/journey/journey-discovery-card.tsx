'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumBadge } from './premium-badge';
import { cn } from '@/lib/utils';
import type { JourneyRichText } from '@/types/journey';

export interface DiscoveryJourney {
  id: string;
  documentId?: string;
  name?: string | JourneyRichText[] | { name?: string; title?: string } | unknown;
  description?: string | JourneyRichText[] | { name?: string; title?: string } | unknown;
  isPremium?: boolean;
  icon?: string | { url?: string };
  banner?: { url?: string };
  journey?: unknown[];
  days?: unknown[];
  category?: string;
  isFeatured?: boolean;
  steps?: Array<{ id: string }>;
}

interface JourneyDiscoveryCardProps {
  journey: DiscoveryJourney;
  isSubscribed?: boolean;
  featured?: boolean;
  onSubscribe?: (journey: DiscoveryJourney) => void;
  isSubscribing?: boolean;
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

function fixImageUrl(url: unknown): string {
  if (!url) return '/journey/default.png';
  if (typeof url === 'string') {
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/uploads/')) return `https://admin.mindtalkbuddy.com${url}`;
    return url;
  }
  if (typeof url === 'object') {
    const u = url as { url?: string };
    if (u.url) return fixImageUrl(u.url);
  }
  return '/journey/default.png';
}

export function JourneyDiscoveryCard({
  journey,
  isSubscribed = false,
  featured = false,
  onSubscribe,
  isSubscribing = false,
  className,
}: JourneyDiscoveryCardProps) {
  const router = useRouter();
  const journeyId = journey.id;
  const name = getSafeString(journey.name);
  const dayCount = (journey.steps?.length ?? journey.days?.length ?? journey.journey?.length) ?? 30;
  const imageUrl = fixImageUrl(typeof journey.icon === 'string' ? journey.icon : journey.icon?.url ?? journey.banner?.url);
  const isPremium = journey.isPremium ?? false;

  const handleClick = () => {
    if (isSubscribed) {
      router.push(`/journey/${journeyId}`);
    } else {
      router.push(`/journey/${journeyId}?isPreview=true`);
    }
  };

  if (featured) {
    return (
      <Card
        className={cn('relative overflow-hidden cursor-pointer group h-[200px] border-0', className)}
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {isPremium && <PremiumBadge className="mb-1.5" />}
              <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{name}</h3>
              <p className="text-white/70 text-xs">{dayCount} Days</p>
            </div>
            <button
              className="flex-shrink-0 bg-white text-foreground font-bold text-xs h-8 px-4 rounded-xl flex items-center gap-1 hover:bg-white/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (isSubscribed) {
                  router.push(`/journey/${journeyId}`);
                } else {
                  onSubscribe?.(journey);
                }
              }}
              disabled={isSubscribing}
            >
              {isSubscribing ? 'Starting...' : isSubscribed ? 'Continue' : 'Start'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border border-border overflow-hidden',
        className
      )}
      onClick={handleClick}
    >
      <div className="relative h-24 w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {isPremium && (
          <div className="absolute top-2 left-2">
            <PremiumBadge size="sm" />
          </div>
        )}
      </div>
      <CardContent className="p-2">
        <h4 className="font-bold text-xs text-foreground leading-snug truncate">{name}</h4>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{dayCount} Days</span>
          {isSubscribed && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">Enrolled</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
