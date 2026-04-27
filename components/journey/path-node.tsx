/**
 * FILE: components/journey/path-node.tsx
 *
 * PURPOSE:
 *   Renders a single node (circle tile) on the journey path chain.
 *   Exports TypeColorConfig / TYPE_COLORS / getTypeColor for sheet components.
 *
 * LOGIC OVERVIEW:
 *   PathNode receives a variant (active/completed/locked/default) and taskType.
 *   All unlocked tiles use the primary theme color via var(--primary) (theme is
 *   oklch, not HSL channels — opacity uses color-mix). Path uses only 2 colors:
 *   primary (orange) for unlocked tiles and muted gray for locked.
 *   TYPE_COLORS.bg is kept as a hex (#E7590F = brand primary) so sheet files can
 *   still append hex-alpha suffixes (e.g. `${color.bg}18`) without changes.
 *   Variants:
 *     active    — large solid primary squircle, pulse rings, speech-bubble label
 *     completed — solid primary squircle + checkmark + corner Eye badge + "Tap to view"
 *                 in label so users know it's still tappable to review
 *     default   — primary-tinted squircle with task icon (available but not yet active)
 *     locked    — muted gray squircle, corner Lock badge
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   NodeVariant        — "completed" | "active" | "locked" | "default"
 *   NodeTaskType       — "video" | "book" | "audio" | "journal" | "assessment" | "gift" | "trophy" | "read" | "summary"
 *   TypeColorConfig    — { bg: string; fg: string; label: string }
 *   TYPE_COLORS        — map of taskType → TypeColorConfig (all bg = brand primary hex)
 *   getTypeColor()     — lookup helper used by action/preview/unit sheets
 *   PathNode           — the renderable circle tile component
 *
 * DEPENDENCIES:
 *   lucide-react icons, cn (lib/utils)
 *
 * LAST UPDATED: 2026-04-27 — completed tiles now show an Eye corner badge and
 *   "Tap to view" suffix in the label so users discover that completed tasks
 *   remain tappable for review. Mirrors the locked-badge pattern.
 */
"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  Check,
  ClipboardList,
  Eye,
  FileText,
  Gift,
  Headphones,
  Lock,
  PenLine,
  Play,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

export type NodeVariant = "completed" | "active" | "locked" | "default";
export type NodeTaskType =
  | "video"
  | "book"
  | "audio"
  | "journal"
  | "assessment"
  | "gift"
  | "trophy"
  | "read"
  | "summary"
  | string;

export interface TypeColorConfig {
  bg: string;
  fg: string;
  label: string;
}

/* All types share the brand primary hex so sheet files can keep the
   `${color.bg}18` hex-alpha pattern without modification. */
const PRIMARY_HEX = "#E7590F";

export const TYPE_COLORS: Record<string, TypeColorConfig> = {
  video: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Video" },
  audio: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Audio" },
  assessment: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Assessment" },
  journal: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Journal" },
  book: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Session" },
  gift: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Mood Check" },
  trophy: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Trophy" },
  read: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Read" },
  summary: { bg: PRIMARY_HEX, fg: "#ffffff", label: "Summary" },
};

export function getTypeColor(taskType: NodeTaskType): TypeColorConfig {
  return TYPE_COLORS[taskType] ?? { bg: PRIMARY_HEX, fg: "#ffffff", label: "Task" };
}

function TaskIcon({ taskType, size = 5 }: { taskType: NodeTaskType; size?: number }) {
  const cls = `w-${size} h-${size}`;
  switch (taskType) {
    case "video":
      return <Play className={cn(cls, "fill-current")} />;
    case "book":
      return <BookOpen className={cls} />;
    case "audio":
      return <Headphones className={cls} />;
    case "journal":
      return <PenLine className={cls} />;
    case "assessment":
      return <ClipboardList className={cls} />;
    case "gift":
      return <Gift className={cls} />;
    case "trophy":
      return <Trophy className={cls} />;
    case "read":
      return <FileText className={cls} />;
    case "summary":
      return <Sparkles className={cls} />;
    default:
      return <Star className={cls} />;
  }
}

interface PathNodeProps {
  variant: NodeVariant;
  taskType?: NodeTaskType;
  taskTitle?: string;
  isMandatory?: boolean;
  isNew?: boolean;
  onClick?: () => void;
  activeRef?: React.RefObject<HTMLDivElement | null>;
}

