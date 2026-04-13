'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame, Zap, Lock, Clock, BarChart2, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PathChain, getTaskType, type PathChainNode, type ChainItem } from './path-chain';
import { XpFloat } from './xp-float';
import { JourneyTaskActionSheet, type TaskActionSheetData } from './journey-task-action-sheet';
import { JourneyUnitTasksSheet, type UnitTask } from './journey-unit-tasks-sheet';
import { getTypeColor } from './path-node';
import type { NodeVariant } from './path-node';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  useJourneyProgress, subscribeToJourney, updateNodeProgress,
} from '@/hooks/use-journey';
import type { JourneyProgress } from '@/hooks/use-journey';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { extractJourneyName, extractJourneyDescription } from '@/types/journey';
import type { JourneyItem, JourneyTask, JourneyAudio, JourneyRichText } from '@/types/journey';
import { fixImageUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function richText(rt: unknown): string {
  if (!rt || !Array.isArray(rt)) return '';
  return (rt as JourneyRichText[])
    .map(b => (b.children ?? []).map(c => c.text ?? (c.children ?? []).map(n => n.text ?? '').join('')).join(''))
    .join('\n').trim();
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ progress }: { progress: JourneyProgress }) {
  const pct = progress.progress ?? 0;
  return (
    <div className="flex items-center justify-between px-5 py-2.5 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-1.5">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-extrabold text-foreground">{progress.streak}</span>
        <span className="text-[10px] text-muted-foreground">Streak</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-extrabold text-foreground">{progress.gems}</span>
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
  mobile: string | null;
  journeyId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JourneyPathView({ journey, progress, mobile, journeyId }: JourneyPathViewProps) {
  const router       = useRouter();
  const isSubscribed = !!progress;
  const steps        = journey.steps ?? [];
  const dayCount     = steps.reduce((a, s) => a + (s.tasks?.length ?? 0), 0);
  const months       = Math.max(1, Math.round(steps.length / 30));

  const completedIds   = new Set(progress?.completedNodeIds ?? []);
  const [subscribing, setSubscribing]             = useState(false);
  const [premiumSheetOpen, setPremiumSheetOpen]   = useState(false);
  const [showXpFloat, setShowXpFloat]             = useState(false);
  const [actionSheetData, setActionSheetData]     = useState<TaskActionSheetData | null>(null);
  const [actionSheetOpen, setActionSheetOpen]     = useState(false);
  const [unitTasksOpen, setUnitTasksOpen]         = useState(false);
  const [unitTasksData, setUnitTasksData]         = useState<{ title: string; tasks: UnitTask[] } | null>(null);

  const xpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flat list of all nodes across all steps for active detection
  const allNodes = steps.flatMap((step, si) =>
    (step.tasks ?? []).map((task, ti) => ({ nodeId: `${step.id}-${task.id}`, stepIdx: si, taskIdx: ti, task }))
  );
  const totalNodes         = allNodes.length;
  const firstIncompleteIdx = allNodes.findIndex(n => !completedIds.has(n.nodeId));
  const activeNodeId       = isSubscribed && firstIncompleteIdx >= 0 ? allNodes[firstIncompleteIdx].nodeId : null;
  const allComplete        = isSubscribed && firstIncompleteIdx === -1 && totalNodes > 0;

  // Active day for Today banner
  const activeDayIdx    = isSubscribed ? (allNodes.find(n => n.nodeId === activeNodeId)?.stepIdx ?? 0) : 0;
  const activeStep      = steps[activeDayIdx];
  const activeStepTitle = activeStep ? (typeof activeStep.title === 'string' ? activeStep.title : extractJourneyName(activeStep.title as never)) : '';
  const todayDone       = activeStep ? (activeStep.tasks ?? []).filter(t => completedIds.has(`${activeStep.id}-${t.id}`)).length : 0;
  const todayTotal      = activeStep?.tasks?.length ?? 0;

  function getVariant(nodeId: string, stepIdx: number, taskIdx: number): NodeVariant {
    if (stepIdx === 0) {
      if (!isSubscribed) return taskIdx === 0 ? 'active' : 'default';
      if (completedIds.has(nodeId)) return 'completed';
      if (nodeId === activeNodeId) return 'active';
      const first = allNodes.find(n => n.stepIdx === 0 && !completedIds.has(n.nodeId));
      return first?.nodeId === nodeId ? 'default' : 'locked';
    }
    if (!isSubscribed) return 'locked';
    if (completedIds.has(nodeId)) return 'completed';
    if (nodeId === activeNodeId) return 'active';
    const firstIn = allNodes.find(n => n.stepIdx === stepIdx && !completedIds.has(n.nodeId));
    return firstIn?.nodeId === nodeId ? 'default' : 'locked';
  }

  function getIsMandatory(task: JourneyTask): boolean {
    return (task.assessments?.length ?? 0) > 0 || (task.audios?.length ?? 0) > 0 || task.fillSelfJournal === true;
  }

  function getTaskTitle(task: JourneyTask): string {
    if (task.extraTaskTitle) return task.extraTaskTitle;
    if (task.assessments?.length) return task.assessments[0].title ?? '';
    if (task.audios?.length) return task.audios[0].title ?? '';
    return '';
  }

  function navigateToTask(task: JourneyTask) {
    if (task.assessments?.length) {
      router.push(`/assessments/${task.assessments[0].id}?journey=${journeyId}`);
    } else if (task.audios?.length) {
      const audio = task.audios[0] as JourneyAudio;
      router.push(`/wellness/mindful-minutes/${audio.mindfulMinuteId || audio.documentId || audio.id}`);
    } else if (task.moodCheckIn) {
      router.push(`/journeys/mood-check?journey=${journeyId}`);
    } else if (task.showAppointments || task.showFirstBooking) {
      router.push('/consult/appointments');
    } else if (task.fillSelfJournal || (task.worksheets && (task.worksheets as unknown[]).length > 0)) {
      const ws = task.worksheets as Array<{ id: string }> | undefined;
      router.push(ws?.length ? `/worksheet/${ws[0].id}` : '/self-journaling/new');
    }
  }

  async function markNodeDone(node: PathChainNode) {
    if (!mobile || !isSubscribed) return;
    await updateNodeProgress(mobile, journeyId, node.nodeId, totalNodes);
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
      if (node.isPremiumStep && isSubscribed) setPremiumSheetOpen(true);
      return;
    }
    hapticLight();
    setActionSheetData({ node, isActive: node.variant === 'active' });
    setActionSheetOpen(true);
  }

  function handleContinue() {
    if (!activeNodeId) return;
    const n = allNodes.find(n => n.nodeId === activeNodeId);
    if (n) navigateToTask(n.task);
  }

  async function handleSubscribe() {
    if (!mobile) { router.push('/login'); return; }
    setSubscribing(true);
    try {
      await subscribeToJourney(mobile, journey);
      hapticMedium();
    } catch (e) { console.error(e); }
    finally { setSubscribing(false); }
  }

  function openUnitTasks(stepIdx: number) {
    const step = steps[stepIdx];
    if (!step) return;
    const raw   = typeof step.title === 'string' ? step.title : extractJourneyName(step.title as never);
    const title = raw.replace(/^Day\s*\d+\s*[:\-·]?\s*/i, '').trim() || raw;
    const tasks: UnitTask[] = (step.tasks ?? []).map((task, ti) => ({
      title: getTaskTitle(task),
      type: getTaskType(task),
      isLocked: getVariant(`${step.id}-${task.id}`, stepIdx, ti) === 'locked',
      isCompleted: getVariant(`${step.id}-${task.id}`, stepIdx, ti) === 'completed',
      task,
    }));
    setUnitTasksData({ title: `Day ${stepIdx + 1}: ${title}`, tasks });
    setUnitTasksOpen(true);
  }

  // Build flat ChainItem list: headers + nodes in sequence
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

    // Locked hint row for non-subscribed days 2+
    if (!isSubscribed && stepIdx > 0) {
      // We'll render this in the header, not as a separate chain item
    }

    (step.tasks ?? []).forEach((task, ti) => {
      const nodeId = `${step.id}-${task.id}`;
      chainItems.push({
        kind: 'node',
        node: {
          task,
          variant: getVariant(nodeId, stepIdx, ti),
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

      {/* Today banner */}
      {isSubscribed && activeStep && !allComplete && (
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
        {isSubscribed && journey.isPremium && !progress?.isPremium && (
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

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border px-4 pt-3 pb-6 z-20">
        {isSubscribed ? (
          allComplete ? (
            <div className="w-full h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-base font-bold text-primary">Journey Complete 🎉</span>
            </div>
          ) : (
            <button
              onClick={handleContinue}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm tracking-widest uppercase active:scale-[0.98] transition-transform shadow-md shadow-primary/30"
            >
              Continue
            </button>
          )
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Task action sheet */}
      <JourneyTaskActionSheet
        data={actionSheetData}
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onOpen={() => {
          setActionSheetOpen(false);
          if (!actionSheetData) return;
          const { node, isActive } = actionSheetData;
          if (isSubscribed && mobile && isActive) {
            updateNodeProgress(mobile, journeyId, node.nodeId, totalNodes).then(() => {
              hapticSuccess();
              triggerXp();
            });
          }
          navigateToTask(node.task as JourneyTask);
        }}
        onMarkDone={() => actionSheetData && markNodeDone(actionSheetData.node)}
      />

      {/* Unit tasks sheet */}
      <JourneyUnitTasksSheet
        open={unitTasksOpen}
        onClose={() => setUnitTasksOpen(false)}
        unitTitle={unitTasksData?.title ?? ''}
        tasks={unitTasksData?.tasks ?? []}
        onTaskTap={(item) => { setUnitTasksOpen(false); navigateToTask(item.task); }}
      />

      {/* Premium / subscribe sheet */}
      <Sheet open={premiumSheetOpen} onOpenChange={setPremiumSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8">
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
          ) : (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg font-bold">Unlock with a plan</SheetTitle>
              </SheetHeader>
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
