/**
 * FILE: components/journey/path-chain.tsx
 *
 * PURPOSE:
 *   Renders the zigzag path of task nodes and day-header bars in a flowing S-curve.
 *
 * LOGIC OVERVIEW:
 *   PathChain receives a flat ChainItem[] list (alternating 'header' and 'node' items)
 *   and renders them in a column. Nodes follow a 6-step triangular LR wave
 *   [-72,-24,24,72,24,-24] (constant 36px step) for a smooth out-and-back S-curve flow.
 *   No connector line — tiles are large enough to read on their own.
 *   getTaskType() derives the visual node type from task fields using ID arrays and
 *   boolean flags, in a defined priority order.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   PathChainNode    — node data shape (task, variant, taskType, nodeId, etc.)
 *   ChainItem        — union of 'node' | 'header' items passed to PathChain
 *   getTaskType()    — exported helper used by journey-path-view and action sheet
 *   PathChain        — main component rendering the path
 *
 * DEPENDENCIES:
 *   PathNode, UnitHeaderBar
 *
 * LAST UPDATED: 2026-04-27 — removed dashed connector; 6-step triangular LR wave
 *   [-72,-24,24,72,24,-24] keeps every consecutive step a constant 36px so the
 *   path reads as a smooth S-curve out-and-back instead of an abrupt zigzag.
 */
"use client";

import { useRef } from "react";
import type { JourneyTask } from "@/types/journey";
import { type NodeTaskType, type NodeVariant, PathNode } from "./path-node";
import { UnitHeaderBar } from "./unit-header-bar";

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
  | { kind: "node"; node: PathChainNode }
  | { kind: "header"; unitNumber: number; title: string; onClick?: () => void };

interface PathChainProps {
  items: ChainItem[];
  onNodeTap: (node: PathChainNode) => void;
}

export function getTaskType(task: JourneyTask): NodeTaskType {
  // 1. Read task — extraTaskTitle + extraTaskDescription together signal a text reading task
  if (task.extraTaskTitle && task.extraTaskDescription?.length) return "read";
  // 2. Assessments (ID array takes priority over legacy populated array)
  if (task.assessmentIds?.length || task.assessments?.length) return "assessment";
  // 3. Worksheets → rendered as journal type visually
  if (task.worksheetIds?.length || (task.worksheets as unknown[])?.length) return "journal";
  // 4. Sub-journalings → rendered as journal type visually
  if (task.subJournalingIds?.length || task.subJournalings?.length) return "journal";
  // 5. Audios
  if (task.audioIds?.length || task.audios?.length) return "audio";
  // 6. Boolean flags
  if (task.moodCheckIn) return "gift";
  if (task.showAppointments || task.showFirstBooking) return "book";
  if (task.fillSelfJournal) return "journal";
  return "journal"; // default fallback
}

/* Triangular wave: out (-72 → +72) then back, with constant 36px step between
   consecutive nodes. Wider amplitude + non-zero crossings (±24, never near 0)
   keep the path from feeling cramped in the middle while staying inside the
   visual column even with task labels under each tile. */
const LR = [-72, -24, 24, 72, 24, -24];

export function PathChain({ items, onNodeTap }: PathChainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  let nodeIdx = 0;

  return (
    <div ref={containerRef} className="relative flex flex-col items-center py-4">
      {items.map((item, idx) => {
        if (item.kind === "header") {
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
        const xOffset = LR[nodeIdx % LR.length];
        const isActive = node.variant === "active";
        nodeIdx++;

        return (
          <div
            key={node.nodeId}
            className="relative z-10 flex flex-col items-center"
            style={{ transform: `translateX(${xOffset}px)` }}
            data-node-id={node.task.id}
          >
            {nodeIdx > 1 && <div className={isActive ? "h-4" : "h-3"} />}
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
