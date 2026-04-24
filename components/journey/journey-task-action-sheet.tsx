/**
 * FILE: components/journey/journey-task-action-sheet.tsx
 *
 * PURPOSE:
 *   Bottom sheet shown when a user taps a task node on the journey path.
 *   Displays task type, title, description, and primary/secondary CTAs.
 *
 * LOGIC OVERVIEW:
 *   1. Derives color and meta (emoji, CTA label, canNavigate, canMarkDone) from taskType.
 *   2. For 'read' tasks with extraTaskDescription: renders rich content using BlocksRenderer
 *      with prose styles instead of plain text.
 *   3. Primary CTA: navigates to the task page (canNavigate=true) or marks as read (read type).
 *   4. Secondary CTA: "Mark as Done" shown for audio/video when active and incomplete.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   TaskActionSheetData  — { node: PathChainNode; isActive: boolean }
 *   onOpen               — callback to navigate to the task page
 *   onMarkDone           — callback to mark task complete without navigation
 *
 * DEPENDENCIES:
 *   @strapi/blocks-react-renderer (BlocksRenderer)
 *   path-node (getTypeColor)
 *
 * LAST UPDATED: 2026-04-16 — render extraTaskDescription with BlocksRenderer for read tasks
 */
"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { JourneyRichText, JourneyTask } from "@/types/journey";
import { type BlocksContent, BlocksRenderer } from "@strapi/blocks-react-renderer";
import {
  BookOpen,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  Gift,
  Headphones,
  PenLine,
  Play,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import type { PathChainNode } from "./path-chain";
import { getTypeColor } from "./path-node";

// ---------------------------------------------------------------------------
// Rich text → plain text
// ---------------------------------------------------------------------------

function rtToPlain(rt: unknown): string {
  if (!rt || !Array.isArray(rt)) return "";
  return (rt as JourneyRichText[])
    .map((block) =>
      (block.children ?? [])
        .map((c) => c.text ?? (c.children ?? []).map((n) => n.text ?? "").join(""))
        .join(""),
    )
    .join("\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Per-type config
// ---------------------------------------------------------------------------

interface TypeMeta {
  emoji: string;
  description: string;
  ctaLabel: (done: boolean) => string;
  canNavigate: boolean; // false → no Open button, mark-done only
  canMarkDone: boolean; // show "Mark as Done" secondary button
}

const TYPE_META: Record<string, TypeMeta> = {
  video: {
    emoji: "🎥",
    description: "Video lesson",
    ctaLabel: (done) => (done ? "Rewatch" : "Watch Now"),
    canNavigate: true,
    canMarkDone: true,
  },
  audio: {
    emoji: "🎧",
    description: "Audio session",
    ctaLabel: (done) => (done ? "Listen Again" : "Listen Now"),
    canNavigate: true,
    canMarkDone: true,
  },
  assessment: {
    emoji: "📋",
    description: "Assessment",
    ctaLabel: (done) => (done ? "Review Results" : "Start Assessment"),
    canNavigate: true,
    canMarkDone: false,
  },
  journal: {
    emoji: "✍️",
    description: "Reflection exercise",
    ctaLabel: (done) => (done ? "View Entry" : "Write Entry"),
    canNavigate: true,
    canMarkDone: false,
  },
  book: {
    emoji: "📅",
    description: "Therapy session",
    ctaLabel: (done) => (done ? "View Booking" : "Book a Session"),
    canNavigate: true,
    canMarkDone: false,
  },
  gift: {
    emoji: "💙",
    description: "Daily check-in",
    ctaLabel: (done) => (done ? "View Response" : "Check In Now"),
    canNavigate: true,
    canMarkDone: false,
  },
  trophy: {
    emoji: "🏆",
    description: "Achievement",
    ctaLabel: () => "View Achievement",
    canNavigate: true,
    canMarkDone: false,
  },
  read: {
    emoji: "📖",
    description: "Reading material",
    ctaLabel: (done) => (done ? "Read Again" : "Mark as Read"),
    canNavigate: false,
    canMarkDone: true,
  },
};

function getTypeMeta(type: string): TypeMeta {
  return (
    TYPE_META[type] ?? {
      emoji: "⭐",
      description: "Task",
      ctaLabel: (done) => (done ? "Review" : "Start"),
      canNavigate: true,
      canMarkDone: false,
    }
  );
}

function TaskIconLarge({ taskType }: { taskType: string }) {
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TaskActionSheetData {
  node: PathChainNode;
  isActive: boolean;
}

interface JourneyTaskActionSheetProps {
  data: TaskActionSheetData | null;
  open: boolean;
  onClose: () => void;
  onOpen: () => void; // navigate to task
  onMarkDone: () => void; // mark complete without navigating
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JourneyTaskActionSheet({
  data,
  open,
  onClose,
  onOpen,
  onMarkDone,
}: JourneyTaskActionSheetProps) {
  if (!data) return null;

  const { node, isActive } = data;
  const task = node.task as JourneyTask;
  const taskType = node.taskType ?? "video";
  const isCompleted = node.variant === "completed";
  const isMandatory = node.isMandatory ?? false;

  const color = getTypeColor(taskType);
  const meta = getTypeMeta(taskType);
  const title = node.taskTitle || color.label;
  const descText = rtToPlain(task.extraTaskDescription);
  const showMarkDone = meta.canMarkDone && !isCompleted && isActive;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
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
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${color.bg}22`, color: color.bg }}
                  >
                    {color.label}
                  </span>

                  {isCompleted && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      ✓ Completed
                    </span>
                  )}

                  {!isMandatory && !isCompleted && (
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Optional
                    </span>
                  )}

                  {isMandatory && !isCompleted && (
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color.bg}18`, color: color.bg }}
                    >
                      ★ Required
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                  {title}
                </h3>
              </div>
            </div>
          </div>

          {/* ── Info chips ── */}
          <div className="px-5 pt-4 pb-3 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-[11px] font-semibold px-3 py-1.5 rounded-full">
              {meta.emoji} {meta.description}
            </span>
            {task.assessments && task.assessments.length > 0 && (
              <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-[11px] font-semibold px-3 py-1.5 rounded-full">
                📊 {task.assessments.length} section{task.assessments.length !== 1 ? "s" : ""}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700">
              <Zap className="w-3 h-3" /> +10 XP
            </span>
          </div>

          {/* ── Task description — BlocksRenderer for read tasks, plain text otherwise ── */}
          {taskType === "read" && task.extraTaskDescription?.length ? (
            <div
              className="mx-5 mb-4 rounded-2xl px-4 py-4"
              style={{ backgroundColor: `${color.bg}0d`, border: `1px solid ${color.bg}22` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: color.bg }}
              >
                Reading material
              </p>
              <div className="prose prose-sm max-w-none text-foreground">
                <BlocksRenderer content={task.extraTaskDescription as unknown as BlocksContent} />
              </div>
            </div>
          ) : descText ? (
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
                {descText}
              </p>
            </div>
          ) : null}

          {/* ── Assessment info ── */}
          {task.assessments && task.assessments.length > 0 && task.assessments[0].description && (
            <div className="mx-5 mb-4 rounded-2xl bg-muted/60 px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                About this assessment
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {task.assessments[0].description}
              </p>
            </div>
          )}

          {/* ── CTAs ── */}
          <div className="px-5 pb-8 flex flex-col gap-2.5">
            {/* Primary CTA */}
            {meta.canNavigate ? (
              <button
                onClick={onOpen}
                className="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
                style={{
                  backgroundColor: color.bg,
                  color: color.fg,
                  boxShadow: `0 4px 14px ${color.bg}55`,
                }}
              >
                <span>{meta.ctaLabel(isCompleted)}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : /* 'read' type — always show button, state changes */
            isCompleted ? (
              <button
                disabled
                className="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 border-2 cursor-default"
                style={{
                  borderColor: `${color.bg}50`,
                  color: color.bg,
                  backgroundColor: `${color.bg}0a`,
                }}
              >
                <Check className="w-5 h-5" />
                <span>Already Read</span>
              </button>
            ) : (
              <button
                onClick={onMarkDone}
                className="w-full h-14 rounded-2xl font-bold text-[15px] flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
                style={{
                  backgroundColor: color.bg,
                  color: color.fg,
                  boxShadow: `0 4px 14px ${color.bg}55`,
                }}
              >
                <span>Mark as Read</span>
                <Check className="w-5 h-5" />
              </button>
            )}

            {/* Secondary — Mark as Done (video/audio only) */}
            {meta.canNavigate &&
              meta.canMarkDone &&
              (isCompleted ? (
                <button
                  disabled
                  className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-muted/50 cursor-default"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Marked as Done</span>
                </button>
              ) : isActive ? (
                <button
                  onClick={onMarkDone}
                  className="w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-between px-5 bg-muted active:scale-[0.98] transition-transform"
                >
                  <span className="text-foreground">Mark as Done</span>
                  <Check className="w-4 h-4 text-emerald-600" />
                </button>
              ) : null)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
