/**
 * FILE: hooks/use-agent-chat.ts
 *
 * PURPOSE:
 *   React hook for streaming chat with the Mastra super-agent. Uses the
 *   Mastra client SDK (createMastraClient + agent.stream) rather than raw
 *   fetch calls, and manages all local message and streaming state.
 *
 * LOGIC OVERVIEW:
 *   1. Maintains `messages` (UIMessage[]), `text` (input string), and
 *      `isStreaming` state locally.
 *   2. sendMessage(inputText):
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
 *   threadId     — UUID of the current chat thread (for memory context)
 *   resourceId   — user identity string (for memory context)
 *   messages     — UIMessage[] — current conversation (user + assistant turns)
 *   text         — controlled input value
 *   setText      — setter for controlled input
 *   sendMessage  — triggers a new turn; appends user msg and streams reply
 *   isStreaming  — true while the agent is generating; disables send button
 *
 * DEPENDENCIES:
 *   createMastraClient — authenticated Mastra client factory (lib/mastra-client)
 *   UIMessage          — from "ai" package (shape expected by MessageList)
 *
 * LAST UPDATED: 2026-05-04 — fix UIMessage type (no content field), fix onChunk ChunkType
 */
"use client";

import type { UIMessage } from "ai";
import { useCallback, useRef, useState } from "react";
import { createMastraClient } from "@/lib/mastra-client";

const AGENT_ID = "super-agent";

interface UseAgentChatProps {
  threadId: string;
  resourceId: string;
}

export function useAgentChat({ threadId, resourceId }: UseAgentChatProps) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  /* Keep a stable ref to messages so sendMessage closure always sees current
   * history without stale capture — avoids re-creating sendMessage every turn. */
  const messagesRef = useRef<UIMessage[]>(messages);
  messagesRef.current = messages;

  const sendMessage = useCallback(
    async (inputText: string) => {
      const trimmed = inputText.trim();
      if (!trimmed || isStreaming) return;

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
    [isStreaming, threadId, resourceId],
  );

  return { messages, text, setText, sendMessage, isStreaming };
}
