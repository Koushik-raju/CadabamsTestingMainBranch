/**
 * FILE: app/(auth)/stress-tracker/report/page.tsx
 *
 * PURPOSE:
 *   Patient-facing analyse / report screen for the Stress Tracker. Mirrors the
 *   mood-tracker report layout: headline avg + count, level distribution,
 *   top stressors, and recent entries.
 *
 * KEY VARIABLES / EXPORTS:
 *   StressTrackerReportPage — default export.
 *
 * DEPENDENCIES:
 *   useStressEntries, useStressReport, PageHeader, Card, Skeleton, Button.
 *
 * LAST UPDATED: 2026-04-28 — initial creation.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STRESS_LEVELS,
  useStressEntries,
  useStressReport,
} from "@/hooks/stress-tracker/use-stress-tracker";

type Window = "7d" | "30d" | "all";

const LEVEL_BG: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700",
  2: "bg-lime-100 text-lime-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-orange-100 text-orange-700",
  5: "bg-red-100 text-red-700",
};

const BAR_COLOR: Record<number, string> = {
  1: "bg-emerald-400",
  2: "bg-lime-400",
  3: "bg-yellow-400",
  4: "bg-orange-400",
  5: "bg-red-500",
};

/* Build daily buckets for the chart. Returns one row per calendar day in the
 * window (oldest → newest), filling missing days with avg=null so gaps stay
 * visible. Multiple entries on the same day are averaged. */
