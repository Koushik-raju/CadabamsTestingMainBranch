/**
 * FILE: components/growth/markdown-modal.tsx
 *
 * PURPOSE:
 *   Dialog that renders a single Growth feed item's markdown body. Used by
 *   all four sections (journeys, journals, assessments, chat summaries).
 *
 * LOGIC OVERVIEW:
 *   Controlled by parent via `open`/`onOpenChange`. Renders `body` through
 *   react-markdown. Falls back to a friendly "No details recorded" line
 *   when body is empty — avoids an empty white box.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title, subtitle, body, open, onOpenChange
 *
 * DEPENDENCIES:
 *   react-markdown (already in package.json), shadcn Dialog
 *
 * LAST UPDATED: 2026-04-23 — initial scaffold
 */
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  body: string | null | undefined;
}

export function MarkdownModal({ open, onOpenChange, title, subtitle, body }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {body && body.trim().length > 0 ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground text-sm">No details recorded.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
