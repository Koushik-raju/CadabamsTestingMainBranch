"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out" | "idle";

interface BreathingPattern {
  name: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  description: string;
}

const PATTERNS: BreathingPattern[] = [
  {
    name: "4-7-8",
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    description: "Calming breath for anxiety relief",
  },
  {
    name: "Box Breathing",
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    description: "Used by Navy SEALs for stress control",
  },
  {
    name: "Deep Breath",
    inhale: 4,
    holdIn: 0,
    exhale: 4,
    holdOut: 0,
    description: "Simple deep breathing for relaxation",
  },
];

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Breathe In",
  "hold-in": "Hold",
  exhale: "Breathe Out",
  "hold-out": "Hold",
  idle: "Press Start",
};

export function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);

  const pattern = PATTERNS[selectedPattern];

  const runCycle = useCallback(
    async (signal: AbortSignal) => {
      const steps: { phase: Phase; duration: number }[] = [
        { phase: "inhale", duration: pattern.inhale },
        ...(pattern.holdIn > 0 ? [{ phase: "hold-in" as Phase, duration: pattern.holdIn }] : []),
        { phase: "exhale", duration: pattern.exhale },
        ...(pattern.holdOut > 0 ? [{ phase: "hold-out" as Phase, duration: pattern.holdOut }] : []),
      ];

      for (const step of steps) {
        if (signal.aborted) return;
        setPhase(step.phase);
        for (let i = step.duration; i >= 1; i--) {
          if (signal.aborted) return;
          setCountdown(i);
          await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        }
      }
      setCycles((c) => c + 1);
    },
    [pattern],
  );

  useEffect(() => {
    if (!isActive) return;
    const controller = new AbortController();

    const loop = async () => {
      while (!controller.signal.aborted) {
        await runCycle(controller.signal);
      }
    };

    loop();
    return () => controller.abort();
  }, [isActive, runCycle]);

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
      setPhase("idle");
      setCountdown(0);
    } else {
      setCycles(0);
      setIsActive(true);
    }
  };

  const circleClass =
    phase === "inhale"
      ? "breathing-circle-expand"
      : phase === "exhale"
        ? "breathing-circle-shrink"
        : phase === "hold-in"
          ? "breathing-circle-hold-big"
          : phase === "hold-out"
            ? "breathing-circle-hold-small"
            : "breathing-circle-idle";

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Pattern selector */}
      <div className="flex gap-2 flex-wrap justify-center">
        {PATTERNS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => {
              if (!isActive) setSelectedPattern(i);
            }}
            disabled={isActive}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedPattern === i
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            } disabled:opacity-50`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-xs">{pattern.description}</p>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Outer ring */}
        <div
          className={`absolute rounded-full bg-primary/10 transition-all duration-1000 ease-in-out ${circleClass}-outer`}
        />
        {/* Middle ring */}
        <div
          className={`absolute rounded-full bg-primary/20 transition-all duration-1000 ease-in-out ${circleClass}-middle`}
        />
        {/* Inner circle */}
        <div
          className={`relative rounded-full bg-primary flex flex-col items-center justify-center shadow-lg transition-all duration-1000 ease-in-out ${circleClass}-inner`}
        >
          <span className="text-primary-foreground text-lg font-semibold text-center px-3 leading-tight">
            {PHASE_LABELS[phase]}
          </span>
          {countdown > 0 && (
            <span className="text-primary-foreground text-3xl font-bold mt-1">{countdown}</span>
          )}
        </div>
      </div>

      {/* Cycle counter */}
      {cycles > 0 && (
        <p className="text-sm text-muted-foreground">
          Cycles completed: <span className="font-semibold text-primary">{cycles}</span>
        </p>
      )}

      {/* Control button */}
      <Button
        onClick={handleToggle}
        size="lg"
        className="rounded-full px-10"
        variant={isActive ? "outline" : "default"}
      >
        {isActive ? "Stop" : "Start"}
      </Button>

      {/* Pattern guide */}
      <div className="grid grid-cols-4 gap-3 text-center w-full max-w-xs">
        {[
          { label: "Inhale", value: pattern.inhale },
          { label: "Hold", value: pattern.holdIn },
          { label: "Exhale", value: pattern.exhale },
          { label: "Hold", value: pattern.holdOut },
        ].map((item) => (
          <div key={item.label + item.value} className="bg-muted rounded-lg p-2">
            <div className="text-lg font-bold text-primary">{item.value}s</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
