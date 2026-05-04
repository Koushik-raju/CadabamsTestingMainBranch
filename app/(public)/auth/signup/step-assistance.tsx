/**
 * FILE: app/(public)/auth/signup/step-assistance.tsx
 *
 * PURPOSE:
 *   Lets the user select one or more assistance tags ("What brings you here?").
 *
 * LOGIC OVERVIEW:
 *   Reads data.tags from context. Tapping a chip toggles it in/out of the tags array.
 *   Selected chips render with primary bg; unselected with card bg.
 *   Continue button requires at least one tag selected.
 *
 * DEPENDENCIES: useSignupContext, TAGS / coralGrad / coralBtnCls from ./types, cn
 *
 * LAST UPDATED: 2026-05-04 — initial extraction
 */

"use client";

import { cn } from "@/lib/utils";
import { useSignupContext } from "./context";
import { TAGS, coralBtnCls, coralGrad } from "./types";

export function StepAssistance() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();

  const toggle = (tag: string) => {
    const selected = data.tags.includes(tag);
    updateData({
      tags: selected ? data.tags.filter((t) => t !== tag) : [...data.tags, tag],
    });
  };

  return (
    <div className="flex flex-col flex-1 gap-5">
      <div className="pt-2">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[30px] font-black text-foreground leading-tight">
          What brings you here?
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">
          Select all that apply — no judgement here
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {TAGS.map((tag) => {
          const selected = data.tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                "px-4 py-2 rounded-full text-[13px] font-semibold border-2 transition-all active:scale-95",
                selected
                  ? "bg-primary text-white border-primary shadow-[var(--sh-glow-orange)]"
                  : "bg-card text-foreground border-transparent shadow-[var(--sh-1)] hover:border-primary/40",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {data.tags.length > 0 && (
        <p className="text-[12px] text-primary font-medium">{data.tags.length} selected</p>
      )}

      <button
        type="button"
        onClick={goNext}
        disabled={data.tags.length === 0}
        className={coralBtnCls}
        style={coralGrad}
      >
        Continue
      </button>
    </div>
  );
}
