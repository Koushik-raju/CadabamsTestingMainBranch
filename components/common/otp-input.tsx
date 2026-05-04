/**
 * FILE: components/common/otp-input.tsx
 *
 * PURPOSE:
 *   Renders a customizable one-time-password (OTP) input component that accepts numeric digits
 *   only. Supports paste, arrow keys, backspace, and automatic focus management between fields.
 *
 * LOGIC OVERVIEW:
 *   Displays a row of number input fields (default 4). Each field accepts one digit. On input,
 *   automatically moves focus to the next field if a digit is entered. Supports pasting a complete
 *   OTP code, arrow key navigation, and backspace deletion. The component maintains a refs array
 *   to manage focus between fields.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   value             — String of digits entered; controlled by onChange callback
 *   onChange          — Callback fired with the complete OTP string when user types or pastes
 *   length            — Number of OTP fields (default 4)
 *   label             — Label text displayed above the inputs (default "Enter OTP")
 *   refs              — useRef array tracking each input element for focus management
 *   OTPInput          — Main export; controlled component for OTP entry
 *
 * DEPENDENCIES:
 *   React hooks: useEffect, useRef
 *   shadcn/ui primitives: Input, Label
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: file header added
 */

"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  label?: string;
}

export function OTPInput({ value = "", onChange, length = 4, label = "Enter OTP" }: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    if (raw.length === 1) {
      const arr = value.split("").concat(Array(length).fill("")).slice(0, length);
      arr[idx] = raw;
      onChange(arr.join("").slice(0, length));
      if (idx < length - 1) refs.current[idx + 1]?.focus();
    } else {
      const pasted = raw.slice(0, length);
      onChange(pasted);
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[idx]) {
        const arr = value.split("");
        arr[idx] = "";
        onChange(arr.join(""));
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
        const arr = value.split("");
        arr[idx - 1] = "";
        onChange(arr.join(""));
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex gap-3">
        {Array.from({ length }).map((_, idx) => (
          <Input
            key={idx}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d*"
            maxLength={length}
            value={value[idx] || ""}
            onChange={(e) => handleInput(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onFocus={(e) => e.target.select()}
            onPaste={handlePaste}
            className="w-14 h-14 text-center text-xl font-semibold"
          />
        ))}
      </div>
    </div>
  );
}
