/**
 * FILE: components/ui/badge.tsx
 *
 * PURPOSE:
 *   Shadcn Badge primitive extended with MindTalk categorical tint variants.
 *   All MindTalk variants use the --mt-tint-* color system (soft pastels + fg).
 *
 * LOGIC OVERVIEW:
 *   CVA variant map covers original shadcn variants + MindTalk tint variants
 *   (mt-blue, mt-purple, mt-green, mt-pink, mt-peach, mt-orange, mt-ai).
 *   All variants are pill-shaped (rounded-full). The mt-ai variant is the
 *   AI-generated pill: cream bg, warning-orange text, border.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   variant — default | secondary | destructive | outline | ghost | link |
 *             mt-blue | mt-purple | mt-green | mt-pink | mt-peach | mt-orange | mt-ai
 *
 * DEPENDENCIES:
 *   class-variance-authority, radix-ui/Slot, cn utility
 *
 * LAST UPDATED: 2026-04-28 — Added MindTalk tint variants and AI pill (Phase 2 migration)
 */

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        /* ── Original shadcn variants ── */
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-[#FCE4E2] text-[#DC4B45] focus-visible:ring-[#DC4B45]/20 [a]:hover:bg-[#FCE4E2]/80",
        outline: "border-[#ECE6DE] text-[#0E1726] [a]:hover:bg-[#F4F2EE]",
        ghost: "hover:bg-[#F4F2EE] hover:text-[#4A5260]",
        link: "text-primary underline-offset-4 hover:underline",

        /* ── MindTalk categorical tints ── */
        "mt-blue": "bg-[#E8F1FF] text-[#2C7BE5]",
        "mt-purple": "bg-[#F1EBFF] text-[#6C5CE7]",
        "mt-green": "bg-[#E6F4EA] text-[#1F8B4C]",
        "mt-pink": "bg-[#FFE6EA] text-[#D03B5C]",
        "mt-peach": "bg-[#FFE9D9] text-[#C9531A]",
        "mt-orange": "bg-[#FFE4D2] text-[#E8620A]",

        /* AI-generated pill: cream bg, warning-orange text, peach border */
        "mt-ai": "bg-[#FBF5EF] text-[#C9531A] border border-[#FFE9D9] font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
