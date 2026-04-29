/**
 * FILE: components/stress/mood-chart.tsx
 *
 * PURPOSE:
 *   Visualizes historical stress level entries as a color-coded bar chart.
 *   Shows stress levels (1–5) over time with contextual labels and reasons if available.
 *
 * LOGIC OVERVIEW:
 *   Renders a horizontal bar for each entry, colored by stress level (green → red).
 *   Falls back to an empty state message when no entries exist.
 *   Each bar shows date, stress level name, and optionally stress reasons if recorded.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   entries         — array of StressEntry objects (stressLevel, createdAt, optional stressReason)
 *   LEVEL_LABELS    — numeric level (1–5) to human-readable label mapping
 *   LEVEL_COLORS    — numeric level to bg- color class mapping
 *
 * DEPENDENCIES:
 *   None (pure component, no hooks or external libs)
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */

"use client";

interface StressEntry {
  stressLevel: number;
  createdAt: string;
  stressReason?: string[];
}

interface MoodChartProps {
  entries: StressEntry[];
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Very High",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-green-400",
  2: "bg-lime-400",
  3: "bg-yellow-400",
  4: "bg-orange-400",
  5: "bg-red-500",
};

export function MoodChart({ entries }: MoodChartProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No stress data recorded yet.
      </div>
    );
  }

  const recent = entries.slice(0, 7).reverse();
  const maxLevel = 5;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Bar chart */}
      <div className="flex items-end gap-2 h-32">
        {recent.map((entry, i) => {
          const heightPct = (entry.stressLevel / maxLevel) * 100;
          const colorClass = LEVEL_COLORS[entry.stressLevel] ?? "bg-muted";
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: "96px" }}>
                <div
                  className={`w-full rounded-t-md ${colorClass} transition-all duration-500`}
                  style={{ height: `${heightPct}%` }}
                  title={`Level ${entry.stressLevel}: ${LEVEL_LABELS[entry.stressLevel]}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {formatDate(entry.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(LEVEL_LABELS).map(([level, label]) => (
          <div key={level} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${LEVEL_COLORS[Number(level)]}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
