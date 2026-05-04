/**
 * FILE: app/(auth)/chat/thread/[thread_id]/page.tsx
 *
 * PURPOSE:
 *   Renders the active chat conversation for a given thread UUID.
 *   Streams responses from the Mastra super-agent via the Mastra client SDK.
 *
 * LOGIC OVERVIEW:
 *   1. Reads thread_id from URL params and resource_id from mastraDataContext.
 *   2. Delegates streaming state and message management to useAgentChat, which
 *      uses the Mastra client's agent.stream() + processDataStream internally.
 *   3. Renders ChatHeader (with history drawer toggle), MessageList (messages
 *      from useAgentChat), and ChatInput (bound to text/setText/sendMessage).
 *   4. HistoryDrawer slides in from the right for navigating past threads.
 *   5. If the URL contains a ?q= param (set by the home header "Ask Dr. Riya"
 *      input), auto-sends that text once on mount via sendMessage().
 *      A ref guards against double-sending on StrictMode double-renders.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threadId        — UUID from URL, scopes the chat session
 *   resource_id     — user identity from mastraDataContext (JWT sub or UUID)
 *   messages        — UIMessage[] from useAgentChat (all turns in this session)
 *   isStreaming     — true while agent is generating; disables send button
 *   sendMessage     — triggers a new turn (appends user msg + streams reply)
 *   initialQ        — decoded ?q= value; auto-sent once on first mount
 *
 * DEPENDENCIES:
 *   useAgentChat, mastraDataContext, ChatHeader, MessageList, ChatInput,
 *   HistoryDrawer
 *
 * LAST UPDATED: 2026-05-04 — replace useChat/raw-fetch with useAgentChat
 *   (Mastra client SDK via agent.stream + processDataStream)
 */
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { HistoryDrawer } from "@/components/chat/history-drawer";
import { MessageList } from "@/components/chat/message-list";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { useAgentChat } from "@/hooks/use-agent-chat";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const threadId = params.thread_id as string;

  /* ?q= is set by the home header "Ask Dr. Riya" input. Decode once. */
  const initialQ = searchParams.get("q") ?? "";

  const [historyOpen, setHistoryOpen] = useState(false);
  const { resource_id } = useContext(mastraDataContext);

  const { messages, text, setText, sendMessage, isStreaming } = useAgentChat({
    threadId,
    resourceId: resource_id,
  });

  /* Auto-send the initial question from the home input once on mount.
   * The ref prevents double-firing on StrictMode double-renders. */
  const sentRef = useRef(false);
  useEffect(() => {
    if (!initialQ || sentRef.current) return;
    sentRef.current = true;
    sendMessage(initialQ);
  }, [initialQ, sendMessage]);

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
        messages={messages}
        isStreaming={isStreaming}
        onLoadMore={() => {}}
        hasMore={false}
        isLoadingMore={false}
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
