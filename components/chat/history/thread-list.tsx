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
            className="rounded-full gap-2 shadow-lg"
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
