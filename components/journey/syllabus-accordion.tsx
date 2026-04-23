"use client";

import { cn } from "@/lib/utils";
import type { JourneyStep } from "@/types/journey";
import { extractJourneyName } from "@/types/journey";
import { ChevronDown, Lock } from "lucide-react";
import { useState } from "react";

interface SyllabusAccordionProps {
  steps: JourneyStep[];
  isSubscribed?: boolean;
}

export function SyllabusAccordion({ steps, isSubscribed = false }: SyllabusAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (steps.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-bold text-foreground mb-3">Journey Syllabus</h3>
      <div className="flex flex-col gap-2">
        {steps.map((step, idx) => {
          const isLocked = !isSubscribed && idx > 0;
          const isOpen = openIndex === idx;
          const taskCount = step.tasks?.length ?? 0;
          const startDay =
            idx === 0
              ? 1
              : steps.slice(0, idx).reduce((acc, s) => acc + (s.tasks?.length ?? 1), 0) + 1;
          const endDay = startDay + taskCount - 1;
          const stepTitle =
            typeof step.title === "string" ? step.title : extractJourneyName(step.title as never);

          return (
            <div
              key={step.id ?? idx}
              className={cn(
                "rounded-2xl border border-border overflow-hidden",
                isLocked ? "opacity-70" : "",
              )}
            >
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-card text-left"
                onClick={() => !isLocked && setOpenIndex(isOpen ? null : idx)}
                disabled={isLocked}
              >
                {/* Step number circle */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    idx === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {idx + 1}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{stepTitle}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Days {startDay}–{endDay} • {taskCount} Tasks
                  </p>
                </div>

                {/* Right icon */}
                {isLocked ? (
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                      isOpen ? "rotate-180" : "",
                    )}
                  />
                )}
              </button>

              {/* Expandable description */}
              {isOpen && !isLocked && (
                <div className="px-4 pb-3 pt-0 bg-card border-t border-border animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {extractJourneyName(step.description as never) ||
                      `Explore ${taskCount} activities to build your understanding.`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
