"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
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

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      prevMessageCount.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
      <div className="px-4 py-6 flex flex-col gap-5">
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