/**
 * FILE: components/home/support-section.tsx
 *
 * PURPOSE:
 *   Card on the home screen offering two CTAs for finding a therapist:
 *   "Talk to a therapist" (direct listing) and "Match me" (guided wizard).
 *
 * LOGIC OVERVIEW:
 *   1. Renders a white card with a blue glyph tile and "Find the right expert for you" heading.
 *   2. Two buttons: primary mt-primary ("Talk to a therapist") and mt-secondary ("Match me").
 *      "Not sure?" copy above uses the design system recommendation pattern.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   onTalk   — called when user taps "Talk to a therapist"; navigates to find-therapist list
 *   onMatch  — called when user taps "Match me"; navigates to find-therapist wizard
 *
 * DEPENDENCIES:
 *   Button, Card, CardContent — shadcn/ui primitives
 *   Users2                    — lucide-react icon
 *
 * LAST UPDATED: 2026-04-28 — Redesigned with mt-* button variants, blue glyph tile,
 *   design-system type scale, and sentence-case copy
 */

import { Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  onTalk: () => void;
  onMatch: () => void;
}

export function SupportSection({ onTalk, onMatch }: Props) {
  return (
    <div className="px-5 mb-8">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-1">
          {/* Glyph tile + heading */}
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: "#E8F1FF" }}
            >
              <Users2 size={20} style={{ color: "#2C7BE5" }} strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="mt-overline">Need support?</span>
              <h4 className="text-[17px] font-bold leading-tight text-[#0E1726]">
                Find the right expert for you
              </h4>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <Button variant="mt-primary" size="mt-sm" onClick={onTalk} className="flex-1">
              Talk to a therapist
            </Button>
            <Button variant="mt-secondary" size="mt-sm" onClick={onMatch} className="flex-1">
              Match me
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
