/**
 * FILE: components/chat/message-list.tsx
 *
 * PURPOSE:
 *   Renders a scrollable list of chat messages with infinite scroll support for loading
 *   older messages. Handles auto-scroll to new messages and maintains scroll position
 *   when prepending older messages.
 *
 * LOGIC OVERVIEW:
 *   - Maintains ref to bottom of list for auto-scroll on new messages
 *   - Detects scroll-to-top to trigger onLoadMore callback (infinite scroll)
 *   - Uses useLayoutEffect to preserve scroll position when messages are prepended
 *   - Renders loading spinner, date label, and MessageBubble components
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   messages        — array of UIMessage objects to display
 *   isStreaming     — whether the last message is being streamed in real-time
 *   onLoadMore      — callback to load older messages (infinite scroll)
 *   hasMore         — whether older messages exist to load
 *   isLoadingMore   — whether older messages are currently loading
 *
 * DEPENDENCIES:
 *   ai library      — UIMessage type
 *   MessageBubble   — component that renders individual messages
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale, color tokens, border radius
 */
"use client";

import type { UIMessage } from "ai";
import { useEffect, useLayoutEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const messageTimestamps = new Map<string, string>();

function getTimestamp(id: string): string {
  let ts = messageTimestamps.get(id);
  if (!ts) {
    ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    messageTimestamps.set(id, ts);
  }
  return ts;
}

export function MessageList({
  messages,
  isStreaming,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);
  const prevScrollHeight = useRef(0);
  const isPrepending = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMore && onLoadMore) {
      prevScrollHeight.current = target.scrollHeight;
      isPrepending.current = true;
      onLoadMore();
    }
  };

  useLayoutEffect(() => {
    if (isPrepending.current && bottomRef.current) {
      const container = bottomRef.current.parentElement?.parentElement;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight.current;
      }
      isPrepending.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!isPrepending.current && messages.length > prevMessageCount.current) {
      prevMessageCount.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" onScroll={handleScroll}>
      <div className="px-4 py-6 flex flex-col gap-5">
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-muted-foreground" />
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex justify-center">
            <span className="rounded-full bg-muted px-4 py-1 text-[11px] text-muted-foreground">
              Today
            </span>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLastAssistantStreaming =
            isStreaming && i === messages.length - 1 && msg.role === "assistant";

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLastAssistantStreaming={isLastAssistantStreaming}
              timestamp={getTimestamp(msg.id)}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
