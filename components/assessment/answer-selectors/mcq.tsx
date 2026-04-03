'use client';

import { CheckCircle2, Circle } from 'lucide-react';

export interface McqOption {
  id?: string | number;
  question?: string;
  option?: string;
  value?: string;
}

interface McqSelectorProps {
  title?: string;
  subTitle?: string;
  questions: McqOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function McqSelector({ title, subTitle, questions, selected, onSelect }: McqSelectorProps) {
  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-4 w-full">
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2 leading-tight">
          {title}
        </h2>
      )}
      {subTitle && (
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
          {subTitle}
        </p>
      )}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {questions.map((q, index) => {
          const label = q.question || q.option || q.value || String(index + 1);
          const isSelected = selected === label;
          return (
            <button
              key={q.id ?? index}
              onClick={() => onSelect(label)}
              className={`flex items-center gap-3 p-4 rounded-full border-2 w-full text-left transition-all duration-200 active:scale-95 ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50'
              }`}
            >
              <span className="flex-shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </span>
              <span className="text-sm sm:text-base font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
