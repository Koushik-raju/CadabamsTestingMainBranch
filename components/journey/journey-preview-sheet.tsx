/**
 * FILE: components/journey/journey-preview-sheet.tsx
 *
 * PURPOSE:
 *   Read-only bottom sheet shown when an unenrolled user taps a task node.
 *   Shows task type, title, description and a subscribe/plans CTA.
 *   Makes zero backend calls — all action is deferred to the parent.
 *
 * LOGIC OVERVIEW:
 *   Renders task info using the same gradient header as JourneyTaskActionSheet.
 *   Primary CTA either calls onSubscribe (free) or onViewPlans (premium).
 *   isSubscribing disables the CTA and shows a loading indicator.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JourneyPreviewSheetProps  — props interface
 *   JourneyPreviewSheet       — exported component
 *
 * DEPENDENCIES:
 *   getTypeColor, NodeTaskType — path-node
 *   Sheet, SheetContent, SheetTitle — @/components/ui/sheet
 *
 * LAST UPDATED: 2026-04-22 — initial creation
 */
"use client";

import {
  BookOpen,
  ClipboardList,
  FileText,
  Gift,
  Headphones,
  Lock,
  PenLine,
  Play,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { NodeTaskType } from "./path-node";
import { getTypeColor } from "./path-node";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function TaskIconLarge({ taskType }: { taskType: NodeTaskType }) {
  const cls = "w-7 h-7";
  switch (taskType) {
    case "video":
      return <Play className={cn(cls, "fill-current")} />;
    case "audio":
      return <Headphones className={cls} />;
    case "assessment":
      return <ClipboardList className={cls} />;
    case "journal":
      return <PenLine className={cls} />;
    case "book":
      return <BookOpen className={cls} />;
    case "gift":
      return <Gift className={cls} />;
    case "trophy":
      return <Trophy className={cls} />;
    case "read":
      return <FileText className={cls} />;
    default:
      return <Star className={cls} />;
  }
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

function getTypeEmoji(taskType: NodeTaskType): string {
  return TYPE_EMOJI[taskType as string] ?? "⭐";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JourneyPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  taskType: NodeTaskType;
  taskTitle: string;
  taskDescription?: string; // plain text, optional
  isPremium: boolean;
  isSubscribing: boolean;
  onSubscribe: () => void; // free journey CTA → calls subscribeToJourney externally
  onViewPlans: () => void; // premium journey CTA → router.push('/packages')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JourneyPreviewSheet({
  open,
  onClose,
  taskType,
  taskTitle,
  taskDescription,
  isPremium,
  isSubscribing,
  onSubscribe,
  onViewPlans,
}: JourneyPreviewSheetProps) {
  const color = getTypeColor(taskType);
  const emoji = getTypeEmoji(taskType);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <SheetTitle className="sr-only">{taskTitle}</SheetTitle>
        <div className="overflow-y-auto max-h-[85vh]">
          {/* ── Coloured header ── */}
          <div
            className="px-5 pt-3 pb-5"
            style={{
              background: `linear-gradient(160deg, ${color.bg}20 0%, ${color.bg}06 100%)`,
              borderBottom: `1px solid ${color.bg}18`,
            }}
          >
            {/* Drag handle */}
            <div className="mx-auto w-10 h-1 bg-border/60 rounded-full mb-4" />

            <div className="flex items-start gap-4">
              {/* Icon circle */}
              <div
                className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: color.bg,
                  boxShadow: `0 6px 20px ${color.bg}55`,
                  color: color.fg,
                }}
              >
                <TaskIconLarge taskType={taskType} />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                {/* Badge row */}
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {/* Task type badge */}
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color.bg}22`, color: color.bg }}
                  >
                    {color.label}
                  </span>

                  {/* Preview Only badge */}
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Preview Only
                  </span>

                  {/* Premium badge */}
                  {isPremium && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                      ★ Premium
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                  {taskTitle}
                </h3>
              </div>
            </div>
          </div>

          {/* ── Info chips ── */}
          <div className="px-5 pt-4 pb-3 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-[11px] font-semibold px-3 py-1.5 rounded-full">
              {emoji} {color.label}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700">
              <Zap className="w-3 h-3" /> +10 XP
            </span>
          </div>

          {/* ── Task description ── */}
          {taskDescription ? (
            <div
              className="mx-5 mb-4 rounded-2xl px-4 py-4"
              style={{ backgroundColor: `${color.bg}0d`, border: `1px solid ${color.bg}22` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: color.bg }}
              >
                About this task
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {taskDescription}
              </p>
            </div>
          ) : null}

          {/* ── CTA ── */}
          <div className="px-5 pb-8 flex flex-col gap-2.5">
            {isPremium ? (
              /* Premium journey — unlock with a plan */
              <button
                onClick={onViewPlans}
                className="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-between px-5 active:scale-[0.98] transition-transform bg-foreground text-background"
              >
                <span>Unlock with a Plan →</span>
                <Lock className="w-5 h-5 opacity-70" />
              </button>
            ) : (
              /* Free journey — subscribe */
              <button
                onClick={onSubscribe}
                disabled={isSubscribing}
                className="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-between px-5 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{
                  backgroundColor: color.bg,
                  color: color.fg,
                  boxShadow: `0 4px 14px ${color.bg}55`,
                }}
              >
                {isSubscribing ? (
                  <span className="flex items-center gap-2 w-full justify-center">
                    <svg
                      className="animate-spin w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Starting…
                  </span>
                ) : (
                  <>
                    <span>Start Free Journey →</span>
                    <Zap className="w-5 h-5" />
                  </>
                )}
              </button>
            )}

            {/* Subscript */}
            <p className="text-center text-xs text-muted-foreground px-2">
              Subscribe to access this task and track your progress.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
