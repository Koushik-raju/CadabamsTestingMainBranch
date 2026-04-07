"use client";

import { ThinkingComponent } from "@/components/chat/thinking-component";
import { MessageEnrichments } from "@/components/chat/specialized-components/message-enrichments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken } from "@/lib/cookies";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { ChevronLeft, Send, History, MessageSquare } from "lucide-react";
import { Streamdown } from "streamdown";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { mastraDataContext } from "@/contexts/mastra-data-context";
import { MASTRA_BACKEND_URL } from "@/lib/config";
import { createMastraClient } from "@/lib/mastra-client";
import { v4 as uuidv4 } from "uuid";

interface MastraThread {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const getMessageText = (msg: UIMessage): string =>
  msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

const messageTimestamps = new Map<string, string>();
const getTimestamp = (id: string): string => {
  let ts = messageTimestamps.get(id);
  if (!ts) {
    ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    messageTimestamps.set(id, ts);
  }
  return ts;
};

export default function ChatPage() {
  const params = useParams();
  const threadId = params.threadId as string;

  const [text, setText] = useState("");
  const [authHeader, setAuthHeader] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [threads, setThreads] = useState<MastraThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);
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

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      prevMessageCount.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim()) return;
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
    [text, sendMessage, threadId, resource_id]
  );

  const isStreaming = status === "streaming" || status === "submitted";

  const prevStatusRef = useRef(status);
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" ||
      prevStatusRef.current === "submitted";
    const isNowDone = status === "ready" || status === "error";
    if (wasStreaming && isNowDone) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && !getMessageText(lastMsg).trim()) {
        sendMessage(
          { text: "Continue" },
          {
            body: {
              memory: {
                thread: threadId,
                resource: resource_id,
              },
            },
          }
        );
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, sendMessage, threadId, resource_id]);

  const openHistory = async () => {
    setHistoryOpen(true);
    if (threads.length > 0) return;
    setThreadsLoading(true);
    try {
      const client = await createMastraClient();
      const result = await client.listMemoryThreads({
        resourceId: resource_id,
      });
      setThreads(result.threads ?? []);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    setHistoryOpen(false);
    router.push(`/chat/${newId}`);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f6f4f2] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 bg-white px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Riya</h1>
          <p className="text-xs text-muted-foreground">Gentle support, anytime</p>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full border-0 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hidden sm:flex"
        >
          Reflecting with you
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={openHistory}
          aria-label="Chat history"
        >
          <History className="size-5" />
        </Button>
      </div>

      {/* Messages */}
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
            const isUser = msg.role === "user";
            const messageText = getMessageText(msg);
            const isLastAssistantStreaming =
              isStreaming && i === messages.length - 1 && msg.role === "assistant";

            return (
              <div key={msg.id} className="flex flex-col">
                {isLastAssistantStreaming && (
                  <div className="mb-1">
                    <ThinkingComponent isStreaming steps={[]} />
                  </div>
                )}
                {messageText && (
                  <div className={isUser ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={
                        isUser
                          ? "max-w-[75%] rounded-2xl rounded-br-sm bg-[#fde8dc] px-4 py-3 text-foreground"
                          : "max-w-[90%] text-foreground"
                      }
                    >
                      <Streamdown
                        className="text-[15px] leading-relaxed prose-sm max-w-none"
                        animated={{ animation: "blurIn", duration: 200, easing: "ease-out" }}
                        isAnimating={isLastAssistantStreaming}
                        caret={isLastAssistantStreaming ? "block" : undefined}
                      >
                        {messageText}
                      </Streamdown>
                    </div>
                  </div>
                )}
                {!isUser && !isLastAssistantStreaming && (
                  <MessageEnrichments text={messageText} />
                )}
                <span
                  className={`mt-1 px-1 text-[10px] text-muted-foreground ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {getTimestamp(msg.id)}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white px-4 pb-[max(env(safe-area-inset-bottom,0px),16px)] pt-3 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="h-11 flex-1 rounded-full border-border bg-[#f6f4f2] text-[15px] text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || isStreaming}
            className="size-10 shrink-0 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>

      {/* History drawer */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="text-base font-semibold">Past Chats</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">No past chats</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your conversation history will appear here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setHistoryOpen(false);
                      router.push(`/chat/${thread.id}`);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors text-left w-full ${
                      thread.id === threadId ? "bg-muted" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {thread.title ?? "Chat Session"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(thread.updatedAt ?? thread.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <Button onClick={handleNewChat} className="w-full rounded-full">
              New Chat
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
