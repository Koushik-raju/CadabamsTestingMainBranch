'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/shared/navigation/back-button';
import { useAuth } from '@/hooks/use-auth';

export default function AiTherapyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const callerName =
    (user?.caller_name as string | undefined) ??
    (user?.name as string | undefined) ??
    'there';

  return (
    <main className="min-h-screen bg-background flex flex-col px-4">
      {/* Safe-area top padding */}
      <div className="pt-[max(env(safe-area-inset-top,0px),1rem)]" />

      {/* Header */}
      <header className="flex items-center gap-4 mb-8">
        <BackButton fallback="/home" />
        <h1 className="text-xl font-extrabold text-foreground">
          Mindful AI Chatbot
        </h1>
      </header>

      {/* Body */}
      <section className="flex flex-col flex-1 items-center justify-between pb-8">
        {/* Illustration + intro */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative w-[240px] h-[240px] sm:w-[290px] sm:h-[290px]">
            <Image
              src="/img/ai-therapy-chatbot/robot.png"
              alt="Dr. Riya — AI Mental Health Companion"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-3 max-w-sm">
            <h2 className="text-2xl font-extrabold text-foreground">
              Talk to Dr. Riya
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Hey {callerName}, I&apos;m Dr. Riya, and I&apos;ll guide you to
              analyze your possible symptoms. Are you ready?
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="w-full max-w-sm space-y-3 mt-8">
          <Button
            className="w-full h-14 rounded-full text-sm font-semibold gap-2"
            onClick={() => router.push('/chat/new')}
            aria-label="Start a new conversation with Dr. Riya"
          >
            <Plus className="w-5 h-5" />
            New Conversation
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 rounded-full text-sm font-semibold gap-2"
            onClick={() => router.push('/chat')}
            aria-label="View past chat sessions"
          >
            <History className="w-5 h-5" />
            View Past Chats
          </Button>
        </div>
      </section>
    </main>
  );
}
