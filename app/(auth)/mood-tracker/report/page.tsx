/**
 * FILE: app/(auth)/mood-tracker/report/page.tsx
 *
 * PURPOSE:
 *   Patient-facing analyse / report screen for the Mood Tracker. Shows the
 *   average mood, a 1–5 score distribution, the patient's most-frequent
 *   bubble feelings, and the most recent entries.
 *
 * LOGIC OVERVIEW:
 *   - useMoodReport pulls aggregate stats; useMoodEntries pulls the recent
 *     timeline. The window can be toggled between 7d / 30d / all.
 *   - Score buckets are rendered as a simple horizontal bar list — no chart
 *     library dependency added for this first cut.
 *
 * KEY VARIABLES / EXPORTS:
 *   MoodTrackerReportPage — default export.
 *
 * DEPENDENCIES:
 *   useMoodReport, useMoodEntries, PageHeader, Card, Skeleton, Button.
 *
 * LAST UPDATED: 2026-04-28 — fix moodLabel SDK type gap (generated as object, guarded at render).
 */
"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMoodEntries, useMoodReport } from "@/hooks/mood-tracker/use-mood-tracker";

type Window = "7d" | "30d" | "all";

/* SDK types moodLabel as an object; extract only if it's a real string at runtime. */
function safeStr(val: unknown, fallback: string): string {
  return typeof val === "string" ? val : fallback;
}

const SCORE_EMOJI = ["😢", "😕", "😐", "🙂", "😄"];
const SCORE_TINT: Record<number, string> = {
  1: "bg-purple-100 text-purple-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-lime-100 text-lime-700",
  5: "bg-green-100 text-green-700",
};

function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function windowToFromIso(w: Window): string | undefined {
  if (w === "all") return undefined;
  const days = w === "7d" ? 7 : 30;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function MoodTrackerReportPage() {
  const [win, setWin] = useState<Window>("30d");
  const fromIso = useMemo(() => windowToFromIso(win), [win]);

  const { data: report, isLoading: reportLoading } = useMoodReport(fromIso);
  const { data: list, isLoading: listLoading } = useMoodEntries(20);

  const maxBucket = report ? Math.max(1, ...Object.values(report.scoreBuckets ?? {})) : 1;

  return (
    <div className="bg-gray-50/50 pb-24">
      <PageHeader title="Mood Report" fallback="/mood-tracker" />

      <div className="px-4 flex flex-col gap-4">
        {/* Window selector */}
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

        {/* Headline card */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            {reportLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold">
                    {report?.averageScore != null ? Number(report.averageScore).toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">Average mood</span>
                </div>
                <div className="ml-auto flex flex-col items-end">
                  <span className="text-2xl font-bold">{report?.count ?? 0}</span>
                  <span className="text-xs text-muted-foreground">Entries</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Score distribution */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold">Score distribution</h3>
            {reportLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="flex flex-col gap-2">
                {(["5", "4", "3", "2", "1"] as const).map((k) => {
                  const v = report?.scoreBuckets?.[k] ?? 0;
                  const pct = (v / maxBucket) * 100;
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-4 text-xs font-bold text-muted-foreground">{k}</span>
                      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs font-medium">{v}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top feelings */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold">Top feelings</h3>
            {reportLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (report?.topFeelings ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No feelings logged yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {report!.topFeelings.map((f) => (
                  <span
                    key={f.label}
                    className="rounded-full bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1"
                  >
                    {f.label} · {f.count}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent entries */}
        <Card>
          <CardContent className="p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold">Recent entries</h3>
            {listLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (list?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't logged a mood yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {list!.items.map((entry) => {
                  const emoji = SCORE_EMOJI[entry.moodScore - 1] ?? "🙂";
                  const tint = SCORE_TINT[entry.moodScore] ?? "bg-muted text-foreground";
                  return (
                    <li
                      key={entry.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl ${tint}`}
                      >
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold truncate">
                            {safeStr(entry.moodLabel, `Mood ${entry.moodScore}`)}
                          </p>
                          <p className="text-[11px] text-muted-foreground shrink-0">
                            {formatDay(entry.loggedAt)} · {formatTime(entry.loggedAt)}
                          </p>
                        </div>
                        {entry.feelings.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {entry.feelings.slice(0, 4).map((f) => (
                              <span
                                key={f}
                                className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
                              >
                                {f}
                              </span>
                            ))}
                            {entry.feelings.length > 4 && (
                              <span className="text-[10px] text-muted-foreground self-center">
                                +{entry.feelings.length - 4}
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
