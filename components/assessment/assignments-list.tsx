/**
 * FILE: components/assessment/assignments-list.tsx
 *
 * PURPOSE:
 *   Renders a grouped list card of the patient's completed assessment
 *   completions. Each row shows a gradient icon tile, assessment title,
 *   completion date, severity badge, and score percentage.
 *
 * LOGIC OVERVIEW:
 *   - Receives items (CompletionResponseDto[]) and onItemClick callback.
 *   - Derives a severity config (gradient + label color) from item.severity.
 *   - Uses item.scorePercentage directly from the DTO (computed server-side).
 *   - Formats completedAt into a short human-readable date.
 *   - Renders rows inside a single grouped Card with Separator dividers.
 *   - Uses item.id (unique completion UUID) as the React key.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   items        — CompletionResponseDto[] to render
 *   onItemClick  — called with the clicked item; parent handles navigation
 *
 * DEPENDENCIES:
 *   CompletionResponseDto — from @/sdk/backend-v2
 *
 * LAST UPDATED: 2026-04-21 — replace AssignedAssessmentItem with CompletionResponseDto;
 *   use scorePercentage from DTO; use assessmentTitle field for display
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CompletionResponseDto } from "@/sdk/backend-v2";
import { ChevronRight, ClipboardList } from "lucide-react";

interface AssignmentsListProps {
  items: CompletionResponseDto[];
  onItemClick: (item: CompletionResponseDto) => void;
}

type SeverityConfig = {
  gradient: string;
  badgeBg: string;
  badgeText: string;
  label: string;
};

function getSeverityConfig(severity: CompletionResponseDto["severity"]): SeverityConfig {
  if (severity === "minimal")
    return {
      gradient: "from-emerald-500 to-teal-600",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-700",
      label: "Minimal",
    };
  if (severity === "mild")
    return {
      gradient: "from-sky-500 to-blue-600",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-700",
      label: "Mild",
    };
  if (severity === "moderate")
    return {
      gradient: "from-amber-400 to-orange-500",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-700",
      label: "Moderate",
    };
  if (severity === "severe")
    return {
      gradient: "from-red-500 to-rose-600",
      badgeBg: "bg-red-100",
      badgeText: "text-red-700",
      label: "Severe",
    };
  return {
    gradient: "from-violet-500 to-purple-600",
    badgeBg: "bg-muted",
    badgeText: "text-muted-foreground",
    label: "Completed",
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function AssignmentsList({ items, onItemClick }: AssignmentsListProps) {
  return (
    <Card>
      <CardContent className="py-0 px-3">
        {items.map((item, i) => {
          const config = getSeverityConfig(item.severity);
          const pct = item.scorePercentage ?? null;
          const date = formatDate(item.completedAt);
          const title = item.assessmentTitle ?? item.assessmentKey;

          return (
            <div key={item.id}>
              <div
                className="flex items-start gap-3 py-3 transition-colors hover:bg-muted/50 active:bg-muted rounded-lg cursor-pointer"
                onClick={() => onItemClick(item)}
                role="button"
                tabIndex={0}
                aria-label={title}
                onKeyDown={(e) => e.key === "Enter" && onItemClick(item)}
              >
                {/* Gradient icon tile */}
                <div
                  className={cn(
                    "relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0",
                    "flex items-center justify-center overflow-hidden shadow-sm",
                    config.gradient,
                  )}
                >
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>

                {/* Text block */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug truncate">
                    {title}
                  </p>

                  {date && <p className="text-xs text-muted-foreground mt-0.5">{date}</p>}

                  {/* Severity + score pills */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                        config.badgeBg,
                        config.badgeText,
                      )}
                    >
                      {config.label}
                    </span>
                    {pct !== null && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Score {pct}%
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
              {i < items.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
