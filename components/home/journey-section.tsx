import Link from 'next/link';
import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  streakDays?: number;
  journeyTitle?: string;
  journeyLevel?: string;
  progressPercent?: number;
}

export function JourneySection({
  streakDays = 3,
  journeyTitle = '98 Day Emotional Reset',
  journeyLevel = 'Level 2: Awareness',
  progressPercent = 35,
}: Props) {
  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Your Journey</h3>
        <Link href="/journeys" className="text-sm font-semibold text-primary">
          View Path
        </Link>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5 px-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
              <Flame className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">
                Daily Streak: {streakDays} Days
              </span>
            </div>
          </div>

          <h4 className="text-[17px] font-bold leading-snug">{journeyTitle}</h4>

          <div className="flex flex-col gap-1.5">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground font-medium">{journeyLevel}</span>
              <span className="text-[12px] font-bold text-primary">{progressPercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
