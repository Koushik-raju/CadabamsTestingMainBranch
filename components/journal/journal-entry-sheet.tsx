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
 * LAST UPDATED: 2026-04-28 — Neo icon style: compact gradient tile row header (homepage pattern), removed full-width banner
 */
import { GlyphTile } from "@/components/shared/glyph-tile";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getJournalVisual } from "@/lib/journal-visual";
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
  const { tint, Icon } = getJournalVisual(journalName);
  const hasPrompts = Array.isArray(prompts) && prompts.length > 0;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* ── Journal identity row — compact tile + name + date (homepage pattern) ── */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3 flex-shrink-0">
          {journalIcon ? (
            <Image
              src={journalIcon}
              alt={journalName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 shadow-[var(--sh-1)]"
            />
          ) : (
            <GlyphTile icon={Icon} tint={tint} size="lg" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
              {dateLabel}
            </p>
            <SheetHeader className="p-0">
              <SheetTitle className="text-left text-base font-bold text-foreground leading-snug truncate">
                {journalName}
              </SheetTitle>
            </SheetHeader>
          </div>
        </div>
        <Separator />

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
            <p className="text-sm text-muted-foreground text-center py-8">
              No content in this entry.
            </p>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-3 bg-background/95 backdrop-blur-sm border-t border-border/50">
          <Button
            className="w-full rounded-full h-14 text-base font-semibold gap-2"
            onClick={() => {
              onClose();
              onJournal();
            }}
          >
            <Pencil className="w-4 h-4" />
            Journal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
