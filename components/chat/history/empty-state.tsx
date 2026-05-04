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
 * LAST UPDATED: 2026-05-04 — GlyphTile orange tint (brand primary); bigger CTA
 */

import { MessageSquare, Plus } from "lucide-react";
import { GlyphTile } from "@/components/shared/glyph-tile";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onNewChat: () => void;
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
      <GlyphTile icon={MessageSquare} tint="orange" size="lg" className="w-16 h-16 rounded-2xl" />

      <div>
        <p className="font-semibold text-foreground">No chat history yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Start a conversation with Riya to create your first chat session.
        </p>
      </div>

      <Button
        size="lg"
        className="rounded-full gap-2 px-8 shadow-[var(--sh-glow-orange)]"
        onClick={onNewChat}
        aria-label="Start a new chat"
      >
        <Plus className="w-5 h-5" />
        Start New Chat
      </Button>
    </div>
  );
}
