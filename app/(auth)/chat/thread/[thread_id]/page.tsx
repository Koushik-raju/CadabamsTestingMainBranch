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
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threadId        — UUID from URL, scopes the chat session
 *   resource_id     — user identity from mastraDataContext (JWT sub or UUID)
 *   allMessages     — merged historical + live messages from useChatSession
 *   isStreaming     — true while assistant is generating; disables send button
 *   handleSubmit    — form submit handler; calls useChatSession.sendMessage
 *
 * DEPENDENCIES:
 *   useChatSession, mastraDataContext, ChatHeader, MessageList, ChatInput,
 *   HistoryDrawer
 *
 * LAST UPDATED: 2026-04-16 — consolidated useThreadMessages + useChat into useChatSession
 */
"use client";

import { useCallback, useContext, useState } from "react";
import { useParams } from "next/navigation";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { HistoryDrawer } from "@/components/chat/history-drawer";
import { useChatSession } from "@/hooks/use-chat-session";

export default function ChatPage() {
  const params = useParams();
  const threadId = params.thread_id as string;

  const [historyOpen, setHistoryOpen] = useState(false);
  const { resource_id } = useContext(mastraDataContext);

  const {
    allMessages,
    sendMessage,
    isStreaming,
    loadMore,
    hasMore,
    isLoadingMore,
    text,
    setText,
  } = useChatSession({ threadId, resourceId: resource_id });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(text);
    },
    [text, sendMessage],
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f6f4f2] overflow-hidden">
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
