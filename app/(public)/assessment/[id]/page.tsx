'use client';

import { useState, use, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ref, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { QuestionRenderer, type Question, type AnswerValue } from '@/components/assessment/question-renderer';
import { backendClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAssessmentById, mapStrapiAssessment } from '@/hooks/use-assessments';

export default function AssessmentFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assessmentId } = use(params);
  const router = useRouter();

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: assessmentData, isLoading, error: fetchError } = useAssessmentById(assessmentId);

  const assessment = useMemo(() => {
    if (!assessmentData?.data) return null;
    return mapStrapiAssessment(assessmentData.data);
  }, [assessmentData]);

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
    if (!questions.length) return;
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
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const leadId = String(user.lead_id || '');

      const payload: Record<string, unknown> = { date: new Date().toISOString() };
      questions.forEach((q, index) => {
        const key = `q_${q.id}_step_${index}`;
        payload[key] = {
          ...answers[key],
          questionText: q.title || q.label || 'Unknown Question',
        };
      });

      if (leadId && assessmentId) {
        const dbRef = ref(database, `assessments/${leadId}/${assessmentId}`);
        await push(dbRef, payload);
      }

      await backendClient.post(endpoints.saveAssessment, {
        lead_id: leadId,
        assessment_id: assessmentId,
        answers: payload,
      });

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
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <Skeleton className="h-3 w-full max-w-sm rounded-full" />
          <Skeleton className="h-8 w-3/4 max-w-sm" />
          <div className="flex flex-col gap-3 w-full max-w-md mt-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center font-medium">{error || 'Failed to load assessment.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-2 w-full bg-orange-500" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Assessment Complete</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Your responses have been recorded.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 max-w-sm">
            <p className="text-xs text-orange-800">
              AI-generated summary based on your responses. This is for informational purposes only and does not replace professional medical advice.
            </p>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => router.push(`/assessment/analysis?id=${assessmentId}`)}
          >
            Generate Report
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
  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
        {currentStep === 0 ? (
          <BackButton fallback={`/assessment/details?id=${assessmentId}`} />
        ) : (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{assessment?.title}</p>
          <p className="text-xs font-medium text-foreground">
            Step {currentStep + 1} of {questions.length}
          </p>
        </div>
      </div>

      <div className="px-4 pt-3">
        <Progress value={progress} className="h-2 bg-slate-200 [&>div]:bg-orange-500" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <QuestionRenderer
          question={currentQuestion}
          answer={answers[currentKey] ?? {}}
          onChange={handleAnswer}
          onComplete={handleComplete}
        />
      </div>

      <div className="px-4 pb-6 pt-3 border-t border-border bg-card">
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!isStepComplete || submitting}
          onClick={handleNext}
        >
          {submitting ? (
            'Submitting...'
          ) : isLastStep ? (
            'Submit Assessment'
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
