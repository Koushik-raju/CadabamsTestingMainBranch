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
 *   5. A FAB (SquarePen icon, bottom-right) is the primary "new chat" CTA —
 *      always reachable regardless of scroll position. PageHeader keeps no
 *      right-slot button so the header stays clean.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   resource_id     — user identity from mastraDataContext
 *   threads         — SWR data: array of MastraThread (normalised dates)
 *   isLoading       — true during the initial threads fetch
 *
 * DEPENDENCIES:
 *   useThreads, mastraDataContext, ThreadList, LoadingState, EmptyState,
 *   PageHeader
 *
 * LAST UPDATED: 2026-05-04 — replace header button with bottom-right FAB for new chat
 */
"use client";

import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { EmptyState } from "@/components/chat/history/empty-state";
import { LoadingState } from "@/components/chat/history/loading-state";
import { ThreadList } from "@/components/chat/history/thread-list";
import { PageHeader } from "@/components/shared/navigation/page-header";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { useThreads } from "@/hooks/use-threads";

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
    <main className="relative flex flex-col min-h-screen bg-background">
      <PageHeader title="My AI Chats" fallback="/home" hardBack="/home" />

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

      {/* FAB — primary CTA for starting a new chat. Fixed to bottom-right so
          it stays above the bottom nav bar (pb-24 on main handles the gap). */}
      <button
        type="button"
        onClick={handleNewChat}
        aria-label="New chat"
        className="fixed bottom-8 right-5 z-20 flex items-center gap-2 rounded-full bg-primary px-5 py-3 shadow-lg shadow-primary/30 active:scale-95 transition-transform"
      >
        <SquarePen className="size-4 text-white" />
        <span className="text-sm font-semibold text-white">New Chat</span>
      </button>
    </main>
  );
}
