'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* Avatar placeholder */}
      <div className="w-7 h-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">R</span>
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[80%]">
        <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
        {message.timestamp && (
          <p className="text-xs text-muted-foreground text-right mt-1">
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">R</span>
      </div>
      <div className="max-w-[80%]">
        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-background rounded px-1 py-0.5 text-xs font-mono">{children}</code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.timestamp && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp: string | number): string {
  try {
    const date = new Date(
      typeof timestamp === 'number' && timestamp < 1e12
        ? timestamp * 1000
        : timestamp
    );
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatBubble({ message }: ChatBubbleProps) {
  if (message.role === 'user') {
    return <UserBubble message={message} />;
  }
  return <AssistantBubble message={message} />;
}

export { TypingIndicator };
