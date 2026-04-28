/**
 * FILE: components/ui/input.tsx
 *
 * PURPOSE:
 *   Shadcn Input primitive re-themed for the MindTalk design system.
 *   14px radius, cream-tinted background, orange focus ring.
 *
 * LOGIC OVERVIEW:
 *   Single input element with design-system border (#ECE6DE hairline),
 *   orange focus ring (#F97316), and 14px corner radius matching
 *   the design system's --r-md token. Larger min-height (44px) for
 *   comfortable mobile touch targets.
 *
 * DEPENDENCIES:
 *   cn utility
 *
 * LAST UPDATED: 2026-04-28 — Re-themed to MindTalk design system (Phase 2 migration)
 */

import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        /* Base */
        "min-h-[44px] w-full min-w-0 px-4 py-3 text-base text-[#0E1726]",
        /* Shape — 14px radius matches --r-md */
        "rounded-[14px]",
        /* Border — hairline on cream, orange when focused */
        "border border-[#ECE6DE] bg-white outline-none",
        "transition-[border-color,box-shadow] duration-[140ms]",
        "focus-visible:border-[#F97316] focus-visible:ring-3 focus-visible:ring-[#F97316]/20",
        /* Placeholder */
        "placeholder:text-[#9AA0AB]",
        /* File input */
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#0E1726]",
        /* Disabled */
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F4F2EE] disabled:opacity-50",
        /* Invalid */
        "aria-invalid:border-[#DC4B45] aria-invalid:ring-3 aria-invalid:ring-[#DC4B45]/20",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
