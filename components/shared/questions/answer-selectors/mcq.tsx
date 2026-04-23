"use client";

import { CheckCircle2 } from "lucide-react";

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
    <div className="flex flex-col px-5 pt-6 pb-4 w-full">
      {subTitle && (
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          {subTitle}
        </p>
      )}
      {title && <h2 className="text-xl font-bold text-foreground mb-6 leading-snug">{title}</h2>}
      <div className="flex flex-col gap-3 w-full">
        {questions.map((q, index) => {
          const label = q.question || q.option || q.value || String(index + 1);
          const isSelected = selected === label;
          return (
            <button
              key={q.id ?? index}
              onClick={() => onSelect(label)}
              className={`flex items-center justify-between gap-3 px-4 py-4 rounded-2xl border-2 w-full text-left transition-all duration-150 active:scale-[0.98] ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <span
                className={`text-sm font-medium leading-snug ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}
              >
                {label}
              </span>
              <span className="flex-shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 block" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
