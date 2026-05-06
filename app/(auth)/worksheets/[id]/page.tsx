/**
 * FILE: app/(auth)/assessments/[id]/page.tsx
 *
 * PURPOSE:
 *   Assessment form page — renders a multi-step question wizard for a single
 *   assessment, collects answers, and submits them via the SDK.
 *
 * LOGIC OVERVIEW:
 *   - Fetches assessment detail via useWorksheetById(id).
 *   - Maps SDK AssessmentQuestionResponseDto questions into the local Question
 *     shape expected by QuestionRenderer; keyValue is narrowed with a runtime
 *     type guard instead of a blind cast.
 *   - Tracks per-step answers in a Record<string, AnswerValue> state map.
 *   - The generate wizard step renders a custom "Assessment Complete" screen
 *     (checkmark, heading, AI disclaimer card, Generate Report button) instead
 *     of delegating to QuestionRenderer. The header on that step shows an X
 *     close button and a full 100% progress bar to match the reference design.
 *   - On final step (or Generate Report tap from the generate step), handleSubmit
 *     routes to /assessments/[id]/generate/[completionId]; the completion is only
 *     POSTed once thanks to submittedSubmissionIdRef.
 *   - JOURNEY CONTEXT: when the assessment was opened from a journey task
 *     (continuation.active), handleSubmit skips the generate + result pages
 *     entirely — it calls continuation.markCompleted() with the completionId
 *     as proof and navigates straight back to the journey details page. The
 *     JourneyReturnFab then surfaces on the journey page.
 *   - A "Past Reports" link in the header links to /assessments/[id]/reports
 *     so users can view prior reports without leaving the wizard.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   worksheetId               — route param, identifies the assessment to fetch
 *   questions                  — memoized array of Question objects derived from SDK data
 *   answers                    — Record<stepKey, AnswerValue> collected across steps
 *   currentStep                — index into questions array
 *   isStepComplete             — whether the current step's answer satisfies the validator
 *   submittedSubmissionIdRef   — set once the CompletionResponseDto is created, used to
 *                                skip a duplicate POST from handleSubmit
 *   persistSubmission          — memoized-once submit helper returning the completion id
 *   continuation               — useJourneyTaskContinuation('ASSESSMENT') — non-null active
 *                                when opened from a journey; drives the fast-return flow
 *
 * DEPENDENCIES:
 *   useWorksheetById             — SWR hook wrapping cmsAssessmentsControllerFindOne
 *   submitWorksheet              — SDK call to patientAssessmentsControllerCreateCompletion
 *   QuestionRenderer              — renders question UI by type
 *   useJourneyTaskContinuation    — hooks/journeys/use-journey-task-continuation
 *
 * LAST UPDATED: 2026-04-24 — skip generate/result pages when opened from a journey; redirect to journey details with FAB
 */

"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { mutate } from "swr";
import { BackButton } from "@/components/shared/navigation/back-button";
import { isWorksheetTemplateUrl } from "@/components/shared/questions/answer-selectors/worksheet-submission-step";
import {
  type AnswerValue,
  type Question,
  QuestionRenderer,
} from "@/components/shared/questions/question-renderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJourneyTaskContinuation } from "@/hooks/journeys/use-journey-task-continuation";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { submitWorksheet, useWorksheetById, type WorksheetItem } from "@/hooks/use-worksheets";
import { assignedWorksheetsKey } from "@/lib/swr-keys";

type WorksheetQuestion = WorksheetItem["Questions"][number];

