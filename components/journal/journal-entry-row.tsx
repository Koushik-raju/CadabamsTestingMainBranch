/**
 * FILE: components/journal/journal-entry-row.tsx
 *
 * PURPOSE:
 *   Shared stateless entry row used by both the home page (/self-journaling)
 *   and the sub-journal detail page (/self-journaling/journal/[slug]).
 *
 * LOGIC OVERVIEW:
 *   Accepts normalized props (title, preview, time, promptCount) and renders
 *   the violet gradient icon tile + title + preview + time/prompt badge.
 *   Callers adapt their data shape to these props; the visual stays consistent.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalEntryRowProps — { title?, preview?, time, promptCount? }
 *   JournalEntryRow      — stateless display component
 *
 * DEPENDENCIES:
 *   lucide-react, cn (lib/utils)
 *
 * LAST UPDATED: 2026-04-27 — created; extracted from duplicate EntryRow impls in home + slug pages
 */
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export interface JournalEntryRowProps {
  title?: string | null;
  preview?: string | null;
  time: string;
  promptCount?: number;
}

export function JournalEntryRow({ title, preview, time, promptCount = 0 }: JournalEntryRowProps) {
  return (
    <div className="py-3 flex items-start gap-3 transition-colors hover:bg-muted/50 active:bg-muted cursor-pointer">
      <div
        className={cn(
          "relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600",
          "flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm",
        )}
      >
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
        <BookOpen className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">{title}</p>
        )}
        {preview && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{preview}</p>
        )}
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className="text-xs text-muted-foreground">{time}</span>
        {promptCount > 0 && (
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
            {promptCount}p
          </span>
        )}
      </div>
    </div>
  );
}
