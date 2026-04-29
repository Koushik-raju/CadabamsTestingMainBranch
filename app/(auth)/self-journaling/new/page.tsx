/**
 * FILE: app/(auth)/self-journaling/new/page.tsx
 *
 * PURPOSE:
 *   Free-flow journal entry creation page. Supports AI-assisted prompt mode
 *   and plain-text mode; submits via createSelfJournalingEntry SDK wrapper.
 *
 * LOGIC OVERVIEW:
 *   1. Reads `title`, `subJournalId`, `categoryId`, `slug`, `aiPrompt` from
 *      URL search params and sessionStorage.
 *   2. Fetches recent entries (useSelfJournalingEntries) to build AI context.
 *   3. In prompt mode: calls the external AI endpoint to generate questions,
 *      accumulates prompt pairs in savedPrompts state.
 *   4. On save: assembles saved prompts + current content into a
 *      CreateJournalEntryDto (entryText + prompts) and calls
 *      createSelfJournalingEntry, then navigates away.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   savedPrompts       — JournalPromptDto[]; accumulated AI Q&A pairs
 *   content            — string; current free-text content in the editor
 *   currentHeading     — string; heading for the in-progress prompt answer
 *   createSelfJournalingEntry — SDK-backed mutation (hooks/use-journaling)
 *
 * DEPENDENCIES:
 *   createSelfJournalingEntry / useSelfJournalingEntries (hooks/use-journaling)
 *   JournalEditor (components/journal/journal-editor)
 *   External AI API: https://api-ai-mcp.mindtalkbuddy.com
 *
 * LAST UPDATED: 2026-04-28 — buildContextFromEntries accepts unknown fields to handle SDK type gaps
 *   (entryText/prompts typed incorrectly as objects/nested arrays in generated SDK).
 */
"use client";

import { JournalEditor } from "@/components/journal/journal-editor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  type JournalPromptDto,
  createSelfJournalingEntry,
  useSelfJournalingEntries,
} from "@/hooks/use-journaling";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const API_BASE = "https://api-ai-mcp.mindtalkbuddy.com";

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

/** Replace {{memory_summary}}, {{recent_entries}}, {{entry_text}} in AI prompt template */
function fillPromptTemplate(
  template: string,
  memorySummary: string,
  recentEntries: string,
  entryText: string,
): string {
  return template
    .replace(/\{\{memory_summary\}\}/g, memorySummary || "No prior summary available.")
    .replace(/\{\{recent_entries\}\}/g, recentEntries || "No recent entries.")
    .replace(/\{\{entry_text\}\}/g, entryText || "");
}

/*
 * SDK types entryText as `{ [key: string]: unknown } | null` and prompts as
 * `unknown[][]`. Accept `unknown` for both so the function can receive the
 * actual JournalEntryResponseDto[] array without type errors, then extract
 * plain values at runtime.
 */
function safeStr(val: unknown): string {
  return typeof val === "string" ? val : "";
}

function parsePromptItem(val: unknown): { heading?: string; text?: string } {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    return {
      heading: typeof o.heading === "string" ? o.heading : undefined,
      text: typeof o.text === "string" ? o.text : undefined,
    };
  }
  return {};
}

