/**
 * FILE: components/chat/chat-header.tsx
 *
 * PURPOSE:
 *   Top bar for the AI chat (Doctor Riya) thread screen. Shows the Dr. Riya
 *   identity with subtitle and a history toggle button.
 *
 * LOGIC OVERVIEW:
 *   Delegates to PageHeader (shared navigation component) for consistent layout:
 *   - title="Dr. Riya", subtitle="Gentle support, anytime", fallback="/chat"
 *   - History button passed via the right slot
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   onHistoryClick — opens the chat history drawer
 *
 * DEPENDENCIES:
 *   PageHeader — components/shared/navigation/page-header.tsx
 *   Button, lucide-react
 *
 * LAST UPDATED: 2026-05-04 — replaced custom layout with PageHeader shared component
 */

import { PageHeader } from "@/components/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

interface ChatHeaderProps {
  onHistoryClick: () => void;
}

export function ChatHeader({ onHistoryClick }: ChatHeaderProps) {
  return (
    <PageHeader
      title="Dr. Riya"
      subtitle="Gentle support, anytime"
      fallback="/chat"
      right={
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:bg-muted"
          onClick={onHistoryClick}
          aria-label="Chat history"
        >
          <History className="size-5" />
        </Button>
      }
    />
  );
}
