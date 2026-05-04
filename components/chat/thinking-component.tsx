"use client";

import { BrainIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Shimmer } from "@/components/ui/shimmer";
import { CHAT_REMAINING_MESSAGES } from "@/lib/config";

const FIRST_MESSAGE = "Thinking";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface ThinkingComponentProps {
  isStreaming: boolean;
  steps: string[];
}

export function ThinkingComponent({ isStreaming }: ThinkingComponentProps) {
  const [, forceUpdate] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number | null>(null);
  const stagesRef = useRef<string[]>([FIRST_MESSAGE, ...CHAT_REMAINING_MESSAGES]);

  useEffect(() => {
    if (!isStreaming) return;

    startTimeRef.current = Date.now();
    durationRef.current = null;
    stagesRef.current = [FIRST_MESSAGE, ...shuffle(CHAT_REMAINING_MESSAGES)];

    const id = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 7000);

    return () => {
      clearInterval(id);
      if (startTimeRef.current !== null) {
        durationRef.current = Math.round((Date.now() - startTimeRef.current) / 1000);
        startTimeRef.current = null;
      }
    };
  }, [isStreaming]);

  const stageIndex =
    isStreaming && startTimeRef.current !== null
      ? Math.min(
          Math.floor((Date.now() - startTimeRef.current) / 7000),
          stagesRef.current.length - 1,
        )
      : 0;

  const currentMessage = stagesRef.current[stageIndex] ?? FIRST_MESSAGE;

  const label = isStreaming ? (
    <Shimmer as="span">{currentMessage}</Shimmer>
  ) : durationRef.current !== null ? (
    `Thought for ${durationRef.current} sec`
  ) : (
    "Thought"
  );

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <BrainIcon className="size-4" />
      <span>{label}</span>
    </div>
  );
}
