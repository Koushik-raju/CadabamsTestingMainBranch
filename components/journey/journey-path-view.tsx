/**
 * FILE: components/journey/journey-path-view.tsx
 *
 * PURPOSE:
 *   Renders the enrolled-journey path view. All unlock / cooldown / streak logic
 *   is server-owned — this component reads per-task `state` and the
 *   enrollment's `nextDayUnlocksAt` directly and renders accordingly.
 *
 * LOGIC OVERVIEW:
 *   1. Flattens CMS steps into nodes, keyed by composite "stepId-taskId" for React.
 *   2. Looks up each task's server state (locked/available/active/completed)
 *      from enrollment.tasks by plain taskId — maps it to NodeVariant.
 *   3. Navigates using task.destinationPath (plus a redirectTo back to details).
 *      If destinationPath is missing, shows a toast ("This task isn't available yet").
 *   4. On mount (when subscribed) fires tickJourney() — the server idempotently
 *      advances the day if the cooldown has elapsed.
 *   5. If nextDayUnlocksAt is in the future, shows a sticky countdown banner and
 *      re-ticks when it hits zero.
 *   6. markNodeDone and action-sheet onMarkDone send the plain taskId.
 *   7. onOpen only navigates — does NOT call updateNodeProgress.
 *   8. On return from a task page: restores scroll position, revalidates enrollment,
 *      and triggers XP animation if new tasks were completed.
 *   9. Auto-scrolls to the current day's first active/available node on mount.
 *  10. Day-summary sheet auto-opens when todayDone flips to equal todayTotal in-session.
 *  11. Unsubscribed users see a preview sheet instead of the action sheet.
 *  12. Session gate: paid-free-preview users tapping book tasks are redirected to /packages.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   journey              — CMS JourneyItem (content structure)
 *   progress             — PatientJourneyResponseDto (null if unsubscribed)
 *   journeyId            — route param id
 *   pulseNodeId          — taskId of the node to briefly scale on scroll
 *   scrollTargetTaskId   — computed taskId of the first active/available node today
 *   prevTodayDoneRef     — ref tracking previous todayDone for day-summary auto-open
 *
 * DEPENDENCIES:
 *   subscribeToJourney, updateNodeProgress, tickJourney — hooks/journeys/use-journey-detail
 *   PathChain, JourneyTaskActionSheet, JourneyUnitTasksSheet
 *   JourneyPreviewSheet, JourneyDaySummarySheet
 *   toast (react-toastify)
 *   globalMutate (swr) — revalidates enrollment key on return
 *   journeyEnrollmentKey — lib/swr-keys
 *
 * LAST UPDATED: 2026-05-07 — StatsBar and CooldownBanner extracted as exported components; both now rendered as PageHeader children in details/page.tsx so they stick inside the header with no separate offset needed
 */
"use client";

