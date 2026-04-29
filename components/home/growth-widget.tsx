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
 *   3. Footer line summarises "{N} active days · {totalSources} sources"
 *      so the user knows there is content to explore even when none of
 *      the dots fall on today.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   GrowthWidget (default export) — no props.
 *
 * DEPENDENCIES:
 *   useGrowthWeek, todayIso (hooks/growth/use-growth)
 *   shadcn Card + Skeleton, lucide icons, next/link
 *
 * LAST UPDATED: 2026-04-27 — added date-range header + activity dots
 *   sized for visibility + footer summary line.
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type GrowthDay, todayIso, useGrowthDay, useGrowthWeek } from "@/hooks/growth/use-growth";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ClipboardList, MapIcon, MessageSquare, NotebookPen, Sparkles } from "lucide-react";
import Link from "next/link";

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type DayLike = {
  hasJourney?: boolean;
  hasJournal?: boolean;
  hasAssessment?: boolean;
  hasChatSummary?: boolean;
};

/* Order matters — chat summaries are usually the most recent activity, then
 * journals, then assessments, then journey progress. We surface up to 3 icons
 * under each day cell; a "+N" pill flags any extras and the View All link in
 * the header takes the user to the full breakdown. */
const SOURCE_ORDER: { key: keyof DayLike; Icon: typeof Sparkles; tint: string }[] = [
  { key: "hasChatSummary", Icon: MessageSquare, tint: "text-indigo-500" },
  { key: "hasJournal", Icon: NotebookPen, tint: "text-sky-500" },
  { key: "hasAssessment", Icon: ClipboardList, tint: "text-violet-500" },
  { key: "hasJourney", Icon: MapIcon, tint: "text-emerald-500" },
];

function activeSources(d: DayLike) {
  return SOURCE_ORDER.filter(({ key }) => Boolean(d[key]));
}

/* Flatten a GrowthDay into a single timestamp-ordered list of recent items.
 * We render the top 3 as cards under the date strip so the user sees actual
 * content without leaving the home page. Each item carries a label, icon,
 * preview text, and the source date for navigation. */
type RecentItem = {
  id: string;
  date: string;
  ts: number;
  label: string;
  preview: string;
  Icon: typeof Sparkles;
  tint: string;
  bg: string;
};

function buildRecent(day: GrowthDay | undefined): RecentItem[] {
  if (!day) return [];
  const items: RecentItem[] = [];

  for (const j of day.journeys) {
    items.push({
      id: `jrn-${j.enrollmentId}-${j.completedAt}`,
      date: day.date,
      ts: new Date(j.completedAt).getTime(),
      label: j.journeyTitle ?? "Journey",
      preview:
        j.kind === "day"
          ? (j.summaryText?.slice(0, 80) ?? `Day ${j.dayNumber ?? ""} completed`)
          : (j.taskTitle ?? "Task completed"),
      Icon: MapIcon,
      tint: "text-emerald-700",
      bg: "bg-emerald-50",
    });
  }
  for (const n of day.journals) {
    const previewText =
      n.entryText?.replace(/\s+/g, " ").slice(0, 80) ?? n.prompts[0]?.text?.slice(0, 80) ?? "";
    items.push({
      id: `nl-${n.id}`,
      date: day.date,
      ts: new Date(n.journaledAt).getTime(),
      label: n.title ?? "Journal entry",
      preview: previewText || "Wrote a journal entry",
      Icon: NotebookPen,
      tint: "text-sky-700",
      bg: "bg-sky-50",
    });
  }
  for (const a of day.assessments) {
    items.push({
      id: `as-${a.id}`,
      date: day.date,
      ts: new Date(a.completedAt).getTime(),
      label: a.assessmentTitle ?? a.assessmentKey,
      preview: a.severity ? `Severity: ${a.severity}` : "Assessment completed",
      Icon: ClipboardList,
      tint: "text-violet-700",
      bg: "bg-violet-50",
    });
  }
  for (const c of day.chatSummaries) {
    items.push({
      id: `cs-${c.id}`,
      date: day.date,
      ts: new Date(c.createdAt).getTime(),
      label: "Chat summary",
      preview: c.text.replace(/\s+/g, " ").slice(0, 80),
      Icon: MessageSquare,
      tint: "text-indigo-700",
      bg: "bg-indigo-50",
    });
  }

  return items.sort((a, b) => b.ts - a.ts);
}

