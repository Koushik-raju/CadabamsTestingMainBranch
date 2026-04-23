/**
 * FILE: components/growth/day-feed.tsx
 *
 * PURPOSE:
 *   Renders the per-day Growth feed — four sections (journey activity,
 *   journals, assessments, chat summaries) stacked vertically. Empty
 *   sections are hidden. Each item tap opens the shared markdown modal.
 *
 * LOGIC OVERVIEW:
 *   Receives the GrowthDay payload + loading flag. While loading shows a
 *   handful of skeleton rows. When `day` exists and every section is empty
 *   renders a soft empty state. Items dispatch a typed onOpen call back
 *   so the parent can assemble the modal props (title + body) once.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   day         — GrowthDay payload
 *   isLoading   — drives skeletons
 *   onOpenItem  — called with { title, subtitle, body } on row tap
 *
 * DEPENDENCIES:
 *   lucide-react icons, shadcn Card / Skeleton / Separator
 *
 * LAST UPDATED: 2026-04-23 — initial scaffold
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { GrowthDay } from "@/hooks/growth/use-growth";
import { cn } from "@/lib/utils";
import { BookOpen, ClipboardCheck, MessageSquareText, Route } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";

/**
 * Preview markdown components — collapse every block-level element (paragraph,
 * heading, list, blockquote, hr, code block) down to inline so the 2-line
 * `line-clamp` clips cleanly. Inline formatting (bold / italic / link / inline
 * code) still renders because we leave those tags to React-Markdown defaults.
 * Also strips the button-inside-button HTML warning from interactive children.
 */
const PREVIEW_COMPONENTS: Components = {
  p: ({ children }) => <>{children} </>,
  h1: ({ children }) => <strong>{children} </strong>,
  h2: ({ children }) => <strong>{children} </strong>,
  h3: ({ children }) => <strong>{children} </strong>,
  h4: ({ children }) => <strong>{children} </strong>,
  h5: ({ children }) => <strong>{children} </strong>,
  h6: ({ children }) => <strong>{children} </strong>,
  ul: ({ children }) => <>{children}</>,
  ol: ({ children }) => <>{children}</>,
  li: ({ children }) => <>{children} · </>,
  blockquote: ({ children }) => <>{children} </>,
  hr: () => <> — </>,
  pre: ({ children }) => <>{children} </>,
  code: ({ children }) => <code className="text-[10px]">{children}</code>,
  a: ({ children }) => <span className="underline">{children}</span>,
  br: () => <> </>,
};

export interface ModalPayload {
  title: string;
  subtitle?: string;
  body: string | null;
}

interface Props {
  day: GrowthDay | undefined;
  isLoading: boolean;
  onOpenItem: (payload: ModalPayload) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function Section({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", accent)}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      <Card>
        <CardContent className="py-0 px-3">{children}</CardContent>
      </Card>
    </div>
  );
}

function Row({
  onClick,
  title,
  meta,
  preview,
  isLast,
}: {
  onClick: () => void;
  title: string;
  meta: string;
  preview: string | null;
  isLast: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left py-3 transition-colors hover:bg-muted/50 active:bg-muted -mx-3 px-3"
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{meta}</span>
        </div>
        {preview && (
          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5 [&_strong]:font-semibold [&_em]:italic">
            <ReactMarkdown components={PREVIEW_COMPONENTS}>{preview}</ReactMarkdown>
          </div>
        )}
      </button>
      {!isLast && <Separator />}
    </>
  );
}

export function DayFeed({ day, isLoading, onOpenItem }: Props) {
  if (isLoading || !day) {
    return (
      <div className="px-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const totalItems =
    day.journeys.length + day.journals.length + day.assessments.length + day.chatSummaries.length;

  if (totalItems === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Nothing recorded for this day yet.</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {day.journeys.length > 0 && (
        <Section title="Journey activity" icon={Route} accent="bg-violet-500">
          {day.journeys.map((item, i) => (
            <Row
              key={`${item.enrollmentId}-${item.dayNumber}`}
              onClick={() =>
                onOpenItem({
                  title: item.journeyTitle ?? "Journey",
                  subtitle: `Day ${item.dayNumber} · ${formatTime(item.completedAt)}`,
                  body: item.summaryText,
                })
              }
              title={`Day ${item.dayNumber} · ${item.journeyTitle ?? "Journey"}`}
              meta={formatTime(item.completedAt)}
              preview={item.summaryText}
              isLast={i === day.journeys.length - 1}
            />
          ))}
        </Section>
      )}

      {day.journals.length > 0 && (
        <Section title="Journals" icon={BookOpen} accent="bg-emerald-500">
          {day.journals.map((item, i) => (
            <Row
              key={item.id}
              onClick={() =>
                onOpenItem({
                  title: item.title?.trim() || "Journal entry",
                  subtitle: formatTime(item.journaledAt),
                  body: item.entryText,
                })
              }
              title={item.title?.trim() || "Journal entry"}
              meta={formatTime(item.journaledAt)}
              preview={item.entryText}
              isLast={i === day.journals.length - 1}
            />
          ))}
        </Section>
      )}

      {day.assessments.length > 0 && (
        <Section title="Assessments & mood" icon={ClipboardCheck} accent="bg-amber-500">
          {day.assessments.map((item, i) => (
            <Row
              key={item.id}
              onClick={() =>
                onOpenItem({
                  title: item.assessmentTitle ?? item.assessmentKey,
                  subtitle: [
                    item.severity ? `Severity: ${item.severity}` : null,
                    formatTime(item.completedAt),
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  body: item.analysisMarkdown,
                })
              }
              title={item.assessmentTitle ?? item.assessmentKey}
              meta={formatTime(item.completedAt)}
              preview={item.severity ? `Severity: ${item.severity}` : null}
              isLast={i === day.assessments.length - 1}
            />
          ))}
        </Section>
      )}

      {day.chatSummaries.length > 0 && (
        <Section title="Chat summary" icon={MessageSquareText} accent="bg-sky-500">
          {day.chatSummaries.map((item, i) => (
            <Row
              key={item.id}
              onClick={() =>
                onOpenItem({
                  title: "Chat summary",
                  subtitle: formatTime(item.createdAt),
                  body: item.text,
                })
              }
              title="Chat summary"
              meta={formatTime(item.createdAt)}
              preview={item.text}
              isLast={i === day.chatSummaries.length - 1}
            />
          ))}
        </Section>
      )}
    </div>
  );
}
