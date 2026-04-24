"use client";

import { useEffect, useState } from "react";

const SMILEY_EMOJIS = ["😢", "😕", "😐", "🙂", "😄"];
const SMILEY_LABELS = ["Very Bad", "Bad", "Neutral", "Good", "Very Good"];

// Semantic emotion colors — intentional per-position design, not structural UI
const SMILEY_COLORS = [
  "border-purple-400 bg-purple-50",
  "border-primary/60 bg-primary/10",
  "border-yellow-400 bg-yellow-50",
  "border-lime-400 bg-lime-50",
  "border-green-400 bg-green-50",
];
const SMILEY_SELECTED_COLORS = [
  "border-purple-500 bg-purple-100 ring-2 ring-purple-400",
  "border-primary bg-primary/15 ring-2 ring-primary/50",
  "border-yellow-500 bg-yellow-100 ring-2 ring-yellow-400",
  "border-lime-500 bg-lime-100 ring-2 ring-lime-400",
  "border-green-500 bg-green-100 ring-2 ring-green-400",
];

interface SmileySelectorProps {
  title?: string;
  subTitle?: string;
  selected: number;
  onSelect: (value: number) => void;
  labels?: [string?, string?, string?, string?, string?];
}

export function SmileySelector({
  title,
  subTitle,
  selected,
  onSelect,
  labels,
}: SmileySelectorProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayLabels = labels?.length ? labels : SMILEY_LABELS;

  // Default to neutral (2) so it's always "complete"
  useEffect(() => {
    if (selected === undefined || selected === null) {
      onSelect(2);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-4 w-full">
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2 leading-tight">
          {title}
        </h2>
      )}
      {subTitle && (
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{subTitle}</p>
      )}
      <div className="flex gap-3 sm:gap-4 justify-center mt-4">
        {SMILEY_EMOJIS.map((emoji, index) => {
          const isSelected = selected === index;
          const isHovered = hovered === index;
          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                isSelected ? SMILEY_SELECTED_COLORS[index] : SMILEY_COLORS[index]
              } ${isHovered && !isSelected ? "scale-105" : ""}`}
              aria-label={displayLabels[index] || SMILEY_LABELS[index]}
              aria-pressed={isSelected}
            >
              <span
                className={`text-3xl sm:text-4xl transition-all ${isSelected ? "scale-110" : ""}`}
              >
                {emoji}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[48px] ${
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {displayLabels[index] || SMILEY_LABELS[index]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
