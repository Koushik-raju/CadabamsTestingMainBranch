'use client';

import { useState } from 'react';
import { ChevronDown, X, CheckCircle2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export interface SubQuestion {
  id: string | number;
  label: string;
  options: Array<{ id: string | number; label: string; value: string }>;
}

interface MultiDropdownSelectorProps {
  title?: string;
  subTitle?: string;
  subQuestions: SubQuestion[];
  answers: Record<string, string>;
  onAnswer: (subQuestionId: string | number, value: string) => void;
}

export function MultiDropdownSelector({
  title,
  subTitle,
  subQuestions,
  answers,
  onAnswer,
}: MultiDropdownSelectorProps) {
  const [openSheetFor, setOpenSheetFor] = useState<string | number | null>(null);

  const activeSubQuestion = subQuestions.find((sq) => sq.id === openSheetFor);

  return (
    <div className="flex flex-col px-5 pt-6 pb-4 w-full">
      {subTitle && (
        <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2">
          {subTitle}
        </p>
      )}
      {title && (
        <h2 className="text-xl font-bold text-foreground mb-2 leading-snug">{title}</h2>
      )}
      <p className="text-sm text-muted-foreground mb-6">
        Tap to choose a response for each line before continuing.
      </p>

      <div className="flex flex-col gap-4 w-full">
        {subQuestions.map((sq) => {
          const selectedValue = answers[String(sq.id)];
          const selectedLabel = selectedValue
            ? sq.options.find((o) => o.value === selectedValue)?.label || selectedValue
            : null;

          return (
            <div key={sq.id} className="space-y-2">
              <p className="text-sm text-foreground leading-snug">{sq.label}</p>
              <button
                onClick={() => setOpenSheetFor(sq.id)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors ${
                  selectedLabel
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <span className="text-sm font-medium">
                  {selectedLabel || 'Select an option'}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom sheet picker */}
      <Sheet open={openSheetFor !== null} onOpenChange={(open) => !open && setOpenSheetFor(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
          <SheetHeader className="flex flex-row items-center justify-between mb-4">
            <SheetTitle className="text-base font-semibold">Choose response</SheetTitle>
            <button
              onClick={() => setOpenSheetFor(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </SheetHeader>

          {activeSubQuestion && (
            <div className="flex flex-col gap-2">
              {activeSubQuestion.options.map((opt) => {
                const isSelected = answers[String(activeSubQuestion.id)] === opt.value;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onAnswer(activeSubQuestion.id, opt.value);
                      setOpenSheetFor(null);
                    }}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-orange-700' : 'text-foreground'
                      }`}
                    >
                      {opt.label}
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 block" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
