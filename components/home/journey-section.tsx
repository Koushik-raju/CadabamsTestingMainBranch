/**
 * FILE: components/home/journey-section.tsx
 *
 * PURPOSE:
 *   Displays the user's active enrolled journey on the home screen with
 *   real progress data and daily streak count.
 *
 * LOGIC OVERVIEW:
 *   1. Accepts enriched enrollment data and streak count as props from home/page.tsx.
 *   2. Shows a loading skeleton while data fetches.
 *   3. Shows an empty state with "Explore journeys" CTA if no active journeys.
 *   4. Renders each enrolled journey as a row: painterly icon tile (image or
 *      purple gradient fallback), journey name, day progress (day N of N),
 *      orange progress bar, and percentage. Streak shown as "Keep your streak"
 *      chip (never "streak broken" language per design system rule).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   enrollments  — enriched enrollment objects (id, name, currentDay, totalDays, icon)
 *   streak       — daily streak count from gamification
 *   isLoading    — drives skeleton display
 *
 * DEPENDENCIES:
 *   shadcn Card, Skeleton, Separator
 *   Flame, Route — lucide-react
 *
 * LAST UPDATED: 2026-04-28 — Design system migration: orange progress bar,
 *   mt-* type scale, soft-land streak language, purple gradient fallback tile
 */

import { Flame, Route } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface HomeEnrollment {
  enrollmentId: string;
  journeyId: string;
  name: string;
  currentDay: number;
  totalDays: number;
  icon: string | null;
}

interface Props {
  enrollments: HomeEnrollment[];
  streak: number;
  isLoading?: boolean;
}

export function JourneySection({ enrollments = [], streak, isLoading = false }: Props) {
  return (
    <div className="px-5 mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="mt-h3 text-[#0E1726]">Your journeys</h3>
          {streak > 0 && (
            /* Streak chip — never says "broke", always "keep going" */
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{ background: "#FFE4D2" }}
            >
              <Flame className="w-3 h-3" style={{ color: "#E8620A" }} />
              <span
                className="text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: "#E8620A" }}
              >
                {streak}d
              </span>
            </div>
          )}
        </div>
        <Link href="/journeys" className="text-[13px] font-semibold text-[#F97316]">
          View all
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 h-16 rounded-[14px] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3 rounded" />
                <Skeleton className="h-2.5 w-1/3 rounded" />
                <Skeleton className="h-2 w-full rounded-full mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "#F4F2EE" }}
            >
              <Route className="w-6 h-6" style={{ color: "#6B7280" }} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-[#0E1726]">No active journeys yet</p>
              <p className="text-[13px] text-[#6B7280] mt-1">
                Complete your first reflection today to start your streak!
              </p>
            </div>
            <Link href="/journeys" className="text-[14px] font-semibold text-[#F97316]">
              Explore journeys →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-0 px-4">
            {enrollments.map((enrollment, i) => {
              const percent =
                enrollment.totalDays > 0
                  ? Math.round((enrollment.currentDay / enrollment.totalDays) * 100)
                  : 0;
              return (
                <div key={enrollment.enrollmentId}>
                  <Link
                    href={`/journeys/${enrollment.journeyId}`}
                    className="flex items-center gap-3 py-4 transition-colors active:bg-[#F4F2EE]/50 -mx-4 px-4"
                  >
                    {/* Journey icon — API image or purple gradient fallback */}
                    {enrollment.icon ? (
                      <img
                        src={enrollment.icon}
                        alt={enrollment.name}
                        className="w-16 h-16 rounded-[14px] flex-shrink-0 object-cover"
                        style={{ boxShadow: "0 2px 8px rgba(15,23,42,0.10)" }}
                      />
                    ) : (
                      <div
                        className="relative w-16 h-16 rounded-[14px] flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{
                          background: "linear-gradient(135deg, #6C5CE7, #9B8FF0)",
                          boxShadow: "0 2px 8px rgba(108,92,231,0.25)",
                        }}
                      >
                        <Route className="w-7 h-7 text-white" />
                      </div>
                    )}

                    {/* Journey meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-[#0E1726] truncate">
                        {enrollment.name}
                      </p>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">
                        Day{" "}
                        <span className="font-bold text-[#0E1726] mt-numeric">
                          {enrollment.currentDay}
                        </span>{" "}
                        of <span className="mt-numeric">{enrollment.totalDays}</span>
                      </p>
                      {/* Progress bar — orange fill */}
                      <div className="mt-2 flex flex-col gap-1">
                        <div
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          style={{ background: "#F4F2EE" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%`, background: "#F97316" }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-bold self-end mt-numeric"
                          style={{ color: "#F97316" }}
                        >
                          {percent}%
                        </span>
                      </div>
                    </div>
                  </Link>
                  {i < enrollments.length - 1 && (
                    <div className="h-px" style={{ background: "#ECE6DE" }} />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
