import { ThinkingComponent } from "@/components/chat/thinking-component";
import { MessageEnrichments } from "@/components/chat/specialized-components/message-enrichments";
import { Streamdown } from "streamdown";
import type { UIMessage } from "ai";

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