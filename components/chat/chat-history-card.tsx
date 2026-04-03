'use client';

import { ChevronRight, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Assessment {
  title?: string;
  timestamp?: { _seconds: number } | string | number;
  summary?: string;
}

interface ChatHistoryCardProps {
  assessment: Assessment;
  onClick: () => void;
}

function formatTimestamp(timestamp: Assessment['timestamp']): string {
  if (!timestamp) return 'Unknown date';
  try {
    let date: Date;
    if (
      typeof timestamp === 'object' &&
      timestamp !== null &&
      '_seconds' in timestamp
    ) {
      date = new Date((timestamp as { _seconds: number })._seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Unknown date';
    }
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
}

export function ChatHistoryCard({ assessment, onClick }: ChatHistoryCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {assessment.title ?? 'Mental Health Assessment'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTimestamp(assessment.timestamp)}
          </p>
          {assessment.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {assessment.summary}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </CardContent>
    </Card>
  );
}
