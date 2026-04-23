"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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

  const handleClick = () => {
    router.push(`/journeys/${journey.journeyId}/details`);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow border border-border",
        className,
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {journey.icon && (
            <div className="relative w-12 h-12 flex-shrink-0 bg-muted rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={journey.icon} alt={journey.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-sm text-foreground truncate uppercase">
                {journey.name}
              </h3>
              {journey.isPremium && <PremiumBadge size="sm" />}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
              <span className="text-primary">DAY {journey.currentDay || 1}</span>
              <span className="opacity-40">•</span>
              <span>{progressPercent}% DONE</span>
              {journey.streak > 0 && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="flex items-center gap-0.5 text-orange-500">
                    <Flame className="w-3 h-3" />
                    {journey.streak}
                  </span>
                </>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </CardContent>
    </Card>
  );
}
