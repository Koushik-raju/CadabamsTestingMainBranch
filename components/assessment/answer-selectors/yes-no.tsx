/**
 * FILE: components/assessment/answer-selectors/yes-no.tsx
 *
 * PURPOSE:
 *   Yes/No binary choice selector — renders two option buttons side by side with
 *   selected state styling (green for yes, red for no).
 *
 * LOGIC OVERVIEW:
 *   - Receives title/question text and selected state.
 *   - Renders two buttons with conditional styling based on selection.
 *   - Yes button: green background when selected; No button: red (destructive).
 *   - Both buttons use scale-95 on active and transition effects.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   selected    — current selection (yesLabel or noLabel string)
 *   onSelect    — callback fired with selected label
 *   yesLabel    — text for yes button (defaults to "Yes")
 *   noLabel     — text for no button (defaults to "No")
 *   YesNoSelector — default export
 *
 * DEPENDENCIES:
 *   Tailwind CSS for styling
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

interface YesNoSelectorProps {
  title?: string;
  subTitle?: string;
  question?: string;
  yesLabel?: string;
  noLabel?: string;
  selected: string;
  onSelect: (value: string) => void;
}

export function YesNoSelector({
  title,
  subTitle,
  question,
  yesLabel = "Yes",
  noLabel = "No",
  selected,
  onSelect,
}: YesNoSelectorProps) {
  const heading = title || question || "";
  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-4 w-full">
      {heading && (
        <h2 className="text-xl sm:text-2xl font-bold text-primary text-center mb-2 leading-tight">
          {heading}
        </h2>
      )}
      {subTitle && (
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">{subTitle}</p>
      )}
      <div className="flex gap-4 sm:gap-6 mt-6 justify-center">
        <button
          onClick={() => onSelect(yesLabel)}
          className={`w-28 sm:w-32 py-4 rounded-2xl border-2 font-semibold text-base transition-all duration-200 active:scale-95 ${
            selected === yesLabel
              ? "bg-green-500 border-green-500 text-white shadow-[var(--sh-1)]"
              : "bg-card border-border text-foreground hover:border-green-400"
          }`}
          aria-pressed={selected === yesLabel}
        >
          {yesLabel}
        </button>
        <button
          onClick={() => onSelect(noLabel)}
          className={`w-28 sm:w-32 py-4 rounded-2xl border-2 font-semibold text-base transition-all duration-200 active:scale-95 ${
            selected === noLabel
              ? "bg-destructive border-destructive text-destructive-foreground shadow-[var(--sh-1)]"
              : "bg-card border-border text-foreground hover:border-destructive/50"
          }`}
          aria-pressed={selected === noLabel}
        >
          {noLabel}
        </button>
      </div>
    </div>
  );
}
