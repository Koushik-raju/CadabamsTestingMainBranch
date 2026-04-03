'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { JournalEditor } from '@/components/journal/journal-editor';

interface JournalPrompt {
  heading: string;
  text: string;
}

const API_BASE = 'https://api-ai-mcp.mindtalkbuddy.com';

const TEMPLATES: Record<string, string> = {
  gratitude: "What are three things you're grateful for today?",
  sleeplog: 'How did you sleep last night? Any dreams or thoughts?',
  affirmations: "What's a positive affirmation you want to focus on today?",
};

function NewJournalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<JournalPrompt[]>([]);
  const [currentHeading, setCurrentHeading] = useState('');
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const template = searchParams.get('template');
    if (template && TEMPLATES[template]) {
      setCurrentHeading(TEMPLATES[template]);
      setIsPromptMode(true);
    }
  }, [searchParams]);

  const getLeadId = useCallback((): string | null => {
    if (!user) return null;
    return user.lead_id ? String(user.lead_id) : null;
  }, [user]);

  const getMobile = useCallback((): string | null => {
    if (!user) return null;
    const m = (user.caller_mobile as string | undefined) ?? (user.phone_number as string | undefined);
    return m ? m.replace(/\D/g, '') : null;
  }, [user]);

  const fetchPrompt = useCallback(async (): Promise<string | null> => {
    const leadId = getLeadId();
    const mobile = getMobile();
    if (!leadId || !mobile) return null;

    try {
      const res = await fetch(`${API_BASE}/api/journal/prompt-me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(leadId),
          mobile,
          meta: {
            caller_name: (user?.caller_name as string | undefined) ?? '',
            caller_mobile: mobile,
            lead_id: Number(leadId),
            patient_name: (user?.patient_name as string | undefined) ?? '',
            caller_email: (user?.email as string | undefined) ?? '',
            uid: (user?.uid as string | undefined) ?? '',
          },
        }),
      });
      const data = (await res.json()) as { success?: boolean; data?: { question?: string } };
      return data?.success && data?.data?.question ? data.data.question : null;
    } catch {
      return null;
    }
  }, [getLeadId, getMobile, user]);

  const fetchDeeperPrompt = useCallback(
    async (currentText: string, previousPrompts: JournalPrompt[]): Promise<string | null> => {
      const leadId = getLeadId();
      const mobile = getMobile();
      if (!leadId || !mobile) return null;

      const ctx = [...previousPrompts.map((p) => `${p.heading}\n${p.text}`), currentText.trim()]
        .filter(Boolean)
        .join('\n\n');

      if (!ctx.trim()) return null;

      try {
        const res = await fetch(`${API_BASE}/api/journal/go-deeper`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: Number(leadId),
            mobile,
            currentConversation: ctx,
            meta: {
              caller_name: (user?.caller_name as string | undefined) ?? '',
              caller_mobile: mobile,
              lead_id: Number(leadId),
              patient_name: (user?.patient_name as string | undefined) ?? '',
              caller_email: (user?.email as string | undefined) ?? '',
              uid: (user?.uid as string | undefined) ?? '',
            },
          }),
        });
        const data = (await res.json()) as { success?: boolean; data?: { question?: string } };
        return data?.success && data?.data?.question ? data.data.question : null;
      } catch {
        return null;
      }
    },
    [getLeadId, getMobile, user]
  );

  const handleSave = useCallback(async () => {
    const leadId = getLeadId();
    if (!leadId) return;

    const allPrompts = [...savedPrompts];
    if (content.trim()) {
      allPrompts.push({ heading: currentHeading || "What's on your mind...", text: content });
    }
    if (allPrompts.length === 0) return;

    setIsSaving(true);
    try {
      const { database } = await import('@/lib/firebase');
      const { ref, push, set } = await import('firebase/database');

      const journalData = {
        entry: allPrompts.map((p) => `${p.heading}\n${p.text}`).join('\n\n'),
        prompts: allPrompts,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        leadId,
      };

      const journalsRef = ref(database, `self-journalings/${leadId}`);
      const newRef = push(journalsRef);
      await set(newRef, journalData);
      router.push('/self-journaling');
    } catch (err) {
      console.error('Error saving journal:', err);
    } finally {
      setIsSaving(false);
    }
  }, [content, currentHeading, savedPrompts, getLeadId, router]);

  const handlePromptMe = useCallback(async () => {
    setIsPrompting(true);
    const previousHeading = currentHeading || "What's on your mind...";

    const deeper = await fetchDeeperPrompt(content, savedPrompts);
    const newHeading = deeper ?? await fetchPrompt();

    if (!newHeading) { setIsPrompting(false); return; }

    if (content.trim()) {
      setSavedPrompts((prev) => [...prev, { heading: previousHeading, text: content }]);
    }
    setContent('');
    setCurrentHeading(newHeading);
    setIsPromptMode(true);
    setIsPrompting(false);
  }, [content, currentHeading, savedPrompts, fetchDeeperPrompt, fetchPrompt]);

  const handleGoDeeper = useCallback(async () => {
    const previousContent = content.trim();
    const previousHeading = currentHeading || "What's on your mind...";

    if (previousContent) {
      setSavedPrompts((prev) => [...prev, { heading: previousHeading, text: previousContent }]);
    }
    setContent('');
    setCurrentHeading('');
    setIsPrompting(true);

    const deeper = await fetchDeeperPrompt(previousContent, savedPrompts);
    if (!deeper) {
      if (previousContent) {
        setContent(previousContent);
        setCurrentHeading(previousHeading);
        setIsPromptMode(true);
      }
      setIsPrompting(false);
      return;
    }

    setCurrentHeading(deeper);
    setIsPromptMode(true);
    setIsPrompting(false);
  }, [content, currentHeading, savedPrompts, fetchDeeperPrompt]);

  const handleBack = async () => {
    if (content.trim() || savedPrompts.length > 0) {
      await handleSave();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Self Journaling</h1>
      </div>

      {/* Editor */}
      <div className="flex-1 px-4 py-4 overflow-auto flex flex-col">
        <JournalEditor
          content={content}
          onChange={setContent}
          savedPrompts={savedPrompts}
          currentHeading={currentHeading}
          isPromptMode={isPromptMode}
          isPrompting={isPrompting}
          isLoading={isSaving}
          onSave={handleSave}
          onPromptMe={handlePromptMe}
          onGoDeeper={handleGoDeeper}
        />
      </div>
    </div>
  );
}

export default function NewJournalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewJournalContent />
    </Suspense>
  );
}
