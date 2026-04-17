'use client';

import { useState, use, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { QuestionRenderer, type Question, type AnswerValue } from '@/components/shared/questions/question-renderer';
import { ChevronLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAssessmentById, submitAssessment } from '@/hooks/assessments/use-assessment-detail';
import { useAuth } from '@/hooks/shared/auth/use-auth';

export default function AssessmentFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const answersInitialized = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      options: q.options?.map((o) => ({ id: o.id, option: o.label, value: o.value })),
      subtitle: q.subtitle ?? undefined,
      smileys: q.smileys,
    }));
  }, [assessment?.Questions]);

  useEffect(() => {
    if (!questions.length || answersInitialized.current) return;
    answersInitialized.current = true;
    const initial: Record<string, AnswerValue> = {};
    questions.forEach((q, index) => {
      const key = `q_${q.id}_step_${index}`;
      const type = q.type || '';
      if (type === 'smiley' || q.smileys?.length) {
        initial[key] = { selected: 2 };
      } else if (type === 'yes_no') {
        initial[key] = { selected: '' };
      } else if (type === 'mcq') {
        initial[key] = { selected: '' };
      } else if (type === 'text') {
        initial[key] = { text: '' };
      } else {
        initial[key] = { selected: '' };
      }
    });
    setAnswers(initial);
  }, [questions]);

  useEffect(() => {
    if (!questions.length) return;
    const q = questions[currentStep];
    const key = `q_${q.id}_step_${currentStep}`;
    const ans = answers[key];
    const type = q.type || '';

    if (type === 'smiley' || (q.smileys && q.smileys.length > 0)) {
      setIsStepComplete(true);
    } else if (type === 'yes_no') {
      setIsStepComplete(!!((ans as { selected?: string })?.selected));
    } else if (type === 'mcq') {
      setIsStepComplete(!!((ans as { selected?: string })?.selected));
    } else if (type === 'text') {
      setIsStepComplete(((ans as { text?: string })?.text || '').trim().length > 0);
    } else {
      setIsStepComplete(true);
    }
  }, [currentStep, answers, questions]);

  const currentKey = questions[currentStep]
    ? `q_${questions[currentStep].id}_step_${currentStep}`
    : '';

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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const leadId = user?.lead_id ? String(user.lead_id) : '';

      const formattedAnswers: Record<string, unknown> = {};
      questions.forEach((q, index) => {
        const key = `q_${q.id}_step_${index}`;
        formattedAnswers[key] = {
          ...answers[key],
          questionText: q.title || q.label || 'Unknown Question',
        };
      });

      await submitAssessment(leadId, assessmentId, formattedAnswers);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Failed to submit assessment. Please try again.');
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
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
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
          {error || 'Failed to load assessment.'}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Full orange progress bar */}
        <div className="h-1.5 w-full bg-primary" />

        <div className="flex items-center px-3 py-3">
          <button
            onClick={() => router.push('/assessments')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <span className="text-xl text-foreground leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Assessment Complete</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">
            You&apos;ve answered all questions. We&apos;re ready to compile your personalized insights.
          </p>
          <div className="bg-muted rounded-2xl p-4 mb-8 max-w-sm w-full flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground text-left leading-relaxed">
              AI-Generated Report — This report is generated using artificial intelligence based on
              your responses. It is for informational purposes only and does not replace professional
              medical advice.
            </p>
          </div>
          <Button
            className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base"
            onClick={() => router.push(`/assessments/${assessmentId}/analysis`)}
          >
            GENERATE REPORT →
          </Button>
        </div>
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
        />
      </div>

      {/* Continue button */}
      <div className="px-5 pb-8 pt-3 border-t border-border bg-card">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base disabled:opacity-40"
          disabled={!isStepComplete || submitting}
          onClick={handleNext}
        >
          {submitting ? 'Submitting...' : isLastStep ? 'Submit Assessment' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}
