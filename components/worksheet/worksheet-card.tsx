/**
 * FILE: components/worksheet/worksheet-card.tsx
 *
 * PURPOSE:
 *   Displays a single worksheet item in a card layout with status badge, assigned date,
 *   and an action button to open the worksheet. Used in list views of assigned worksheets.
 *
 * LOGIC OVERVIEW:
 *   Renders a Card containing the worksheet metadata (label, description, categories,
 *   completion status). Formats the assigned date using Indian locale. Displays a
 *   completion badge and a button to trigger the onOpen callback for navigation.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   item              — AssignedWorksheetItem passed as prop, contains label, description, status, etc.
 *   onOpen            — Callback fired when the action button is clicked, receives the item
 *   assignedDate      — Computed from item.assignedAt, formatted as "DD MMM YYYY" in Indian locale
 *   WorksheetCard     — Main export; component that renders a single worksheet card
 *   AssignedWorksheetItem — TypeScript interface defining the shape of a worksheet item
 *
 * DEPENDENCIES:
 *   shadcn/ui primitives: Badge, Button, Card, CardContent
 *   lucide-react icons: BookOpen, CheckCircle2, ChevronRight
 *
 * LAST UPDATED: 2026-04-28 — Neo design system: shadow scale (shadow-md → shadow-[var(--sh-2)])
 */

"use client";

import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface AssignedWorksheetItem {
  documentId: string;
  id: string | number | undefined;
  label: string;
  description: string;
  category: string[];
  assignedAt: string | undefined;
  status: string;
  isCompleted: boolean;
  lastUsed: string;
  image: string | null;
}

interface WorksheetCardProps {
  item: AssignedWorksheetItem;
  onOpen: (item: AssignedWorksheetItem) => void;
}

export function WorksheetCard({ item, onOpen }: WorksheetCardProps) {
  const assignedDate = item.assignedAt
    ? new Date(item.assignedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-[var(--sh-2)] transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground text-xs sm:text-sm truncate">
                  {item.label}
                </h3>
                {item.isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                )}
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge
                  variant={item.isCompleted ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {item.isCompleted ? "Completed" : "Pending"}
                </Badge>
                {assignedDate && (
                  <span className="text-xs text-muted-foreground">Assigned: {assignedDate}</span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="icon"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 bg-green-600 hover:bg-green-700"
            onClick={() => onOpen(item)}
            aria-label={`Open ${item.label}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
