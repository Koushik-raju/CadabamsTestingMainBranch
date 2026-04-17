'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Bot, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Markdown from 'react-markdown';

interface AssessmentQuestion {
  id: string | number;
  title?: string;
  question?: string;
  label?: string;
  type?: string;
  options?: Array<{ label?: string; value?: string; option?: string }>;
  questions?: Array<{ question: string }>;
  answers?: Array<{ answer: string }>;
}

interface GenerateProps {
  title?: string;
  prompt?: string;
  assessmentTitle?: string;
  assessmentQuestions?: AssessmentQuestion[];
  assessmentAnswers?: Record<string, unknown>;
  onComplete: () => void;
  onGenerated?: (text: string) => void;
  onFinish: () => void;
}

export function Generate({ title, prompt, assessmentTitle, assessmentQuestions, assessmentAnswers, onComplete, onGenerated, onFinish }: GenerateProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  // Generate step manages its own buttons — tell form it's "complete" so it hides the footer
  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const handleGenerate = useCallback(async () => {
    setStatus('generating');
    setError('');
    try {
      // Build the prompt exactly like the old frontend:
      // "{prompt} Assessment: {questions} Answer: {answers}"
      const assessmentData = (assessmentQuestions || []).map((q) => ({
        title: q.title || q.question || q.label || '',
        type: q.type,
        options: q.options,
        questions: q.questions,
        answers: q.answers,
      }));

      const userPrompt = prompt
        ? `${prompt} Assessment: ${JSON.stringify(assessmentData)} Answer: ${JSON.stringify(assessmentAnswers || {})}`
        : `Assessment Name: ${assessmentTitle || 'Unknown'} Assessment: ${JSON.stringify(assessmentData)} Answer: ${JSON.stringify(assessmentAnswers || {})}`;

      const res = await fetch('/api/assessment-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!res.ok) throw new Error('Failed to generate report');

      const data = await res.json();
      const text = data?.result || data?.content || data?.text || '';
      setResult(text);
      setStatus('done');
      onGenerated?.(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }, [prompt, assessmentTitle, assessmentQuestions, assessmentAnswers, onGenerated]);

  // Idle state — ready to generate
  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center px-5 pt-10 pb-4 w-full">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Bot className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          Ready to Generate Report
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
          Your assessment is complete. Tap below to see your AI-powered wellness insights.
        </p>
        <Button
          className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base"
          onClick={handleGenerate}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Summary
        </Button>
      </div>
    );
  }

  // Generating state — loading
  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center px-5 pt-10 pb-4 w-full">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <Bot className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          AI Is Analyzing...
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          We are carefully analyzing your responses to generate personalized insights.
        </p>
        <div className="flex gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center px-5 pt-10 pb-4 w-full">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <Bot className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-destructive text-center mb-2">
          Analysis Encountered an Issue
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
          {error}
        </p>
        <Button
          className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base"
          onClick={handleGenerate}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Done state — show result + Finish button
  return (
    <div className="flex flex-col px-5 pt-6 pb-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground leading-snug">
          {title || 'Your Report'}
        </h2>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 mb-6 max-h-[50vh] overflow-y-auto">
        <Markdown
          components={{
            h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold text-foreground mt-4 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h3>,
            p: ({ children }) => <p className="text-sm text-foreground/80 leading-relaxed mb-3">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-sm text-foreground/80 leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          }}
        >
          {result}
        </Markdown>
      </div>
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base"
        onClick={onFinish}
      >
        Finish
      </Button>
    </div>
  );
}
