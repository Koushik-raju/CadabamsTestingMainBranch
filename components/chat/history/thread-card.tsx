import { Card, CardContent } from "@/components/ui/card";
import { MastraThread } from "@/lib/chat";
import { formatDate } from "@/lib/chat";
import { ChevronRight, MessageSquare } from "lucide-react";

interface ThreadCardProps {
  thread: MastraThread;
  onClick: (thread: MastraThread) => void;
}

export function ThreadCard({ thread, onClick }: ThreadCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
      onClick={() => onClick(thread)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(thread);
        }
      }}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {thread.title ?? "Chat Session"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(thread.updatedAt ?? thread.createdAt)}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
