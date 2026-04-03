'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MoodQuestion {
  question: string;
  value: number;
}

interface MoodCheckFormProps {
  questions?: MoodQuestion[];
  onSubmit: (answers: Record<string, number>) => Promise<void>;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😊'];
const MOOD_LABELS = ['Very Low', 'Low', 'Neutral', 'Good', 'Great'];

const DEFAULT_QUESTIONS: MoodQuestion[] = [
  { question: 'How are you feeling right now?', value: 5 },
  { question: 'How stressed do you feel?', value: 3 },
  { question: 'How energetic do you feel?', value: 4 },
];

export function MoodCheckForm({
  questions = DEFAULT_QUESTIONS,
  onSubmit,
  isSubmitting = false,
  title = 'Mood Check-In',
  subtitle = 'Take a moment to reflect and log your current mood.',
  submitLabel = 'Save Mood',
}: MoodCheckFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    questions.forEach((q, i) => {
      initial[`q_${i}`] = q.value;
    });
    return initial;
  });

  const handleSliderChange = (key: string, value: number[]) => {
    setAnswers((prev) => ({ ...prev, [key]: value[0] }));
  };

  const getMoodEmoji = (value: number) => {
    // value 1–10, map to 0–4 index
    const idx = Math.min(4, Math.floor(((value - 1) / 9) * 5));
    return MOOD_EMOJIS[idx];
  };

  const getMoodLabel = (value: number) => {
    const idx = Math.min(4, Math.floor(((value - 1) / 9) * 5));
    return MOOD_LABELS[idx];
  };

  const handleSubmit = async () => {
    await onSubmit(answers);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center pb-2">
        <h2 className="font-bold text-lg text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {questions.map((q, i) => {
        const key = `q_${i}`;
        const val = answers[key] ?? q.value;

        return (
          <Card key={key} className="border border-border">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-semibold text-foreground">
                {q.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {/* Emoji display */}
              <div className="flex flex-col items-center mb-4">
                <span className="text-4xl mb-1">{getMoodEmoji(val)}</span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    val >= 7
                      ? 'text-green-600'
                      : val >= 4
                        ? 'text-amber-600'
                        : 'text-red-500'
                  )}
                >
                  {getMoodLabel(val)}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">{val}/10</span>
              </div>

              {/* Range slider */}
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={val}
                onChange={(e) => handleSliderChange(key, [Number(e.target.value)])}
                className="w-full accent-primary cursor-pointer"
              />

              {/* Min/Max labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button
        className="w-full mt-2"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );
}
