/**
 * FILE: components/ui/card.tsx
 *
 * PURPOSE:
 *   Shadcn Card primitive re-themed for the MindTalk design system.
 *   Cards float on the cream canvas with a soft shadow and no border.
 *
 * LOGIC OVERVIEW:
 *   Standard Card compound (Card, CardHeader, CardTitle, CardDescription,
 *   CardAction, CardContent, CardFooter) with design-system defaults:
 *   white bg, --r-lg radius (18px), --sh-2 shadow, no ring/border.
 *   The "hero" size variant bumps to --r-xl (24px) for hero surfaces.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   size — "default" | "sm" | "hero"
 *
 * DEPENDENCIES:
 *   cn utility, design-system CSS vars (--r-lg, --sh-2, --mt-line)
 *
 * LAST UPDATED: 2026-04-28 — Re-themed to MindTalk design system (Phase 2 migration)
 */

import * as React from "react";

import { cn } from "@/lib/utils";

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" | "hero" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        /* White card floating on cream — no border, soft elevation shadow */
        "group/card flex flex-col gap-4 overflow-hidden bg-white text-[#0E1726] text-sm",
        "rounded-[18px] shadow-[0_2px_6px_rgba(15,23,42,0.05),0_6px_16px_rgba(15,23,42,0.04)]",
        "py-4",
        "has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0",
        "*:[img:first-child]:rounded-t-[18px] *:[img:last-child]:rounded-b-[18px]",
        /* Size variants */
        "data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:rounded-[14px]",
        "data-[size=hero]:rounded-[24px] data-[size=hero]:shadow-[0_8px_24px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1",
        "rounded-t-[18px] px-4",
        "group-data-[size=sm]/card:px-3 group-data-[size=hero]/card:rounded-t-[24px]",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        /* Hairline divider when a border-b is applied */
        "[.border-b]:pb-4 border-[#ECE6DE] group-data-[size=sm]/card:[.border-b]:pb-3",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-bold text-base leading-snug text-[#0E1726] group-data-[size=sm]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-[#6B7280]", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-[18px] border-t border-[#ECE6DE] bg-[#F4F2EE] p-4",
        "group-data-[size=sm]/card:p-3",
        "group-data-[size=hero]/card:rounded-b-[24px]",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
