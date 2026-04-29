/**
 * FILE: components/package/package-discovery-card.tsx
 *
 * PURPOSE:
 *   Hero-style package card showing a gradient header with initials circle, price badge,
 *   and basic package info below. Used in package discovery/browse views.
 *
 * LOGIC OVERVIEW:
 *   1. Receives a PackageResponseDto and optional className.
 *   2. Derives initials from first 2 words of package name.
 *   3. Gets color palette via getPackagePalette(pkg.id).
 *   4. Renders gradient header with initials circle, price badge, and arrow.
 *   5. Below header shows package name and session count.
 *   6. On click, navigates to /packages/browse/{pkg.id}.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   pkg                      — PackageResponseDto; the package data to display
 *   className               — optional additional classes for the Card
 *   palette                 — object from getPackagePalette; gradient, badgeBg, iconBg
 *   initials                — 2-char string derived from package name
 *   PackageDiscoveryCard    — exported component function
 *
 * DEPENDENCIES:
 *   @/lib/package-colors    — getPackagePalette function
 *   @/sdk/backend-v2        — PackageResponseDto type
 *   next/navigation         — useRouter hook
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getPackagePalette } from "@/lib/package-colors";
import { cn } from "@/lib/utils";
import type { PackageResponseDto } from "@/sdk/backend-v2";
import { ArrowRight, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

interface PackageDiscoveryCardProps {
  pkg: PackageResponseDto;
  className?: string;
}

export function PackageDiscoveryCard({ pkg, className }: PackageDiscoveryCardProps) {
  const router = useRouter();
  const palette = getPackagePalette(pkg.id);

  const initials = (pkg.package_name ?? "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-[var(--sh-3)] transition-all border-0 overflow-hidden pt-0 active:scale-[0.97]",
        className,
      )}
      onClick={() => router.push(`/packages/browse/${pkg.id}`)}
    >
      {/* Coloured header */}
      <div className={cn("relative h-28 bg-gradient-to-br", palette.gradient)}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white,transparent_55%)]" />
        {/* Initials circle */}
        <div
          className={cn(
            "absolute top-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white",
            palette.iconBg,
          )}
        >
          {initials}
        </div>
        {/* Price badge */}
        <div className="absolute bottom-3 right-3">
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm",
              palette.badgeBg,
              "text-white",
            )}
          >
            ₹{(pkg.amount_total ?? 0).toLocaleString("en-IN")}
          </span>
        </div>
        {/* Arrow */}
        <div className="absolute top-3 right-3">
          <ArrowRight className="w-4 h-4 text-white/60" />
        </div>
      </div>

      <CardContent className="p-2.5 pt-0 mt-2">
        <h4 className="font-bold text-xs text-foreground leading-snug line-clamp-2">
          {pkg.package_name}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Layers className="w-3 h-3" />
          <span>{pkg.package_product_ids.length} Sessions</span>
        </div>
      </CardContent>
    </Card>
  );
}
