/**
 * FILE: components/journal/journal-writer.tsx
 *
 * PURPOSE:
 *   Full-screen journal writing component shared by the free-flow route
 *   (/self-journaling/new) and the guided route (/self-journaling/new/[slug]).
 *   Accepts an optional slug; when provided, resolves the sub-journal from
 *   the categories hook and auto-triggers an AI prompt if one exists.
 *
 * LOGIC OVERVIEW:
 *   1. If slug is given, finds the matching SubJournalingItem via
 *      useJournalingCategories() — title, aiPrompt, and id come from the
 *      fetched record, never from the URL.
 *   2. If sub.aiPrompt exists and user is ready, auto-fetches an AI question
 *      on mount (fires once via hasAutoTriggered guard).
 *   3. Toolbar: Mic triggers Web Speech API transcription (appended to textarea);
 *      Smile opens an emoji picker popover (selection appended at cursor).
 *   4. "Go deeper" saves the current response and fetches a follow-up question.
 *      "Finish" saves everything and navigates back to /self-journaling.
 *   5. Closing with unsaved content auto-saves before navigating away.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   slug              — optional; identifies the guided sub-journal
 *   sub               — resolved SubJournalingItem (undefined for free-flow)
 *   aiPromptTemplate  — sub.aiPrompt or null
 *   savedPrompts      — completed prompt+response pairs this session
 *   currentHeading    — active AI-generated question
 *   isRecording       — true while Web Speech API is capturing audio
 *   showEmojiPicker   — controls visibility of the emoji popover
 *
 * DEPENDENCIES:
 *   useJournalingCategories()   — resolves sub by slug
 *   useSelfJournalingEntries()  — recent entries for AI context
 *   createSelfJournalingEntry() — mutation to persist the entry
 *   emoji-picker-react          — emoji picker UI
 *   Web Speech API              — browser-native mic transcription
 *
 * LAST UPDATED: 2026-04-21 — identity migration: createSelfJournalingEntry payload leadId → crmLeadId;
 *   removed ... header button; prompt heading reduced to text-xl.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  X,
  Sparkles,
  Loader2,
  ImageIcon,
  Mic,
  MicOff,
  Smile,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import {
  createSelfJournalingEntry,
  useSelfJournalingEntries,
  useJournalingCategories,
  type JournalingPrompt,
} from '@/hooks/use-journaling';
import type { EmojiClickData } from 'emoji-picker-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const API_BASE = 'https://api-ai-mcp.mindtalkbuddy.com';

// ---------------------------------------------------------------------------
// Web Speech API type shim (not in default TS lib)
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHeaderDate(): string {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString('en-US', { month: 'short' });
  return `Today, ${day} ${month}`;
}

function fillPromptTemplate(
  template: string,
  memorySummary: string,
  recentEntries: string,
  entryText: string,
): string {
  return template
    .replace(/\{\{memory_summary\}\}/g, memorySummary || 'No prior summary available.')
    .replace(/\{\{recent_entries\}\}/g, recentEntries || 'No recent entries.')
    .replace(/\{\{entry_text\}\}/g, entryText || '');
}

function buildContextFromEntries(
  entries: Array<{ entry?: string | null; prompts?: JournalingPrompt[] | null; createdAt: string }>,
): { recentEntriesText: string; memorySummary: string } {
  const recent = entries.slice(0, 5);
  const recentEntriesText = recent
    .map((e) => {
      const text = e.prompts?.map((p) => `${p.heading}: ${p.text}`).join('\n') ?? e.entry ?? '';
      return text.slice(0, 500);
    })
    .join('\n---\n');

  const memorySummary =
    recent.length > 0
      ? `User has ${entries.length} journal entries. Recent themes: ${recent
          .map((e) => e.prompts?.[0]?.heading ?? e.entry?.slice(0, 50) ?? '')
          .filter(Boolean)
          .join(', ')}`
      : '';

  return { recentEntriesText, memorySummary };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface JournalWriterProps {
  slug?: string;
}

export function JournalWriter({ slug }: JournalWriterProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { entries: recentEntries } = useSelfJournalingEntries(10);
  const { subJournalings, isLoading: subsLoading } = useJournalingCategories();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [content, setContent] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<JournalingPrompt[]>([]);
  const [currentHeading, setCurrentHeading] = useState('');
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const sub = slug ? subJournalings.find((s) => s.slug === slug) : undefined;
  const aiPromptTemplate = sub?.aiPrompt ?? null;

  const getLeadId = useCallback((): number | null => {
    if (!user) return null;
    return user.lead_id ? Number(user.lead_id) : null;
  }, [user]);

  const getMobile = useCallback((): string | null => {
    if (!user) return null;
    const m =
      (user.caller_mobile as string | undefined) ??
      (user.phone_number as string | undefined);
    return m ? m.replace(/\D/g, '') : null;
  }, [user]);

  const fetchPromptWithContext = useCallback(
    async (template: string | null, conversationContext = ''): Promise<string | null> => {
      const leadId = getLeadId();
      const mobile = getMobile();
      if (!leadId || !mobile) return null;

      try {
        const { recentEntriesText, memorySummary } = buildContextFromEntries(recentEntries);

        const filledPrompt = template
          ? fillPromptTemplate(template, memorySummary, recentEntriesText, conversationContext)
          : undefined;

        const res = await fetch(`${API_BASE}/api/journal/prompt-me`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: leadId,
            mobile: String(mobile),
            ...(filledPrompt ? { aiPrompt: filledPrompt } : {}),
            ...(slug ? { slug } : {}),
          }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          data?: { question?: string };
        };
        return data?.success && data?.data?.question ? data.data.question : null;
      } catch {
        return null;
      }
    },
    [getLeadId, getMobile, recentEntries, slug],
  );

  useEffect(() => {
    if (hasAutoTriggered || !aiPromptTemplate || !user || subsLoading) return;
    setHasAutoTriggered(true);
    setIsPrompting(true);

    fetchPromptWithContext(aiPromptTemplate).then((question) => {
      if (question) {
        setCurrentHeading(question);
        setIsPromptMode(true);
      }
      setIsPrompting(false);
    });
  }, [aiPromptTemplate, user, hasAutoTriggered, fetchPromptWithContext, subsLoading]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSave = useCallback(async () => {
    const leadId = getLeadId();
    if (!leadId) return;

    const allPrompts: JournalingPrompt[] = [...savedPrompts];
    if (content.trim()) {
      allPrompts.push({
        heading: currentHeading || "What's on your mind...",
        text: content,
      });
    }
    if (allPrompts.length === 0) return;

    setIsSaving(true);
    try {
      await createSelfJournalingEntry({
        crmLeadId: leadId,
        title: sub?.title ?? allPrompts[0]?.heading ?? 'Journal Entry',
        entry: allPrompts.map((p) => `${p.heading}\n${p.text}`).join('\n\n'),
        prompts: allPrompts,
        subJournalingId: sub?.id,
      });
      router.push('/self-journaling');
    } catch (err) {
      console.error('Error saving journal:', err);
    } finally {
      setIsSaving(false);
    }
  }, [content, currentHeading, savedPrompts, getLeadId, router, sub]);

  const handleGoDeeper = useCallback(async () => {
    const previousContent = content.trim();
    const previousHeading = currentHeading || "What's on your mind...";

    if (previousContent) {
      setSavedPrompts((prev) => [...prev, { heading: previousHeading, text: previousContent }]);
    }
    setContent('');
    setCurrentHeading('');
    setIsPrompting(true);

    const conversationCtx = [
      ...savedPrompts.map((p) => `${p.heading}\n${p.text}`),
      previousContent ? `${previousHeading}\n${previousContent}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const question = await fetchPromptWithContext(aiPromptTemplate, conversationCtx);

    if (!question) {
      if (previousContent) {
        setContent(previousContent);
        setCurrentHeading(previousHeading);
        setIsPromptMode(true);
      }
      setIsPrompting(false);
      return;
    }

    setCurrentHeading(question);
    setIsPromptMode(true);
    setIsPrompting(false);
  }, [content, currentHeading, savedPrompts, fetchPromptWithContext, aiPromptTemplate]);

  const handlePromptMe = useCallback(async () => {
    setIsPrompting(true);
    const previousHeading = currentHeading || "What's on your mind...";

    const conversationCtx = [
      ...savedPrompts.map((p) => `${p.heading}\n${p.text}`),
      content.trim(),
    ]
      .filter(Boolean)
      .join('\n\n');

    const question = await fetchPromptWithContext(aiPromptTemplate, conversationCtx);

    if (!question) {
      setIsPrompting(false);
      return;
    }

    if (content.trim()) {
      setSavedPrompts((prev) => [...prev, { heading: previousHeading, text: content }]);
    }
    setContent('');
    setCurrentHeading(question);
    setIsPromptMode(true);
    setIsPrompting(false);
  }, [content, currentHeading, savedPrompts, fetchPromptWithContext, aiPromptTemplate]);

  const handleClose = () => {
    if (content.trim() || savedPrompts.length > 0) {
      handleSave();
    } else {
      router.push('/self-journaling');
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  // ---------------------------------------------------------------------------
  // Mic — Web Speech API
  // ---------------------------------------------------------------------------

  const handleMicToggle = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();

      if (transcript) {
        setContent((prev) => {
          const joined = prev ? `${prev} ${transcript}` : transcript;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
          }, 0);
          return joined;
        });
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    setIsRecording(true);
  };

  // ---------------------------------------------------------------------------
  // Emoji
  // ---------------------------------------------------------------------------

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart ?? content.length;
      const end = textarea.selectionEnd ?? content.length;
      const next = content.slice(0, start) + emoji + content.slice(end);
      setContent(next);
      // Restore cursor after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }, 0);
    } else {
      setContent((prev) => prev + emoji);
    }

    setShowEmojiPicker(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasContent = content.trim().length > 0;
  const isInitialLoading = subsLoading && !!slug;
  const isLoadingPrompt = isPrompting && !currentHeading && savedPrompts.length === 0;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={handleClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {formatHeaderDate()}
        </span>
        {/* Spacer keeps date centered */}
        <div className="w-9 h-9" />
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-36">

        {isInitialLoading || isLoadingPrompt ? (
          <div className="flex flex-col gap-4 pt-2">
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-4/5 rounded-lg" />
            <div className="flex gap-4 mt-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="w-5 h-5 rounded" />)}
            </div>
            <Skeleton className="h-32 w-full rounded-lg mt-2" />
          </div>
        ) : (
          <>
            {savedPrompts.map((prompt, i) => (
              <div key={i} className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
                  Today&apos;s Prompt
                </p>
                <h2 className="text-xl font-bold text-foreground leading-snug mb-5">
                  {prompt.heading}
                </h2>
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                  {prompt.text}
                </p>
              </div>
            ))}

            {currentHeading && (
              <div className="mb-2 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
                  Today&apos;s Prompt
                </p>
                <h2 className="text-xl font-bold text-foreground leading-snug">
                  {currentHeading}
                </h2>
              </div>
            )}

            {isPrompting && !currentHeading && savedPrompts.length > 0 && (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Getting your next prompt…</span>
              </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-5 my-4">
              {/* Image — placeholder, not yet implemented */}
              <button
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                aria-label="Add image"
                disabled
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Mic */}
              <button
                onClick={handleMicToggle}
                className={
                  isRecording
                    ? 'text-destructive animate-pulse'
                    : 'text-muted-foreground/40 hover:text-muted-foreground transition-colors'
                }
                aria-label={isRecording ? 'Stop recording' : 'Record voice'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Emoji */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <button
                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    aria-label="Insert emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="p-0 border-0 shadow-xl w-auto"
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    lazyLoadEmojis
                    skinTonesDisabled
                    searchDisabled={false}
                    height={380}
                    width={320}
                  />
                </PopoverContent>
              </Popover>

              {/* Hashtag — placeholder */}
              <button
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                aria-label="Add tag"
                disabled
              >
                <Hash className="w-5 h-5" />
              </button>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 mb-3 text-destructive">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-medium">Listening… tap mic to stop</span>
              </div>
            )}

            <Textarea
              ref={textareaRef}
              placeholder={currentHeading ? 'Start writing…' : "What's on your mind…"}
              value={content}
              onChange={handleContentChange}
              className="resize-none border-none shadow-none bg-transparent focus-visible:ring-0 text-base text-foreground min-h-[200px] overflow-hidden p-0 leading-relaxed placeholder:text-muted-foreground/50"
              autoFocus
            />
          </>
        )}
      </div>

      {/* ── Fixed bottom actions ── */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-10 pt-3 bg-background/95 backdrop-blur-sm">
        {hasContent ? (
          <div className="flex gap-3">
            <Button
              className="flex-1 rounded-full gap-2 h-14 text-base font-semibold"
              onClick={isPromptMode ? handleGoDeeper : handlePromptMe}
              disabled={isPrompting || isSaving}
            >
              {isPrompting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />}
              Go deeper
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-full h-14 text-base font-semibold border-border"
              onClick={handleSave}
              disabled={isSaving || isPrompting}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finish'}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full rounded-full gap-2 h-14 text-base font-semibold"
            onClick={isPromptMode ? handleGoDeeper : handlePromptMe}
            disabled={isPrompting || isInitialLoading}
          >
            {isPrompting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Sparkles className="w-4 h-4" />}
            Go Deeper
          </Button>
        )}
      </div>

    </div>
  );
}
