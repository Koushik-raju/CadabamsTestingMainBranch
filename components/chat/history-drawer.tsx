"use client";

import { MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingState } from "@/components/chat/history/loading-state";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useThreads } from "@/hooks/use-threads";
import { formatDate } from "@/lib/chat";

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentThreadId?: string;
  resourceId: string | undefined;
}

export function HistoryDrawer({
  open,
  onOpenChange,
  currentThreadId,
  resourceId,
}: HistoryDrawerProps) {
  const router = useRouter();
  const { data: threads, isLoading, mutate } = useThreads(resourceId);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  const handleThreadClick = (threadId: string) => {
    onOpenChange(false);
    router.push(`/chat/thread/${threadId}`);
  };

  const handleNewChat = async () => {
    setIsCreatingNewChat(true);
    try {
      await mutate();
      const newId = crypto.randomUUID();
      onOpenChange(false);
      router.push(`/chat/thread/${newId}`);
    } finally {
      setIsCreatingNewChat(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="text-base font-semibold">Past Chats</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingState />
          ) : !threads || threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No past chats</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your conversation history will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleThreadClick(thread.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors text-left w-full ${
                    thread.id === currentThreadId ? "bg-muted" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {thread.title ?? "Chat Session"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(thread.updatedAt ?? thread.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <Button
            className="w-full rounded-full gap-2"
            onClick={handleNewChat}
            disabled={isCreatingNewChat}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
