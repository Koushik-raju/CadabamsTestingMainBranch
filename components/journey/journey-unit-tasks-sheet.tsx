"use client";

import { ChevronRight, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { JourneyTask } from "@/types/journey";
import type { NodeTaskType } from "./path-node";
import { getTypeColor } from "./path-node";

export interface UnitTask {
  title: string;
  type: NodeTaskType;
  isLocked: boolean;
  isCompleted: boolean;
  task: JourneyTask;
}

interface JourneyUnitTasksSheetProps {
  open: boolean;
  onClose: () => void;
  unitTitle: string;
  summary?: string | null;
  tasks: UnitTask[];
  onTaskTap: (task: UnitTask) => void;
}

const TYPE_EMOJI: Record<string, string> = {
  video: "🎥",
  audio: "🎧",
  assessment: "📋",
  journal: "✍️",
  book: "📅",
  gift: "💙",
  trophy: "🏆",
  read: "📖",
};

export function JourneyUnitTasksSheet({
  open,
  onClose,
  unitTitle,
  summary,
  tasks,
  onTaskTap,
}: JourneyUnitTasksSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-0 pb-10 pt-4 overflow-y-auto"
        style={{ maxHeight: "80vh" }}
      >
        <div className="mx-auto w-10 h-1 bg-border rounded-full mb-4" />
        <SheetHeader className="px-5 mb-3 text-left">
          <SheetTitle className="text-base font-bold">{unitTitle}</SheetTitle>
        </SheetHeader>

        {summary ? (
          <div className="px-5 mb-3">
            <div className="px-3 py-2.5 rounded-xl bg-muted/60 border border-border/40">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Day summary
              </p>
              <p className="text-sm leading-relaxed text-foreground">{summary}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col divide-y divide-border/40">
          {tasks.map((item, idx) => {
            const color = getTypeColor(item.type);
            const emoji = TYPE_EMOJI[item.type] ?? "⭐";

            return (
              <button
                key={idx}
                onClick={() => !item.isLocked && onTaskTap(item)}
                disabled={item.isLocked}
                className="flex items-center gap-3 px-5 py-3.5 text-left transition-colors disabled:opacity-60 active:bg-muted/40"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{
                    backgroundColor: item.isLocked ? "hsl(var(--muted))" : `${color.bg}18`,
                    color: item.isLocked ? "hsl(var(--muted-foreground))" : color.bg,
                  }}
                >
                  {item.isCompleted ? "✓" : emoji}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug truncate text-foreground">
                    {item.title || color.label}
                  </p>
                  <p
                    className="text-[11px] font-medium mt-0.5"
                    style={{ color: item.isLocked ? "hsl(var(--muted-foreground))" : color.bg }}
                  >
                    {color.label}
                  </p>
                </div>

                {/* Status */}
                {item.isCompleted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    Done
                  </span>
                ) : item.isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
