"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAccessToken } from "@/lib/cookies";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { MASTRA_BACKEND_URL } from "@/lib/config";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { HistoryDrawer } from "@/components/chat/history-drawer";

export default function ChatPage() {
  const params = useParams();
  const threadId = params.thread_id as string;

  const [text, setText] = useState("");
  const [authHeader, setAuthHeader] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const router = useRouter();
  const { resource_id } = useContext(mastraDataContext);

  useEffect(() => {
    getAccessToken().then((token) => {
      if (token) setAuthHeader({ Authorization: `Bearer ${token}` });
    });
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: MASTRA_BACKEND_URL,
      headers: authHeader,
    }),
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim() || status === "streaming") return;
      sendMessage(
        { text },
        {
          body: {
            memory: {
              thread: threadId,
              resource: resource_id,
            },
          },
        }
      );
      setText("");
    },
    [text, sendMessage, threadId, resource_id, status],
  );

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f6f4f2] overflow-hidden">
      <ChatHeader onHistoryClick={() => setHistoryOpen(true)} />
      
      <MessageList messages={messages} isStreaming={isStreaming} />

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