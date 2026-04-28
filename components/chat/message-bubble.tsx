/*
 * FILE: components/chat/message-bubble.tsx
 *
 * PURPOSE:
 *   Renders a single chat message — either a user bubble (right-aligned,
 *   warm-peach fill) or an assistant reply (left-aligned, plain text with
 *   markdown streaming).
 *
 * LOGIC OVERVIEW:
 *   1. Derives isUser from message.role.
 *   2. Extracts plain text from UIMessage parts via getMessageText.
 *   3. While isLastAssistantStreaming, shows ThinkingComponent above the text.
 *   4. After the assistant finishes streaming, renders MessageEnrichments
 *      (quick-reply chips, links, etc.) below the bubble.
 *   5. Timestamp shown below every message in muted-foreground.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   message                  — ai-sdk UIMessage (role, parts, id)
 *   isLastAssistantStreaming — true while the last assistant turn is live
 *   timestamp                — pre-formatted time string from the parent list
 *
 * DEPENDENCIES:
 *   MessageEnrichments, ThinkingComponent, Streamdown (streamdown)
 *
 * LAST UPDATED: 2026-04-28 — add file header; replace #fde8dc with var(--mt-orange-100)
 */
import { MessageEnrichments } from "@/components/chat/specialized-components/message-enrichments";
import { ThinkingComponent } from "@/components/chat/thinking-component";
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
      {messageText && (
        <div className={isUser ? "flex justify-end" : "flex justify-start"}>
          <div
            className={
              isUser
                ? "max-w-[75%] rounded-2xl rounded-br-sm bg-[var(--mt-orange-100)] px-4 py-3 text-foreground"
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
      {!isUser && !isLastAssistantStreaming && <MessageEnrichments text={messageText} />}
      <span
        className={`mt-1 px-1 text-[10px] text-muted-foreground ${
          isUser ? "text-right" : "text-left"
        }`}
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