export default function WorksheetFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: worksheetId } = use(params);
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const answersInitialized = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Completion id once persisted — tracked to avoid a second submit when the
  // generate step has already created the CompletionResponseDto.
  const submittedSubmissionIdRef = useRef<string | null>(null);

  const continuation = useJourneyTaskContinuation("WORKSHEET");
  const { user } = useAuth();

  const { data: worksheetData, isLoading, error: fetchError } = useWorksheetById(worksheetId);

  const worksheet = worksheetData;

  const questions = useMemo(() => {
    return (worksheet?.Questions || []).map((q: WorksheetQuestion) => ({
      id: q.id,
      question: q.title,
      title: q.title,
      label: q.label ?? undefined,
      type: q.type,
      description: q.subtitle ?? undefined,
      options: q.options?.map((o: WorksheetQuestion["options"][number]) => ({
        id: o.id,
        option: o.label,
        label: o.label,
        value: o.value,
      })),
      subtitle: q.subtitle ?? undefined,
      smileys: q.smileys,
      text: q.text ?? undefined,
      count: q.count ?? undefined,
      keyValue:
        typeof q.keyValue === "string"
          ? q.keyValue
          : q.keyValue !== null && typeof q.keyValue === "object"
            ? (q.keyValue as Record<string, string>)
            : undefined,
      prompt: q.prompt ?? undefined,
      answer: q.answer ?? undefined,
      questions: q.questions ?? undefined,
      answers: q.answers ?? undefined,
    }));
  }, [worksheet?.Questions]);

  useEffect(() => {
    if (!questions.length || answersInitialized.current) return;
    answersInitialized.current = true;
    const initial: Record<string, AnswerValue> = {};
    questions.forEach((q: Question, index: number) => {
      const key = `q_${q.id}_step_${index}`;
      const raw = q.type || "";
      // Normalize the type the same way as QuestionRenderer
      const isSmiley = raw === "smiley" || raw.includes("smiley") || !!q.smileys?.length;
      const isMood =
        raw === "mood_selector" || raw.includes("mood-selector") || raw.includes("mood_selector");
      const isLevel =
        raw === "level_selector" ||
        raw.includes("level-selector") ||
        raw.includes("level_selector");
      const isBubble =
        raw === "bubble_selector" ||
        raw.includes("bubble-selector") ||
        raw.includes("bubble_selector");
      const isDot =
        raw === "dot_chooser" || raw.includes("dot-chooser") || raw.includes("dot_chooser");
      const isIndicator = raw === "indicator" || raw.includes("indicator");
      const isViewText =
        raw === "view_text" || raw.includes("view-text") || raw.includes("view_text");
      const isWorksheetSubmission =
        raw.includes("worksheet-submission") || raw.includes("worksheetsubmission");
      const isAgreement = raw === "agreement" || raw.includes("agreement");
      const isGenerate = raw === "generate" || raw.includes("generate");
      const isQa = raw === "qa" || raw.includes(".qa");
      const isQaWithSubs = isQa && Array.isArray(q.questions) && q.questions.length > 0;
      const isYesNo = raw === "yes_no" || raw.includes("yes") || raw.includes("no");
      const isText = raw === "text" || raw.includes("text") || raw.includes("speech");

      if (isSmiley || isMood) {
        initial[key] = { selected: 2 };
      } else if (isLevel) {
        initial[key] = { level: 0 };
      } else if (isBubble || isDot) {
        initial[key] = { selected: [] as string[] };
      } else if (isIndicator) {
        initial[key] = { value: 50 };
      } else if (isViewText || isAgreement || isGenerate || isWorksheetSubmission) {
        initial[key] = {};
      } else if (isQaWithSubs) {
        initial[key] = { subAnswers: {} };
      } else if (isQa || isText) {
        initial[key] = { text: "" };
      } else if (isYesNo) {
        initial[key] = { selected: "" };
      } else {
        initial[key] = { selected: "" };
      }
    });
    setAnswers(initial);
  }, [questions]);

  useEffect(() => {
    if (!questions.length) return;
    const q = questions[currentStep];
    const key = `q_${q.id}_step_${currentStep}`;
    const ans = answers[key];
    const raw = q.type || "";

    const isWorksheetSubmission =
      raw.includes("worksheet-submission") || raw.includes("worksheetsubmission");
    if (isWorksheetSubmission) {
      if (isWorksheetTemplateUrl(q.text)) {
        const u = (ans as { fileUrl?: string })?.fileUrl;
        setIsStepComplete(!!u?.trim());
      } else {
        setIsStepComplete(true);
      }
      return;
    }

    // Always-complete types: informational screens or selectors with meaningful defaults
    // (smiley/mood default to index 2, level defaults to 0, indicator defaults to 50).
    // rating and qa are excluded — no pre-selected default, user must explicitly answer.
    const alwaysComplete = [
      "smiley",
      "mood_selector",
      "level_selector",
      "indicator",
      "view_text",
      "agreement",
      "generate",
    ];
    const isAlwaysComplete =
      alwaysComplete.includes(raw) ||
      raw.includes("smiley") ||
      raw.includes("mood-selector") ||
      raw.includes("level-selector") ||
      raw.includes("indicator") ||
      raw.includes("view-text") ||
      raw.includes("agreement") ||
      raw.includes("generate") ||
      (q.smileys && q.smileys.length > 0);

    if (isAlwaysComplete) {
      setIsStepComplete(true);
    } else if (raw === "rating") {
      // rating has no default — requires an explicit tap; stored as number once selected
      const sel = (ans as { selected?: unknown })?.selected;
      setIsStepComplete(typeof sel === "number");
    } else if (raw === "text" || raw.includes("text") || raw.includes("speech")) {
      setIsStepComplete(((ans as { text?: string })?.text || "").trim().length > 0);
    } else if (raw === "qa" || raw.includes("qa")) {
      // qa with sub-questions: every sub-question must be answered
      if (Array.isArray(q.questions) && q.questions.length > 0) {
        const subAnswers = (ans as { subAnswers?: Record<string, string> })?.subAnswers || {};
        setIsStepComplete(
          q.questions.every((_: { question: string }, idx: number) => !!subAnswers[`qa_${idx}`]),
        );
      } else {
        setIsStepComplete(((ans as { text?: string })?.text || "").trim().length > 0);
      }
    } else if (
      raw === "bubble_selector" ||
      raw.includes("bubble-selector") ||
      raw.includes("bubble_selector") ||
      raw === "dot_chooser" ||
      raw.includes("dot-chooser") ||
      raw.includes("dot_chooser")
    ) {
      const arr = (ans as { selected?: string[] })?.selected;
      setIsStepComplete(Array.isArray(arr) && arr.length > 0);
    } else {
      // mcq, yes_no, and other string-selected types
      setIsStepComplete(!!(ans as { selected?: string })?.selected);
    }
  }, [currentStep, answers, questions]);

  const currentKey = questions[currentStep]
    ? `q_${questions[currentStep].id}_step_${currentStep}`
    : "";

  const handleAnswer = (value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [currentKey]: value }));
  };

  const handleComplete = (complete: boolean) => {
    setIsStepComplete(complete);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const persistSubmission = async (): Promise<string> => {
    if (submittedSubmissionIdRef.current) return submittedSubmissionIdRef.current;
    const submissionDocumentId = worksheet?.documentId?.trim() || worksheetId;
    const formattedAnswers: Record<string, unknown> = {};
    questions.forEach((q: Question, index: number) => {
      const key = `q_${q.id}_step_${index}`;
      formattedAnswers[key] = {
        ...answers[key],
        questionText: q.title || q.label || "Unknown Question",
        stepOrder: index,
      };
    });
    const id = await submitWorksheet(submissionDocumentId, formattedAnswers);
    submittedSubmissionIdRef.current = id;
    const lead = user?.lead_id != null ? String(user.lead_id) : null;
    if (lead) void mutate(assignedWorksheetsKey(lead));
    return id;
  };

  const handleSubmit = async () => {
    if (continuation.active) {
      setSubmitting(true);
      try {
        const submissionId = await persistSubmission();
        await continuation.markCompleted(
          { kind: "WORKSHEET", worksheetSubmissionId: submissionId },
          { proofPreview: "Worksheet complete" },
        );
        router.push(`/journeys/${continuation.journeyId}/details`);
      } catch (err) {
        console.error("Error submitting worksheet from journey:", err);
        setError("Failed to submit worksheet. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (submittedSubmissionIdRef.current) {
      router.push(`/worksheets/${worksheetId}/result/${submittedSubmissionIdRef.current}`);
      return;
    }
    setSubmitting(true);
    try {
      const submissionId = await persistSubmission();
      router.push(`/worksheets/${worksheetId}/result/${submissionId}`);
    } catch (err) {
      console.error("Error submitting worksheet:", err);
      setError("Failed to submit worksheet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="px-4 pt-3">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <Skeleton className="h-8 w-3/4 max-w-sm" />
          <div className="flex flex-col gap-3 w-full max-w-md mt-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center font-medium">
          {error || "Failed to load worksheet."}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">No questions found for this worksheet.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const progress = Math.round(((currentStep + 1) / questions.length) * 100);
  const currentQuestion = questions[currentStep] as Question;
  const isLastStep = currentStep === questions.length - 1;
  const currentType = currentQuestion?.type || "";
  const isGenerateStep = currentType === "generate" || currentType.includes("generate");

  /* Generate step renders a full custom "Assessment Complete" screen instead
     of the standard question renderer, matching the reference design layout. */
  if (isGenerateStep) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header: X close + full progress bar */}
        <div className="flex items-center gap-3 px-3 py-3 bg-card">
          <button
            onClick={() => router.push(`/worksheets/${worksheetId}/details`)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6">
          {/* Checkmark circle */}
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" strokeWidth={2} />
            </div>
          </div>

          {/* Heading + subtext */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              Worksheet
              <br />
              Complete
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xs mx-auto">
              You&apos;ve finished all steps. Continue to save your responses and view optional AI
              insights.
            </p>
          </div>

          {/* AI disclaimer card */}
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-4 flex gap-3 items-start">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">AI-Generated Report</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This report is generated using artificial intelligence based on your responses. It
                is for informational purposes only and does not replace professional medical advice.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Report button — sticky bottom */}
        <div className="sticky bottom-0 px-5 pt-3 pb-10 bg-card border-t border-border">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-2xl text-sm tracking-widest uppercase disabled:opacity-40 flex items-center justify-center gap-2"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              "Generating..."
            ) : (
              <>
                Save & continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
        {currentStep === 0 ? (
          <BackButton fallback={`/worksheets/${worksheetId}/details`} />
        ) : (
          <button
            onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {questions.length}
          </p>
        </div>
        <Link
          href={`/worksheets`}
          aria-label="Back to worksheets"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded-full transition-colors"
        >
          <FileText className="w-3 h-3" />
          My worksheets
        </Link>
      </div>

      {/* Orange progress bar */}
      <div className="w-full bg-muted h-1.5">
        <div
          className="h-1.5 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto">
        <QuestionRenderer
          question={currentQuestion}
          answer={answers[currentKey] ?? {}}
          onChange={handleAnswer}
          onComplete={handleComplete}
          onFinish={undefined}
        />
      </div>

      {/* Continue button — sticky to bottom */}
      <div className="sticky bottom-0 px-5 pt-3 pb-10 border-t border-border bg-card">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base disabled:opacity-40"
          disabled={!isStepComplete || submitting}
          onClick={handleNext}
        >
          {submitting ? "Submitting..." : isLastStep ? "Submit worksheet" : "Continue →"}
        </Button>
      </div>
    </div>
  );
}
