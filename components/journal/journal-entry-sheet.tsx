/**
 * FILE: components/journal/journal-entry-sheet.tsx
 *
 * PURPOSE:
 *   Bottom sheet that shows full journal entry details when an entry row is
 *   tapped. Used on both the home page and the sub-journal detail page.
 *
 * LOGIC OVERVIEW:
 *   Renders a Sheet (side="bottom") with three sections:
 *   1. Journal identity card — cover image or gradient tile + journal name + date.
 *   2. Entry body — prompt question/answer pairs or plain free-text.
 *   3. Fixed footer — "Journal" CTA button that navigates to the writer.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   JournalEntrySheetProps — full prop contract
 *   JournalEntrySheet      — controlled bottom sheet (open / onClose from parent)
 *
 * DEPENDENCIES:
 *   Sheet, SheetContent (components/ui/sheet)
 *   Button (components/ui/button)
 *   getJournalVisual (lib/journal-visual)
 *
 * LAST UPDATED: 2026-04-27 — created
 */
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getJournalVisual } from "@/lib/journal-visual";
import { cn } from "@/lib/utils";
import { BookOpen, Pencil } from "lucide-react";
import Image from "next/image";

export interface JournalEntrySheetProps {
  open: boolean;
  onClose: () => void;
  /** Display name of the sub-journal (e.g. "Evening Reset" or "Free Flow"). */
  journalName: string;
  /** Cover image URL for the journal, if available. */
  journalIcon?: string | null;
  /** Entry title (optional). */
  title?: string | null;
  /** Prompt/response pairs — shown as Q&A blocks. */
  prompts?: Array<{ heading?: string | null; text?: string | null }>;
  /** Plain free-text body when no prompts exist. */
  plainText?: string | null;
  /** Human-readable date label ("Today", "Apr 27", etc.). */
  dateLabel: string;
  /** Called when the "Journal" CTA is tapped — should navigate to the writer. */
  onJournal: () => void;
}

export function JournalEntrySheet({
  open,
  onClose,
  journalName,
  journalIcon,
  title,
  prompts,
  plainText,
  dateLabel,
  onJournal,
}: JournalEntrySheetProps) {
  const { gradient, Icon } = getJournalVisual(journalName);
  const hasPrompts = Array.isArray(prompts) && prompts.length > 0;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="p-0 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* ── Journal identity card ── */}
        <div className="relative overflow-hidden flex-shrink-0">
          {journalIcon ? (
            <div className="relative h-28 w-full">
              <Image src={journalIcon} alt={journalName} fill className="object-cover" sizes="100vw" />
              {/* gradient overlay for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className={cn("h-28 w-full bg-gradient-to-br relative overflow-hidden", gradient)}>
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-4 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-10 h-10 text-white/70" />
              </div>
            </div>
          )}

          {/* Journal name + date overlaid on the image */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 px-5 pb-4 pt-2",
            journalIcon ? "" : "bg-gradient-to-t from-black/40 to-transparent",
          )}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
              {dateLabel}
            </p>
            <SheetHeader className="p-0">
              <SheetTitle className="text-left text-base font-bold text-white leading-snug">
                {journalName}
              </SheetTitle>
            </SheetHeader>
          </div>
        </div>

        {/* ── Entry body ── */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-32">
          {title && (
            <h3 className="text-base font-semibold text-foreground mb-3 leading-snug">{title}</h3>
          )}

          {hasPrompts ? (
            <div className="flex flex-col gap-5">
              {prompts!.map((prompt, idx) => (
                <div key={idx}>
                  {idx > 0 && <Separator className="mb-5" />}
                  {prompt.heading && (
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-primary leading-snug">
                        {prompt.heading}
                      </p>
                    </div>
                  )}
                  {prompt.text && (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {prompt.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            plainText && (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {plainText}
              </p>
            )
          )}

          {!hasPrompts && !plainText && !title && (
            <p className="text-sm text-muted-foreground text-center py-8">No content in this entry.</p>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-3 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <Button
            className="w-full rounded-full h-14 text-base font-semibold gap-2"
            onClick={() => { onClose(); onJournal(); }}
          >
            <Pencil className="w-4 h-4" />
            Journal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
