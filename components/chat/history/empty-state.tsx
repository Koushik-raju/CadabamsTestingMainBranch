/**
 * FILE: components/chat/history/empty-state.tsx
 *
 * PURPOSE:
 *   Full-page empty state shown when the user has no chat threads yet.
 *   Follows the design-system empty-state pattern (§7): centred icon tile,
 *   headline, supporting text, and a primary CTA button.
 *
 * LOGIC OVERVIEW:
 *   - GlyphTile (purple, lg) for the canonical icon tile.
 *   - Primary CTA uses size="lg" rounded-full with the orange glow shadow.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   onNewChat       — callback fired when the user taps "Start New Chat"
 *
 * DEPENDENCIES:
 *   GlyphTile — components/shared/glyph-tile.tsx
 *   Button    — shadcn/ui button primitive
 *   lucide-react — MessageSquare, Plus
 *
 * LAST UPDATED: 2026-05-04 — remove CTA button; FAB on parent page handles new chat
 */

import { MessageSquare } from "lucide-react";
import { GlyphTile } from "@/components/shared/glyph-tile";

interface EmptyStateProps {
  onNewChat: () => void;
}

export function EmptyState({ onNewChat: _ }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
      <GlyphTile icon={MessageSquare} tint="orange" size="lg" className="w-16 h-16 rounded-2xl" />

      <div>
        <p className="font-semibold text-foreground">No chat history yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Tap the button below to start a conversation with Riya.
        </p>
      </div>
    </div>
  );
}
