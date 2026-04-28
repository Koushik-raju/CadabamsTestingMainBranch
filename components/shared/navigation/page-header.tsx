/**
 * FILE: components/shared/navigation/page-header.tsx
 *
 * PURPOSE:
 *   Reusable page-level header with a back button, title, optional subtitle,
 *   and an optional right-side action slot. Standardises the header pattern
 *   used across all inner pages (self-journaling, assessments, wellness, etc.).
 *
 * LOGIC OVERVIEW:
 *   Renders a top bar (sticky by default): BackButton | title+subtitle | optional right slot.
 *   Pass sticky={false} to opt out, or override with className if needed.
 *   Back behaviour is delegated entirely to BackButton — pass fallback, hardBack,
 *   or onBack and BackButton resolves the priority internally.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title       — main heading text (required)
 *   subtitle    — secondary line below the title (optional)
 *   fallback    — router path BackButton uses when history is empty (default: "/home")
 *   hardBack    — if set, back button always replaces to this path, ignoring history
 *   onBack      — fully custom handler; takes priority over hardBack and fallback
 *   right       — ReactNode rendered flush-right (optional, e.g. filter button)
 *   sticky      — whether the header sticks to the top on scroll (default: true)
 *   className   — extra classes on the outer wrapper
 *
 * DEPENDENCIES:
 *   BackButton — components/shared/navigation/back-button.tsx
 *
 * LAST UPDATED: 2026-04-27 — added sticky prop (default true); fixed WebKit overflow-x ancestor bug
 */

"use client";

import { BackButton } from "@/components/shared/navigation/back-button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  fallback?: string;
  /** Always navigate to this path on back, bypassing browser history entirely. */
  hardBack?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Stick the header to the top of the scroll container. Defaults to true. */
  sticky?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  fallback = "/home",
  hardBack,
  onBack,
  right,
  sticky = true,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-5 pt-5 pb-1",
        sticky && "sticky top-0 z-10",
        className,
      )}
      style={{ background: "#FAF7F4" }}
    >
      <BackButton fallback={fallback} hardBack={hardBack} onClick={onBack} />

      <div className="flex-1 min-w-0">
        <h1 className="text-[18px] font-bold leading-tight" style={{ color: "#0E1726" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: "#6B7280" }}>
            {subtitle}
          </p>
        )}
      </div>

      {right && <div className="flex-shrink-0 flex items-center gap-1">{right}</div>}
    </div>
  );
}
