/**
 * FILE: components/assessment/assignments-list.tsx
 *
 * PURPOSE:
 *   Renders a grouped list card of the patient's doctor-assigned assessments.
 *   Each row shows a gradient icon tile, assessment title, the date the doctor
 *   assigned it, and an optional category pill.
 *
 * LOGIC OVERVIEW:
 *   - Receives items (AssignedAssessmentItem[]) and onItemClick callback.
 *   - Formats assignedAt into a short human-readable date.
 *   - Renders rows inside a single grouped Card with Separator dividers.
 *   - Uses item.documentId as the React key (Strapi documentId is unique per
 *     assigned assessment).
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   items        — AssignedAssessmentItem[] to render
 *   onItemClick  — called with the clicked item; parent handles navigation
 *
 * DEPENDENCIES:
 *   AssignedAssessmentItem — from @/hooks/assessments/use-assessments-page
 *
 * LAST UPDATED: 2026-04-28 — switch from CompletionResponseDto (completed
 *   assessments) to AssignedAssessmentItem (doctor-assigned assessments) so
 *   the My Assessments tab matches the reference frontned data source.
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AssignedAssessmentItem } from "@/hooks/assessments/use-assessments-page";
import { cn } from "@/lib/utils";
import { ChevronRight, ClipboardList } from "lucide-react";

interface AssignmentsListProps {
  items: AssignedAssessmentItem[];
  onItemClick: (item: AssignedAssessmentItem) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function AssignmentsList({ items, onItemClick }: AssignmentsListProps) {
  return (
    <Card>
      <CardContent className="py-0 px-3">
        {items.map((item, i) => {
          const date = formatDate(item.assignedAt);
          const title = item.title;
          const primaryCategory = item.category?.[0] ?? null;

          return (
            <div key={item.documentId}>
              <div
                className="flex items-start gap-3 py-3 transition-colors hover:bg-muted/50 active:bg-muted rounded-lg cursor-pointer"
                onClick={() => onItemClick(item)}
                role="button"
                tabIndex={0}
                aria-label={title}
                onKeyDown={(e) => e.key === "Enter" && onItemClick(item)}
              >
                <div
                  className={cn(
                    "relative w-11 h-11 rounded-2xl bg-gradient-to-br flex-shrink-0",
                    "flex items-center justify-center overflow-hidden shadow-sm",
                    "from-violet-500 to-purple-600",
                  )}
                >
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white/10" />
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug truncate">
                    {title}
                  </p>

                  {date && <p className="text-xs text-muted-foreground mt-0.5">Assigned {date}</p>}

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      Assigned
                    </span>
                    {primaryCategory && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                        {primaryCategory}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
              {i < items.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
