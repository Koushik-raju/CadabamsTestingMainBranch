"use client";

import { AlertCircle, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import Markdown from "react-markdown";
import { AIDisclaimer, AIPill } from "@/components/shared/ai-pill";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  analyzeWorksheet,
  useWorksheetById,
  useWorksheetSubmissionById,
  type WorksheetItem,
} from "@/hooks/use-worksheets";
import type { WorksheetAnswerRow } from "@/lib/patient-worksheets-api";

/** Keys look like `q_<questionCuid>_step_<index>`. */
function labelForQuestionKey(questionKey: string, worksheet: WorksheetItem | null | undefined): string {
  const m = questionKey.match(/^q_(.+)_step_(\d+)$/);
  if (!m) return "Your response";
  const [, qid, stepStr] = m;
  const step = Number(stepStr);
  const q = worksheet?.Questions?.find((x) => x.id === qid);
  const title = q?.title?.trim();
  if (title) return title;
  if (typeof step === "number" && !Number.isNaN(step)) return `Question ${step + 1}`;
  return "Your response";
}

function AnswerDisplay({ row }: { row: WorksheetAnswerRow }) {
  const isUpload = !!(row.fileUrl?.trim() || row.fileName?.trim());

  if (isUpload) {
    return (
      <div className="space-y-2">
        <p className="text-foreground">
          <span className="text-muted-foreground">Uploaded file: </span>
          {row.fileName?.trim() || "Worksheet file"}
        </p>
        {row.fileType ? <p className="text-xs text-muted-foreground">{row.fileType}</p> : null}
        {row.aiSummary?.trim() ? (
          <div className="pt-2 mt-1 border-t border-border">
            <p className="text-xs font-semibold text-primary mb-1.5">Reflection</p>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
              <Markdown>{row.aiSummary}</Markdown>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const raw = row.extractedContent?.trim();
  if (!raw) return <p className="text-muted-foreground">—</p>;

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return (
        <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono text-foreground/90">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      /* fall through */
    }
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
      <Markdown>{raw}</Markdown>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function WorksheetSubmissionResultPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id: worksheetId, submissionId } = use(params);
  const { data: worksheet, isLoading: wsLoading } = useWorksheetById(worksheetId);
  const { data: submission, isLoading: subLoading, error, mutate } =
    useWorksheetSubmissionById(submissionId);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeErr, setAnalyzeErr] = useState<string | null>(null);

  const loading = wsLoading || subLoading;

  const onAnalyze = async () => {
    setAnalyzeErr(null);
    setAnalyzing(true);
    try {
      await analyzeWorksheet(submissionId);
      await mutate();
    } catch (e) {
      setAnalyzeErr(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title="Worksheet" fallback="/worksheets" />
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pb-24">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center text-sm">
          {error ? String(error) : "Could not load this submission."}
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/worksheets">Back to worksheets</Link>
        </Button>
      </div>
    );
  }

  const summary = submission.aiSummary?.trim();
  const answersSorted = [...(submission.answers ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title={worksheet?.title ?? "Worksheet"}
        fallback="/worksheets"
        right={
          <Link
            href={`/worksheets/${worksheetId}/details`}
            className="text-xs font-semibold text-primary flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            About
          </Link>
        }
      />

      <div className="px-4 pt-2 space-y-4">
        <p className="text-xs text-muted-foreground">Submitted {formatDate(submission.submittedAt)}</p>

        {summary ? (
          <Card className="border-border shadow-[var(--sh-2)]">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <AIPill />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={analyzing}
                  onClick={() => void onAnalyze()}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Refresh insights
                    </>
                  )}
                </Button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                <Markdown>{summary}</Markdown>
              </div>
              <AIDisclaimer />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-border bg-muted/30">
            <CardContent className="py-8 flex flex-col items-center text-center gap-3">
              <Sparkles className="w-10 h-10 text-primary" />
              <p className="text-sm font-medium text-foreground">Optional AI summary</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Generate a short reflection based on your answers. You can skip this anytime.
              </p>
              {analyzeErr && <p className="text-xs text-destructive">{analyzeErr}</p>}
              <Button type="button" disabled={analyzing} onClick={() => void onAnalyze()}>
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate insights
                  </>
                )}
              </Button>
              <AIDisclaimer />
            </CardContent>
          </Card>
        )}

        {answersSorted.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Your answers</h2>
              <ul className="space-y-4">
                {answersSorted.map((a: WorksheetAnswerRow) => (
                  <li key={a.id} className="text-sm border-b border-border last:border-0 pb-4 last:pb-0">
                    <p className="text-sm font-medium text-foreground mb-2 leading-snug">
                      {labelForQuestionKey(a.questionKey, worksheet ?? undefined)}
                    </p>
                    <AnswerDisplay row={a} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Button asChild variant="secondary" className="w-full">
          <Link href="/worksheets">Browse more worksheets</Link>
        </Button>
      </div>
    </div>
  );
}
