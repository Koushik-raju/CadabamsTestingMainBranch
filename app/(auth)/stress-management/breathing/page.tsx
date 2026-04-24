"use client";

import { BreathingExercise } from "@/components/stress/breathing-exercise";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BreathingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Breathing Exercises</h1>
          <p className="text-xs text-muted-foreground">Calm your nervous system</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4">
        <BreathingExercise />
      </div>

      {/* Tips */}
      <div className="px-4 mt-6">
        <div className="bg-muted rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Tips for best results</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Find a comfortable seated position</li>
            <li>Keep your eyes closed or soft-focused</li>
            <li>Breathe through your nose when possible</li>
            <li>Do at least 3–5 cycles per session</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
