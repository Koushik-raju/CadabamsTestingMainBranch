/**
 * FILE: components/chat/history/thread-card.tsx
 *
 * PURPOSE:
 *   Renders an individual thread card in the chat history list. Displays thread title,
 *   last updated date, and a message icon. Clickable to open the thread.
 *
 * LOGIC OVERVIEW:
 *   - Accepts thread object and onClick callback
 *   - Handles both click and keyboard (Enter/Space) interactions for accessibility
 *   - Scales down briefly on click (active:scale-[0.99]) for feedback
 *   - Shows hover shadow on interaction
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   thread          — MastraThread object containing id, title, createdAt, updatedAt
 *   onClick         — callback fired when user selects this thread
 *
 * DEPENDENCIES:
 *   Card, CardContent — shadcn/ui card primitives
 *   formatDate      — utility to format thread timestamps
 *   lucide-react    — icon components (MessageSquare, ChevronRight)
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
import { Card, CardContent } from "@/components/ui/card";
import { MastraThread } from "@/lib/chat";
import { formatDate } from "@/lib/chat";
import { ChevronRight, MessageSquare } from "lucide-react";

interface ThreadCardProps {
  thread: MastraThread;
  onClick: (thread: MastraThread) => void;
}

export function ThreadCard({ thread, onClick }: ThreadCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-[var(--sh-2)] transition-shadow active:scale-[0.99]"
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
      <CardContent className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {thread.title ?? "Chat Session"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(thread.updatedAt ?? thread.createdAt)}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
