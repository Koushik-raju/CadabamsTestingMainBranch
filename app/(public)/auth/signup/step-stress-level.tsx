/**
 * FILE: app/(public)/auth/signup/step-stress-level.tsx
 *
 * PURPOSE:
 *   Highly interactive stress-level slider (0–10) with a large colour-changing
 *   emoji circle that gives immediate visual feedback as the user drags.
 *
 * LOGIC OVERVIEW:
 *   Reads/writes data.stressLevel (number, default 5) via updateData.
 *   Color, emoji, and label all derive from the current value and update in real time.
 *   Custom CSS injected via <style> for the range thumb (not styleable via Tailwind alone).
 *   Track fill is built with a CSS linear-gradient background split at the current %.
 *
 * DEPENDENCIES: useSignupContext, coralGrad/coralBtnCls
 *
 * LAST UPDATED: 2026-05-04 — initial creation
 */

"use client";

import { useSignupContext } from "./context";
import { coralBtnCls, coralGrad } from "./types";

function getColor(v: number): string {
  if (v <= 2) return "#22c55e";
  if (v <= 4) return "#84cc16";
  if (v <= 6) return "#eab308";
  if (v <= 8) return "#f97316";
  return "#ef4444";
}

function getEmoji(v: number): string {
  if (v <= 1) return "😌";
  if (v <= 3) return "🙂";
  if (v <= 5) return "😐";
  if (v <= 7) return "😟";
  if (v <= 9) return "😰";
  return "🤯";
}

function getLabel(v: number): string {
  if (v <= 2) return "Very Low";
  if (v <= 4) return "Low";
  if (v <= 6) return "Moderate";
  if (v <= 8) return "High";
  return "Very High";
}

export function StepStressLevel() {
  const { data, updateData, goNext, currentIndex, visibleSteps } = useSignupContext();
  const value = data.stressLevel;
  const color = getColor(value);
  const emoji = getEmoji(value);
  const label = getLabel(value);
  const pct = (value / 10) * 100;

  return (
    <div className="flex flex-col flex-1">
      <div className="pt-2 mb-8">
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
          Step {currentIndex + 1} of {visibleSteps.length}
        </p>
        <h1 className="text-[28px] font-black text-foreground leading-tight">
          What&apos;s your current stress level?
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2">Drag the slider to tell us</p>
      </div>

      {/* Live visual circle */}
      <div className="flex flex-col items-center mb-10">
        <div
          className="w-40 h-40 rounded-full flex items-center justify-center shadow-xl transition-all duration-300"
          style={{ background: color }}
        >
          <span
            className="text-7xl select-none transition-all duration-300"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
          >
            {emoji}
          </span>
        </div>
        <p className="mt-5 text-[20px] font-black transition-all duration-300" style={{ color }}>
          {label}
        </p>
        <p className="text-[13px] text-muted-foreground mt-1 tabular-nums">{value} / 10</p>
      </div>

      {/* Styled range slider */}
      <div className="px-1 mb-8">
        {/* Inject thumb styles — not achievable with Tailwind utilities */}
        <style>{`
          .stress-slider { outline: none; }
          .stress-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${color};
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            cursor: pointer;
            transition: border-color 0.3s ease;
          }
          .stress-slider::-moz-range-thumb {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: white;
            border: 3px solid ${color};
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            cursor: pointer;
          }
        `}</style>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => updateData({ stressLevel: parseInt(e.target.value) })}
          className="stress-slider w-full h-2 rounded-full appearance-none cursor-pointer transition-all duration-150"
          style={{
            background: `linear-gradient(to right, ${color} ${pct}%, rgba(0,0,0,0.1) ${pct}%)`,
          }}
        />
        <div className="flex justify-between mt-2.5 px-0.5">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <span key={n} className="text-[10px] text-muted-foreground tabular-nums">
              {n}
            </span>
          ))}
        </div>
      </div>

      <button type="button" onClick={goNext} className={coralBtnCls} style={coralGrad}>
        Continue
      </button>
    </div>
  );
}
