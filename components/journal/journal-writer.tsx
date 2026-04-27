/**
 * FILE: components/journal/journal-writer.tsx
 *
 * PURPOSE:
 *   Full-screen journal writing component shared by the free-flow route
 *   (/self-journaling/new) and the guided route (/self-journaling/new/[slug]).
 *   Accepts an optional slug; when provided, resolves the sub-journal from the
 *   subscriptions hook. Free-flow uses a hardcoded FreeFlow sub-journal ID so
 *   both modes receive AI prompts via the same backend endpoint.
 *
 * LOGIC OVERVIEW:
 *   1. If slug is given, fetches the sub-journal via useSubJournalDetail(slug).
 *      If no slug (free-flow), resolves to the hardcoded FREEFLOW_SUB_ID.
 *   2. Once a subJournalingId is available, auto-triggers generateJournalPrompt
 *      once on mount (hasAutoTriggered guard).
 *   3. "Prompt Me" / "Go Deeper" buttons call generateJournalPrompt again for
 *      follow-up questions.
 *   4. Toolbar: Mic triggers Web Speech API transcription (appended to textarea);
 *      Smile opens an emoji picker popover (selection appended at cursor).
 *   5. "Finish" saves everything and navigates back to /self-journaling.
 *   6. Closing with unsaved content auto-saves before navigating away.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   slug              — optional; identifies the guided sub-journal
 *   FREEFLOW_SUB_ID   — hardcoded CmsSubJournaling ID for the free-flow entry
 *   subJournalingId   — resolved sub-journal ID (from detail hook or hardcoded)
 *   subTitle          — title for save metadata (from sub-journal or "Journal Entry")
 *   savedPrompts      — completed prompt+response pairs accumulated this session
 *   currentHeading    — active AI-generated question shown above the textarea
 *   isRecording       — true while Web Speech API is capturing audio
 *   showEmojiPicker   — controls visibility of the emoji popover
 *
 * DEPENDENCIES:
 *   useSubJournalDetail()       — resolves sub-journal by slug (subscriptions hook)
 *   createSelfJournalingEntry() — mutation to persist the entry
 *   generateJournalPrompt()     — SDK-backed AI prompt
 *   emoji-picker-react          — emoji picker UI
 *   Web Speech API              — browser-native mic transcription
 *
 * LAST UPDATED: 2026-04-27 — hasAutoTriggered changed to useRef (fixes StrictMode double-fetch);
 *   fetchPrompt passes currentEntryText built from savedPrompts + content so sequential
 *   aiPrompt templates advance through questions instead of repeating Q1.
 */
