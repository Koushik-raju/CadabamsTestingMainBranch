/**
 * FILE: components/shared/questions/answer-selectors/generate.tsx
 *
 * PURPOSE:
 *   Terminal step of an assessment wizard. Confirms completion and hands off
 *   to the parent via onFinish, which persists the completion and routes to
 *   /assessments/[id]/generate/[completionId] where the actual AI analysis
 *   is triggered. This component no longer runs the LLM inline.
 *
 * LOGIC OVERVIEW:
 *   - On mount, calls onComplete() so the wizard's footer is hidden (this step
 *     owns its own CTA).
 *   - Renders a simple "ready to finish" panel with a Finish button that
 *     invokes onFinish.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title     — optional heading
 *   onComplete — notifies wizard this step manages its own footer
 *   onFinish  — called when the user taps Finish; parent submits the completion
 *               and routes to the dedicated Generate Report page
 *
 * DEPENDENCIES:
 *   lucide-react — iconography
 *
 * LAST UPDATED: 2026-04-20 — strip inline LLM call; generation now happens on
 *   /assessments/[id]/generate/[completionId].
 */
"use client";

import { Bot } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface GenerateProps {
  title?: string;
  onComplete: () => void;
  onFinish: () => void;
}

export function Generate({ onComplete, onFinish }: GenerateProps) {
  useEffect(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center px-5 pt-10 pb-4 w-full">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Bot className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground text-center mb-2">You&apos;re All Done</h2>
      <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
        Tap View Report to submit your responses. You&apos;ll generate your AI-powered report on the
        next screen.
      </p>
      <Button
        className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white font-semibold h-14 rounded-2xl text-base"
        onClick={onFinish}
      >
        View Report
      </Button>
    </div>
  );
}
