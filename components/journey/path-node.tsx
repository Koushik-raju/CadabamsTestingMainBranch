"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  Check,
  ClipboardList,
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

export const TYPE_COLORS: Record<string, TypeColorConfig> = {
  video: { bg: "#FF2D2D", fg: "#ffffff", label: "Video" }, // vivid red
  audio: { bg: "#006EFF", fg: "#ffffff", label: "Audio" }, // electric blue
  assessment: { bg: "#00897B", fg: "#ffffff", label: "Assessment" }, // teal
  journal: { bg: "#00C853", fg: "#ffffff", label: "Journal" }, // vivid green
  book: { bg: "#00BCD4", fg: "#ffffff", label: "Session" }, // vivid cyan
  gift: { bg: "#FF6D00", fg: "#ffffff", label: "Mood Check" }, // deep orange
  trophy: { bg: "#FFD600", fg: "#1a1a1a", label: "Trophy" }, // vivid yellow (dark text)
  read: { bg: "#E91E8C", fg: "#ffffff", label: "Read" }, // hot pink/magenta
  summary: { bg: "#8B5CF6", fg: "#ffffff", label: "Summary" }, // violet
};

export function getTypeColor(taskType: NodeTaskType): TypeColorConfig {
  return TYPE_COLORS[taskType] ?? { bg: "#6b7280", fg: "#ffffff", label: "Task" };
}

function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#")) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
              backgroundColor: color.bg,
              color: color.fg,
              boxShadow: `0 4px 12px ${withAlpha(color.bg, 0.45)}`,
            }}
          >
            {bubbleLabel}
          </div>
          <div
            className="w-0 h-0 mt-[-1px]"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `7px solid ${color.bg}`,
            }}
          />
        </div>
      )}

      {/* Circle */}
      <div
        data-circle="true"
        className={cn(
          "relative flex items-center justify-center",
          isActive ? "w-[72px] h-[72px]" : "w-[58px] h-[58px]",
          isNew && "animate-in zoom-in-50 duration-300",
        )}
      >
        {/* Pulse rings — active */}
        {isActive && (
          <>
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: withAlpha(color.bg, 0.28), animationDuration: "1.6s" }}
            />
            <span
              className="absolute rounded-full animate-ping"
              style={{
                inset: "-9px",
                backgroundColor: withAlpha(color.bg, 0.12),
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
            "relative w-full h-full rounded-full flex items-center justify-center transition-all duration-200 select-none",
            !isLocked && "active:scale-95",
            isLocked && "cursor-not-allowed",
          )}
          style={
            isActive
              ? {
                  backgroundColor: color.bg,
                  color: color.fg,
                  border: `3px solid rgba(255,255,255,0.22)`,
                  boxShadow: `0 8px 28px ${withAlpha(color.bg, 0.5)}`,
                }
              : isCompleted
                ? {
                    // Full solid colour, slightly dimmed — done
                    backgroundColor: withAlpha(color.bg, 0.72),
                    color: color.fg,
                    outline: `3px solid ${withAlpha(color.bg, 0.3)}`,
                    outlineOffset: "3px",
                  }
                : isLocked
                  ? {
                      // Uniform slate — locked means "not yours yet", type doesn't matter
                      backgroundColor: "#e2e8f0",
                      color: "#94a3b8",
                      border: "2px solid #cbd5e1",
                    }
                  : {
                      // Default / accessible — high-opacity solid fill so colour reads clearly
                      backgroundColor: withAlpha(color.bg, 0.82),
                      color: color.fg,
                      border: isMandatory
                        ? `3px solid ${color.bg}`
                        : `2px solid ${withAlpha(color.bg, 0.6)}`,
                    }
          }
        >
          {isCompleted ? (
            <Check className="w-6 h-6 stroke-[3]" />
          ) : (
            <TaskIcon taskType={taskType} size={isActive ? 6 : 5} />
          )}
        </button>

        {/* Lock badge */}
        {isLocked && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background bg-slate-400">
            <Lock className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Type label */}
      <span
        className="text-[10px] font-bold mt-1.5 tracking-wide"
        style={{ color: isLocked ? "#94a3b8" : color.bg, opacity: isCompleted ? 0.75 : 1 }}
      >
        {color.label}
      </span>
    </div>
  );
}
