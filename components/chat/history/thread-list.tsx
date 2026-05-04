/**
 * FILE: components/chat/history/thread-list.tsx
 *
 * PURPOSE:
 *   Renders all chat threads in a single grouped card (one Card, Separator between
 *   rows) and a floating "New Chat" FAB at the bottom.
 *
 * LOGIC OVERVIEW:
 *   - Wraps every ThreadCard row in one Card/CardContent with Separators between
 *     items — follows the design-system grouped-list rule (no one-Card-per-item).
 *   - Section heading shows thread count as a subtitle.
 *   - FAB (New Chat) is shown when onNewChat is provided.
 *   - Safe-area-inset-bottom applied to FAB wrapper for Capacitor shell.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threads         — array of MastraThread objects (previous chats)
 *   onThreadClick   — callback fired when user selects a thread
 *   onNewChat       — optional callback to start a new conversation
 *
 * DEPENDENCIES:
 *   Button, Card, CardContent, Separator — shadcn/ui primitives
 *   ThreadCard      — row component for individual thread display
 *
 * LAST UPDATED: 2026-05-04 — grouped-list card pattern, section heading, FAB glow
 */

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MastraThread } from "@/lib/chat";
import { ThreadCard } from "./thread-card";

interface ThreadListProps {
  threads: MastraThread[];
  onThreadClick: (thread: MastraThread) => void;
  onNewChat?: () => void;
}

export function ThreadList({ threads, onThreadClick, onNewChat }: ThreadListProps) {
  return (
    <>
      <section className="flex-1 px-4 py-3" aria-label="Previous chat sessions">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">Recent Chats</h2>
          <span className="text-xs text-muted-foreground">
            {threads.length} session{threads.length !== 1 ? "s" : ""}
          </span>
        </div>

        <Card className="rounded-3xl shadow-[var(--sh-2)] border border-border">
          <CardContent className="py-0 px-3">
            {threads.map((thread, i) => (
              <div key={thread.id}>
                <ThreadCard thread={thread} onClick={onThreadClick} />
                {i < threads.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {onNewChat && (
        <div className="flex justify-center py-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
          <Button
            className="rounded-full gap-2 px-8 shadow-[var(--sh-glow-orange)]"
            size="lg"
            onClick={onNewChat}
            aria-label="Start a new chat session"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </Button>
        </div>
      )}
    </>
  );
}
