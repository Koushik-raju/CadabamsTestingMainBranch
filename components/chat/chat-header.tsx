/**
 * FILE: components/chat/chat-header.tsx
 *
 * PURPOSE:
 *   Top bar for the AI chat (Doctor Riya) thread screen. Shows the Dr. Riya
 *   identity with the sparkle brand mark, subtitle, and the history button.
 *
 * LOGIC OVERVIEW:
 *   Renders a white top bar (cream underline separator) with:
 *   - Back button (left)
 *   - Riya avatar with sparkle mark (design system AI identity)
 *   - Name + "Gentle support, anytime" subtitle
 *   - History toggle button (right)
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   onHistoryClick — opens the chat history drawer
 *
 * DEPENDENCIES:
 *   BackButton, Badge, Button, lucide-react
 *
 * LAST UPDATED: 2026-04-28 — Design system migration: sparkle mark on avatar,
 *   cream separator instead of border, orange ring on avatar
 */

import { BackButton } from "@/components/shared/navigation/back-button";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

/* Brand sparkle — 4-pointed star, same as the AI tab centre button */
function SparkleIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6z" />
      <path d="M19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
    </svg>
  );
}

interface ChatHeaderProps {
  onHistoryClick: () => void;
}

export function ChatHeader({ onHistoryClick }: ChatHeaderProps) {
  return (
    <div
      className="shrink-0 flex items-center gap-3 bg-white px-4 py-3"
      style={{ borderBottom: "1px solid #ECE6DE" }}
    >
      <BackButton fallback="/chat" className="size-8 text-[#6B7280]" />

      {/* Dr. Riya avatar with sparkle mark */}
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm"
          style={{ background: "linear-gradient(135deg, #FBB7BC, #F97316)" }}
        >
          R
        </div>
        {/* Sparkle badge bottom-right */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "#F97316", boxShadow: "0 0 0 1.5px #fff" }}
        >
          <SparkleIcon size={9} />
        </div>
      </div>

      <div className="flex-1">
        <h1 className="text-[15px] font-bold text-[#0E1726] leading-tight">Dr. Riya</h1>
        <p className="text-[12px] text-[#6B7280]">Gentle support, anytime</p>
      </div>

      {/* History button */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-[#6B7280] hover:bg-[#F4F2EE]"
        onClick={onHistoryClick}
        aria-label="Chat history"
      >
        <History className="size-5" />
      </Button>
    </div>
  );
}
