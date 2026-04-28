/**
 * FILE: components/ui/button.tsx
 *
 * PURPOSE:
 *   Shadcn Button primitive extended with MindTalk design-system variants.
 *   All mt-* variants follow the design system spec: pill shape, brand-orange
 *   primary, coral-to-orange gradient, soft-white secondary, ghost, danger.
 *
 * LOGIC OVERVIEW:
 *   CVA variant map covers both the original shadcn variants (default, outline,
 *   secondary, ghost, destructive, link) and the new MindTalk variants (mt-primary,
 *   mt-gradient, mt-secondary, mt-ghost, mt-danger, mt-dark). The MindTalk variants
 *   are pill-shaped (rounded-full) with the correct sizing (py-4 px-6 for md).
 *   Press feedback is scale(0.97) via active: transform; orange glow shadow on primary.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   variant         — shadcn variants + mt-primary | mt-gradient | mt-secondary |
 *                     mt-ghost | mt-danger | mt-dark
 *   size            — default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg |
 *                     mt-sm | mt-md | mt-lg
 *   buttonVariants  — exported CVA fn for use in asChild patterns
 *
 * DEPENDENCIES:
 *   class-variance-authority, radix-ui/Slot, cn utility
 *
 * LAST UPDATED: 2026-04-28 — Added full MindTalk variant set per design system migration
 */

import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* ── Original shadcn variants (kept for backward compat) ── */
        default:
          "rounded-lg bg-primary text-primary-foreground active:translate-y-px [a]:hover:bg-primary/80",
        outline:
          "rounded-lg border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "rounded-lg hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",

        /* ── MindTalk design-system variants ── */

        /* Primary: solid orange, pill, orange glow shadow, scale-down on press */
        "mt-primary":
          "rounded-full bg-[#F97316] text-white font-bold shadow-[0_8px_18px_rgba(249,115,22,0.28)] hover:bg-[#E8620A] active:scale-[0.97] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] transition-[transform,box-shadow] duration-[140ms]",

        /* Gradient: coral-to-orange pill, same press feedback */
        "mt-gradient":
          "rounded-full bg-gradient-to-r from-[#F77268] to-[#F97316] text-white font-bold shadow-[0_8px_18px_rgba(247,114,104,0.22)] hover:opacity-90 active:scale-[0.97] active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] transition-[transform,box-shadow,opacity] duration-[140ms]",

        /* Secondary: white pill, soft shadow, ink text */
        "mt-secondary":
          "rounded-full bg-white text-[#0E1726] font-bold shadow-[0_2px_6px_rgba(15,23,42,0.05),0_6px_16px_rgba(15,23,42,0.04)] hover:bg-[#FBF5EF] active:scale-[0.97] transition-[transform,background-color] duration-[140ms]",

        /* Ghost: transparent, orange text, no shadow */
        "mt-ghost":
          "rounded-full bg-transparent text-[#F97316] font-bold hover:bg-[#FFF4EC] active:scale-[0.97] transition-[transform,background-color] duration-[140ms]",

        /* Danger: white bg, danger-red text, soft danger border */
        "mt-danger":
          "rounded-full bg-white text-[#DC4B45] font-bold border border-[#FCE4E2] hover:bg-[#FCE4E2] active:scale-[0.97] transition-[transform,background-color] duration-[140ms]",

        /* Dark: near-black fill, white text — hero cards / dark surfaces */
        "mt-dark":
          "rounded-full bg-[#1C2433] text-white font-bold hover:bg-[#2D3441] active:scale-[0.97] transition-[transform,background-color] duration-[140ms]",
      },
      size: {
        /* ── Shadcn sizes ── */
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9",

        /* ── MindTalk sizes (pill, generous padding) ── */
        "mt-sm": "gap-1.5 px-4 py-2.5 text-[13px]",
        "mt-md": "gap-2 px-[22px] py-[14px] text-[15px]",
        "mt-lg": "gap-2 px-7 py-4 text-base w-full justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