function buildDailySeries(
  entries: { stressLevel: number; loggedAt: string }[],
  win: Window,
): { dayIso: string; avg: number | null; count: number }[] {
  const dayCount = win === "7d" ? 7 : win === "30d" ? 30 : 14;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sums = new Map<string, { sum: number; count: number }>();
  for (const e of entries) {
    const d = new Date(e.loggedAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const cur = sums.get(key) ?? { sum: 0, count: 0 };
    cur.sum += e.stressLevel;
    cur.count += 1;
    sums.set(key, cur);
  }

  const series: { dayIso: string; avg: number | null; count: number }[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const cur = sums.get(key);
    series.push({
      dayIso: key,
      avg: cur ? cur.sum / cur.count : null,
      count: cur?.count ?? 0,
    });
  }
  return series;
}

function windowToFromIso(w: Window): string | undefined {
  if (w === "all") return undefined;
  const days = w === "7d" ? 7 : 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function StressTrackerReportPage() {
  const [win, setWin] = useState<Window>("30d");
  const fromIso = useMemo(() => windowToFromIso(win), [win]);

  const { data: report, isLoading: reportLoading } = useStressReport(fromIso);
  /* Pull a wider history (200 rows) so the date-wise chart has data across
   * the 30d window without a second fetch. The "Recent entries" card slices
   * the first 20 below. */
  const { data: list, isLoading: listLoading } = useStressEntries(200);

  const maxBucket = report ? Math.max(1, ...Object.values(report.levelBuckets ?? {})) : 1;

  /* Pull a wider entry list when "all" so we still have ~14 days of bars. */
  const chartScrollRef = useRef<HTMLDivElement | null>(null);

  const dailySeries = useMemo(
    () =>
      buildDailySeries(
        (list?.items ?? []).map((e) => ({ stressLevel: e.stressLevel, loggedAt: e.loggedAt })),
        win,
      ),
    [list, win],
  );

  /* Auto-scroll the chart to the latest (rightmost) day when the series or
   * window changes. Without this the user lands on day 1 of the window. */
  useEffect(() => {
    const el = chartScrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [dailySeries, win]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <PageHeader title="Stress Report" fallback="/stress-tracker" />

      <div className="px-4 flex flex-col gap-4">
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((w) => (
            <Button
              key={w}
              size="sm"
              variant={win === w ? "default" : "outline"}
              onClick={() => setWin(w)}
            >
              {w === "all" ? "All time" : `Last ${w === "7d" ? "7" : "30"} days`}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            {reportLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold">
                    {report?.averageLevel != null ? report.averageLevel.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">Average level</span>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="text-2xl font-bold">{report?.count ?? 0}</span>
                  <span className="text-xs text-muted-foreground">Entries</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Date-wise bar chart */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold">Daily stress level</h3>
              <span className="text-[11px] text-muted-foreground">Avg per day · 1–5</span>
            </div>
            {listLoading ? (
              <Skeleton className="h-36 w-full" />
            ) : (
              <div className="flex flex-col gap-2">
                <div ref={chartScrollRef} className="flex items-end gap-1 overflow-x-auto pb-1">
                  {dailySeries.map((d) => {
                    const heightPct = d.avg != null ? (d.avg / 5) * 100 : 0;
                    const rounded = d.avg != null ? Math.round(d.avg) : 0;
                    const color =
                      d.avg != null ? (BAR_COLOR[rounded] ?? "bg-muted") : "bg-muted/40";
                    const dayNum = new Date(d.dayIso).getDate();
                    return (
                      <div
                        key={d.dayIso}
                        className="flex flex-col items-center gap-1 flex-1 min-w-[14px]"
                        title={
                          d.avg != null
                            ? `${d.dayIso} · avg ${d.avg.toFixed(1)} (${d.count} entries)`
                            : `${d.dayIso} · no entries`
                        }
                      >
                        {/* Fixed-height bar track. Bar height is a percentage
                         * of this track so flex-1 / column-flex sizing quirks
                         * don't collapse it to zero. Empty-day stub has its
                         * own pixel floor for visibility. */}
                        <div className="relative h-28 w-full flex items-end">
                          <div
                            className={`w-full rounded-t-md transition-all ${color}`}
                            style={{
                              height: d.avg != null ? `${Math.max(heightPct, 8)}%` : "4px",
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {dayNum}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center pt-1">
                  {STRESS_LEVELS.map((l) => (
                    <div key={l.score} className="flex items-center gap-1">
                      <div className={`h-2.5 w-2.5 rounded-sm ${BAR_COLOR[l.score]}`} />
                      <span className="text-[10px] text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold">Level distribution</h3>
            {reportLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="flex flex-col gap-2">
                {[5, 4, 3, 2, 1].map((score) => {
                  const k = String(score);
                  const v = report?.levelBuckets?.[k] ?? 0;
                  const pct = (v / maxBucket) * 100;
                  const label = STRESS_LEVELS.find((l) => l.score === score)?.label ?? k;
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-16 text-xs font-semibold text-muted-foreground">
                        {label}
                      </span>
                      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs font-medium">{v}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold">Top stressors</h3>
            {reportLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (report?.topReasons ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No stressors logged yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {report!.topReasons.map((f) => (
                  <span
                    key={f.label}
                    className="rounded-full bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1"
                  >
                    {f.label} · {f.count}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold">Recent entries</h3>
            {listLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (list?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't logged stress yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {list!.items.slice(0, 20).map((entry) => {
                  const tint = LEVEL_BG[entry.stressLevel] ?? "bg-muted text-foreground";
                  const label =
                    entry.stressLevelLabel ??
                    STRESS_LEVELS.find((l) => l.score === entry.stressLevel)?.label ??
                    `Level ${entry.stressLevel}`;
                  return (
                    <li
                      key={entry.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold ${tint}`}
                      >
                        {entry.stressLevel}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{label}</p>
                          <p className="text-[11px] text-muted-foreground shrink-0">
                            {formatDay(entry.loggedAt)} · {formatTime(entry.loggedAt)}
                          </p>
                        </div>
                        {entry.stressReasons.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {entry.stressReasons.slice(0, 4).map((r) => (
                              <span
                                key={r}
                                className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
                              >
                                {r}
                              </span>
                            ))}
                            {entry.stressReasons.length > 4 && (
                              <span className="text-[10px] text-muted-foreground self-center">
                                +{entry.stressReasons.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
