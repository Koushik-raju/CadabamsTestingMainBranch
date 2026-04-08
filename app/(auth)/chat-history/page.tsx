"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { Plus, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/common/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { createMastraClient } from "@/lib/mastra-client";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { v4 as uuidv4 } from "uuid";
import { MASTRA_AGENT_ID } from "@/lib/config";


interface MastraThread {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Unknown date";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown date";
  }
}

function LoadingState() {
  return (
    <div className="space-y-3 px-4 py-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border"
        >
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        No chat history yet
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Start a conversation with Riya to create your first chat session.
      </p>
      <Button
        className="rounded-full gap-2"
        onClick={onNewChat}
        aria-label="Start a new chat"
      >
        <Plus className="w-4 h-4" />
        Start New Chat
      </Button>
    </div>
  );
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const { resource_id } = useContext(mastraDataContext);
  const [threads, setThreads] = useState<MastraThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!resource_id) return;

    async function loadThreads() {
      try {
        const client = await createMastraClient();
        const result = await client.listMemoryThreads({
          resourceId: resource_id,
        });
        setThreads((result.threads ?? []).map((t) => ({
          ...t,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
          updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
        })));
      } catch {
        setThreads([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadThreads();
  }, [resource_id]);

  const handleNewChat = () => {
    router.push(`/chat/${uuidv4()}`);
  };

  const handleThreadClick = (thread: MastraThread) => {
    router.push(`/chat/${thread.id}`);
  };

  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Safe-area top */}
      <div className="pt-[max(env(safe-area-inset-top,0px),1rem)]" />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 pb-4">
        <BackButton fallback="/ai-therapy" />
        <h1 className="text-xl font-extrabold text-foreground">My AI Chats</h1>
      </header>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : threads.length > 0 ? (
        <section
          className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
          aria-label="Previous chat sessions"
        >
          {threads.map((thread) => (
            <Card
              key={thread.id}
              className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
              onClick={() => handleThreadClick(thread)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleThreadClick(thread);
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
          ))}
        </section>
      ) : (
        <EmptyState onNewChat={handleNewChat} />
      )}

      {/* Floating new-chat button (only when list visible) */}
      {!isLoading && threads.length > 0 && (
        <div className="flex justify-center py-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
          <Button
            className="rounded-full gap-2 shadow-lg"
            onClick={handleNewChat}
            aria-label="Start a new chat session"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </Button>
        </div>
      )}
    </main>
  );
}