export function PathNode({
  variant,
  taskType = "video",
  taskTitle,
  isMandatory,
  isNew,
  onClick,
  activeRef,
}: PathNodeProps) {
  const isActive = variant === "active";
  const isCompleted = variant === "completed";
  const isLocked = variant === "locked";
  // "default" = available/unlocked but not the current active node
  const isAvailable = !isActive && !isCompleted && !isLocked;

  const color = getTypeColor(taskType);
  const bubbleLabel = taskTitle?.trim() || color.label;

  return (
    <div ref={isActive ? activeRef : undefined} className="flex flex-col items-center">
      {/* Speech bubble — active only */}
      {isActive && (
        <div className="flex flex-col items-center mb-2 animate-in fade-in-0 slide-in-from-top-3 duration-400">
          <div
            className="text-[11px] font-extrabold px-4 py-1.5 rounded-full tracking-wide uppercase max-w-[140px] truncate text-center"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              boxShadow: "0 4px 12px color-mix(in oklch, var(--primary) 40%, transparent)",
            }}
          >
            {bubbleLabel}
          </div>
          <div
            className="w-0 h-0 mt-[-1px]"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "7px solid var(--primary)",
            }}
          />
        </div>
      )}

      {/* Circle */}
      <div
        data-circle="true"
        className={cn(
          "relative flex items-center justify-center",
          isActive ? "w-[88px] h-[88px]" : "w-[76px] h-[76px]",
          isNew && "animate-in zoom-in-50 duration-300",
        )}
      >
        {/* Pulse rings — active only */}
        {isActive && (
          <>
            <span
              className="absolute inset-0 rounded-[24px] animate-ping"
              style={{
                backgroundColor: "color-mix(in oklch, var(--primary) 28%, transparent)",
                animationDuration: "1.6s",
              }}
            />
            <span
              className="absolute rounded-[28px] animate-ping"
              style={{
                inset: "-9px",
                backgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)",
                animationDuration: "2.4s",
                animationDelay: "0.5s",
              }}
            />
          </>
        )}

        <button
          onClick={!isLocked ? onClick : undefined}
          disabled={isLocked}
          className={cn(
            "relative w-full h-full flex items-center justify-center transition-all duration-200 select-none",
            isActive ? "rounded-[24px]" : "rounded-[20px]",
            !isLocked && "active:scale-95",
            isLocked && "cursor-not-allowed",
          )}
          style={
            isActive
              ? {
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  border: "3px solid rgba(255,255,255,0.22)",
                  boxShadow: "0 8px 28px color-mix(in oklch, var(--primary) 50%, transparent)",
                }
              : isCompleted
                ? {
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }
                : isLocked
                  ? {
                      backgroundColor: "#e2e8f0",
                      color: "#94a3b8",
                      border: "2px solid #cbd5e1",
                    }
                  : {
                      /* available/default — solid primary at reduced opacity so the
                         hierarchy is: active (full) > available (dimmed) > locked (gray).
                         Subtle shadow reinforces the "tappable" affordance. */
                      backgroundColor: "color-mix(in oklch, var(--primary) 65%, transparent)",
                      color: "var(--primary-foreground)",
                      boxShadow: "0 4px 14px color-mix(in oklch, var(--primary) 30%, transparent)",
                      border: isMandatory ? `3px solid var(--primary)` : "none",
                    }
          }
        >
          {isCompleted ? (
            <Check className="w-8 h-8 stroke-[3]" />
          ) : (
            <TaskIcon taskType={taskType} size={isActive ? 8 : 7} />
          )}
        </button>

        {/* Lock badge */}
        {isLocked && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background bg-slate-400">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {/* View badge — signals that completed tiles are still tappable to review.
            Mirrors the lock-badge pattern (corner pip) so users read "this has a state
            you can still interact with" without adding extra UI clutter. */}
        {isCompleted && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background bg-background">
            <Eye className="w-2.5 h-2.5" style={{ color: "var(--primary)" }} />
          </div>
        )}
      </div>

      {/* Type label — completed shows "Type · View" so the tap-to-review affordance
          is obvious even without the corner badge in view */}
      <span
        className="text-[10px] font-bold mt-1.5 tracking-wide"
        style={{ color: isLocked ? "#94a3b8" : "var(--primary)" }}
      >
        {color.label}
        {isCompleted && <span className="font-semibold opacity-80"> · Tap to view</span>}
      </span>
    </div>
  );
}
