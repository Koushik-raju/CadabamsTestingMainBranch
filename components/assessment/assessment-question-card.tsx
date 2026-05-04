/**
 * FILE: components/assessment/assessment-question-card.tsx
 *
 * PURPOSE:
 *   Question card component that renders a single assessment question with
 *   type-specific answer selectors (smiley, single choice, text, slider).
 *
 * LOGIC OVERVIEW:
 *   - AssessmentQuestionCard is the main export that dispatches rendering based
 *     on question.type (smiley, choice, textarea, indicator).
 *   - SmileySelector: emoji button grid with selected state styling.
 *   - SingleChoice: radio button list with selected state.
 *   - TextArea: text input field with placeholder.
 *   - Indicator: horizontal slider (range input) with labels.
 *   - All selectors accept a callback (onSelect/onChange) that triggers parent
 *     onAnswer(questionId, value).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   question        — AssessmentQuestionItem with type and options
 *   questionIndex   — current question number (for progress display)
 *   totalQuestions  — total question count (for progress display)
 *   selectedAnswer  — current answer value (string, number, or array)
 *   onAnswer        — callback fired when answer changes
 *   AssessmentQuestionCard — default export
 *
 * DEPENDENCIES:
 *   React useState hook
 *   Tailwind CSS for styling
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import { useState } from "react";

interface AssessmentOption {
  id: string;
  label: string;
  value: string | number;
  order: number;
}
interface AssessmentQuestionItem {
  id: string;
  type: string;
  title?: string;
  subtitle?: unknown;
  hint?: unknown;
  continueLabel?: string;
  order?: number;
  smileys?: unknown[];
  count?: unknown;
  label?: unknown;
  prompt?: string;
  choice?: unknown;
  answer?: unknown;
  text?: string;
  options?: AssessmentOption[];
}

function extractTextFromRich(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (obj.text && typeof obj.text === "string") return obj.text;
    if (obj.en && typeof obj.en === "string") return obj.en;
  }
  return "";
}

interface AssessmentQuestionCardProps {
  question: AssessmentQuestionItem;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer?: string | number | number[];
  onAnswer: (questionId: string, value: string | number | number[]) => void;
}

function SmileySelector({
  options,
  selected,
  onSelect,
}: {
  options: AssessmentOption[];
  selected?: string | number | number[];
  onSelect: (value: number) => void;
}) {
  const defaultOptions = [
    { emoji: "😔", label: "Never" },
    { emoji: "🙁", label: "Rarely" },
    { emoji: "😐", label: "Sometimes" },
    { emoji: "🙂", label: "Often" },
    { emoji: "😊", label: "Always" },
  ];

  const displayOptions = options.length > 0 ? options : defaultOptions;

  return (
    <div className="grid grid-cols-5 gap-2">
      {displayOptions.map((opt, index) => {
        const emoji = "emoji" in opt ? (opt.emoji as string) : defaultOptions[index]?.emoji;
        const label =
          "label" in opt ? opt.label : (defaultOptions[index]?.label ?? String(index + 1));
        const value = "value" in opt ? opt.value : index;
        const isSelected = selected === value || selected === index;

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-primary/30 bg-primary/5 shadow-[var(--sh-1)]"
                : "border-transparent bg-card hover:border-border"
            }`}
          >
            <span className="text-3xl">{emoji}</span>
            <span
              className={`text-[10px] font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SingleChoice({
  options,
  selected,
  onSelect,
}: {
  options: AssessmentOption[];
  selected?: string | number | number[];
  onSelect: (value: number) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      {options.map((opt, index) => {
        const isSelected =
          selected === opt.value || selected === index || selected === String(opt.value);

        return (
          <button
            key={opt.id ?? index}
            onClick={() => onSelect(typeof opt.value === "number" ? index : Number(opt.value))}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
              isSelected
                ? "border-primary/30 bg-primary/5"
                : "border-transparent bg-card hover:border-border"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? "border-primary bg-primary" : "border-border"
              }`}
            >
              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span
              className={`text-sm ${isSelected ? "text-primary font-medium" : "text-foreground"}`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Type your answer here..."}
      className="w-full h-40 p-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground resize-none"
    />
  );
}

function Indicator({
  value,
  onChange,
}: {
  value?: string | number;
  onChange: (v: number) => void;
}) {
  const [sliderValue, setSliderValue] = useState<number>(typeof value === "number" ? value : 50);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Low</span>
        <span className="font-semibold text-primary">{sliderValue}</span>
        <span>High</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        onChange={(e) => {
          const v = Number(e.target.value);
          setSliderValue(v);
          onChange(v);
        }}
        className="w-full h-2 bg-muted rounded-xl appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

export function AssessmentQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswer,
}: AssessmentQuestionCardProps) {
  const title = question.title ?? "";
  const subtitle = question.subtitle ? extractTextFromRich(question.subtitle) : "";
  const hint = question.hint ? extractTextFromRich(question.hint) : "";
  const type = question.type ?? "";
  const prompt = question.prompt ?? "";
  const text = question.text ?? "";
  const options = question.options ?? [];

  const handleSingleSelect = (value: number) => {
    onAnswer(question.id, value);
  };

  const handleTextChange = (value: string) => {
    onAnswer(question.id, value);
  };

  const handleIndicatorChange = (value: number) => {
    onAnswer(question.id, value);
  };

  const renderQuestionContent = () => {
    if (type.includes("smiley") || type.includes("emotion")) {
      return (
        <SmileySelector options={options} selected={selectedAnswer} onSelect={handleSingleSelect} />
      );
    }

    if (type.includes("text-to-speech") || type.includes("textarea")) {
      return (
        <TextArea
          value={selectedAnswer as string}
          onChange={handleTextChange}
          placeholder={text || undefined}
        />
      );
    }

    if (type.includes("indicator") || type.includes("slider")) {
      return <Indicator value={selectedAnswer as number} onChange={handleIndicatorChange} />;
    }

    if (type.includes("choice") || type.includes("option")) {
      if (options.length > 0) {
        return (
          <SingleChoice options={options} selected={selectedAnswer} onSelect={handleSingleSelect} />
        );
      }
    }

    return (
      <TextArea
        value={selectedAnswer as string}
        onChange={handleTextChange}
        placeholder="Type your answer here..."
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {prompt && (
          <p className="text-xs font-medium text-primary uppercase tracking-wide">{prompt}</p>
        )}
        <h2 className="text-lg font-semibold text-foreground leading-relaxed">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-4">{renderQuestionContent()}</div>

      {hint && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
          <span className="font-medium">Hint: </span>
          {hint}
        </div>
      )}
    </div>
  );
}
