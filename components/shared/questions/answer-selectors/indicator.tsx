'use client';

import { useState } from 'react';

interface IndicatorSelectorProps {
  title?: string;
  subTitle?: string;
  value: number;
  onChange: (value: number) => void;
  keyValue?: Record<string, string>;
}

function getDescription(value: number, keyValue?: Record<string, string>): string {
  if (!keyValue) {
    if (value <= 25) return 'Low Impact';
    if (value <= 50) return 'Moderate Impact';
    if (value <= 75) return 'High Impact';
    return 'Very High Impact';
  }

  for (const [range, desc] of Object.entries(keyValue)) {
    const parts = range.split('-').map(Number);
    if (parts.length === 2 && value >= parts[0] && value <= parts[1]) {
      return desc;
    }
  }
  return '';
}

export function IndicatorSelector({ title, subTitle, value, onChange, keyValue }: IndicatorSelectorProps) {
  const [localValue, setLocalValue] = useState(value);
  const description = getDescription(localValue, keyValue);

  return (
    <div className="flex flex-col items-center px-5 pt-6 pb-4 w-full">
      {title && (
        <h2 className="text-xl font-bold text-foreground text-center mb-2 leading-snug">
          {title}
        </h2>
      )}
      {subTitle && (
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
          {subTitle}
        </p>
      )}

      {/* Large score display */}
      <div className="w-28 h-28 rounded-full border-4 border-primary/30 bg-primary/5 flex items-center justify-center mb-3">
        <span className="text-4xl font-bold text-primary">{localValue}</span>
      </div>
      {description && (
        <p className="text-sm font-medium text-primary mb-8">{description}</p>
      )}

      {/* Slider */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Low Impact</span>
          <span>High Impact</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLocalValue(v);
            onChange(v);
          }}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
