"use client";

import { BarChart3, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AssessmentEmptyStateProps {
  variant: "no-results" | "no-assignments";
  /** When `worksheet`, copy refers to worksheets instead of assessments. */
  kind?: "assessment" | "worksheet";
  className?: string;
}

const assessmentContent = {
  "no-results": {
    icon: Search,
    title: "No assessments found",
    description: "Try a different search term or filter.",
  },
  "no-assignments": {
    icon: BarChart3,
    title: "No Assigned Assessments",
    description: "You don't have any assigned assessments yet.",
  },
};

const worksheetContent = {
  "no-results": {
    icon: Search,
    title: "No worksheets found",
    description: "Try a different search term or filter.",
  },
  "no-assignments": {
    icon: BarChart3,
    title: "No assigned worksheets",
    description: "You don't have any assigned worksheets yet.",
  },
};

export function AssessmentEmptyState({
  variant,
  kind = "assessment",
  className = "",
}: AssessmentEmptyStateProps) {
  const table = kind === "worksheet" ? worksheetContent : assessmentContent;
  const { icon: Icon, title, description } = table[variant];

  return (
    <Card className={`border-dashed border-border bg-transparent shadow-none ${className}`}>
      <CardContent className="p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      </CardContent>
    </Card>
  );
}
