/**
 * FILE: components/journey/journey-path-view.tsx
 *
 * PURPOSE:
 *   Renders the enrolled-journey path view. All unlock / cooldown / streak logic
 *   is now server-owned — this component reads per-task `state` and the
 *   enrollment's `nextDayUnlocksAt` directly and renders accordingly.
 *
 * LOGIC OVERVIEW:
 *   1. Flattens CMS steps into nodes, keyed by composite "stepId-taskId" for React.
 *   2. Looks up each task's server state (locked/available/active/completed)
 *      from enrollment.tasks by plain taskId — maps it to NodeVariant.
 *   3. Navigates using task.destinationPath (plus a redirectTo back to details).
 *   4. On mount (when subscribed) fires tickJourney() — the server idempotently
 *      advances the day if the cooldown has elapsed.
 *   5. If nextDayUnlocksAt is in the future, shows a sticky countdown banner and
 *      re-ticks when it hits zero.
 *   6. markNodeDone and action-sheet onOpen send the plain taskId.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   journey        — CMS JourneyItem (content structure)
 *   progress       — PatientJourneyResponseDto (null if unsubscribed)
 *   journeyId      — route param id
 *
 * DEPENDENCIES:
 *   subscribeToJourney, updateNodeProgress, tickJourney — hooks/journeys/use-journey-detail
 *   PathChain, JourneyTaskActionSheet, JourneyUnitTasksSheet
 *
 * LAST UPDATED: 2026-04-20 — migrate to server-owned task state + tick endpoint
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Zap, Lock, Clock, BarChart2, Timer, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PathChain, getTaskType, type PathChainNode, type ChainItem } from './path-chain';
import { XpFloat } from './xp-float';
import { JourneyTaskActionSheet, type TaskActionSheetData } from './journey-task-action-sheet';
import { JourneyUnitTasksSheet, type UnitTask } from './journey-unit-tasks-sheet';
import type { NodeVariant } from './path-node';
import {
  Sheet, SheetContent, SheetTitle,
} from '@/components/ui/sheet';
import {
  subscribeToJourney, updateNodeProgress, tickJourney,
  type JourneyProgress,
} from '@/hooks/journeys/use-journey-detail';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { extractJourneyName, extractJourneyDescription } from '@/types/journey';
import type { JourneyItem, JourneyTask } from '@/types/journey';
import { fixImageUrl } from '@/lib/utils';
import type { EnrollmentTaskDto } from '@/sdk/backend-v2';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapState(state: EnrollmentTaskDto['state']): NodeVariant {
  if (state === 'completed') return 'completed';
  if (state === 'active') return 'active';
  if (state === 'locked') return 'locked';
  return 'default'; // 'available'
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ progress }: { progress: JourneyProgress }) {
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
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
            <circle
              cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 13}`}
              strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
              strokeLinecap="round" className="text-primary transition-all duration-500"
            />
          </svg>
        </div>
        <span className="text-[10px] text-muted-foreground">{pct}%</span>
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
  const router       = useRouter();
  const isSubscribed = !!progress;
  const steps        = journey.steps ?? [];
  const dayCount     = steps.reduce((a, s) => a + (s.tasks?.length ?? 0), 0);
  const months       = Math.max(1, Math.round(steps.length / 30));

  // Server-owned task state lookup (plain taskId -> EnrollmentTaskDto).
  const taskStateById = useMemo(() => {
    const map = new Map<string, EnrollmentTaskDto>();
    progress?.tasks?.forEach((t) => map.set(t.taskId, t));
    return map;
  }, [progress]);

  const [subscribing, setSubscribing]             = useState(false);
  const [premiumSheetOpen, setPremiumSheetOpen]   = useState(false);
  const [showXpFloat, setShowXpFloat]             = useState(false);
  const [actionSheetData, setActionSheetData]     = useState<TaskActionSheetData | null>(null);
  const [actionSheetOpen, setActionSheetOpen]     = useState(false);
  const [unitTasksOpen, setUnitTasksOpen]         = useState(false);
  const [unitTasksData, setUnitTasksData]         = useState<{ title: string; tasks: UnitTask[] } | null>(null);

  const xpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDay = progress?.currentDay ?? 1;
  const currentDayIdx = Math.min(Math.max(0, currentDay - 1), Math.max(0, steps.length - 1));
  const activeStep = steps[currentDayIdx];
  const activeStepTitle = activeStep
    ? (typeof activeStep.title === 'string' ? activeStep.title : extractJourneyName(activeStep.title as never))
    : '';

  const currentDayTasks = progress?.tasks?.filter((t) => t.dayNumber === (currentDay as unknown)) ?? [];
  const todayTotal = currentDayTasks.length;
  const todayDone  = currentDayTasks.filter((t) => t.state === 'completed').length;

  const allComplete = !!progress?.isCompleted;
  const isPaidFreePreview = isSubscribed && (journey.isPremium ?? false) && !progress?.canAccessPremium;

  // Server-driven day advance — fire once on mount and once more when the
  // countdown hits zero. The endpoint is idempotent.
  const tickedRef = useRef(false);
  useEffect(() => {
    if (!progress || tickedRef.current) return;
    tickedRef.current = true;
    tickJourney(progress.id, journeyId).catch(console.error);
  }, [progress, journeyId]);

  // Countdown banner driven by server-provided nextDayUnlocksAt.
  const nextUnlockMs = progress?.nextDayUnlocksAt ? new Date(progress.nextDayUnlocksAt).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  const cooldownRemainingMs = nextUnlockMs > 0 ? Math.max(0, nextUnlockMs - now) : 0;
  const showCooldownBanner = isSubscribed && !allComplete && nextUnlockMs > now;

  useEffect(() => {
    if (!showCooldownBanner) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [showCooldownBanner]);

  // When the countdown reaches zero, re-tick so the server flips the state.
  useEffect(() => {
    if (!progress) return;
    if (nextUnlockMs === 0) return;
    if (cooldownRemainingMs > 0) return;
    tickJourney(progress.id, journeyId).catch(console.error);
  }, [cooldownRemainingMs, nextUnlockMs, progress, journeyId]);

  function getVariant(taskId: string, stepIdx: number, taskIdx: number): NodeVariant {
    // Unsubscribed preview: Day 1 first-task active, rest default (non-interactive).
    if (!isSubscribed) {
      if (stepIdx === 0) return taskIdx === 0 ? 'active' : 'default';
      return 'locked';
    }
    const entry = taskStateById.get(taskId);
    if (!entry) return 'locked';
    return mapState(entry.state);
  }

  function getIsMandatory(task: JourneyTask): boolean {
    return (task.assessmentIds?.length ?? task.assessments?.length ?? 0) > 0
      || (task.audioIds?.length ?? task.audios?.length ?? 0) > 0
      || task.fillSelfJournal === true;
  }

  function getTaskTitle(task: JourneyTask): string {
    if (task.extraTaskTitle) return task.extraTaskTitle;
    if (task.assessments?.length) return task.assessments[0].title ?? '';
    if (task.audios?.length) return task.audios[0].title ?? '';
    const type = getTaskType(task);
    const labels: Record<string, string> = {
      assessment: 'Assessment',
      audio: 'Audio Session',
      video: 'Video',
      journal: 'Journal Entry',
      book: 'Book a Session',
      gift: 'Mood Check-in',
      read: 'Reading',
    };
    return labels[type] ?? '';
  }

  function navigateToTask(task: JourneyTask, taskId: string) {
    // 'Read' tasks render content inline in the action sheet — no navigation.
    if (task.extraTaskTitle && task.extraTaskDescription?.length) return;

    const redirectTo = encodeURIComponent(`/journeys/${journeyId}/details`);
    const entry = taskStateById.get(taskId);
    const dest = entry?.destinationPath;
    if (!dest) return;
    const sep = dest.includes('?') ? '&' : '?';
    router.push(`${dest}${sep}redirectTo=${redirectTo}`);
  }

  async function markNodeDone(taskId: string) {
    if (!progress) return;
    await updateNodeProgress(progress.id, journeyId, taskId);
    hapticSuccess();
    setActionSheetOpen(false);
    triggerXp();
  }

  function triggerXp() {
    if (xpTimer.current) clearTimeout(xpTimer.current);
    setShowXpFloat(true);
    xpTimer.current = setTimeout(() => setShowXpFloat(false), 1400);
  }

  function handleNodeTap(node: PathChainNode) {
    if (node.variant === 'locked') {
      hapticWarning();
      if (isPaidFreePreview || (node.isPremiumStep && isSubscribed)) {
        setPremiumSheetOpen(true);
      }
      return;
    }
    hapticLight();
    setActionSheetData({ node, isActive: node.variant === 'active' });
    setActionSheetOpen(true);
  }

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      await subscribeToJourney(journey);
      hapticMedium();
    } catch (e) { console.error(e); }
    finally { setSubscribing(false); }
  }

  function openUnitTasks(stepIdx: number) {
    const step = steps[stepIdx];
    if (!step) return;
    const raw   = typeof step.title === 'string' ? step.title : extractJourneyName(step.title as never);
    const title = raw.replace(/^Day\s*\d+\s*[:\-·]?\s*/i, '').trim() || raw;
    const tasks: UnitTask[] = (step.tasks ?? []).map((task, ti) => {
      const variant = getVariant(task.id, stepIdx, ti);
      return {
        title: getTaskTitle(task),
        type: getTaskType(task),
        isLocked: variant === 'locked',
        isCompleted: variant === 'completed',
        task,
      };
    });
    setUnitTasksData({ title: `Day ${stepIdx + 1}: ${title}`, tasks });
    setUnitTasksOpen(true);
  }

  // Build flat ChainItem list: headers + nodes in sequence.
  // nodeId is a composite purely for React key stability — the SDK only ever
  // sees the plain taskId.
  const chainItems: ChainItem[] = [];
  steps.forEach((step, stepIdx) => {
    const raw       = typeof step.title === 'string' ? step.title : extractJourneyName(step.title as never);
    const title     = raw.replace(/^Day\s*\d+\s*[:\-·]?\s*/i, '').trim() || raw;
    const isPremium = (journey.isPremium ?? false) && stepIdx > 0;

    chainItems.push({
      kind: 'header',
      unitNumber: stepIdx + 1,
      title,
      onClick: () => openUnitTasks(stepIdx),
    });

    (step.tasks ?? []).forEach((task, ti) => {
      const nodeId = `${step.id}-${task.id}`;
      chainItems.push({
        kind: 'node',
        node: {
          task,
          variant: getVariant(task.id, stepIdx, ti),
          taskType: getTaskType(task),
          nodeId,
          taskTitle: getTaskTitle(task),
          isMandatory: getIsMandatory(task),
          stepIdx,
          isPremiumStep: isPremium,
        },
      });
    });
  });

  const imageUrl = fixImageUrl(journey.icon);
  const name     = extractJourneyName(journey.name);
  const ctaLabel = subscribing ? 'Please wait…'
    : journey.isPremium ? 'Unlock Premium Journey'
    : 'Start Journey →';

  return (
    <>
      {/* Stats */}
      {isSubscribed && progress && <StatsBar progress={progress} />}

      {/* Paid free-preview banner */}
      {isPaidFreePreview && (
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden border border-violet-200">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-4 py-3 flex items-start gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex-shrink-0 flex items-center justify-center shadow-sm">
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
              <Sparkles className="w-5 h-5 text-white" />
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
              onClick={() => router.push('/packages')}
              className="text-xs font-bold text-primary"
            >
              View Plans →
            </button>
          </div>
        </div>
      )}

      {/* Sticky "day complete" cooldown banner — driven by server nextDayUnlocksAt */}
      {showCooldownBanner && (
        <div className="sticky top-14 z-30 mx-4 mt-3 rounded-2xl overflow-hidden border border-emerald-200 shadow-lg">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-3 flex items-start gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0 flex items-center justify-center shadow-sm">
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
              <Clock className="w-5 h-5 text-white" />
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
            <p className="text-xs text-muted-foreground">Day {currentDayIdx + 1} done · Day {currentDayIdx + 2} unlocks next</p>
            <span className="text-xs font-bold text-emerald-600">{todayDone}/{todayTotal} tasks</span>
          </div>
        </div>
      )}

      {/* Today banner (default state) */}
      {isSubscribed && activeStep && !allComplete && !showCooldownBanner && (
        <div
          className="mx-4 mt-3 mb-0 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.14)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Today</p>
            <p className="text-sm font-bold text-foreground truncate">{activeStepTitle}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-extrabold text-primary leading-none">
              {todayDone}<span className="text-sm text-muted-foreground">/{todayTotal}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">tasks done</p>
          </div>
        </div>
      )}

      {/* Badge chips (not subscribed) */}
      {!isSubscribed && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
            <BarChart2 className="w-3 h-3" />Beginner
          </span>
          <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
            <Clock className="w-3 h-3" />{dayCount} Tasks
          </span>
          <span className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
            <Timer className="w-3 h-3" />5–10 min/day
          </span>
        </div>
      )}

      {/* Path */}
      <div className="relative pb-6">
        <XpFloat show={showXpFloat} />
        <div className={cn(!isSubscribed && 'opacity-[0.85]')}>
          <PathChain
            items={chainItems}
            onNodeTap={handleNodeTap}
          />
        </div>

        {/* Premium locked wall */}
        {isSubscribed && journey.isPremium && !progress?.canAccessPremium && (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Unlock more units</p>
            <button onClick={() => router.push('/packages')} className="text-xs font-bold text-primary underline underline-offset-2">
              View Plans →
            </button>
          </div>
        )}
      </div>

      {/* Footer — only shown when NOT subscribed */}
      {!isSubscribed && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border px-4 pt-3 pb-6 z-20">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            {months} {months === 1 ? 'Month' : 'Months'} · {steps.length} Days · {dayCount} Tasks
          </p>
          <button
            onClick={journey.isPremium ? () => setPremiumSheetOpen(true) : handleSubscribe}
            disabled={subscribing}
            className={cn(
              'w-full h-14 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform',
              subscribing && 'opacity-60 cursor-not-allowed',
              journey.isPremium ? 'bg-foreground text-background' : 'bg-primary text-primary-foreground shadow-md shadow-primary/30',
            )}
          >
            {ctaLabel}
          </button>
        </div>
      )}

      {/* Task action sheet */}
      <JourneyTaskActionSheet
        data={actionSheetData}
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onOpen={() => {
          setActionSheetOpen(false);
          if (!actionSheetData) return;
          const { node, isActive } = actionSheetData;
          const task = node.task as JourneyTask;
          if (isSubscribed && progress && isActive) {
            updateNodeProgress(progress.id, journeyId, task.id).then(() => {
              hapticSuccess();
              triggerXp();
            });
          }
          navigateToTask(task, task.id);
        }}
        onMarkDone={() =>
          actionSheetData && markNodeDone((actionSheetData.node.task as JourneyTask).id)
        }
      />

      {/* Unit tasks sheet */}
      <JourneyUnitTasksSheet
        open={unitTasksOpen}
        onClose={() => setUnitTasksOpen(false)}
        unitTitle={unitTasksData?.title ?? ''}
        tasks={unitTasksData?.tasks ?? []}
        onTaskTap={(item) => {
          setUnitTasksOpen(false);
          navigateToTask(item.task, item.task.id);
        }}
      />

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
                {extractJourneyDescription(journey.description) || 'Unlock all units and track your progress.'}
              </p>
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { icon: <Clock className="w-3 h-3" />, text: `${dayCount} Tasks` },
                  { icon: <BarChart2 className="w-3 h-3" />, text: `${steps.length} Days` },
                  { icon: <Timer className="w-3 h-3" />, text: `${months}M Duration` },
                ].map(({ icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {icon}{text}
                  </span>
                ))}
              </div>
              <button
                onClick={() => { setPremiumSheetOpen(false); router.push('/packages'); }}
                className="w-full h-14 rounded-2xl bg-foreground text-background font-bold text-base"
              >
                View Plans →
              </button>
            </>
          ) : isPaidFreePreview ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-sm">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Premium Journey</p>
                  <p className="text-xs text-muted-foreground">Day 1 free · full access requires a plan</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                You're experiencing <span className="font-semibold text-foreground">Day 1 for free</span>. Digital tasks like audio, assessments, and journaling are available.
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
                  <span key={text} className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {icon}{text}
                  </span>
                ))}
              </div>
              <button
                onClick={() => { setPremiumSheetOpen(false); router.push('/packages'); }}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base"
              >
                Get Full Access →
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground mb-2">Unlock with a plan</p>
              <p className="text-sm text-muted-foreground mb-6">Upgrade to unlock all units and track your progress.</p>
              <button
                onClick={() => { setPremiumSheetOpen(false); router.push('/packages'); }}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base"
              >
                View Plans →
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
