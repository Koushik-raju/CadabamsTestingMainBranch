"use client";

import { useRouter } from "next/navigation";
import { useContext } from "react";
import { BackButton } from "@/components/shared/navigation/back-button";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { useThreads } from "@/hooks/use-threads";
import { ThreadList } from "@/components/chat/history/thread-list";
import { LoadingState } from "@/components/chat/history/loading-state";
import { EmptyState } from "@/components/chat/history/empty-state";

export default function ChatHistoryPage() {
  const router = useRouter();
  const { resource_id } = useContext(mastraDataContext);
  const { data: threads, isLoading } = useThreads(resource_id);

  const handleNewChat = () => {
    router.push(`/chat/thread/${crypto.randomUUID()}`);
  };

  const handleThreadClick = (threadId: string) => {
    router.push(`/chat/thread/${threadId}`);
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
      ) : !threads || threads.length === 0 ? (
        <EmptyState onNewChat={handleNewChat} />
      ) : (
        <ThreadList
          threads={threads}
          onThreadClick={(thread) => handleThreadClick(thread.id)}
          onNewChat={handleNewChat}
        />
      )}
    </main>
  );
}