/** Format the week range as "Apr 27 – May 3". The ISO strings from the
 *  backend are already user-tz local dates so we render them in UTC to
 *  avoid double-shifting. */
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
  /* Recent-items preview is always pinned to TODAY. Showing data from a
   * stale "latest active day" was confusing — users read the cards as
   * today's activity. If today has nothing, the section collapses and the
   * fallback footer line ("Tap any day to see the details") takes over. */
  const previewDate = today;
  const { day: previewDay, isLoading: dayLoading } = useGrowthDay(previewDate);
  const recent = buildRecent(previewDay);
  const recentTop3 = recent.slice(0, 3);

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
    <div className="px-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <h3 className="text-lg font-bold truncate">
            {firstName ? (
              <>
                {firstName}
                <span className="text-muted-foreground font-semibold">&apos;s growth</span>
              </>
            ) : (
              "Your Growth"
            )}
          </h3>
        </div>
        {/* Pin to today via ?date= so the Growth page skips the
            best-default-date auto-jump and opens on today's cell. */}
        <Link
          href={`/growth?date=${today}`}
          className="text-sm font-semibold text-primary flex-shrink-0"
        >
          View All
        </Link>
      </div>

      <Card>
        <CardContent className="py-3 px-3">
          {/* Date range — derived from the backend's tz-bucketed week */}
          <div className="flex items-center justify-between mb-3 px-1">
            {isLoading || !week ? (
              <Skeleton className="h-3 w-28 rounded" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {formatRange(week.weekStart, week.weekEnd)}
              </span>
            )}
            {!isLoading && week && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {activeDays.length} {activeDays.length === 1 ? "day" : "days"} active
              </span>
            )}
          </div>

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
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        isToday ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {DOW_LABELS[i]}
                    </span>
                    {iso ? (
                      <span
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : active
                              ? "bg-primary/10 text-primary"
                              : "text-foreground",
                        )}
                      >
                        {Number(iso.slice(8, 10))}
                      </span>
                    ) : (
                      <Skeleton className="h-8 w-8 rounded-full" />
                    )}
                    {/* Source icons row — up to 3 most recent activities for
                     *  the day, with a "+N" pill for extras. Reserves space
                     *  even when the day is empty so the row heights line
                     *  up. */}
                    <div className="flex items-center justify-center gap-0.5 h-3">
                      {d
                        ? activeSources(d)
                            .slice(0, 3)
                            .map(({ key, Icon, tint }) => (
                              <Icon
                                key={key}
                                className={cn("w-2.5 h-2.5", tint)}
                                strokeWidth={2.5}
                              />
                            ))
                        : null}
                      {d && activeSources(d).length > 3 && (
                        <span className="text-[8px] font-bold text-primary leading-none">
                          +{activeSources(d).length - 3}
                        </span>
                      )}
                      {d && activeSources(d).length === 0 && (
                        <span
                          className={cn(
                            "w-1 h-1 rounded-full",
                            active && !isToday ? "bg-primary" : "bg-transparent",
                          )}
                        />
                      )}
                    </div>
                  </div>
                );

                return iso ? (
                  <Link
                    key={iso}
                    href={`/growth?date=${iso}`}
                    className="rounded-lg transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    {cell}
                  </Link>
                ) : (
                  <div key={i}>{cell}</div>
                );
              },
            )}
          </div>

          {/* Recent activity preview — top 3 items from the latest active day,
              each linking into /growth?date=…. The View All link in the
              widget header surfaces the rest. Hidden while loading.

              The date this preview belongs to may NOT be today (latest active
              day can be days earlier). Show the date as a small header so
              users don't read the cards as today's data. */}
          {(dayLoading || recentTop3.length > 0) && (
            <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-2">
              {dayLoading && !previewDay ? (
                <>
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 -mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {previewDate === today
                        ? "Today"
                        : new Date(`${previewDate}T00:00:00Z`).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {recent.length} {recent.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  {recentTop3.map((item) => (
                    <Link
                      key={item.id}
                      href={`/growth?date=${item.date}`}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-2.5 transition-colors hover:bg-muted/40 active:bg-muted"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          item.bg,
                        )}
                      >
                        <item.Icon className={cn("h-4 w-4", item.tint)} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate">{item.label}</p>
                        {item.preview && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {item.preview}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                  {recent.length > 3 && (
                    <Link
                      href={`/growth?date=${previewDate}`}
                      className="text-[11px] font-semibold text-primary text-center pt-1"
                    >
                      View all {recent.length} items →
                    </Link>
                  )}
                </>
              )}
            </div>
          )}

          {/* Fallback footer line — shown only when no day has any data so the
              widget never collapses to just the date strip. */}
          {!isLoading &&
            week &&
            activeDays.length > 0 &&
            !dayLoading &&
            recentTop3.length === 0 && (
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Tap any day to see the details
                </span>
                <span className="text-[11px] font-semibold text-foreground">
                  {sourceCount} {sourceCount === 1 ? "source" : "sources"}
                </span>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
