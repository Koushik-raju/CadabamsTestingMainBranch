/**
 * FILE: hooks/use-agent-chat.ts
 *
 * PURPOSE:
 *   React hook for streaming chat with the Mastra super-agent. Uses the
 *   Mastra client SDK (createMastraClient + agent.stream) rather than raw
 *   fetch calls, and manages all local message and streaming state.
 *
 * LOGIC OVERVIEW:
 *   1. On mount, fetches the last PAGE_SIZE messages from Mastra memory via
 *      getMemoryThread().listMessages({ page:0, perPage:PAGE_SIZE }) ordered
 *      newest-first, then reverses them for chronological display.
 *      isLoadingHistory is true until this completes.
 *   2. loadMore() prepends an older page of messages (page 1, 2, …) to state.
 *      hasMore tracks whether additional pages exist.
 *   3. Maintains `messages` (UIMessage[]), `text` (input string),
 *      `isStreaming`, `isLoadingHistory`, `isLoadingMore`, and `hasMore`.
 *   4. sendMessage(inputText): blocked while isStreaming OR isLoadingHistory.
 *      a. Appends the user's UIMessage to state and clears the input.
 *      b. Inserts an empty assistant UIMessage placeholder (same ID reused
 *         throughout streaming so React updates the same element in-place).
 *      c. Creates a Mastra client, calls agent.stream() with the full
 *         conversation history and memory context (threadId + resourceId).
 *      d. Processes the data stream via processDataStream({ onChunk }),
 *         accumulating text-delta payloads into the assistant placeholder.
 *      e. Sets isStreaming = false on completion or error.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   threadId          — UUID of the current chat thread (for memory context)
 *   resourceId        — user identity string (for memory context)
 *   messages          — UIMessage[] — current conversation (user + assistant turns)
 *   text              — controlled input value
 *   setText           — setter for controlled input
 *   sendMessage       — triggers a new turn; appends user msg and streams reply
 *   isStreaming       — true while the agent is generating; disables send button
 *   isLoadingHistory  — true while the initial page of messages is being fetched
 *   isLoadingMore     — true while an older page is being prepended
 *   hasMore           — true when there are older pages yet to be loaded
 *   loadMore          — prepends the next page of older messages to state
 *
 * DEPENDENCIES:
 *   createMastraClient — authenticated Mastra client factory (lib/mastra-client)
 *   UIMessage          — from "ai" package (shape expected by MessageList)
 *
 * LAST UPDATED: 2026-05-04 — silence 404 on new threads (thread not yet in Mastra memory)
 */
"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { createMastraClient } from "@/lib/mastra-client";

const AGENT_ID = "super-agent";

interface UseAgentChatProps {
  threadId: string;
  resourceId: string;
}

/* Convert a raw Mastra DB message to a UIMessage.
 *
 * Mastra stores messages as: { role, content: { format: 2, parts: [...], content: string } }
 * The top-level `content` field is an object, not a string. We prefer
 * `content.content` (the plain-text summary Mastra always writes) and fall
 * back to joining only `type:"text"` parts, ignoring tool-invocations,
 * reasoning, step-start, and data-om-status so none of those appear in the UI. */
function toUIMessage(m: any): UIMessage {
  let text = "";

  if (typeof m.content === "string") {
    /* Legacy / already-string shape. */
    text = m.content;
  } else if (m.content && typeof m.content === "object") {
    if (typeof m.content.content === "string") {
      /* Preferred: Mastra always writes the full text here. */
      text = m.content.content;
    } else if (Array.isArray(m.content.parts)) {
      /* Fallback: join only plain-text parts; skip tool/reasoning/status parts. */
      text = m.content.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text ?? "")
        .join("");
    }
  }

  return {
    id: m.id ?? crypto.randomUUID(),
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text }],
  };
}

export function useAgentChat({ threadId, resourceId }: UseAgentChatProps) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, _setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  /* Next page index to fetch when the user scrolls up. */
  const nextPageRef = useRef(1);

  /* Keep a stable ref to messages so sendMessage closure always sees current
   * history without stale capture — avoids re-creating sendMessage every turn. */
  const messagesRef = useRef<UIMessage[]>(messages);
  messagesRef.current = messages;

  /* Fetch all thread messages on mount.
   *
   * Mastra's listMessages returns messages in createdAt ASC order by default
   * (oldest → newest), which matches the correct chat display order. We use a
   * high perPage (500) to retrieve all messages in a single call rather than
   * paginating, which avoids the complexity of computing the "last N" window
   * when only ASC ordering is available. hasMore is preserved so a future
   * paginated loadMore can be added once the backend supports DESC ordering. */
  useEffect(() => {
    let cancelled = false;
    nextPageRef.current = 1;

    async function loadHistory() {
      try {
        const client = await createMastraClient();
        const thread = client.getMemoryThread({ threadId, agentId: AGENT_ID });
        const result = await (thread as any).listMessages({ perPage: 500 });
        if (cancelled) return;

        const raw: any[] = Array.isArray(result?.messages) ? result.messages : [];
        const uiMessages = raw
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map(toUIMessage);

        setMessages(uiMessages);
        setHasMore(false);
      } catch (err: any) {
        /* 404 means the thread hasn't been created in Mastra memory yet (new
         * conversation). Treat it as empty history — not a real error. */
        if (!err?.message?.includes("404")) {
          console.error("[useAgentChat] failed to load history:", err);
        }
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [threadId, resourceId]);

  /* Placeholder — real paginated loadMore requires DESC ordering support from
   * the Mastra backend. hasMore is always false for now. */
  const loadMore = useCallback(async () => {}, []);

  const sendMessage = useCallback(
    async (inputText: string) => {
      const trimmed = inputText.trim();
      /* Block while history is loading to avoid racing the setMessages call above. */
      if (!trimmed || isStreaming || isLoadingHistory) return;

      /* Build the user turn and append it immediately for instant feedback. */
      const userMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: trimmed }],
      };

      const assistantId = crypto.randomUUID();
      const assistantPlaceholder: UIMessage = {
        id: assistantId,
        role: "assistant",
        parts: [{ type: "text", text: "" }],
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setText("");
      setIsStreaming(true);

      /* Build a plain messages array (role + content string) for the Mastra
       * agent — includes full history so the agent has conversation context. */
      const history = messagesRef.current.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.parts
          .filter((p) => p.type === "text")
          .map((p) => (p as { type: "text"; text: string }).text)
          .join(""),
      }));

      try {
        const client = await createMastraClient();
        const agent = client.getAgent(AGENT_ID);

        const response = await agent.stream(
          [...history, { role: "user" as const, content: trimmed }],
          {
            memory: { thread: threadId, resource: resourceId },
          },
        );

        let accumulated = "";

        await response.processDataStream({
          onChunk: async (chunk) => {
            if (chunk.type === "text-delta") {
              const text = (chunk.payload as { text?: string })?.text;
              if (text) {
                accumulated += text;
                /* Update the assistant placeholder in-place using its stable ID. */
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, parts: [{ type: "text", text: accumulated }] }
                      : m,
                  ),
                );
              }
            }
          },
        });
      } catch (error) {
        console.error("[useAgentChat] stream error:", error);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, isLoadingHistory, threadId, resourceId],
  );

  return {
    messages,
    text,
    setText,
    sendMessage,
    isStreaming,
    isLoadingHistory,
    isLoadingMore,
    hasMore,
    loadMore,
  };
}
