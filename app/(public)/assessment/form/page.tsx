'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ref, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { QuestionRenderer, type Question, type AnswerValue } from '@/components/assessment/question-renderer';
import { backendClient } from '@/lib/api-client';
import { endpoints } from '@/config/api-endpoints';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ASSESSMENT_API = 'https://mindtalkbuddy.com/api/assessments';

interface AssessmentData {
  label?: string;
  description?: string;
  Questions?: Question[];
}

function AssessmentFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assessmentId = searchParams.get('id');

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setError('No assessment ID provided.');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const res = await axios.get<{ data: AssessmentData }>(
          `${ASSESSMENT_API}/${assessmentId}?pLevel=4`
        );
        const data = res.data.data;
        setAssessment(data);
        setQuestions(data.Questions || []);

        // Initialize answers
        const initial: Record<string, AnswerValue> = {};
        (data.Questions || []).forEach((q, index) => {
          const key = `${q.__component || 'q'}_${q.id}_step_${index}`;
          const comp = q.__component || '';
          if (comp.includes('smiley') || q.type === 'smiley') {
            initial[key] = { selected: 2 };
          } else if (comp.includes('yes') || q.type === 'yes_no') {
            initial[key] = { selected: '' };
          } else if (comp.includes('mcq') || q.type === 'mcq') {
            initial[key] = { selected: '' };
          } else if (comp.includes('text') || q.type === 'text') {
            initial[key] = { text: '' };
          } else {
            initial[key] = { selected: '' };
          }
        });
        setAnswers(initial);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [assessmentId]);

  // Reset step completion check when step changes
  useEffect(() => {
    if (!questions.length) return;
    const q = questions[currentStep];
    const key = `${q.__component || 'q'}_${q.id}_step_${currentStep}`;
    const ans = answers[key];
    const comp = q.__component || '';
    const type = q.type || '';

    if (comp.includes('smiley') || type === 'smiley') {
      setIsStepComplete(true);
    } else if (comp.includes('yes') || type === 'yes_no') {
      setIsStepComplete(!!((ans as { selected?: string })?.selected));
    } else if (comp.includes('mcq') || type === 'mcq') {
      setIsStepComplete(!!((ans as { selected?: string })?.selected));
    } else if (comp.includes('text') || type === 'text') {
      setIsStepComplete(((ans as { text?: string })?.text || '').trim().length > 0);
    } else {
      setIsStepComplete(true);
    }
  }, [currentStep, answers, questions]);

  const currentKey = questions[currentStep]
    ? `${questions[currentStep].__component || 'q'}_${questions[currentStep].id}_step_${currentStep}`
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

      // Build payload with question text
      const payload: Record<string, unknown> = { date: new Date().toISOString() };
      questions.forEach((q, index) => {
        const key = `${q.__component || 'q'}_${q.id}_step_${index}`;
        payload[key] = {
          ...answers[key],
          questionText: q.question || q.title || q.label || 'Unknown Question',
        };
      });

      // Save to Firebase
      if (leadId && assessmentId) {
        const dbRef = ref(database, `assessments/${leadId}/${assessmentId}`);
        await push(dbRef, payload);
      }

      // Save to backend
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

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center font-medium">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Assessment Complete!</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Your responses have been recorded. Thank you for completing this assessment.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/assessments')}>
            View Assignments
          </Button>
          <Button onClick={() => router.push(`/assessment/analysis?id=${assessmentId}`)}>
            View Analysis
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
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
        {currentStep === 0 ? (
          <BackButton fallback="/assessments" />
        ) : (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{assessment?.label}</p>
          <p className="text-xs font-medium text-foreground">
            Question {currentStep + 1} of {questions.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <Progress value={progress} className="h-2" />
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

      {/* Footer */}
      <div className="px-4 pb-6 pt-3 border-t border-border bg-card">
        <Button
          className="w-full"
          size="lg"
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

export default function AssessmentFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
      }
    >
      <AssessmentFormContent />
    </Suspense>
  );
}
