/**
 * FILE: components/journey/path-chain.tsx
 *
 * PURPOSE:
 *   Renders the Duolingo-style zigzag path of task nodes and day-header bars,
 *   connected by an SVG curved dashed line.
 *
 * LOGIC OVERVIEW:
 *   PathChain receives a flat ChainItem[] list (alternating 'header' and 'node' items)
 *   and renders them in a column. Nodes alternate left/right at ±68px from center.
 *   An SVG overlay draws cubic Bézier curves connecting consecutive node circles.
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
 * LAST UPDATED: 2026-04-22 — add data-node-id attribute for auto-scroll targeting
 */
"use client";

import type { JourneyTask } from "@/types/journey";
import { useEffect, useRef, useState } from "react";
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

const LR = [-68, 68]; // px from center, alternating

interface SvgState {
  d: string;
  w: number;
  h: number;
}

export function PathChain({ items, onNodeTap }: PathChainProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<SvgState>({ d: "", w: 0, h: 0 });

  const nodeItems = items.filter(
    (i): i is Extract<ChainItem, { kind: "node" }> => i.kind === "node",
  );

  // Re-measure whenever items (or their variants) change
  const key = nodeItems.map((i) => `${i.node.nodeId}:${i.node.variant}`).join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || nodeItems.length < 2) {
      setSvg({ d: "", w: 0, h: 0 });
      return;
    }

    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const cRect = container.getBoundingClientRect();
        const circles = Array.from(container.querySelectorAll<HTMLElement>('[data-circle="true"]'));
        if (circles.length < 2 || cRect.width === 0) return;

        const parts: string[] = [];
        for (let i = 0; i < circles.length - 1; i++) {
          const r1 = circles[i].getBoundingClientRect();
          const r2 = circles[i + 1].getBoundingClientRect();
          const x1 = r1.left - cRect.left + r1.width / 2;
          const y1 = r1.top - cRect.top + r1.height / 2;
          const x2 = r2.left - cRect.left + r2.width / 2;
          const y2 = r2.top - cRect.top + r2.height / 2;
          const mid = (y1 + y2) / 2;
          parts.push(
            `M${x1.toFixed(1)},${y1.toFixed(1)} C${x1.toFixed(1)},${mid.toFixed(1)} ${x2.toFixed(1)},${mid.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
          );
        }
        if (parts.length)
          setSvg({ d: parts.join(" "), w: Math.round(cRect.width), h: container.scrollHeight });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
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
        const xOffset = LR[nodeIdx % 2];
        const isActive = node.variant === "active";
        nodeIdx++;

        return (
          <div
            key={node.nodeId}
            className="relative z-10 flex flex-col items-center"
            style={{ transform: `translateX(${xOffset}px)` }}
            data-node-id={node.task.id}
          >
            {nodeIdx > 1 && <div className={isActive ? "h-5" : "h-4"} />}
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
