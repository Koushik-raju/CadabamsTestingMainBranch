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
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
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
  body?: string | null;
  /** Optional question/answer pairs. When present, modal renders a Q&A list
   *  alongside (or instead of) the markdown body. */
  qa?: { question: string; answer: string | null }[];
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
  subtitle,
  meta,
  preview,
  isLast,
}: {
  onClick: () => void;
  title: string;
  subtitle?: string | null;
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
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
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
          {day.journeys.map((item, i) => {
            // Journey day rows render like the legacy app: journey name as
            // the title, "Self-Reflection (Day N)" as a small subtitle, no
            // summary preview under the row. Tapping opens the modal with
            // the full LLM markdown summary.
            const rowTitle = item.journeyTitle ?? "Journey";
            const subtitle =
              item.kind === "day"
                ? `Self-Reflection (Day ${item.dayNumber ?? "?"})`
                : (item.taskTitle ?? item.taskType ?? "Task");
            return (
              <Row
                key={`${item.kind}-${item.enrollmentId}-${item.dayNumber ?? "?"}-${i}`}
                onClick={() =>
                  onOpenItem({
                    title: rowTitle,
                    subtitle: `${subtitle} · ${formatTime(item.completedAt)}`,
                    body: item.summaryText,
                  })
                }
                title={rowTitle}
                subtitle={subtitle}
                meta={formatTime(item.completedAt)}
                preview={null}
                isLast={i === day.journeys.length - 1}
              />
            );
          })}
        </Section>
      )}

      {day.journals.length > 0 && (
        <Section title="Journals" icon={BookOpen} accent="bg-emerald-500">
          {day.journals.map((item, i) => {
            // Build Q&A pairs from prompts when present. The legacy
            // /self-journalings shape stores `entryText` as the prompt
            // question + answer flattened — so when prompts exist we
            // ONLY render Q&A and skip entryText, otherwise the modal
            // shows the same content twice. Standalone free-text
            // journals (no prompts) fall through to entryText as the
            // markdown body.
            //
            // Many journals also store the prompt question as both the
            // entry title AND the prompt heading. Modal already renders
            // the title — drop a Q&A heading that just repeats it so
            // the user doesn't see the question twice.
            const modalTitle = item.title?.trim() || "Journal entry";
            const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
            const qa = (item.prompts ?? [])
              .filter((p) => p.heading || p.text)
              .map((p) => ({
                question: norm(p.heading) === norm(modalTitle) ? "" : (p.heading ?? ""),
                answer: p.text,
              }));
            const body = qa.length > 0 ? null : item.entryText;
            return (
              <Row
                key={item.id}
                onClick={() =>
                  onOpenItem({
                    title: modalTitle,
                    subtitle: formatTime(item.journaledAt),
                    body,
                    qa: qa.length ? qa : undefined,
                  })
                }
                title={modalTitle}
                meta={formatTime(item.journaledAt)}
                preview={null}
                isLast={i === day.journals.length - 1}
              />
            );
          })}
        </Section>
      )}

      {day.assessments.length > 0 && (
        <Section title="Assessments & mood" icon={ClipboardCheck} accent="bg-amber-500">
          {day.assessments.map((item, i) => (
            // Match legacy /growth — assessment modal renders only the LLM
            // analysis markdown. Raw Q&A pairs aren't useful here because
            // many SOCRATES-style assessments store all sub-question
            // answers under one umbrella `questionText`, producing redundant
            // "Rate your agreement…" rows. The markdown analysis already
            // captures the user-facing summary.
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
              subtitle={item.severity ? `Severity: ${item.severity}` : undefined}
              meta={formatTime(item.completedAt)}
              preview={null}
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
