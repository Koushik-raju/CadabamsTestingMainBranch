/**
 * FILE: components/journal/journal-entry-card.tsx
 *
 * PURPOSE:
 *   Card displaying a single journal entry preview in the journal list.
 *
 * LOGIC OVERVIEW:
 *   Shows up to 2 prompt-answer blocks (left-bordered orange bar per prompt)
 *   or a free-flow text preview. Date label uses mt-overline style.
 *   Clicking opens the full entry sheet.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   entry     — free-flow text content
 *   prompts   — structured heading/text pairs
 *   createdAt — ISO date string
 *   onClick   — opens entry detail
 *
 * DEPENDENCIES:
 *   Card, CardContent (shadcn)
 *
 * LAST UPDATED: 2026-04-28 — Design system migration: orange left border on prompts,
 *   mt-overline date label, cream tint on prompt blocks
 */

import { Card, CardContent } from "@/components/ui/card";

interface JournalPrompt {
  heading: string;
  text: string;
}

interface JournalEntryCardProps {
  id: string;
  entry?: string;
  prompts?: JournalPrompt[];
  createdAt: string;
  onClick?: () => void;
}

export function JournalEntryCard({ entry, prompts, createdAt, onClick }: JournalEntryCardProps) {
  const preview = prompts && prompts.length > 0 ? prompts[0].text : (entry ?? "");

  return (
    <Card
      className="cursor-pointer active:scale-[0.97] transition-transform duration-[140ms]"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col gap-2.5">
        {prompts && prompts.length > 0 ? (
          <div className="space-y-2">
            {prompts.slice(0, 2).map((p, i) => (
              <div
                key={i}
                className="pl-3 py-1.5 rounded-r-[8px]"
                style={{ borderLeft: "2px solid #F97316", background: "#FFF4EC" }}
              >
                <p className="text-[14px] text-[#0E1726] line-clamp-2 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-[#0E1726] line-clamp-3 leading-relaxed whitespace-pre-wrap">
            {preview}
          </p>
        )}
        {/* mt-overline style date label */}
        <span className="mt-overline">
          {new Date(createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </CardContent>
    </Card>
  );
}
