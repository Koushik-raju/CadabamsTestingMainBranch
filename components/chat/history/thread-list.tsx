/**
 * FILE: components/chat/history/thread-list.tsx
 *
 * PURPOSE:
 *   Renders a scrollable list of previous chat threads with a "New Chat" button.
 *   Allows users to navigate between different conversation threads.
 *
 * LOGIC OVERVIEW:
 *   - Maps threads array to ThreadCard components
 *   - Displays "New Chat" button if threads exist and onNewChat callback provided
 *   - Button uses safe-area-inset-bottom for mobile Capacitor shell padding
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threads         — array of MastraThread objects (previous chats)
 *   onThreadClick   — callback fired when user selects a thread
 *   onNewChat       — optional callback to start a new conversation
 *
 * DEPENDENCIES:
 *   Button          — shadcn/ui button primitive
 *   ThreadCard      — component for individual thread display
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
import { Button } from "@/components/ui/button";
import { MastraThread } from "@/lib/chat";
import { Plus } from "lucide-react";
import { ThreadCard } from "./thread-card";

interface ThreadListProps {
  threads: MastraThread[];
  onThreadClick: (thread: MastraThread) => void;
  onNewChat?: () => void;
}

export function ThreadList({ threads, onThreadClick, onNewChat }: ThreadListProps) {
  return (
    <>
      <section
        className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
        aria-label="Previous chat sessions"
      >
        {threads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} onClick={onThreadClick} />
        ))}
      </section>

      {onNewChat && threads.length > 0 && (
        <div className="flex justify-center py-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
          <Button
            className="rounded-full gap-2 shadow-[var(--sh-3)]"
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
