/**
 * FILE: components/chat/history/thread-card.tsx
 *
 * PURPOSE:
 *   Renders a single thread row inside the grouped chat-history card.
 *   Not a standalone Card — ThreadList wraps all rows in one Card with Separators.
 *
 * LOGIC OVERVIEW:
 *   - Accepts thread object and onClick callback
 *   - Handles click and keyboard (Enter/Space) for accessibility
 *   - Shows hover/active colour feedback (design system row pattern)
 *   - Uses GlyphTile (orange tint — brand primary) as the canonical icon tile
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   thread          — MastraThread object containing id, title, createdAt, updatedAt
 *   onClick         — callback fired when user selects this thread
 *
 * DEPENDENCIES:
 *   GlyphTile       — components/shared/glyph-tile.tsx
 *   formatDate      — utility to format thread timestamps
 *   lucide-react    — MessageSquare, ChevronRight
 *
 * LAST UPDATED: 2026-05-04 — swapped inline gradient tile for GlyphTile
 */

import { ChevronRight, MessageSquare } from "lucide-react";
import { GlyphTile } from "@/components/shared/glyph-tile";
import { formatDate, MastraThread } from "@/lib/chat";

interface ThreadCardProps {
  thread: MastraThread;
  onClick: (thread: MastraThread) => void;
}

export function ThreadCard({ thread, onClick }: ThreadCardProps) {
  return (
    <div
      className="flex items-center gap-3 py-0 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted rounded-xl -mx-1 px-1"
      onClick={() => onClick(thread)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(thread);
        }
      }}
    >
      <GlyphTile icon={MessageSquare} tint="orange" size="md" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">
          {thread.title ?? "Chat Session"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(thread.updatedAt ?? thread.createdAt)}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}
