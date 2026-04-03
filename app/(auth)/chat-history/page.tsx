'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { ChatHistoryCard } from '@/components/chat/chat-history-card';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/hooks/use-auth';

interface Assessment {
  id?: string;
  title?: string;
  timestamp?: { _seconds: number } | string | number;
  summary?: string;
}

function useAssessments(leadId: string | number | null) {
  return useSWR<Assessment[]>(
    leadId ? ['assessments', leadId] : null,
    async () => {
      const data = await chatService.fetchAssessments({ lead_id: leadId });
      if (Array.isArray(data)) return data as Assessment[];
      // Some backends wrap in { result: [...] } or { data: [...] }
      const wrapped = data as { result?: Assessment[]; data?: Assessment[] };
      return wrapped.result ?? wrapped.data ?? [];
    },
    { revalidateOnFocus: false }
  );
}

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        No chat history yet
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Start a conversation with Dr. Riya to create your first mental health
        assessment.
      </p>
      <Button
        className="rounded-full gap-2"
        onClick={onNewChat}
        aria-label="Start a new chat with Dr. Riya"
      >
        <Plus className="w-4 h-4" />
        Start New Chat
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 px-4 py-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const leadId = (user?.lead_id ?? user?.caller_mobile ?? null) as string | number | null;
  const { data: assessments, isLoading } = useAssessments(leadId);

  const handleAssessmentClick = (assessment: Assessment) => {
    router.push(
      `/ai-therapy/previous-chat/assessment-details?assessment=${encodeURIComponent(
        JSON.stringify(assessment)
      )}`
    );
  };

  const handleNewChat = () => router.push('/new-chat');

  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Safe-area top */}
      <div className="pt-[max(env(safe-area-inset-top,0px),1rem)]" />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 pb-4">
        <BackButton fallback="/ai-therapy" />
        <h1 className="text-xl font-extrabold text-foreground">My AI Chats</h1>
      </header>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : assessments && assessments.length > 0 ? (
        <section
          className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
          aria-label="Previous chat sessions"
        >
          {assessments.map((assessment, idx) => (
            <ChatHistoryCard
              key={assessment.id ?? idx}
              assessment={assessment}
              onClick={() => handleAssessmentClick(assessment)}
            />
          ))}
        </section>
      ) : (
        <EmptyState onNewChat={handleNewChat} />
      )}

      {/* Floating new-chat button (only when list visible) */}
      {!isLoading && assessments && assessments.length > 0 && (
        <div className="flex justify-center py-4 pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
          <Button
            className="rounded-full gap-2 shadow-lg"
            onClick={handleNewChat}
            aria-label="Start a new chat session"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </Button>
        </div>
      )}
    </main>
  );
}
