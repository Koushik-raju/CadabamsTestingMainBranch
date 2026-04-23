/**
 * FILE: app/(auth)/assessments/[id]/page.tsx
 *
 * PURPOSE:
 *   Assessment form page — renders a multi-step question wizard for a single
 *   assessment, collects answers, and submits them via the SDK.
 *
 * LOGIC OVERVIEW:
 *   - Fetches assessment detail via useAssessmentById(id).
 *   - Maps SDK AssessmentQuestionResponseDto questions into the local Question
 *     shape expected by QuestionRenderer; keyValue is narrowed with a runtime
 *     type guard instead of a blind cast.
 *   - Tracks per-step answers in a Record<string, AnswerValue> state map.
 *   - The generate wizard step no longer runs the LLM; it just shows a
 *     "View Report" button that invokes handleSubmit. The actual analyze call
 *     lives on /assessments/[id]/generate/[completionId].
 *   - On final step (or View Report tap from the generate step), handleSubmit
 *     routes to /assessments/[id]/result; the completion is only POSTed
 *     once thanks to submittedCompletionIdRef.
 *   - A "Past Reports" link in the header links to /assessments/[id]/reports
 *     so users can view prior reports without leaving the wizard.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   assessmentId               — route param, identifies the assessment to fetch
 *   questions                  — memoized array of Question objects derived from SDK data
 *   answers                    — Record<stepKey, AnswerValue> collected across steps
 *   currentStep                — index into questions array
 *   isStepComplete             — whether the current step's answer satisfies the validator
 *   submittedCompletionIdRef   — set once the CompletionResponseDto is created, used to
 *                                skip a duplicate POST from handleSubmit
 *   persistCompletion          — memoized-once submit helper returning the completion id
 *
 * DEPENDENCIES:
 *   useAssessmentById             — SWR hook wrapping cmsAssessmentsControllerFindOne
 *   submitAssessment              — SDK call to patientAssessmentsControllerCreateCompletion
 *   QuestionRenderer              — renders question UI by type
 *
 * LAST UPDATED: 2026-04-20 — add Past Reports header link.
 */

"use client";

import { BackButton } from "@/components/shared/navigation/back-button";
import {
  type AnswerValue,
  type Question,
  QuestionRenderer,
} from "@/components/shared/questions/question-renderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { submitAssessment, useAssessmentById } from "@/hooks/assessments/use-assessment-detail";
import { useAuth } from "@/hooks/shared/auth/use-auth";
import { AlertCircle, ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";

export default function AssessmentFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const answersInitialized = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Completion id once persisted — tracked to avoid a second submit when the
  // generate step has already created the CompletionResponseDto.
  const submittedCompletionIdRef = useRef<string | null>(null);

  const { data: assessmentData, isLoading, error: fetchError } = useAssessmentById(assessmentId);

  const assessment = assessmentData;

  const questions = useMemo(() => {
    return (assessment?.Questions || []).map((q) => ({
      id: q.id,
      question: q.title,
      title: q.title,
      label: q.label ?? undefined,
      type: q.type,
      description: q.subtitle ?? undefined,
      options: q.options?.map((o) => ({
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
  }, [assessment?.Questions]);

  useEffect(() => {
    if (!questions.length || answersInitialized.current) return;
    answersInitialized.current = true;
    const initial: Record<string, AnswerValue> = {};
    questions.forEach((q, index) => {
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
      } else if (isViewText || isAgreement || isGenerate) {
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

    // These types are always complete (informational, have defaults, or user can proceed freely)
    const alwaysComplete = [
      "smiley",
      "mood_selector",
      "level_selector",
      "indicator",
      "view_text",
      "agreement",
      "generate",
      "rating",
      "qa",
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
      raw.includes(".qa") ||
      (q.smileys && q.smileys.length > 0);

    if (isAlwaysComplete) {
      setIsStepComplete(true);
    } else if (raw === "text" || raw.includes("text") || raw.includes("speech")) {
      setIsStepComplete(((ans as { text?: string })?.text || "").trim().length > 0);
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

  const persistCompletion = async (): Promise<string> => {
    if (submittedCompletionIdRef.current) return submittedCompletionIdRef.current;
    const leadId = user?.lead_id ? String(user.lead_id) : "";
    const formattedAnswers: Record<string, unknown> = {};
    questions.forEach((q, index) => {
      const key = `q_${q.id}_step_${index}`;
      formattedAnswers[key] = {
        ...answers[key],
        questionText: q.title || q.label || "Unknown Question",
      };
    });
    const id = await submitAssessment(leadId, assessmentId, formattedAnswers);
    submittedCompletionIdRef.current = id;
    return id;
  };

  const handleSubmit = async () => {
    // Persist the completion (once) and route to the generate page for that
    // specific completionId, which hosts the "Generate Report" CTA.
    if (submittedCompletionIdRef.current) {
      router.push(`/assessments/${assessmentId}/generate/${submittedCompletionIdRef.current}`);
      return;
    }
    setSubmitting(true);
    try {
      const completionId = await persistCompletion();
      router.push(`/assessments/${assessmentId}/generate/${completionId}`);
    } catch (err) {
      console.error("Error submitting assessment:", err);
      setError("Failed to submit assessment. Please try again.");
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
          {error || "Failed to load assessment."}
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
        <p className="text-muted-foreground">No questions found for this assessment.</p>
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with progress */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
        {currentStep === 0 ? (
          <BackButton fallback={`/assessments/${assessmentId}/details`} />
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
          href={`/assessments/${assessmentId}/reports`}
          aria-label="View past reports"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded-full transition-colors"
        >
          <FileText className="w-3 h-3" />
          Past Reports
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
          onFinish={isGenerateStep ? handleSubmit : undefined}
        />
      </div>

      {/* Continue button — hidden on generate steps (they manage their own buttons) */}
      {!isGenerateStep && (
        <div className="px-5 pb-8 pt-3 border-t border-border bg-card">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base disabled:opacity-40"
            disabled={!isStepComplete || submitting}
            onClick={handleNext}
          >
            {submitting ? "Submitting..." : isLastStep ? "Submit Assessment" : "Continue →"}
          </Button>
        </div>
      )}
    </div>
  );
}
