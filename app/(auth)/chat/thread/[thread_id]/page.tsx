/**
 * FILE: app/(auth)/chat/thread/[thread_id]/page.tsx
 *
 * PURPOSE:
 *   Renders the active chat conversation for a given thread UUID.
 *   Handles both historical message display and real-time streaming replies.
 *
 * LOGIC OVERVIEW:
 *   1. Reads thread_id from URL params and resource_id from mastraDataContext.
 *   2. Delegates all data-fetching and streaming state to useChatSession, which
 *      merges SWR-cached history with live @ai-sdk/react messages.
 *   3. Renders ChatHeader (with history drawer toggle), MessageList (merged
 *      messages + pagination), and ChatInput (send form).
 *   4. HistoryDrawer slides in from the right for navigating past threads.
 *   5. If the URL contains a ?q= param (set by the home header "Ask Dr. Riya"
 *      input), auto-sends that text once as soon as initial loading finishes.
 *      A ref guards against double-sending on re-renders.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threadId        — UUID from URL, scopes the chat session
 *   resource_id     — user identity from mastraDataContext (JWT sub or UUID)
 *   allMessages     — merged historical + live messages from useChatSession
 *   isStreaming     — true while assistant is generating; disables send button
 *   handleSubmit    — form submit handler; calls useChatSession.sendMessage
 *   initialQ        — decoded ?q= value; auto-sent once on first load
 *
 * DEPENDENCIES:
 *   useChatSession, mastraDataContext, ChatHeader, MessageList, ChatInput,
 *   HistoryDrawer
 *
 * LAST UPDATED: 2026-04-28 — remove per-page bg; root layout now owns bg-background
 */
"use client";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { HistoryDrawer } from "@/components/chat/history-drawer";
import { MessageList } from "@/components/chat/message-list";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { useChatSession } from "@/hooks/use-chat-session";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const threadId = params.thread_id as string;

  /* ?q= is set by the home header "Ask Dr. Riya" input. Decode once. */
  const initialQ = searchParams.get("q") ?? "";

  const [historyOpen, setHistoryOpen] = useState(false);
  const { resource_id } = useContext(mastraDataContext);

  const {
    allMessages,
    sendMessage,
    isStreaming,
    loadMore,
    hasMore,
    isLoadingMore,
    isInitialLoading,
    text,
    setText,
  } = useChatSession({ threadId, resourceId: resource_id });

  /* Auto-send the initial question from the home input once loading is done.
   * The ref prevents double-firing on StrictMode double-renders. */
  const sentRef = useRef(false);
  useEffect(() => {
    if (!initialQ || isInitialLoading || sentRef.current) return;
    sentRef.current = true;
    sendMessage(initialQ);
  }, [initialQ, isInitialLoading, sendMessage]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(text);
    },
    [text, sendMessage],
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <ChatHeader onHistoryClick={() => setHistoryOpen(true)} />

      <MessageList
        messages={allMessages}
        isStreaming={isStreaming}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
      />

      <ChatInput
        text={text}
        onTextChange={setText}
        onSubmit={handleSubmit}
        isStreaming={isStreaming}
      />

      <HistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        currentThreadId={threadId}
        resourceId={resource_id}
      />
    </div>
  );
}
