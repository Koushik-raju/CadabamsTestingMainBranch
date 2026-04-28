/**
 * FILE: components/home/growth-widget.tsx
 *
 * PURPOSE:
 *   Home-page teaser for Growth. Header shows the user's first name and
 *   the visible date range (e.g. "Apr 27 – May 3"). Below it a 7-day
 *   Mon→Sun strip with a coloured dot under each day that has activity,
 *   plus a small footer summary line showing the count of active days
 *   in this week. Every cell deep-links to /growth?date=YYYY-MM-DD.
 *
 * LOGIC OVERVIEW:
 *   1. Fetch useGrowthWeek(today) for the 7-day activity flags + range.
 *   2. Date range derives from week.weekStart/weekEnd — formatted via
 *      Intl.DateTimeFormat with timeZone: UTC because the strings are
 *      already user-tz local dates from the backend.
 *   3. Active day = orange filled circle; today = solid orange circle with
 *      white text; active non-today = orange/10 tint; inactive = ink text.
 *   4. Footer line summarises "{N} active days · {totalSources} sources".
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   GrowthWidget (default export) — no props.
 *
 * DEPENDENCIES:
 *   useGrowthWeek, todayIso (hooks/growth/use-growth)
 *   shadcn Card + Skeleton, lucide icons, next/link
 *
 * LAST UPDATED: 2026-04-28 — Design system migration: orange date circle,
 *   mt-overline section label, mt-* type scale, cream progress dots
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { todayIso, useGrowthWeek } from "@/hooks/growth/use-growth";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "lucide-react";
import Link from "next/link";

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function formatRange(start?: string, end?: string): string {
  if (!start || !end) return "";
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function GrowthWidget() {
  const today = todayIso();
  const { user } = useAuth();
  const firstName = ((user?.name as string | undefined) ?? "").split(" ")[0];
  const { week, isLoading } = useGrowthWeek(today);

  const activeDays =
    week?.days.filter((d) => d.hasJourney || d.hasJournal || d.hasAssessment || d.hasChatSummary) ??
    [];
  const sourceFlags = week?.days.reduce(
    (acc, d) => ({
      j: acc.j || d.hasJourney,
      n: acc.n || d.hasJournal,
      a: acc.a || d.hasAssessment,
      c: acc.c || d.hasChatSummary,
    }),
    { j: false, n: false, a: false, c: false },
  ) ?? { j: false, n: false, a: false, c: false };
  const sourceCount = Object.values(sourceFlags).filter(Boolean).length;

  return (
    <div className="px-5 mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#F97316" }} />
          <h3 className="mt-h3 text-[#0E1726] truncate">
            {firstName ? (
              <>
                {firstName}
                <span style={{ color: "#6B7280", fontWeight: 600 }}>&apos;s growth</span>
              </>
            ) : (
              "Your growth"
            )}
          </h3>
        </div>
        <Link
          href={`/growth?date=${today}`}
          className="text-[13px] font-semibold flex-shrink-0"
          style={{ color: "#F97316" }}
        >
          View all
        </Link>
      </div>

      <Card>
        <CardContent className="py-4 px-3">
          {/* Date range */}
          <div className="flex items-center justify-between mb-4 px-1">
            {isLoading || !week ? (
              <Skeleton className="h-3 w-28 rounded" />
            ) : (
              <span className="text-[12px] font-semibold text-[#6B7280]">
                {formatRange(week.weekStart, week.weekEnd)}
              </span>
            )}
            {!isLoading && week && (
              <span className="mt-overline">
                {activeDays.length} {activeDays.length === 1 ? "day" : "days"} active
              </span>
            )}
          </div>

          {/* 7-day grid — Mon to Sun */}
          <div className="grid grid-cols-7 gap-1">
            {(isLoading || !week ? (Array.from({ length: 7 }) as undefined[]) : week.days).map(
              (d, i) => {
                const iso = d?.date;
                const isToday = iso === today;
                const active =
                  d && (d.hasJourney || d.hasJournal || d.hasAssessment || d.hasChatSummary);

                const cell = (
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: isToday ? "#F97316" : "#6B7280" }}
                    >
                      {DOW_LABELS[i]}
                    </span>
                    {iso ? (
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-numeric"
                        style={{
                          background: isToday ? "#F97316" : active ? "#FFE4D2" : "transparent",
                          color: isToday ? "#fff" : active ? "#E8620A" : "#0E1726",
                        }}
                      >
                        {Number(iso.slice(8, 10))}
                      </span>
                    ) : (
                      <Skeleton className="h-8 w-8 rounded-full" />
                    )}
                    {/* Dot marker for active non-today days */}
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: active && !isToday ? "#F97316" : "transparent" }}
                    />
                  </div>
                );

                return iso ? (
                  <Link
                    key={iso}
                    href={`/growth?date=${iso}`}
                    className="rounded-[10px] transition-colors hover:bg-[#F4F2EE] active:bg-[#ECE6DE]"
                  >
                    {cell}
                  </Link>
                ) : (
                  <div key={i}>{cell}</div>
                );
              },
            )}
          </div>

          {/* Footer summary */}
          {!isLoading && week && activeDays.length > 0 && (
            <div
              className="mt-3 pt-3 flex items-center justify-between gap-2"
              style={{ borderTop: "1px solid #ECE6DE" }}
            >
              <span className="text-[11px] text-[#6B7280]">Tap any day to see the details</span>
              <span className="text-[11px] font-semibold text-[#0E1726]">
                {sourceCount} {sourceCount === 1 ? "source" : "sources"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