/** Build context strings from recent journal entries */
function buildContextFromEntries(
  entries: Array<{
    entryText?: unknown;
    prompts?: unknown[] | null;
    createdAt: string;
  }>,
): { recentEntriesText: string; memorySummary: string } {
  const recent = entries.slice(0, 5);
  const recentEntriesText = recent
    .map((e) => {
      const text =
        e.prompts
          ?.map((p) => {
            const q = parsePromptItem(p);
            return `${q.heading ?? ""}: ${q.text ?? ""}`;
          })
          .join("\n") ?? safeStr(e.entryText);
      return text.slice(0, 500);
    })
    .join("\n---\n");

  const memorySummary =
    recent.length > 0
      ? `User has ${entries.length} journal entries. Recent themes: ${recent
          .map((e) => {
            const firstPrompt = e.prompts?.[0];
            return parsePromptItem(firstPrompt).heading ?? safeStr(e.entryText).slice(0, 50);
          })
          .filter(Boolean)
          .join(", ")}`
      : "";

  return { recentEntriesText, memorySummary };
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function NewJournalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { entries: recentEntries } = useSelfJournalingEntries(10);

  const [content, setContent] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<JournalPromptDto[]>([]);
  const [currentHeading, setCurrentHeading] = useState("");
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  const title = searchParams.get("title") ?? undefined;
  const subJournalId = searchParams.get("subJournalId") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const slug = searchParams.get("slug") ?? undefined;

  // Get AI prompt template: URL param → sessionStorage → null
  const aiPromptTemplate =
    searchParams.get("aiPrompt") ??
    (typeof window !== "undefined" ? sessionStorage.getItem("pending_ai_prompt") : null) ??
    null;

  const getLeadId = useCallback((): number | null => {
    if (!user) return null;
    return user.lead_id ? Number(user.lead_id) : null;
  }, [user]);

  const getMobile = useCallback((): string | null => {
    if (!user) return null;
    const m =
      (user.caller_mobile as string | undefined) ?? (user.phone_number as string | undefined);
    return m ? m.replace(/\D/g, "") : null;
  }, [user]);

  // Fetch AI prompt using template + context
  const fetchPromptWithContext = useCallback(
    async (template: string | null, conversationContext = ""): Promise<string | null> => {
      const leadId = getLeadId();
      const mobile = getMobile();
      if (!leadId || !mobile) return null;

      try {
        const { recentEntriesText, memorySummary } = buildContextFromEntries(recentEntries);

        const filledPrompt = template
          ? fillPromptTemplate(template, memorySummary, recentEntriesText, conversationContext)
          : undefined;

        const res = await fetch(`${API_BASE}/api/journal/prompt-me`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  // Auto-trigger prompt when we have an AI template (guided journaling)
  useEffect(() => {
    if (hasAutoTriggered || !aiPromptTemplate || !user) return;
    setHasAutoTriggered(true);
    setIsPrompting(true);

    fetchPromptWithContext(aiPromptTemplate).then((question) => {
      if (question) {
        setCurrentHeading(question);
        setIsPromptMode(true);
      }
      setIsPrompting(false);
      // Clean up sessionStorage
      sessionStorage.removeItem("pending_ai_prompt");
    });
  }, [aiPromptTemplate, user, hasAutoTriggered, fetchPromptWithContext]);

  const handleSave = useCallback(async () => {
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
      await createSelfJournalingEntry({
        title: title ?? allPrompts[0]?.heading ?? "Journal Entry",
        entryText: allPrompts.map((p) => `${p.heading}\n${p.text}`).join("\n\n"),
        prompts: allPrompts,
        subJournalingId: subJournalId,
      });

      if (categoryId) {
        router.push(`/self-journaling/history?categoryId=${categoryId}`);
      } else {
        router.push("/self-journaling");
      }
    } catch (err) {
      console.error("Error saving journal:", err);
    } finally {
      setIsSaving(false);
    }
  }, [content, currentHeading, savedPrompts, router, title, subJournalId, categoryId]);

  const handlePromptMe = useCallback(async () => {
    setIsPrompting(true);
    const previousHeading = currentHeading || "What's on your mind...";

    // Build conversation context for go-deeper
    const conversationCtx = [...savedPrompts.map((p) => `${p.heading}\n${p.text}`), content.trim()]
      .filter(Boolean)
      .join("\n\n");

    const question = await fetchPromptWithContext(aiPromptTemplate, conversationCtx);

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
  }, [content, currentHeading, savedPrompts, fetchPromptWithContext, aiPromptTemplate]);

  const handleGoDeeper = useCallback(async () => {
    const previousContent = content.trim();
    const previousHeading = currentHeading || "What's on your mind...";

    if (previousContent) {
      setSavedPrompts((prev) => [...prev, { heading: previousHeading, text: previousContent }]);
    }
    setContent("");
    setCurrentHeading("");
    setIsPrompting(true);

    // Build full conversation for context
    const conversationCtx = [
      ...savedPrompts.map((p) => `${p.heading}\n${p.text}`),
      previousContent ? `${previousHeading}\n${previousContent}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

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
        <h1 className="text-lg font-semibold text-foreground">{title ?? "Self Journaling"}</h1>
      </div>

      {/* Editor */}
      <div className="flex-1 px-4 py-4 overflow-auto flex flex-col">
        {/* Loading skeleton when auto-triggering prompt */}
        {isPrompting && !currentHeading && savedPrompts.length === 0 ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default function NewJournalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewJournalContent />
    </Suspense>
  );
}
