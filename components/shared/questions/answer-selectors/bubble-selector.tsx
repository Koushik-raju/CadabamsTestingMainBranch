'use client';

import { CheckCircle2 } from 'lucide-react';

export interface BubbleOption {
  id?: string | number;
  label: string;
  value?: string;
}

interface BubbleSelectorProps {
  title?: string;
  subTitle?: string;
  options: BubbleOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function BubbleSelector({ title, subTitle, options, selected, onToggle }: BubbleSelectorProps) {
  return (
    <div className="flex flex-col px-5 pt-6 pb-4 w-full">
      {subTitle && (
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          {subTitle}
        </p>
      )}
      {title && (
        <h2 className="text-xl font-bold text-foreground mb-2 leading-snug">
          {title}
        </h2>
      )}
      <p className="text-sm text-muted-foreground mb-6">
        Select all that apply
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((opt, index) => {
          const val = opt.value || opt.label;
          const isSelected = selected.includes(val);
          return (
            <button
              key={opt.id ?? index}
              onClick={() => onToggle(val)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/30'
              }`}
              aria-pressed={isSelected}
            >
              {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
