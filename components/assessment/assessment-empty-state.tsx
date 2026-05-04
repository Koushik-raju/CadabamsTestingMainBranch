"use client";

import { BarChart3, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AssessmentEmptyStateProps {
  variant: "no-results" | "no-assignments";
  className?: string;
}

const content = {
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

export function AssessmentEmptyState({ variant, className = "" }: AssessmentEmptyStateProps) {
  const { icon: Icon, title, description } = content[variant];

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
