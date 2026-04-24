/**
 * FILE: components/home/support-section.tsx
 *
 * PURPOSE:
 *   Card on the home screen offering two CTAs for finding a therapist:
 *   "Talk to a therapist" (direct listing) and "Match me" (guided wizard).
 *
 * LOGIC OVERVIEW:
 *   1. Renders a card with a grid icon and "Find the right expert for you" heading.
 *   2. Two full-width buttons delegate navigation to the parent via callbacks.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   onTalk   — called when user taps "Talk to a therapist"; navigates to find-therapist list
 *   onMatch  — called when user taps "Match me"; navigates to find-therapist wizard
 *
 * DEPENDENCIES:
 *   Button, Card, CardContent — shadcn/ui primitives
 *   LayoutGrid                — lucide-react icon
 *
 * LAST UPDATED: 2026-04-24 — add file header; increase button size to lg
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";

interface Props {
  onTalk: () => void;
  onMatch: () => void;
}

export function SupportSection({ onTalk, onMatch }: Props) {
  return (
    <div className="px-4 mb-8">
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <LayoutGrid size={24} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-[1.5px]">
                NEED SUPPORT?
              </span>
              <h4 className="text-lg font-bold leading-tight">Find the right expert for you</h4>
            </div>
          </div>
          <div className="flex gap-3">
            <Button size="lg" onClick={onTalk} className="flex-1 rounded-full">
              Talk to a therapist
            </Button>
            <Button size="lg" onClick={onMatch} variant="secondary" className="flex-1 rounded-full">
              Match me
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
