/**
 * FILE: components/shared/search-bar.tsx
 *
 * PURPOSE:
 *   Generic, reusable search input bar for use across the app — inline in pages,
 *   inside PageHeader's subHeader slot, or anywhere a text search field is needed.
 *
 * LOGIC OVERVIEW:
 *   Wraps the shadcn Input primitive with a leading Search icon and an optional
 *   dismiss (X) button that appears once the user has typed anything.
 *   Controlled via value + onChange; optionally uncontrolled via defaultValue.
 *   The dismiss button calls onChange("") and re-focuses the input so the user
 *   can immediately type a new query without lifting a finger.
 *   All layout sizing and padding is exposed through className so callers can
 *   adapt to any context (full-width page bar, constrained panel, etc.).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   value         — controlled value (optional; omit for uncontrolled)
 *   defaultValue  — uncontrolled initial value (optional)
 *   onChange      — called with the new string on every keystroke or dismiss
 *   placeholder   — input placeholder text (default: "Search…")
 *   autoFocus     — whether the input is focused on mount (default: false)
 *   disabled      — disables the field (default: false)
 *   className     — extra classes on the outer wrapper div
 *   inputClassName — extra classes forwarded directly to the <Input> element
 *
 * DEPENDENCIES:
 *   Input — components/ui/input.tsx (shadcn, MindTalk-themed)
 *
 * LAST UPDATED: 2026-05-07 — initial creation
 */

"use client";

import { Search, X } from "lucide-react";
import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called with the raw ChangeEvent for callers that need the full event. */
  onInput?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Called when the user taps the dismiss (×) button. Overrides the default clear+focus behaviour. */
  onClear?: () => void;
  /** Called on keydown — e.g. to detect Enter for search submission. */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function SearchBar({
  value,
  defaultValue,
  onChange,
  onInput,
  onClear,
  onKeyDown,
  placeholder = "Search…",
  autoFocus = false,
  disabled = false,
  className,
  inputClassName,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value !== undefined ? value.length > 0 : undefined;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value);
    onInput?.(e);
  }

  function handleDismiss() {
    if (onClear) {
      onClear();
    } else {
      onChange?.("");
    }
    inputRef.current?.focus();
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0"
        style={{ color: "#9AA0AB" }}
        aria-hidden
      />

      <Input
        ref={inputRef}
        type="search"
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        // Extra left padding to clear the search icon; extra right padding when dismiss is visible
        className={cn("pl-9", hasValue ? "pr-9" : "pr-4", inputClassName)}
      />

      {/* Dismiss button — only shown when the field has a value (controlled mode) */}
      {hasValue && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full hover:bg-[#F0ECE8] transition-colors duration-140 active:scale-90"
        >
          <X className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
        </button>
      )}
    </div>
  );
}
