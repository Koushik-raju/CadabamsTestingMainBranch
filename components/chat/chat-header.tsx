import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/shared/navigation/back-button";

interface ChatHeaderProps {
  onHistoryClick: () => void;
}

export function ChatHeader({ onHistoryClick }: ChatHeaderProps) {
  return (
    <div className="shrink-0 flex items-center gap-3 bg-white px-4 py-3 border-b border-border">
      <BackButton fallback="/chat" className="size-8 text-muted-foreground" />
      <div className="flex-1">
        <h1 className="text-base font-semibold text-foreground">Riya</h1>
        <p className="text-xs text-muted-foreground">Gentle support, anytime</p>
      </div>
      <Badge
        variant="secondary"
        className="rounded-full border-0 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hidden sm:flex"
      >
        Reflecting with you
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground"
        onClick={onHistoryClick}
        aria-label="Chat history"
      >
        <History className="size-5" />
      </Button>
    </div>
  );
}