"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef } from "react";

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
