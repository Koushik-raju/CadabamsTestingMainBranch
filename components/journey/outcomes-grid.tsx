'use client';

import { Brain, Heart, Sun, Star, Shield, Zap, Smile, Wind } from 'lucide-react';

const OUTCOME_ICONS = [Brain, Heart, Sun, Star, Shield, Zap, Smile, Wind];

interface OutcomeItem {
  label: string;
  icon?: string;
}

interface OutcomesGridProps {
  outcomes: OutcomeItem[];
}

export function OutcomesGrid({ outcomes }: OutcomesGridProps) {
  const items = outcomes.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-bold text-foreground mb-3">What you&apos;ll achieve</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const Icon = OUTCOME_ICONS[i % OUTCOME_ICONS.length];
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 bg-muted rounded-2xl p-3"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs font-medium text-foreground leading-snug mt-1">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
