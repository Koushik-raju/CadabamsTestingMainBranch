/**
 * FILE: components/journey/task-preview-sheet.tsx
 *
 * PURPOSE:
 *   Bottom sheet preview of a journey task. Displays task type badge, title,
 *   mandatory/optional status, completed state, XP reward, and a CTA to start
 *   or review the task.
 *
 * LOGIC OVERVIEW:
 *   Receives task data and renders UI based on taskType (assessment, audio,
 *   journal, book, gift, video) with a type-specific badge. Shows "Completed"
 *   badge if variant is "completed". Shows "Optional" badge if not mandatory.
 *   CTA text toggles between "Start" and "Review" based on completion state.
 *   Calls onStart() or onClose() on user action.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   task             — task object or null (if null, renders nothing)
 *   taskTitle        — display title for the sheet
 *   taskType         — type enum (assessment, audio, journal, book, gift, video)
 *   variant          — state (completed or in-progress)
 *   isMandatory      — whether the task is required to complete the day
 *   open             — sheet visibility
 *   onStart          — callback when user taps the CTA
 *   onClose          — callback when user dismisses the sheet
 *   TaskPreviewSheet — default export component
 *
 * DEPENDENCIES:
 *   Sheet, SheetContent, SheetHeader, SheetTitle — @/components/ui/sheet
 *   lucide-react icons (Check, BookOpen, Headphones, etc.)
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { JourneyTask } from "@/types/journey";
import {
  BookOpen,
  Check,
  ClipboardList,
  Gift,
  Headphones,
  PenLine,
  Play,
  Star,
  Zap,
} from "lucide-react";
import type { NodeTaskType, NodeVariant } from "./path-node";

interface TaskPreviewSheetProps {
  task: JourneyTask | null;
  taskTitle: string;
  taskType: NodeTaskType;
  variant: NodeVariant;
  isMandatory: boolean;
  open: boolean;
  onStart: () => void;
  onClose: () => void;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; bg: string; text: string }
> = {
  assessment: {
    label: "Assessment",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
  },
  audio: {
    label: "Audio",
    icon: <Headphones className="w-3.5 h-3.5" />,
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  journal: {
    label: "Journal",
    icon: <PenLine className="w-3.5 h-3.5" />,
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  book: {
    label: "Appointment",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
  },
  gift: {
    label: "Mood Check",
    icon: <Gift className="w-3.5 h-3.5" />,
    bg: "bg-pink-500/10",
    text: "text-pink-600 dark:text-pink-400",
  },
  video: {
    label: "Lesson",
    icon: <Play className="w-3.5 h-3.5 fill-current" />,
    bg: "bg-primary/10",
    text: "text-primary",
  },
};

function getTypeConfig(type: NodeTaskType) {
  return (
    TYPE_CONFIG[type] ?? {
      label: "Activity",
      icon: <Star className="w-3.5 h-3.5" />,
      bg: "bg-muted",
      text: "text-muted-foreground",
    }
  );
}

export function TaskPreviewSheet({
  task,
  taskTitle,
  taskType,
  variant,
  isMandatory,
  open,
  onStart,
  onClose,
}: TaskPreviewSheetProps) {
  if (!task) return null;

  const config = getTypeConfig(taskType);
  const isCompleted = variant === "completed";
  const displayTitle = taskTitle || "Activity";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-10 pt-4">
        <div className="mx-auto w-10 h-1 bg-border rounded-full mb-5" />

        <SheetHeader className="mb-5 text-left">
          {/* Type badge row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full",
                config.bg,
                config.text,
              )}
            >
              {config.icon}
              {config.label}
            </span>

            {isCompleted && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                <Check className="w-3 h-3 stroke-[2.5]" />
                Completed
              </span>
            )}

            {!isMandatory && !isCompleted && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                Optional
              </span>
            )}
          </div>

          <SheetTitle className="text-lg font-bold text-foreground leading-snug">
            {displayTitle}
          </SheetTitle>
        </SheetHeader>

        {/* XP reward chip */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-extrabold px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            +10 XP
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className={cn(
            "w-full h-14 rounded-2xl font-extrabold text-base tracking-wide transition-all active:scale-[0.98] shadow-[var(--sh-1)]",
            isCompleted
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-primary text-primary-foreground shadow-primary/30 shadow-[var(--sh-glow-orange)]",
          )}
        >
          {isCompleted ? "Review" : "Start"}
        </button>
      </SheetContent>
    </Sheet>
  );
}
