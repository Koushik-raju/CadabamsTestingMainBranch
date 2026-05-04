/**
 * FILE: app/(auth)/stress-management/body-scan/page.tsx
 *
 * PURPOSE:
 *   Guided body scan meditation exercise page.
 *   Steps through body parts (feet to head) with timed instructions for progressive relaxation.
 *
 * LOGIC OVERVIEW:
 *   Renders a step-by-step body scan with navigation (previous/next).
 *   Tracks current body part index. Displays timed instruction for each part.
 *   Timer counts down and auto-advances to next part when complete.
 *   Shows progress (completed checkmarks) for previous parts.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   currentIndex   — index into BODY_PARTS array
 *   timeRemaining  — countdown timer for current part in seconds
 *   BODY_PARTS     — predefined body part sequence with instructions and duration
 *
 * DEPENDENCIES:
 *   Button, Card, CardContent  — shadcn/ui primitives
 *   CheckCircle2, ChevronLeft, ChevronRight  — lucide icons
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */

"use client";

import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BodyPart {
  name: string;
  instruction: string;
  duration: number; // seconds
}

const BODY_PARTS: BodyPart[] = [
  {
    name: "Feet & Toes",
    instruction:
      "Bring your attention to your feet and toes. Notice any tension, temperature, or sensations. Take a deep breath and let any tension melt away as you exhale.",
    duration: 30,
  },
  {
    name: "Calves & Shins",
    instruction:
      "Move your awareness up to your calves and shins. Feel the weight of your legs. With each breath out, let these muscles soften and relax completely.",
    duration: 30,
  },
  {
    name: "Thighs & Hips",
    instruction:
      "Bring your attention to your thighs and hip area. Notice any tightness. Allow your legs to feel heavy and completely supported. Breathe and release.",
    duration: 30,
  },
  {
    name: "Abdomen",
    instruction:
      "Focus on your belly and lower back. Feel it rise and fall with each breath. Let your stomach muscles loosen with each exhale.",
    duration: 30,
  },
  {
    name: "Chest",
    instruction:
      "Move your awareness to your chest and upper back. Feel your heart beating. With each breath, let your chest expand freely and your shoulders drop.",
    duration: 30,
  },
  {
    name: "Hands & Arms",
    instruction:
      "Notice your hands, forearms, and upper arms. Feel your fingers relax and uncurl. Let any tension flow out through your fingertips as you exhale.",
    duration: 30,
  },
  {
    name: "Shoulders & Neck",
    instruction:
      "Bring attention to your shoulders and neck — common areas for stress. Let them soften. Feel the weight of your head being fully supported.",
    duration: 30,
  },
  {
    name: "Face & Head",
    instruction:
      "Finally, notice your face — your jaw, cheeks, forehead, and scalp. Unclench your teeth, soften your eyes, and let your entire face relax completely.",
    duration: 30,
  },
];

export default function BodyScanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [isFinished, setIsFinished] = useState(false);

  const handleStart = () => setCurrentStep(0);

  const handleNext = () => {
    if (currentStep === null) return;
    const newCompleted = new Set(completed);
    newCompleted.add(currentStep);
    setCompleted(newCompleted);
    if (currentStep < BODY_PARTS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
      setCurrentStep(null);
    }
  };

  const handlePrev = () => {
    if (currentStep !== null && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6 gap-6">
        <CheckCircle2 className="w-20 h-20 text-green-500" />
        <h2 className="text-2xl font-bold text-foreground text-center">Body Scan Complete</h2>
        <p className="text-muted-foreground text-center">
          You have completed a full body scan. Take a moment to notice how you feel — more present,
          relaxed, and grounded.
        </p>
        <Button className="rounded-full px-8" onClick={() => router.back()}>
          Done
        </Button>
        <Button
          variant="outline"
          className="rounded-full px-8"
          onClick={() => {
            setIsFinished(false);
            setCurrentStep(0);
            setCompleted(new Set());
          }}
        >
          Do It Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Body Scan Meditation</h1>
          <p className="text-xs text-muted-foreground">Progressive relaxation</p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-2 flex flex-col gap-6">
        {currentStep === null ? (
          /* Overview */
          <>
            <p className="text-sm text-muted-foreground">
              A body scan helps you release tension by moving attention through each part of your
              body. The session covers {BODY_PARTS.length} areas and takes about{" "}
              {Math.round(BODY_PARTS.reduce((s, p) => s + p.duration, 0) / 60)} minutes.
            </p>

            {/* Step list */}
            <div className="flex flex-col gap-2">
              {BODY_PARTS.map((part, i) => (
                <div
                  key={part.name}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${completed.has(i) ? "border-green-200 bg-green-50" : "border-border bg-card"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${completed.has(i) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {completed.has(i) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${completed.has(i) ? "text-green-700" : "text-foreground"}`}
                  >
                    {part.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">{part.duration}s</span>
                </div>
              ))}
            </div>

            <Button className="rounded-full" size="lg" onClick={handleStart}>
              {completed.size > 0 ? "Continue" : "Begin Body Scan"}
            </Button>
          </>
        ) : (
          /* Active step */
          <>
            {/* Progress */}
            <div className="flex gap-1">
              {BODY_PARTS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < currentStep
                      ? "bg-primary"
                      : i === currentStep
                        ? "bg-primary/60"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Step {currentStep + 1} of {BODY_PARTS.length}
            </p>

            {/* Card */}
            <Card className="flex-1">
              <CardContent className="p-6 flex flex-col gap-6">
                {/* Body illustration placeholder */}
                <div className="w-full aspect-square max-w-[200px] mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-4xl" role="img" aria-label={BODY_PARTS[currentStep].name}>
                    🧘
                  </span>
                </div>

                <h2 className="text-xl font-bold text-foreground text-center">
                  {BODY_PARTS[currentStep].name}
                </h2>

                <p className="text-base text-muted-foreground text-center leading-relaxed">
                  {BODY_PARTS[currentStep].instruction}
                </p>

                <p className="text-xs text-center text-muted-foreground">
                  Spend about {BODY_PARTS[currentStep].duration} seconds here
                </p>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" className="rounded-full flex-1" onClick={handlePrev}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
              )}
              <Button className="rounded-full flex-1" onClick={handleNext}>
                {currentStep < BODY_PARTS.length - 1 ? (
                  <>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
