/*
 * FILE: components/chat/chat-input.tsx
 *
 * PURPOSE:
 *   Controlled text input bar for the chat thread. Renders a pill-shaped
 *   text field and a send button; delegates all state to the parent.
 *
 * LOGIC OVERVIEW:
 *   Stateless — receives text, onTextChange, onSubmit, and isStreaming as
 *   props. The send button is disabled when the field is blank or a stream
 *   is in progress.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   text          — current input value (controlled)
 *   onTextChange  — parent setter for text
 *   onSubmit      — form submit handler (calls useChatSession.sendMessage)
 *   isStreaming   — disables send while assistant is generating
 *
 * DEPENDENCIES:
 *   components/ui/button, components/ui/input, lucide-react
 *
 * LAST UPDATED: 2026-04-28 — add file header; replace hardcoded #f6f4f2 with var(--mt-cream-bg)
 */

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  text: string;
  onTextChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isStreaming: boolean;
}

export function ChatInput({ text, onTextChange, onSubmit, isStreaming }: ChatInputProps) {
  return (
    <div className="shrink-0 bg-white px-4 pb-[max(env(safe-area-inset-bottom,0px),16px)] pt-3 border-t border-border">
      <form onSubmit={onSubmit} className="flex items-center gap-3">
        <Input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type a message..."
          className="h-11 flex-1 rounded-full border-border bg-[var(--mt-cream-bg)] text-[15px] text-foreground placeholder:text-muted-foreground"
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
  );
}
