/**
 * FILE: components/growth/markdown-modal.tsx
 *
 * PURPOSE:
 *   Dialog that renders a single Growth feed item. Supports two body
 *   shapes:
 *     - `body` (markdown) — used by journey-day summaries, chat summaries,
 *       assessment analysis markdown, free-text journals.
 *     - `qa` (question/answer pairs) — used by journals with prompts and
 *       by assessments with structured answers.
 *
 * LOGIC OVERVIEW:
 *   Controlled by parent via `open`/`onOpenChange`. When `qa` is non-empty
 *   we render a clean Q&A list (each question bold, each answer below) and
 *   suppress the markdown body. When both are absent shows a friendly
 *   "No details recorded" line.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title, subtitle, body, qa, open, onOpenChange
 *
 * DEPENDENCIES:
 *   react-markdown + remark-gfm, shadcn Dialog
 *
 * LAST UPDATED: 2026-04-27 — added qa pair rendering for journals + assessments
 */
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        {!hasContent && (
          <p className="text-muted-foreground text-sm">No details recorded.</p>
        )}

        {qaPairs.length > 0 && (
          <ul className="flex flex-col gap-3 mt-1">
            {qaPairs.map((p, i) => (
              <li
                key={i}
                className="flex flex-col gap-1 border-l-2 border-primary/40 pl-3"
              >
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

        {/* Markdown analysis sometimes accompanies a Q&A list (e.g. an
            assessment with both structured answers AND an LLM analysis).
            Render it as a separate "Analysis" block below the Q&A. */}
        {hasBody && qaPairs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
              Analysis
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body!}</ReactMarkdown>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
