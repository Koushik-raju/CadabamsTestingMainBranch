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
 *      fetches thread history on mount and streams new replies via agent.stream().
 *   3. Renders ChatHeader (with history drawer toggle), MessageList (messages
 *      from useAgentChat), and ChatInput (bound to text/setText/sendMessage).
 *   4. HistoryDrawer slides in from the right for navigating past threads.
 *   5. If the URL contains a ?q= param (set by the home header "Ask Dr. Riya"
 *      input), auto-sends that text once after history has loaded.
 *      A ref guards against double-sending on StrictMode double-renders.
 *   6. visualViewport resize listener keeps the container height in sync with
 *      the visual viewport so the input bar stays above the software keyboard
 *      on iOS/Capacitor (which doesn't resize the layout viewport on keyboard open).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threadId          — UUID from URL, scopes the chat session
 *   resource_id       — user identity from mastraDataContext (JWT sub or UUID)
 *   messages          — UIMessage[] from useAgentChat (all turns in this session)
 *   isStreaming       — true while agent is generating; disables send button
 *   isLoadingHistory  — true while the initial page of messages is being fetched
 *   isLoadingMore     — true while an older page is being prepended
 *   hasMore           — true when older pages exist beyond what's loaded
 *   loadMore          — passed to MessageList; fetches the next older page on scroll-to-top
 *   sendMessage       — triggers a new turn (appends user msg + streams reply)
 *   initialQ          — decoded ?q= value; auto-sent once after history loads
 *   containerRef      — ref on root div; height is synced to visualViewport
 *
 * DEPENDENCIES:
 *   useAgentChat, mastraDataContext, ChatHeader, MessageList, ChatInput,
 *   HistoryDrawer
 *
 * LAST UPDATED: 2026-05-04 — add new-chat FAB (SquarePen, bottom-right above input)
 */
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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

  const {
    messages,
    text,
    setText,
    sendMessage,
    isStreaming,
    isLoadingHistory,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useAgentChat({
    threadId,
    resourceId: resource_id,
  });

  /* Auto-send the initial question from the home input once — but only after
   * history has loaded to avoid the sendMessage guard blocking it.
   * The sentRef prevents double-firing on StrictMode double-renders. */
  const sentRef = useRef(false);
  useEffect(() => {
    if (!initialQ || isLoadingHistory || sentRef.current) return;
    sentRef.current = true;
    sendMessage(initialQ);
  }, [initialQ, isLoadingHistory, sendMessage]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(text);
    },
    [text, sendMessage],
  );

  /* iOS/Capacitor: the WKWebView layout viewport does NOT shrink when the
   * software keyboard opens (unlike Android Chrome with interactiveWidget).
   * Syncing the container height to window.visualViewport.height keeps the
   * flex column sized to the visible area, so the input bar stays above the
   * keyboard instead of being obscured by it. */
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${vv.height}px`;
      }
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex h-[100dvh] flex-col overflow-hidden">
      <ChatHeader onHistoryClick={() => setHistoryOpen(true)} />

      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        onLoadMore={loadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore || isLoadingHistory}
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
