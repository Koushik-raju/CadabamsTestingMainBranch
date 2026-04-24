/**
 * FILE: components/home/journey-section.tsx
 *
 * PURPOSE:
 *   Displays the user's active enrolled journeys on the home screen with
 *   real progress data and daily streak count.
 *
 * LOGIC OVERVIEW:
 *   1. Accepts enriched enrollment data and streak count as props from home/page.tsx.
 *   2. Shows a loading skeleton while data is fetching.
 *   3. Shows an empty state with a CTA if the user has no active journeys.
 *   4. Renders each enrolled journey as a row inside a grouped card, with a
 *      gradient icon tile, name, day counter, and progress bar.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   enrollments     — list of enriched enrollment objects (id, name, currentDay, totalDays)
 *   streak          — daily streak count from gamification
 *   isLoading       — drives skeleton display
 *
 * DEPENDENCIES:
 *   shadcn Card, Skeleton, Separator, Badge
 *
 * LAST UPDATED: 2026-04-24 — skeleton reduced to single row to match single-journey display
 */

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Flame, Route } from "lucide-react";
import Link from "next/link";

export interface HomeEnrollment {
  enrollmentId: string;
  journeyId: string;
  name: string;
  currentDay: number;
  totalDays: number;
}

interface Props {
  enrollments: HomeEnrollment[];
  streak: number;
  isLoading?: boolean;
}

export function JourneySection({ enrollments = [], streak, isLoading = false }: Props) {
  return (
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">Your Journeys</h3>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-0.5">
              <Flame className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider">
                {streak}d streak
              </span>
            </div>
          )}
        </div>
        <Link href="/journeys" className="text-sm font-semibold text-primary">
          View All
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-0 px-3">
            <div>
              <div className="flex items-start gap-3 py-3">
                <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <Skeleton className="h-3.5 w-2/3 rounded" />
                  <Skeleton className="h-2.5 w-1/3 rounded" />
                  <Skeleton className="h-1.5 w-full rounded-full mt-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Route className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No active journeys</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a journey to track your progress here.
              </p>
            </div>
            <Link href="/journeys" className="text-sm font-semibold text-primary">
              Explore Journeys →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-0 px-3">
            {enrollments.map((enrollment, i) => {
              const percent =
                enrollment.totalDays > 0
                  ? Math.round((enrollment.currentDay / enrollment.totalDays) * 100)
                  : 0;
              return (
                <div key={enrollment.enrollmentId}>
                  <Link
                    href={`/journeys/${enrollment.journeyId}`}
                    className="flex items-start gap-3 py-3 transition-colors hover:bg-muted/50 active:bg-muted -mx-3 px-3"
                  >
                    <div
                      className={cn(
                        "relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0",
                        "flex items-center justify-center overflow-hidden shadow-sm",
                        "from-violet-500 to-purple-600",
                      )}
                    >
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                      <Route className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {enrollment.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Day {enrollment.currentDay} of {enrollment.totalDays}
                      </p>
                      <div className="mt-2 flex flex-col gap-1">
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-primary self-end">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  </Link>
                  {i < enrollments.length - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