"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useJourneyTaskContinuation } from "@/hooks/journeys/use-journey-task-continuation";
import { createEntry } from "@/hooks/self-journaling/use-self-journaling";
import { useAuth } from "@/hooks/use-auth";
import { type ConversationTurnDto, generateJournalPrompt } from "@/hooks/use-journaling";
import { useSubJournalDetail } from "@/hooks/use-journaling-subscriptions";
import { journalStreakKey, journalSubEntriesKey, selfJournalingKey } from "@/lib/swr-keys";
import type { JournalPromptDto } from "@/sdk/backend-v2";
import type { EmojiClickData } from "emoji-picker-react";
import { Hash, ImageIcon, Loader2, Mic, MicOff, Smile, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { mutate as globalMutate } from "swr";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

// CmsSubJournaling ID for the free-flow ("FreeFlow") sub-journal.
// Used when no slug is provided so the free-flow writer also receives AI prompts.
const FREEFLOW_SUB_ID = "n2qyl73zc8h0tmcos6n93k6v";

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
  const month = now.toLocaleDateString("en-US", { month: "short" });
  return `Today, ${day} ${month}`;
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
  // For guided mode: fetch sub-journal detail by slug (proven working endpoint).
  // For free-flow: sub is null, we fall back to FREEFLOW_SUB_ID below.
  const { sub, isLoading: subsLoading } = useSubJournalDetail(slug ?? null);
  // Journey tasks can be typed as either SUB_JOURNAL (sub-journal linked via
  // subJournalingIds) or JOURNAL (free-flow entry). Call both hooks and use
  // whichever one has an active slot — only one can be active at a time.
  const continuationSubJournal = useJourneyTaskContinuation("SUB_JOURNAL");
  const continuationJournal = useJourneyTaskContinuation("JOURNAL");
  const continuation = continuationSubJournal.active ? continuationSubJournal : continuationJournal;
  const journeyProofKind = continuationSubJournal.active ? "SUB_JOURNAL" : "JOURNAL";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [content, setContent] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<JournalPromptDto[]>([]);
  const [currentHeading, setCurrentHeading] = useState("");
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /*
   * useRef instead of useState so React StrictMode's double-mount in development
   * does not reset this flag and trigger a second AI call. Refs persist across
   * the unmount/remount cycle that StrictMode uses to surface side effects.
   */
  const hasAutoTriggeredRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  /*
   * Resolve the sub-journal ID for this session:
   * - Guided: use the ID returned by useSubJournalDetail(slug)
   * - Free-flow: fall back to the hardcoded FreeFlow sub-journal ID
   */
  const subJournalingId = sub?.id ?? (slug ? undefined : FREEFLOW_SUB_ID);
  const subTitle = sub?.title ?? undefined;

  /*
   * Build a structured conversation history from savedPrompts + any active in-progress
   * answer in the textarea. Each completed pair contributes an assistant turn (the AI
   * question stored in p.heading) and a user turn (the patient's answer in p.text).
   * If the user has started typing a response to the current question but hasn't saved
   * yet, append that as a user turn too so the AI can see the partial answer and pick
   * the right next question. Sending structured turns instead of a flat text blob lets
   * the LLM distinguish its own questions from patient answers without guessing.
   */
  const fetchPrompt = useCallback((): Promise<string | null> => {
    if (!subJournalingId) return Promise.resolve(null);

    const history: ConversationTurnDto[] = [
      ...savedPrompts.flatMap((p): ConversationTurnDto[] => [
        { role: "assistant", content: p.heading ?? "" },
        { role: "user", content: p.text ?? "" },
      ]),
      ...(currentHeading && content.trim()
        ? ([
            { role: "assistant", content: currentHeading },
            { role: "user", content: content.trim() },
          ] as ConversationTurnDto[])
        : []),
    ];

    return generateJournalPrompt(subJournalingId, history.length > 0 ? history : undefined);
  }, [subJournalingId, savedPrompts, content, currentHeading]);

  // Auto-trigger on mount: for guided mode wait until the sub detail resolves;
  // for free-flow FREEFLOW_SUB_ID is always available so trigger immediately.
  useEffect(() => {
    if (hasAutoTriggeredRef.current || !user) return;
    // For guided mode, wait for the sub detail to load
    if (slug && (subsLoading || !sub?.id)) return;

    hasAutoTriggeredRef.current = true;
    setIsPrompting(true);

    fetchPrompt().then((question) => {
      if (question) {
        setCurrentHeading(question);
        setIsPromptMode(true);
      }
      setIsPrompting(false);
    });
  }, [sub, user, fetchPrompt, subsLoading, slug]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!user) return;

    const allPrompts: JournalPromptDto[] = [...savedPrompts];
    if (content.trim()) {
      allPrompts.push({
        heading: currentHeading || "What's on your mind...",
        text: content,
      });
    }
    if (allPrompts.length === 0) return;

    setIsSaving(true);
    try {
      /*
       * Write to JournalEntry (NestJS campus route) — the canonical table for
       * patient-written content. subJournalingId links the entry back to the
       * CmsSubJournaling template so generatePrompt, getStreak, and
       * getEntriesForSubJournal can all query by it.
       */
      const created = await createEntry({
        title: subTitle ?? allPrompts[0]?.heading ?? "Journal Entry",
        entryText: allPrompts.map((p) => `${p.heading}\n${p.text}`).join("\n\n"),
        prompts: allPrompts,
        subJournalingId,
      });

      // Revalidate all caches that read from JournalEntry
      await Promise.all([
        globalMutate(selfJournalingKey()),
        ...(slug
          ? [globalMutate(journalSubEntriesKey(slug)), globalMutate(journalStreakKey(slug))]
          : []),
      ]);

      // Report back to the journey when this writer was opened as a task.
      if (continuation.active && created?.id) {
        try {
          await continuation.markCompleted(
            /*
             * Both SUB_JOURNAL and JOURNAL task kinds now accept journalEntryId
             * (backend assertTaskActionDone updated to check JournalEntry).
             */
            journeyProofKind === "SUB_JOURNAL"
              ? { kind: "SUB_JOURNAL", journalEntryId: created.id }
              : { kind: "JOURNAL", journalEntryId: created.id },
            { proofPreview: subTitle ?? "Journal entry saved" },
          );
          continuation.returnToJourney();
          return;
        } catch (err) {
          console.error("[JournalWriter] journey completion failed", err);
        }
      }
      router.push("/self-journaling");
    } catch (err) {
      console.error("Error saving journal:", err);
    } finally {
      setIsSaving(false);
    }
  }, [
    content,
    currentHeading,
    savedPrompts,
    user,
    router,
    subTitle,
    subJournalingId,
    continuation,
    slug,
    journeyProofKind,
  ]);

  const handleGoDeeper = useCallback(async () => {
    const previousContent = content.trim();
    const previousHeading = currentHeading || "What's on your mind...";

    if (previousContent) {
      setSavedPrompts((prev) => [...prev, { heading: previousHeading, text: previousContent }]);
    }
    setContent("");
    setCurrentHeading("");
    setIsPrompting(true);

    const question = await fetchPrompt();

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
  }, [content, currentHeading, savedPrompts, fetchPrompt]);

  const handlePromptMe = useCallback(async () => {
    setIsPrompting(true);
    const previousHeading = currentHeading || "What's on your mind...";

    const question = await fetchPrompt();

    if (!question) {
      setIsPrompting(false);
      return;
    }

    if (content.trim()) {
      setSavedPrompts((prev) => [...prev, { heading: previousHeading, text: content }]);
    }
    setContent("");
    setCurrentHeading(question);
    setIsPromptMode(true);
    setIsPrompting(false);
  }, [content, currentHeading, savedPrompts, fetchPrompt]);

  const handleClose = () => {
    if (content.trim() || savedPrompts.length > 0) {
      handleSave();
    } else {
      router.push("/self-journaling");
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
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
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();

      if (transcript) {
        setContent((prev) => {
          const joined = prev ? `${prev} ${transcript}` : transcript;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
              textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
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
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
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
  // For guided mode: wait for sub detail to load before showing content
  const isInitialLoading = !!slug && subsLoading;
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
        <span className="text-sm font-medium text-foreground">{formatHeaderDate()}</span>
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
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-5 h-5 rounded" />
              ))}
            </div>
            <Skeleton className="h-32 w-full rounded-lg mt-2" />
          </div>
        ) : (
          <>
            {savedPrompts.map((prompt, i) => (
              <div key={i} className="mb-8">
                {i === 0 && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
                    Today&apos;s Prompt
                  </p>
                )}
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
                {savedPrompts.length === 0 && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
                    Today&apos;s Prompt
                  </p>
                )}
                <h2 className="text-xl font-bold text-foreground leading-snug">{currentHeading}</h2>
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
                    ? "text-destructive animate-pulse"
                    : "text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                }
                aria-label={isRecording ? "Stop recording" : "Record voice"}
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
                <PopoverContent side="top" align="start" className="p-0 border-0 shadow-xl w-auto">
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
              placeholder={currentHeading ? "Start writing…" : "What's on your mind…"}
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
              {isPrompting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Prompt Me
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-full h-14 text-base font-semibold border-border"
              onClick={handleSave}
              disabled={isSaving || isPrompting}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish"}
            </Button>
          </div>
        ) : (
          <Button
            className="w-full rounded-full gap-2 h-14 text-base font-semibold"
            onClick={isPromptMode ? handleGoDeeper : handlePromptMe}
            disabled={isPrompting || isInitialLoading}
          >
            {isPrompting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Prompt Me
          </Button>
        )}
      </div>
    </div>
  );
}
