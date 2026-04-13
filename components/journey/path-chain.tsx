'use client';

import { useRef, useEffect, useState } from 'react';
import { PathNode, type NodeVariant, type NodeTaskType } from './path-node';
import { UnitHeaderBar } from './unit-header-bar';
import type { JourneyTask } from '@/types/journey';

export interface PathChainNode {
  task: JourneyTask;
  variant: NodeVariant;
  taskType: NodeTaskType;
  nodeId: string;
  taskTitle?: string;
  isMandatory?: boolean;
  stepIdx?: number;
  isPremiumStep?: boolean;
}

export type ChainItem =
  | { kind: 'node'; node: PathChainNode }
  | { kind: 'header'; unitNumber: number; title: string; onClick?: () => void };

interface PathChainProps {
  items: ChainItem[];
  onNodeTap: (node: PathChainNode) => void;
}

export function getTaskType(task: JourneyTask): NodeTaskType {
  if (task.audios       && task.audios.length > 0)                          return 'audio';
  if (task.assessments  && task.assessments.length > 0)                     return 'assessment';
  if (task.fillSelfJournal)                                                  return 'journal';
  if (task.worksheets   && (task.worksheets as unknown[]).length > 0)        return 'journal';
  if (task.showAppointments || task.showFirstBooking)                        return 'book';
  if (task.moodCheckIn)                                                      return 'gift';
  // Tasks with only extraTaskDescription (no media) = reading material
  if (task.extraTaskDescription && (task.extraTaskDescription as unknown[]).length > 0) return 'read';
  return 'video';
}

const LR = [-68, 68]; // px from center, alternating

interface SvgState { d: string; w: number; h: number }

export function PathChain({ items, onNodeTap }: PathChainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg]  = useState<SvgState>({ d: '', w: 0, h: 0 });

  const nodeItems = items.filter((i): i is Extract<ChainItem, { kind: 'node' }> => i.kind === 'node');

  // Re-measure whenever items (or their variants) change
  const key = nodeItems.map(i => `${i.node.nodeId}:${i.node.variant}`).join('|');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || nodeItems.length < 2) { setSvg({ d: '', w: 0, h: 0 }); return; }

    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const cRect   = container.getBoundingClientRect();
        const circles = Array.from(
          container.querySelectorAll<HTMLElement>('[data-circle="true"]')
        );
        if (circles.length < 2 || cRect.width === 0) return;

        const parts: string[] = [];
        for (let i = 0; i < circles.length - 1; i++) {
          const r1 = circles[i].getBoundingClientRect();
          const r2 = circles[i + 1].getBoundingClientRect();
          const x1 = r1.left - cRect.left + r1.width  / 2;
          const y1 = r1.top  - cRect.top  + r1.height / 2;
          const x2 = r2.left - cRect.left + r2.width  / 2;
          const y2 = r2.top  - cRect.top  + r2.height / 2;
          const mid = (y1 + y2) / 2;
          parts.push(`M${x1.toFixed(1)},${y1.toFixed(1)} C${x1.toFixed(1)},${mid.toFixed(1)} ${x2.toFixed(1)},${mid.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`);
        }
        if (parts.length) setSvg({ d: parts.join(' '), w: Math.round(cRect.width), h: container.scrollHeight });
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  let nodeIdx = 0;

  return (
    <div ref={containerRef} className="relative flex flex-col items-center py-4">
      {/* Continuous curved connector across all nodes */}
      {svg.d && (
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ zIndex: 0 }}
          width={svg.w}
          height={svg.h}
        >
          <path
            d={svg.d}
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />
        </svg>
      )}

      {items.map((item, idx) => {
        if (item.kind === 'header') {
          return (
            <div key={`header-${idx}`} className="w-full z-10 mt-3 mb-1">
              <UnitHeaderBar
                unitNumber={item.unitNumber}
                title={item.title}
                onClick={item.onClick}
              />
            </div>
          );
        }

        const { node } = item;
        const xOffset  = LR[nodeIdx % 2];
        const isActive = node.variant === 'active';
        nodeIdx++;

        return (
          <div
            key={node.nodeId}
            className="relative z-10 flex flex-col items-center"
            style={{ transform: `translateX(${xOffset}px)` }}
          >
            {nodeIdx > 1 && <div className={isActive ? 'h-5' : 'h-4'} />}
            <PathNode
              variant={node.variant}
              taskType={node.taskType}
              taskTitle={node.taskTitle}
              isMandatory={node.isMandatory}
              onClick={() => onNodeTap(node)}
            />
          </div>
        );
      })}
    </div>
  );
}
