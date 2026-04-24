import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

interface EmptyStateProps {
  onNewChat: () => void;
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">No chat history yet</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Start a conversation with Riya to create your first chat session.
      </p>
      <Button className="rounded-full gap-2" onClick={onNewChat} aria-label="Start a new chat">
        <Plus className="w-4 h-4" />
        Start New Chat
      </Button>
    </div>
  );
}
