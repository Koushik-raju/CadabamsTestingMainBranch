/**
 * FILE: components/home/tracker-bar.tsx
 *
 * PURPOSE:
 *   Compact three-column tracker strip shown on the home screen above Quick Actions.
 *   Taps route to mood, stress, and sleep tracker pages via the parent callback.
 *
 * LOGIC OVERVIEW:
 *   Static TRACKERS config drives three equal-width tiles inside a single Card.
 *   Each tile: small GlyphTile icon + label + subtitle, tapping fires onTrackerClick.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   TRACKERS        — static config: key, label, subtitle, icon, tint
 *   onTrackerClick  — callback with tracker key; parent handles routing
 *
 * DEPENDENCIES:
 *   GlyphTile — shared glyph icon tile
 *   lucide-react — icons
 *
 * LAST UPDATED: 2026-05-04 — created; extracted trackers out of QuickActions into compact bar
 */

import { GlyphTile } from "@/components/shared/glyph-tile";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Moon, Smile } from "lucide-react";

const TRACKERS = [
  {
    key: "mood-tracker",
    label: "Mood",
    subtitle: "Daily check-in",
    icon: Smile,
    tint: "pink" as const,
  },
  {
    key: "stress-tracker",
    label: "Stress",
    subtitle: "Quick log",
    icon: Activity,
    tint: "orange" as const,
  },
  { key: "sleep-tracker", label: "Sleep", subtitle: "Nightly", icon: Moon, tint: "blue" as const },
];

interface Props {
  onTrackerClick?: (key: string) => void;
}

export function TrackerBar({ onTrackerClick }: Props) {
  return (
    <div className="px-5 mb-8">
      <Card className="overflow-hidden py-0">
        <CardContent className="p-0">
          <div className="grid grid-cols-3 divide-x divide-border">
            {TRACKERS.map(({ key, label, subtitle, icon: Icon, tint }) => (
              <button
                key={key}
                className="flex flex-col items-center gap-2 py-4 px-2 active:bg-muted/60 transition-colors"
                onClick={() => onTrackerClick?.(key)}
              >
                <GlyphTile icon={Icon} tint={tint} size="sm" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[13px] font-semibold leading-none text-[#0E1726]">
                    {label}
                  </span>
                  <span className="text-[10px] font-medium leading-none text-[#6B7280]">
                    {subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
