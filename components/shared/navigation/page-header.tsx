/**
 * FILE: components/shared/navigation/page-header.tsx
 *
 * PURPOSE:
 *   Reusable page-level header with a back button, title, optional subtitle,
 *   and an optional right-side action slot. Standardises the header pattern
 *   used across all inner pages (self-journaling, assessments, wellness, etc.).
 *
 * LOGIC OVERVIEW:
 *   Renders a horizontal flex row: BackButton | title+subtitle | optional right slot.
 *   Back behaviour priority (highest → lowest):
 *     1. `onBack`    — fully custom handler, called as-is.
 *     2. `hardBack`  — router.replace() to the given path, ignoring browser history.
 *     3. `fallback`  — passed to BackButton / useSafeBack; goes back in history or
 *                      falls back to the path if there is no history entry.
 *   Use `hardBack` when the destination must be deterministic regardless of where
 *   the user navigated from (e.g. always go to /home, never to a modal or deep link).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   title       — main heading text (required)
 *   subtitle    — secondary line below the title (optional)
 *   fallback    — router path BackButton uses when history is empty (default: "/home")
 *   hardBack    — if set, back button always replaces to this path, ignoring history
 *   onBack      — fully custom handler; takes priority over hardBack and fallback
 *   right       — ReactNode rendered flush-right (optional, e.g. filter button)
 *   className   — extra classes on the outer wrapper (optional)
 *
 * DEPENDENCIES:
 *   BackButton        — components/shared/navigation/back-button.tsx
 *   useRouter (Next)  — used only when hardBack is provided
 *
 * LAST UPDATED: 2026-04-23 — added hardBack prop for deterministic navigation
 */

"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/shared/navigation/back-button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  fallback?: string;
  /** Always navigate to this path on back, bypassing browser history entirely. */
  hardBack?: string;
  onBack?: () => void;
  right?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  fallback = "/home",
  hardBack,
  onBack,
  right,
  className,
}: PageHeaderProps) {
  const router = useRouter();

  /* Resolve the effective back handler once so BackButton always gets a simple onClick. */
  const resolvedOnBack = onBack ?? (hardBack ? () => router.replace(hardBack) : undefined);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 pt-5 pb-1",
        className,
      )}
    >
      <BackButton fallback={fallback} onClick={resolvedOnBack} />

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-foreground leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {right && (
        <div className="flex-shrink-0 flex items-center gap-1">{right}</div>
      )}
    </div>
  );
}
