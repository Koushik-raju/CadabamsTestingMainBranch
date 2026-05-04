/**
 * FILE: app/(auth)/chat/page.tsx
 *
 * PURPOSE:
 *   Chat history list page. Shows all past conversation threads for the current
 *   user and provides entry points to open an existing thread or start a new one.
 *
 * LOGIC OVERVIEW:
 *   1. Reads resource_id from mastraDataContext (JWT sub or UUID).
 *   2. Fetches the user's thread list via useThreads(resource_id) — SWR-cached
 *      with key threadsKey(resource_id).
 *   3. Renders LoadingState while fetching, EmptyState when no threads exist,
 *      or ThreadList with the thread cards.
 *   4. handleNewChat navigates to a fresh UUID thread; handleThreadClick opens
 *      an existing thread.
 *   5. New Chat shortcut exposed in the PageHeader right slot so it is always
 *      reachable regardless of scroll position.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   resource_id     — user identity from mastraDataContext
 *   threads         — SWR data: array of MastraThread (normalised dates)
 *   isLoading       — true during the initial threads fetch
 *
 * DEPENDENCIES:
 *   useThreads, mastraDataContext, ThreadList, LoadingState, EmptyState,
 *   PageHeader, Button
 *
 * LAST UPDATED: 2026-05-04 — design system alignment: pb-24, New Chat in header
 */
"use client";

import { EmptyState } from "@/components/chat/history/empty-state";
import { LoadingState } from "@/components/chat/history/loading-state";
import { ThreadList } from "@/components/chat/history/thread-list";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { useThreads } from "@/hooks/use-threads";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";

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
    <main className="flex flex-col min-h-screen bg-background pb-24">
      {/* Safe-area top */}
      <div className="pt-[max(env(safe-area-inset-top,0px),1rem)]" />

      <PageHeader
        title="My AI Chats"
        fallback="/ai-therapy"
        right={
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs"
            onClick={handleNewChat}
            aria-label="Start a new chat"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </Button>
        }
      />

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