import { BarChart2, Clock, Flame, Lock, Sparkles, Timer, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { mutate as globalMutate } from "swr";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { type JourneyReturnTaskKind, useJourneyReturn } from "@/contexts/journey-return-context";
import {
  type JourneyProgress,
  subscribeToJourney,
  type TaskProof,
  tickJourney,
  updateNodeProgress,
} from "@/hooks/journeys/use-journey-detail";
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from "@/lib/haptics";
import { journeyEnrollmentKey } from "@/lib/swr-keys";
import { cn, fixImageUrl } from "@/lib/utils";
import type { EnrollmentTaskDto } from "@/sdk/backend-v2";
import type { JourneyItem, JourneyTask } from "@/types/journey";
import { extractJourneyDescription, extractJourneyName } from "@/types/journey";
import { JourneyDaySummaryModal } from "./journey-day-summary-modal";
import { JourneyDaySummarySheet } from "./journey-day-summary-sheet";
import { JourneyPreviewSheet } from "./journey-preview-sheet";
import { JourneyTaskActionSheet, type TaskActionSheetData } from "./journey-task-action-sheet";
import { JourneyUnitTasksSheet, type UnitTask } from "./journey-unit-tasks-sheet";
import { type ChainItem, getTaskType, PathChain, type PathChainNode } from "./path-chain";
import type { NodeVariant } from "./path-node";
import { XpFloat } from "./xp-float";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapState(state: EnrollmentTaskDto["state"]): NodeVariant {
  if (state === "completed") return "completed";
  if (state === "active") return "active";
  if (state === "locked") return "locked";
  return "default"; // 'available'
}

// Map the authoritative server-derived kind to the visual NodeTaskType bucket.
// Kept narrow — if the server ever adds a new kind, fall back to 'journal'.
function mapServerKind(
  kind: EnrollmentTaskDto["kind"],
): "assessment" | "audio" | "video" | "journal" | "book" | "gift" | "read" {
  switch (kind) {
    case "ASSESSMENT":
      return "assessment";
    case "AUDIO":
      return "audio";
    case "VIDEO":
      return "video";
    case "MOOD":
      return "gift";
    case "APPOINTMENT":
    case "CONSULT_BOOKING":
      return "book";
    case "READ":
      return "read";
    case "WORKSHEET":
    case "JOURNAL":
    case "SUB_JOURNAL":
    case "OTHER":
    default:
      return "journal";
  }
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// Stats bar — exported so details/page.tsx can render it as a PageHeader child
// ---------------------------------------------------------------------------

export function StatsBar({ progress }: { progress: JourneyProgress }) {
  const pct = progress.progress ?? 0;
  const streak = progress.gamification?.streak ?? 0;
  const xp = progress.gamification?.xp ?? 0;
  return (
    <div className="flex items-center justify-between px-5 py-2.5 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-1.5">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-extrabold text-foreground">{streak}</span>
        <span className="text-[10px] text-muted-foreground">Streak</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-extrabold text-foreground">{xp}</span>
        <span className="text-[10px] text-muted-foreground">XP</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="relative w-8 h-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 13}`}
              strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="text-primary transition-all duration-500"
            />
          </svg>
        </div>
        <span className="text-[10px] text-muted-foreground">{pct}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cooldown banner — exported so details/page.tsx can render it as a PageHeader
// child. Manages its own countdown timer and re-tick logic internally.
// ---------------------------------------------------------------------------

export function CooldownBanner({
  progress,
  journeyId,
}: {
  progress: JourneyProgress;
  journeyId: string;
}) {
  const enrollmentId = progress.id;
  const currentDay = progress.currentDay ?? 1;
  const currentDayTasks = progress.tasks?.filter((t) => t.dayNumber === currentDay) ?? [];
  const todayTotal = currentDayTasks.length;
  const todayDone = currentDayTasks.filter((t) => t.state === "completed").length;

  const nextUnlockMs = progress.nextDayUnlocksAt
    ? new Date(progress.nextDayUnlocksAt).getTime()
    : 0;
  const [now, setNow] = useState(() => Date.now());
  const cooldownRemainingMs = nextUnlockMs > 0 ? Math.max(0, nextUnlockMs - now) : 0;
  const showBanner = !progress.isCompleted && nextUnlockMs > now;
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!showBanner) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [showBanner]);

  // Re-tick when countdown hits zero so the server advances the day.
  useEffect(() => {
    if (nextUnlockMs === 0 || cooldownRemainingMs > 0) return;
    if (lastTickRef.current === nextUnlockMs) return;
    lastTickRef.current = nextUnlockMs;
    tickJourney(enrollmentId, journeyId).catch(console.error);
  }, [cooldownRemainingMs, nextUnlockMs, enrollmentId, journeyId]);

  if (!showBanner) return null;

  return (
    <div className="mx-4 mb-2 mt-1 rounded-2xl overflow-hidden border border-emerald-200 shadow-(--sh-3)">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-3 flex items-start gap-3">
        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0 flex items-center justify-center shadow-[var(--sh-1)]">
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
          <Clock size={20} strokeWidth={2} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Day complete</p>
          <p className="text-xs text-white/80 mt-0.5 leading-snug">
            Great work — take a break. Next day unlocks soon.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-extrabold text-white leading-none tabular-nums">
            {formatCountdown(cooldownRemainingMs)}
          </p>
          <p className="text-[10px] text-white/70 uppercase tracking-wider mt-0.5">remaining</p>
        </div>
      </div>
      <div className="bg-card px-4 py-2.5 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Day {progress.currentDay} done · Day {(progress.currentDay ?? 1) + 1} unlocks next
        </p>
        <span className="text-xs font-bold text-emerald-600">
          {todayDone}/{todayTotal} tasks
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JourneyPathViewProps {
  journey: JourneyItem;
  progress: JourneyProgress | null;
  journeyId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JourneyPathView({ journey, progress, journeyId }: JourneyPathViewProps) {
  console.log("[JourneyPathView] render", {
    journeyId,
    hasProgress: !!progress,
    progressId: progress?.id,
    nextDayUnlocksAt: progress?.nextDayUnlocksAt,
  });
  const router = useRouter();
  // useSearchParams required to satisfy Next.js hook rules; kept for potential future use.
  useSearchParams();
  const journeyReturn = useJourneyReturn();

  const isSubscribed = !!progress;
  const steps = journey.steps ?? [];
  const dayCount = steps.reduce((a, s) => a + (s.tasks?.length ?? 0), 0);
  const months = Math.max(1, Math.round(steps.length / 30));

  // Server-owned task state lookup (plain taskId -> EnrollmentTaskDto).
  const taskStateById = useMemo(() => {
    const map = new Map<string, EnrollmentTaskDto>();
    progress?.tasks?.forEach((t) => map.set(t.taskId, t));
    return map;
  }, [progress]);

  const [subscribing, setSubscribing] = useState(false);
  const [premiumSheetOpen, setPremiumSheetOpen] = useState(false);
  const [showXpFloat, setShowXpFloat] = useState(false);
  const [actionSheetData, setActionSheetData] = useState<TaskActionSheetData | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [unitTasksOpen, setUnitTasksOpen] = useState(false);
  const [unitTasksData, setUnitTasksData] = useState<{
    title: string;
    summary: string | null;
    tasks: UnitTask[];
  } | null>(null);
  const [summaryModalDay, setSummaryModalDay] = useState<number | null>(null);

  // Preview sheet (unsubscribed users)
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [previewSheetNode, setPreviewSheetNode] = useState<PathChainNode | null>(null);

  // Day summary sheet
  const [daySummaryOpen, setDaySummaryOpen] = useState(false);

  // Pulse animation ref (scale effect on scroll-to node)
  const [_pulseNodeId, setPulseNodeId] = useState<string | null>(null);

  // Track previous todayDone to detect day completion in-session
  const prevTodayDoneRef = useRef<number>(-1);

  const xpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDay = progress?.currentDay ?? 1;
  const currentDayIdx = Math.min(Math.max(0, currentDay - 1), Math.max(0, steps.length - 1));
  const activeStep = steps[currentDayIdx];
  const activeStepTitle = activeStep
    ? typeof activeStep.title === "string"
      ? activeStep.title
      : extractJourneyName(activeStep.title as never)
    : "";

  const currentDayTasks = progress?.tasks?.filter((t) => t.dayNumber === currentDay) ?? [];
  const todayTotal = currentDayTasks.length;
  const todayDone = currentDayTasks.filter((t) => t.state === "completed").length;

  const allComplete = !!progress?.isCompleted;
  const isPaidFreePreview =
    isSubscribed && (journey.isPremium ?? false) && !progress?.canAccessPremium;

  // Server-driven day advance — fire once on mount and once more when the
  // countdown hits zero. The endpoint is idempotent.
  const tickedRef = useRef(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const enrollmentId = progress?.id ?? null;
  useEffect(() => {
    console.log("[JourneyPathView] tick-effect run", { enrollmentId, ticked: tickedRef.current });
    if (!enrollmentId || tickedRef.current) return;
    tickedRef.current = true;
    tickJourney(enrollmentId, journeyId).catch(console.error);

    // XP float for tasks completed while away — check now that progress is fresh.
    const xpCheckStr = sessionStorage.getItem(`journey-xp-check-${journeyId}`);
    if (xpCheckStr) {
      sessionStorage.removeItem(`journey-xp-check-${journeyId}`);
      try {
        const prevDoneIds: string[] = JSON.parse(xpCheckStr);
        const nowDoneIds =
          progressRef.current?.tasks?.filter((t) => t.state === "completed").map((t) => t.taskId) ??
          [];
        const newlyDone = nowDoneIds.filter((id) => !prevDoneIds.includes(id));
        if (newlyDone.length > 0) {
          hapticSuccess();
          triggerXp();
        }
      } catch {
        /* ignore */
      }
    }
  }, [enrollmentId, journeyId]);

  // Return-verification: restore scroll and revalidate enrollment only when
  // returning from a task page (detected via sessionStorage markers).
  useEffect(() => {
    const savedY = sessionStorage.getItem(`journey-scroll-${journeyId}`);
    const savedDoneStr = sessionStorage.getItem(`journey-done-${journeyId}`);
    const returningFromTask = !!savedY || !!savedDoneStr;
    console.log("[JourneyPathView] return-verification effect", { journeyId, returningFromTask });

    if (savedY) {
      window.scrollTo({ top: parseInt(savedY, 10), behavior: "instant" });
      sessionStorage.removeItem(`journey-scroll-${journeyId}`);
    }

    if (savedDoneStr) {
      sessionStorage.removeItem(`journey-done-${journeyId}`);
      try {
        const prevDoneIds: string[] = JSON.parse(savedDoneStr);
        // XP check runs after SWR re-fetch below; capture prevDone for later
        // comparison via a local variable — progress is stale here so defer.
        sessionStorage.setItem(`journey-xp-check-${journeyId}`, JSON.stringify(prevDoneIds));
      } catch {
        /* ignore */
      }
    }

    // Only revalidate when we know we're returning from a task page.
    if (returningFromTask) {
      globalMutate(journeyEnrollmentKey(journeyId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  // Used only to show/hide the "today" banner — CooldownBanner manages the live timer.
  const isCooldownActive =
    isSubscribed &&
    !progress?.isCompleted &&
    (progress?.nextDayUnlocksAt
      ? new Date(progress.nextDayUnlocksAt).getTime() > Date.now()
      : false);

  // Day-summary auto-open: detect when todayDone flips to equal todayTotal in-session.
  useEffect(() => {
    if (!isSubscribed || !progress || todayTotal === 0) return;
    if (prevTodayDoneRef.current === -1) {
      // First render — record current state, don't auto-open
      prevTodayDoneRef.current = todayDone;
      return;
    }
    if (prevTodayDoneRef.current < todayTotal && todayDone === todayTotal) {
      setDaySummaryOpen(true);
    }
    prevTodayDoneRef.current = todayDone;
  }, [todayDone, todayTotal, isSubscribed]);

  // Compute the task ID to auto-scroll to (first active/available node today).
  const scrollTargetTaskId = useMemo(() => {
    if (!progress) return null;
    const currentDayTasks2 = progress.tasks?.filter((t) => t.dayNumber === currentDay) ?? [];
    const firstNonDone = currentDayTasks2.find(
      (t) => t.state === "active" || t.state === "available",
    );
    return firstNonDone?.taskId ?? currentDayTasks2[currentDayTasks2.length - 1]?.taskId ?? null;
  }, [progress, currentDay]);

  // Auto-scroll to current day's first active/available node on first mount.
  // The node may not be in the DOM immediately (large lists, lazy layout),
  // so poll for it up to ~2s at a 100ms interval.
  const hasAutoScrolledRef = useRef(false);
  useEffect(() => {
    if (!scrollTargetTaskId || !isSubscribed) return;
    if (hasAutoScrolledRef.current) return;

    let attempts = 0;
    const maxAttempts = 20;
    const intervalId = setInterval(() => {
      const el = document.querySelector<HTMLElement>(`[data-node-id="${scrollTargetTaskId}"]`);
      if (el) {
        clearInterval(intervalId);
        hasAutoScrolledRef.current = true;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setPulseNodeId(scrollTargetTaskId);
        setTimeout(() => setPulseNodeId(null), 700);
        return;
      }
      if (++attempts >= maxAttempts) clearInterval(intervalId);
    }, 100);
    return () => clearInterval(intervalId);
  }, [scrollTargetTaskId, isSubscribed]);

  function scrollToCurrentNode() {
    if (!scrollTargetTaskId) return;
    const el = document.querySelector<HTMLElement>(`[data-node-id="${scrollTargetTaskId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("scale-110");
      setTimeout(() => el.classList.remove("scale-110"), 600);
    }
  }

  function getVariant(taskId: string, stepIdx: number, taskIdx: number): NodeVariant {
    // Unsubscribed preview: Day 1 first-task active, rest default (non-interactive).
    if (!isSubscribed) {
      if (stepIdx === 0) return taskIdx === 0 ? "active" : "default";
      return "locked";
    }
    const entry = taskStateById.get(taskId);
    if (!entry) return "locked";
    return mapState(entry.state);
  }

  function getIsMandatory(task: JourneyTask): boolean {
    return (
      (task.assessmentIds?.length ?? task.assessments?.length ?? 0) > 0 ||
      (task.audioIds?.length ?? task.audios?.length ?? 0) > 0 ||
      task.fillSelfJournal === true
    );
  }

  function getTaskTitle(task: JourneyTask): string {
    if (task.extraTaskTitle) return task.extraTaskTitle;
    if (task.assessments?.length) return task.assessments[0].title ?? "";
    if (task.audios?.length) return task.audios[0].title ?? "";
    const type = getTaskType(task);
    const labels: Record<string, string> = {
      assessment: "Assessment",
      audio: "Audio Session",
      video: "Video",
      journal: "Journal Entry",
      book: "Book a Session",
      gift: "Mood Check-in",
      read: "Reading",
    };
    return labels[type] ?? "";
  }

  function navigateToTask(task: JourneyTask, taskId: string) {
    // 'Read' tasks render content inline in the action sheet — no navigation.
    if (task.extraTaskTitle && task.extraTaskDescription?.length) return;

    const redirectTo = encodeURIComponent(`/journeys/${journeyId}/details`);
    const entry = taskStateById.get(taskId);
    let dest = entry?.destinationPath ?? "";

    // Fallback: server returned an empty or generic listing path — try to
    // build an id-specific URL from linked CMS content so the user lands on
    // the exact artifact.
    if (
      !dest ||
      dest === "/journey" ||
      dest === "/assessments" ||
      dest === "/worksheets" ||
      dest === "/videos" ||
      dest === "/wellness/mindful-minutes"
    ) {
      const a = task.assessmentIds?.[0] ?? task.assessments?.[0]?.id;
      const w =
        task.worksheetIds?.[0] ?? (task.worksheets as { id?: string }[] | undefined)?.[0]?.id;
      const au = task.audioIds?.[0] ?? task.audios?.[0]?.id;
      const v = task.videoIds?.[0] ?? (task.videos as { id?: string }[] | undefined)?.[0]?.id;
      const sj =
        task.subJournalingIds?.[0] ??
        (task.subJournalings as { id?: string }[] | undefined)?.[0]?.id;
      if (a) dest = `/assessments/${a}`;
      else if (w) dest = `/worksheets/${w}`;
      else if (au) dest = `/wellness/mindful-minutes/${au}`;
      else if (v) dest = `/videos/${v}`;
      // /self-journaling/[id] is the view-completed-entry route; the
      // guided-writer route uses slug. The CMS JourneyTask type only
      // exposes subJournalingIds, not slugs, so this fallback can only
      // produce /self-journaling/new — the server-built destinationPath
      // is the authoritative slug-carrying URL.
      else if (sj || task.fillSelfJournal) dest = "/self-journaling/new";
      else if (task.moodCheckIn) dest = "/journeys/mood-check";
      else if (task.showAppointments || task.showFirstBooking) dest = "/consult/find-therapist";
    }

    if (!dest) {
      toast.error("This task isn't available yet");
      return;
    }

    // Store scroll position before navigating
    sessionStorage.setItem(`journey-scroll-${journeyId}`, String(window.scrollY));
    // Store current completed task IDs for return-verification XP trigger
    const completedIds =
      progress?.tasks?.filter((t) => t.state === "completed").map((t) => t.taskId) ?? [];
    sessionStorage.setItem(`journey-done-${journeyId}`, JSON.stringify(completedIds));

    // Record the in-flight task in the global return context so destination
    // pages can mark it completed and the completion CTA can be rendered
    // once their flow finishes.
    if (progress?.id) {
      const entryKind = (entry?.kind ?? null) as JourneyReturnTaskKind | null;
      const fallbackKind: JourneyReturnTaskKind = task.extraTaskTitle ? "READ" : "OTHER";
      journeyReturn.start({
        journeyId,
        enrollmentId: progress.id,
        taskId,
        taskKind: entryKind ?? fallbackKind,
        taskTitle: entry?.title ?? task.extraTaskTitle ?? null,
        dayNumber: entry?.dayNumber ?? undefined,
      });
    }

    // Surface enrollment + task IDs so the destination page can POST
    // complete-task with a proof id once the artifact is created.
    const sep = dest.includes("?") ? "&" : "?";
    const enrollmentIdParam = progress?.id
      ? `&journeyEnrollmentId=${encodeURIComponent(progress.id)}`
      : "";
    const taskIdParam = `&journeyTaskId=${encodeURIComponent(taskId)}`;
    const journeyIdParam = `&journeyId=${encodeURIComponent(journeyId)}`;
    router.push(
      `${dest}${sep}redirectTo=${redirectTo}${enrollmentIdParam}${taskIdParam}${journeyIdParam}`,
    );
  }

  async function markNodeDone(taskId: string) {
    if (!progress) return;
    const entry = taskStateById.get(taskId);
    const task = actionSheetData?.node.task as JourneyTask | undefined;

    // Build a proof payload from the task's derived kind. In-sheet
    // "Mark as Done" paths cover READ/OTHER and AUDIO/VIDEO — anything that
    // requires a real artifact (assessment/worksheet/journal) is only ever
    // completed from its destination page, not from the action sheet.
    let proof: TaskProof | null = null;
    const kind = entry?.kind;
    if (kind === "AUDIO") {
      const audioId = task?.audioIds?.[0] ?? task?.audios?.[0]?.id;
      if (audioId) proof = { kind: "AUDIO", audioId };
    } else if (kind === "VIDEO") {
      const videoId =
        task?.videoIds?.[0] ?? (task?.videos as { id?: string }[] | undefined)?.[0]?.id;
      if (videoId) proof = { kind: "VIDEO", videoId };
    } else if (kind === "READ" || kind === "OTHER") {
      proof = { kind: kind ?? "OTHER", note: "Read" };
    }

    if (!proof) {
      toast.error("Open the task to complete it.");
      return;
    }

    try {
      await updateNodeProgress(progress.id, journeyId, taskId, proof);
      // Keep the global return context in sync for in-sheet completions so
      // the FAB can surface if the user navigates away before seeing XP.
      if (journeyReturn.state?.taskId === taskId) {
        journeyReturn.markCompleted();
      }
      hapticSuccess();
      setActionSheetOpen(false);
      triggerXp();
    } catch (e) {
      console.error(e);
      toast.error("Could not mark task done.");
    }
  }

  function triggerXp() {
    if (xpTimer.current) clearTimeout(xpTimer.current);
    setShowXpFloat(true);
    xpTimer.current = setTimeout(() => setShowXpFloat(false), 1400);
  }

  function handleNodeTap(node: PathChainNode) {
    // Summary node — opens the markdown modal. Locked while the day isn't
    // complete; the chainItems memo has already decided locked/completed.
    if (node.taskType === "summary") {
      if (node.variant === "locked") {
        hapticWarning();
        return;
      }
      hapticLight();
      setSummaryModalDay((node.stepIdx ?? 0) + 1);
      return;
    }

    // Unsubscribed behaviour:
    // - FREE journeys: Day 1 is tappable as a free try-out; later days
    //   route to the preview sheet so the user sees the subscribe CTA.
    // - PREMIUM journeys: NO day is attemptable. Every tap routes to the
    //   preview sheet — the user must purchase the linked package first.
    if (!isSubscribed) {
      const isDayOne = (node.stepIdx ?? 0) === 0;
      if (!journey.isPremium && isDayOne) {
        hapticLight();
        setActionSheetData({ node, isActive: true });
        setActionSheetOpen(true);
        return;
      }
      hapticLight();
      setPreviewSheetNode(node);
      setPreviewSheetOpen(true);
      return;
    }

    // Session gate: free-preview users tapping book tasks → go to packages
    if (isPaidFreePreview && node.taskType === "book") {
      hapticWarning();
      router.push(packagePath);
      return;
    }

    if (node.variant === "locked") {
      hapticWarning();
      if (isPaidFreePreview || (node.isPremiumStep && isSubscribed)) {
        setPremiumSheetOpen(true);
      }
      return;
    }

    hapticLight();
    // Treat both "active" (current task) and "default" (available, not yet
    // current) as actionable — the secondary "Mark as Done" CTA gates on this
    // flag and locked/completed variants never reach here.
    setActionSheetData({
      node,
      isActive: node.variant === "active" || node.variant === "default",
    });
    setActionSheetOpen(true);
  }

  // Resolves the correct destination for any "subscribe to plan" CTA on
  // this journey. If the journey has a linked packageId, route to the
  // specific package browse page; otherwise fall back to the generic list.
  const packagePath = journey.packageId ? `/packages/browse/${journey.packageId}` : "/packages";

  // Premium journeys: enrollment is handled automatically on the backend
  // once the user purchases the linked package. The frontend MUST NOT call
  // subscribeToJourney for premium journeys — it routes to the package
  // browse flow instead. Free journeys keep the direct-enroll path.
  async function handleSubscribe() {
    if (journey.isPremium) {
      hapticMedium();
      router.push(packagePath);
      return;
    }
    setSubscribing(true);
    try {
      await subscribeToJourney(journey);
      hapticMedium();
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubscribing(false);
    }
  }

  function openUnitTasks(stepIdx: number) {
    const step = steps[stepIdx];
    if (!step) return;
    const raw =
      typeof step.title === "string" ? step.title : extractJourneyName(step.title as never);
    const title = raw.replace(/^Day\s*\d+\s*[:\-·]?\s*/i, "").trim() || raw;
    const tasks: UnitTask[] = (step.tasks ?? []).map((task, ti) => {
      const variant = getVariant(task.id, stepIdx, ti);
      return {
        title: getTaskTitle(task),
        type: getTaskType(task),
        isLocked: variant === "locked",
        isCompleted: variant === "completed",
        task,
      };
    });
    setUnitTasksData({
      title: `Day ${stepIdx + 1}: ${title}`,
      summary: step.summary ?? null,
      tasks,
    });
    setUnitTasksOpen(true);
  }

  // Build flat ChainItem list: headers + nodes in sequence.
  // nodeId is a composite purely for React key stability — the SDK only ever
  // sees the plain taskId.
  // Memoized so that the 1s `now` tick (cooldown banner) doesn't rebuild the
  // full list on every render — PathChain keeps a stable `items` reference.
  const chainItems = useMemo<ChainItem[]>(() => {
    const items: ChainItem[] = [];
    steps.forEach((step, stepIdx) => {
      const raw =
        typeof step.title === "string" ? step.title : extractJourneyName(step.title as never);
      const title = raw.replace(/^Day\s*\d+\s*[:\-·]?\s*/i, "").trim() || raw;
      const isPremium = (journey.isPremium ?? false) && stepIdx > 0;

      items.push({
        kind: "header",
        unitNumber: stepIdx + 1,
        title,
        onClick: () => openUnitTasks(stepIdx),
      });

      const taskVariants: NodeVariant[] = [];
      (step.tasks ?? []).forEach((task, ti) => {
        const nodeId = `${step.id}-${task.id}`;
        const serverEntry = taskStateById.get(task.id);
        /* When the server returns OTHER it means the content-relation join table
           wasn't populated (assessment/audio/etc. not yet connected in the DB).
           Fall back to CMS-based detection so the node still renders with the
           correct type instead of showing "journal" for every unrecognised task. */
        const taskType =
          serverEntry && serverEntry.kind !== "OTHER"
            ? mapServerKind(serverEntry.kind)
            : getTaskType(task);
        const variant = getVariant(task.id, stepIdx, ti);
        taskVariants.push(variant);
        items.push({
          kind: "node",
          node: {
            task,
            variant,
            taskType,
            nodeId,
            taskTitle: getTaskTitle(task),
            isMandatory: getIsMandatory(task),
            stepIdx,
            isPremiumStep: isPremium,
          },
        });
      });

      // Append a synthetic "Summary" node as the final item of every day.
      // Variants:
      //   locked    — the day's tasks aren't all completed yet (greyed + lock)
      //   default   — tasks done, no AI summary yet (tappable → Generate flow)
      //   completed — AI summary already persisted (tappable → View flow)
      // handleNodeTap branches on taskType === 'summary' before dereferencing
      // the (stubbed) task payload, so the minimal stub is safe.
      const dayProgress = progress?.days?.find((d) => d.dayNumber === stepIdx + 1);
      const allTasksCompleted =
        taskVariants.length > 0 && taskVariants.every((v) => v === "completed");
      const dayDone = allTasksCompleted || dayProgress?.completed === true;
      const summaryGenerated = !!dayProgress?.summary;
      const summaryVariant: NodeVariant = !dayDone
        ? "locked"
        : summaryGenerated
          ? "completed"
          : "default";
      items.push({
        kind: "node",
        node: {
          task: {
            id: `summary::${step.id}`,
            strapiId: 0,
            stepId: step.id,
            order: 9999,
          } as unknown as JourneyTask,
          variant: summaryVariant,
          taskType: "summary",
          nodeId: `${step.id}-summary`,
          taskTitle: summaryGenerated ? "View Summary" : "Summary",
          isMandatory: false,
          stepIdx,
          isPremiumStep: isPremium,
        },
      });
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, journey.isPremium, taskStateById, isSubscribed, progress?.days]);

  const imageUrl = fixImageUrl(journey.icon);
  const name = extractJourneyName(journey.name);
  const _ctaLabel = subscribing
    ? "Starting…"
    : journey.isPremium
      ? "Unlock Premium Journey"
      : "Start Free Journey →";

  return (
    <>
      {/* Paid free-preview banner */}
      {isPaidFreePreview && (
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-violet-200">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 py-3 flex items-start gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex-shrink-0 flex items-center justify-center shadow-[var(--sh-1)]">
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
              <Sparkles size={20} strokeWidth={2} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Premium Journey</p>
              <p className="text-xs text-white/80 mt-0.5 leading-snug">
                Day 1 is free — digital tasks only. Appointments are not included.
              </p>
            </div>
          </div>
          <div className="bg-card px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Unlock all days &amp; appointments</p>
            <button
              onClick={() => router.push(packagePath)}
              className="text-xs font-bold text-primary"
            >
              View Plans →
            </button>
          </div>
        </div>
      )}

      {/* Today banner (default state) */}
      {isSubscribed && activeStep && !allComplete && !isCooldownActive && (
        <div
          className="mx-4 mt-3 mb-0 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: "hsl(var(--primary) / 0.08)",
            border: "1px solid hsl(var(--primary) / 0.14)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Today · Day {currentDay}
            </p>
            <p className="text-sm font-bold text-foreground truncate">{activeStepTitle}</p>
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
            <p className="text-lg font-extrabold text-primary leading-none">
              {todayDone}
              <span className="text-sm text-muted-foreground">/{todayTotal}</span>
            </p>
            <button
              onClick={scrollToCurrentNode}
              className="text-[10px] font-bold text-primary underline underline-offset-2"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Badge chips (not subscribed) */}
      {!isSubscribed && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
            <BarChart2 className="w-3 h-3" />
            Beginner
          </span>
          <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            {dayCount} Tasks
          </span>
          <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
            <Timer className="w-3 h-3" />
            5–10 min/day
          </span>
        </div>
      )}

      {/* Path */}
      <div className="relative pb-6">
        <XpFloat show={showXpFloat} />
        <div className={cn(!isSubscribed && "opacity-[0.85]")}>
          <PathChain items={chainItems} onNodeTap={handleNodeTap} />
        </div>

        {/* Premium locked wall */}
        {isSubscribed && journey.isPremium && !progress?.canAccessPremium && (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Unlock more units</p>
            <button
              onClick={() => router.push(packagePath)}
              className="text-xs font-bold text-primary underline underline-offset-2"
            >
              View Plans →
            </button>
          </div>
        )}
      </div>

      {/* Unenrolled users see the sticky Subscribe banner rendered by the
          details page — no footer CTA here to avoid stacking two CTAs. */}

      {/* Task action sheet */}
      <JourneyTaskActionSheet
        data={actionSheetData}
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onOpen={() => {
          setActionSheetOpen(false);
          if (!actionSheetData) return;
          const { node } = actionSheetData;
          navigateToTask(node.task as JourneyTask, (node.task as JourneyTask).id);
        }}
        onMarkDone={() =>
          actionSheetData && markNodeDone((actionSheetData.node.task as JourneyTask).id)
        }
      />

      {/* Unit tasks sheet */}
      <JourneyUnitTasksSheet
        open={unitTasksOpen}
        onClose={() => setUnitTasksOpen(false)}
        unitTitle={unitTasksData?.title ?? ""}
        summary={unitTasksData?.summary ?? null}
        tasks={unitTasksData?.tasks ?? []}
        onTaskTap={(item) => {
          setUnitTasksOpen(false);
          if (isPaidFreePreview && item.type === "book") {
            router.push(packagePath);
            return;
          }
          navigateToTask(item.task, item.task.id);
        }}
      />

      {/* Day summary modal (AI-generated, end-of-day) */}
      {enrollmentId && summaryModalDay != null && (
        <JourneyDaySummaryModal
          open={summaryModalDay != null}
          onClose={() => setSummaryModalDay(null)}
          enrollmentId={enrollmentId}
          dayNumber={summaryModalDay}
          totalDays={steps.length}
          onSummaryGenerated={() => {
            // Refresh enrollment so progress.days[].summary updates and the
            // summary node flips from 'default' (Generate) to 'completed' (View).
            void globalMutate(journeyEnrollmentKey(journeyId));
          }}
        />
      )}

      {/* Premium / subscribe sheet */}
      <Sheet open={premiumSheetOpen} onOpenChange={setPremiumSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
          <SheetTitle className="sr-only">Journey details</SheetTitle>
          <div className="mx-auto w-10 h-1 bg-border rounded-full mb-5" />
          {!isSubscribed ? (
            <>
              <div className="relative h-28 w-full rounded-2xl overflow-hidden mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-3 left-4 text-white font-bold text-sm">{name}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {extractJourneyDescription(journey.description) ||
                  "Unlock all units and track your progress."}
              </p>
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { icon: <Clock className="w-3 h-3" />, text: `${dayCount} Tasks` },
                  { icon: <BarChart2 className="w-3 h-3" />, text: `${steps.length} Days` },
                  { icon: <Timer className="w-3 h-3" />, text: `${months}M Duration` },
                ].map(({ icon, text }) => (
                  <span
                    key={text}
                    className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {icon}
                    {text}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setPremiumSheetOpen(false);
                  router.push(packagePath);
                }}
                className="w-full h-14 rounded-2xl bg-foreground text-background font-bold text-base"
              >
                View Plans →
              </button>
            </>
          ) : isPaidFreePreview ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-[var(--sh-1)]">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                  <Sparkles size={20} strokeWidth={2} className="text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Premium Journey</p>
                  <p className="text-xs text-muted-foreground">
                    Day 1 free · full access requires a plan
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                You're experiencing{" "}
                <span className="font-semibold text-foreground">Day 1 for free</span>. Digital tasks
                like audio, assessments, and journaling are available.
              </p>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Appointments and all remaining days are included with a package.
              </p>
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { icon: <Clock className="w-3 h-3" />, text: `${dayCount} Tasks` },
                  { icon: <BarChart2 className="w-3 h-3" />, text: `${steps.length} Days` },
                  { icon: <Timer className="w-3 h-3" />, text: `${months}M Duration` },
                ].map(({ icon, text }) => (
                  <span
                    key={text}
                    className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {icon}
                    {text}
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setPremiumSheetOpen(false);
                  router.push(packagePath);
                }}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base"
              >
                Get Full Access →
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground mb-2">Unlock with a plan</p>
              <p className="text-sm text-muted-foreground mb-6">
                Upgrade to unlock all units and track your progress.
              </p>
              <button
                onClick={() => {
                  setPremiumSheetOpen(false);
                  router.push(packagePath);
                }}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base"
              >
                View Plans →
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Preview sheet (unsubscribed users) */}
      <JourneyPreviewSheet
        open={previewSheetOpen}
        onClose={() => {
          setPreviewSheetOpen(false);
          setPreviewSheetNode(null);
        }}
        taskType={previewSheetNode?.taskType ?? "journal"}
        taskTitle={previewSheetNode?.taskTitle ?? ""}
        isPremium={journey.isPremium ?? false}
        isSubscribing={subscribing}
        onSubscribe={() => {
          setPreviewSheetOpen(false);
          handleSubscribe();
        }}
        onViewPlans={() => {
          setPreviewSheetOpen(false);
          router.push(packagePath);
        }}
      />

      {/* Day summary sheet */}
      {progress && (
        <JourneyDaySummarySheet
          open={daySummaryOpen}
          onClose={() => setDaySummaryOpen(false)}
          enrollmentId={progress.id}
          journeyId={journeyId}
          dayNumber={currentDay}
          totalDays={steps.length}
          onContinue={() => {
            setDaySummaryOpen(false);
            setTimeout(scrollToCurrentNode, 300);
          }}
        />
      )}
    </>
  );
}
