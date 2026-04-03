'use client';

import { BackButton } from '@/components/common/back-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  onNewChat?: () => void;
}

export function ChatHeader({
  title = 'Dr. Riya',
  subtitle = 'AI Mental Health Companion',
}: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
      <BackButton fallback="/ai-therapy" className="flex-shrink-0" />

      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src="/img/ai-therapy-chatbot/robot.png" alt="Dr. Riya" />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
          R
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-tight truncate">
          {title}
        </p>
        <p className="text-xs text-muted-foreground leading-tight truncate">
          {subtitle}
        </p>
      </div>

      {/* Online indicator */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        <span className="text-xs text-muted-foreground">Online</span>
      </div>
    </header>
  );
}
