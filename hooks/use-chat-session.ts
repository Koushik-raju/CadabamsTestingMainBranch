/**
 * FILE: hooks/use-chat-session.ts
 *
 * PURPOSE:
 *   Consolidated hook for a single chat thread session. Merges historical
 *   message loading and real-time streaming (via @ai-sdk/react useChat) into
 *   a single, page-ready interface.
 *
 * LOGIC OVERVIEW:
 *   1. On mount (or threadId change), fetches page 0 of historical messages via
 *      useEffect — no SWR caching, always fresh from the backend.
 *      - On 404 / "Thread not found": returns empty array (new thread not yet
 *        created on the backend). Does NOT redirect — this fixes the infinite
 *        redirect loop that occurred when navigating to a brand-new thread UUID.
 *   2. `loadMore()` loads additional pages (scroll-up pagination). A `pageRef`
 *      ref tracks the next offset to request (avoids stale closure issues).
 *   3. `useChat` from @ai-sdk/react drives real-time streaming. Memory headers
 *      (thread + resource) are injected into every request body.
 *   4. `allMessages` merges: historicalMessages + live useChat messages.
 *   5. `sendMessage(text)` wraps useChat's sendMessage with the memory payload
 *      and clears the local text state.
 *   6. When status transitions to "ready" (streaming done), revalidates threadsKey
 *      so the new thread immediately appears in the history page and drawer.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threadId         — UUID of the current chat thread (from URL params)
 *   resourceId       — user identity string (from mastraDataContext)
 *   allMessages      — merged array of UIMessage for the MessageList component
 *   sendMessage      — sends a text message and clears text state
 *   isStreaming      — true while the assistant is generating a response
 *   loadMore         — loads the next page of older messages (scroll-up pagination)
 *   hasMore          — whether more historical pages exist
 *   isLoadingMore    — true while loadMore is in flight
 *   isInitialLoading — true until the first fetch completes
 *   text / setText   — controlled input state, managed here so page stays lean
 *
 * DEPENDENCIES:
 *   swr (useSWRConfig only), @ai-sdk/react (useChat), ai (DefaultChatTransport,
 *   UIMessage), createMastraClient, CONFIG.MASTRA_BACKEND_URL, CONFIG.MASTRA_AGENT_ID,
 *   threadsKey
 *
 * LAST UPDATED: 2026-04-16 — removed SWR caching for messages (always fetch fresh)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { CONFIG } from "@/config/env";
import { createMastraClient } from "@/lib/mastra-client";
import { threadsKey } from "@/lib/swr-keys";

const PER_PAGE = 10;

function parseMessages(raw: any[]): UIMessage[] {
  const messages: UIMessage[] = raw.map((msg: any) => {
    const parts: any[] = [];

    for (const part of msg.content?.parts || []) {
      if (part.type === "text" && part.text) {
        parts.push({ type: "text", text: part.text });
      } else if (part.type === "reasoning") {
        parts.push({
          type: "reasoning",
          text: part.reasoning || "",
          details: part.details,
        });
      } else if (part.type === "tool-invocation") {
        parts.push({
          type: "tool-invocation",
          toolInvocation: part.toolInvocation,
        });
      }
    }

    if (parts.length === 0 && msg.content?.content) {
      parts.push({ type: "text", text: msg.content.content });
    }

    const createdAt = msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt);

    return { id: msg.id, role: msg.role, parts, createdAt } as UIMessage;
  });

  return [...messages].sort((a: any, b: any) => {
    const timeA = a.createdAt.getTime();
    const timeB = b.createdAt.getTime();
    if (timeA === timeB) {
      if (a.role === "user" && b.role !== "user") return -1;
      if (a.role !== "user" && b.role === "user") return 1;
      return 0;
    }
    return timeA - timeB;
  });
}

interface UseChatSessionProps {
  threadId: string;
  resourceId: string;
}

export function useChatSession({ threadId, resourceId }: UseChatSessionProps) {
  // Historical messages — no caching, always fetched fresh
  const [historicalMessages, setHistoricalMessages] = useState<UIMessage[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasMoreRef = useRef(false);
  const pageRef = useRef(0);

  // Load page 0 on mount / threadId change
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;

    async function loadInitial() {
      setIsInitialLoading(true);
      setHistoricalMessages([]);
      hasMoreRef.current = false;
      pageRef.current = 0;
      try {
        const client = await createMastraClient();
        const result = (await client.listThreadMessages(threadId, {
          agentId: CONFIG.MASTRA_AGENT_ID,
          requestContext: { page: 0, perPage: PER_PAGE },
        })) as any;
        if (!cancelled) {
          setHistoricalMessages(parseMessages(result.messages || []));
          hasMoreRef.current = result?.hasMore ?? false;
        }
      } catch (error: any) {
        const message = error?.message ?? "";
        // 404 = new thread not yet created on backend — empty chat, no redirect
        if (!message.includes("404") && !message.includes("Thread not found")) {
          console.error("Error loading messages:", error);
        }
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreRef.current) return;
    setIsLoadingMore(true);
    try {
      const client = await createMastraClient();
      const nextOffset = (pageRef.current + 1) * PER_PAGE;
      const result = (await client.listThreadMessages(threadId, {
        agentId: CONFIG.MASTRA_AGENT_ID,
        requestContext: { page: nextOffset, perPage: PER_PAGE },
      })) as any;
      const loaded = parseMessages(result.messages || []);
      if (loaded.length > 0) {
        setHistoricalMessages((prev) => [...loaded, ...prev]);
        pageRef.current += 1;
      }
      hasMoreRef.current = result?.hasMore ?? false;
    } catch {
      // silent fail — user can retry by scrolling again
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, threadId]);

  // Real-time streaming chat
  const [text, setText] = useState("");
  const { mutate: globalMutate } = useSWRConfig();

  const {
    messages: liveMessages,
    sendMessage: sendChatMessage,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: CONFIG.MASTRA_BACKEND_URL,
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // When streaming finishes (status → "ready"), revalidate the threads list so
  // the new thread appears in the history page and history drawer immediately.
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "ready" && status === "ready" && resourceId) {
      globalMutate(threadsKey(resourceId));
    }
    prevStatusRef.current = status;
  }, [status, resourceId, globalMutate]);

  const sendMessage = useCallback(
    (inputText: string) => {
      const trimmed = inputText.trim();
      if (!trimmed || isStreaming) return;
      sendChatMessage(
        { text: trimmed },
        {
          body: {
            memory: {
              thread: threadId,
              resource: resourceId,
            },
          },
        },
      );
      setText("");
    },
    [isStreaming, sendChatMessage, threadId, resourceId],
  );

  const allMessages: UIMessage[] = [...historicalMessages, ...liveMessages];

  return {
    allMessages,
    sendMessage,
    isStreaming,
    loadMore,
    hasMore: hasMoreRef.current,
    isLoadingMore,
    isInitialLoading,
    text,
    setText,
  };
}
