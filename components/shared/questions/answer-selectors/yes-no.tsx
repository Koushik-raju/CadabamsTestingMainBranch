/**
 * FILE: components/shared/questions/answer-selectors/yes-no.tsx
 *
 * PURPOSE:
 *   Renders a binary choice selector with two buttons: yes/no or custom labels.
 *   Handles selected state and dispatch via onSelect callback.
 *
 * LOGIC OVERVIEW:
 *   Displays heading (from title or question prop), optional subtitle.
 *   Two buttons side-by-side; selected button shows primary/destructive styling.
 *   Yes button uses primary color (orange); no button uses destructive (red).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   selected  — current selected label ("Yes", "No", or custom)
 *   onSelect  — callback(label: string) on button click
 *   yesLabel, noLabel — customizable button text
 *
 * DEPENDENCIES:
 *   None (pure UI)
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
              ? "bg-primary border-primary text-primary-foreground shadow-[var(--sh-glow-orange)]"
              : "bg-card border-border text-foreground hover:border-primary/50"
          }`}
          aria-pressed={selected === yesLabel}
        >
          {yesLabel}
        </button>
        <button
          onClick={() => onSelect(noLabel)}
          className={`w-28 sm:w-32 py-4 rounded-2xl border-2 font-semibold text-base transition-all duration-200 active:scale-95 ${
            selected === noLabel
              ? "bg-destructive border-destructive text-destructive-foreground shadow-[var(--sh-2)]"
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
