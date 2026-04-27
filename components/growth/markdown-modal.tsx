/**
 * FILE: components/growth/markdown-modal.tsx
 *
 * PURPOSE:
 *   Bottom sheet that renders a single Growth feed item. Slides up from
 *   the bottom of the viewport (mobile-first pattern) instead of opening
 *   as a centered dialog. Supports two body shapes:
 *     - `body` (markdown) — used by journey-day summaries, chat summaries,
 *       assessment analysis markdown, free-text journals.
 *     - `qa` (question/answer pairs) — used by journals with prompts.
 *
 * LOGIC OVERVIEW:
 *   Controlled by parent via `open`/`onOpenChange`. When `qa` is non-empty
 *   we render a Q&A list; the `body` markdown renders below as an
 *   "Analysis" block when both are present. Empty content falls back to
 *   "No details recorded".
 *
 *   Bottom sheet sizing:
 *     - max-h-[88dvh] caps the height so a tap above the sheet can still
 *       dismiss it.
 *     - Content is in a scrollable region with generous bottom padding
 *       so the last paragraph is never flush against the sheet edge.
 *     - Rounded top corners + a small drag handle for the bottom-sheet
 *       affordance even though shadcn's Sheet doesn't have one out of
 *       the box.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title, subtitle, body, qa, open, onOpenChange
 *
 * DEPENDENCIES:
 *   react-markdown + remark-gfm, shadcn Sheet
 *
 * LAST UPDATED: 2026-04-27 — switched from centered Dialog to bottom Sheet
 *   + bottom padding for the scroll area so content has breathing room.
 */
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface QAPair {
  question: string;
  answer: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  body?: string | null;
  qa?: QAPair[];
}

export function MarkdownModal({ open, onOpenChange, title, subtitle, body, qa }: Props) {
  const qaPairs = (qa ?? []).filter((p) => p.question || p.answer);
  const hasBody = !!body && body.trim().length > 0;
  const hasContent = qaPairs.length > 0 || hasBody;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] rounded-t-2xl px-0 py-0 gap-0 flex flex-col"
      >
        {/* Drag-handle affordance — purely visual, the sheet still
            dismisses via tap-outside / Escape / X. */}
        <div className="flex items-center justify-center pt-2 pb-1 flex-shrink-0">
          <span className="block w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-5 pt-2 pb-3 flex-shrink-0">
          {/* pr-8 keeps long titles clear of the absolute-positioned X. */}
          <SheetTitle className="pr-8 text-left">{title}</SheetTitle>
          {subtitle && <SheetDescription className="text-left">{subtitle}</SheetDescription>}
        </SheetHeader>

        {/* Scrollable content. pb-10 leaves breathing room so the final
            paragraph never sits flush against the sheet edge. */}
        <div className="flex-1 overflow-y-auto px-5 pb-10">
          {!hasContent && <p className="text-muted-foreground text-sm">No details recorded.</p>}

          {qaPairs.length > 0 && (
            <ul className="flex flex-col gap-3">
              {qaPairs.map((p, i) => (
                <li key={i} className="flex flex-col gap-1 border-l-2 border-primary/40 pl-3">
                  {p.question && (
                    <p className="text-xs font-semibold text-foreground/80 leading-snug">
                      {p.question}
                    </p>
                  )}
                  {p.answer ? (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {p.answer}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No answer recorded.</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {hasBody && qaPairs.length === 0 && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body!}</ReactMarkdown>
            </div>
          )}

          {/* Q&A + analysis combined view (e.g. an assessment with both
              structured answers and an LLM analysis). Renders the analysis
              under the Q&A list. */}
          {hasBody && qaPairs.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
                Analysis
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body!}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
