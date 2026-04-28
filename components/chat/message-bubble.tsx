/*
 * FILE: components/chat/message-bubble.tsx
 *
 * PURPOSE:
 *   Renders a single chat message — user bubble (right-aligned, orange-100 fill)
 *   or an assistant reply (left-aligned, markdown text with AI pill).
 *
 * LOGIC OVERVIEW:
 *   1. Derives isUser from message.role.
 *   2. Extracts plain text from UIMessage parts via getMessageText.
 *   3. While isLastAssistantStreaming, shows ThinkingComponent above the text.
 *   4. Every assistant message shows an AIPill above its content per design system rule.
 *   5. After streaming ends, MessageEnrichments (quick-reply chips, links) renders below.
 *   6. Timestamp shown below every message in mt-ink-500.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   message                  — ai-sdk UIMessage (role, parts, id)
 *   isLastAssistantStreaming — true while the last assistant turn is live
 *   timestamp                — pre-formatted time string from the parent list
 *
 * DEPENDENCIES:
 *   MessageEnrichments, ThinkingComponent, Streamdown (streamdown), AIPill
 *
 * LAST UPDATED: 2026-04-28 — Added AI pill above assistant messages, design-system
 *   bubble colors (#FFE4D2 user, plain text assistant), ink text colors
 */
import { MessageEnrichments } from "@/components/chat/specialized-components/message-enrichments";
import { ThinkingComponent } from "@/components/chat/thinking-component";
import { AIPill } from "@/components/shared/ai-pill";
import type { UIMessage } from "ai";
import { Streamdown } from "streamdown";

interface MessageBubbleProps {
  message: UIMessage;
  isLastAssistantStreaming: boolean;
  timestamp: string;
}

export function MessageBubble({
  message,
  isLastAssistantStreaming,
  timestamp,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const messageText = getMessageText(message);

  return (
    <div key={message.id} className="flex flex-col">
      {isLastAssistantStreaming && (
        <div className="mb-1">
          <ThinkingComponent isStreaming steps={[]} />
        </div>
      )}

      {/* AI pill above every assistant message — mandatory per design system */}
      {!isUser && messageText && (
        <div className="mb-1">
          <AIPill label="Dr. Riya" size="sm" />
        </div>
      )}

      {messageText && (
        <div className={isUser ? "flex justify-end" : "flex justify-start"}>
          <div
            className={isUser ? "max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3" : "max-w-[90%]"}
            style={isUser ? { background: "#FFE4D2", color: "#0E1726" } : { color: "#0E1726" }}
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
      {!isUser && !isLastAssistantStreaming && <MessageEnrichments text={messageText} />}
      <span
        className={`mt-1 px-1 text-[10px] ${isUser ? "text-right" : "text-left"}`}
        style={{ color: "#9AA0AB" }}
      >
        {timestamp}
      </span>
    </div>
  );
}

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
