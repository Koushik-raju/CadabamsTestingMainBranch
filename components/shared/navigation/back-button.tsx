/**
 * FILE: components/shared/navigation/back-button.tsx
 *
 * PURPOSE:
 *   Single back-navigation button used on all inner pages. Supports three
 *   back strategies so callers never need to build router logic themselves.
 *
 * LOGIC OVERVIEW:
 *   Priority (highest → lowest):
 *     1. onClick  — fully custom handler, called as-is.
 *     2. hardBack — router.replace() to the given path, ignoring browser history.
 *     3. fallback — useSafeBack; goes back in history or falls back to the path.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   fallback  — path used by useSafeBack when history stack is empty (default: "/home")
 *   hardBack  — if set, always replaces to this path regardless of history
 *   onClick   — fully custom handler; takes priority over hardBack and fallback
 *   className — extra classes on the Button element
 *
 * DEPENDENCIES:
 *   useSafeBack   — hooks/use-safe-back
 *   useRouter     — next/navigation (only when hardBack is provided)
 *
 * LAST UPDATED: 2026-04-27 — added hardBack prop so callers need no router logic
 */

"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSafeBack } from "@/hooks/use-safe-back";

interface BackButtonProps {
  fallback?: string;
  /** Always navigate to this path on back, bypassing browser history entirely. */
  hardBack?: string;
  className?: string;
  onClick?: () => void;
}

export function BackButton({ fallback, hardBack, className, onClick }: BackButtonProps) {
  const router = useRouter();
  const goBack = useSafeBack(fallback);

  /* Resolve handler once: custom onClick → hard replace → safe history back. */
  const handleClick = onClick ?? (hardBack ? () => router.replace(hardBack) : goBack);

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} className={className}>
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
}
