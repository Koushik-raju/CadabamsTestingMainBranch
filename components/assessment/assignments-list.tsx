'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import type { AssignedAssessmentItem } from '@/hooks/use-assessments';

interface AssignmentsListProps {
  items: AssignedAssessmentItem[];
  onItemClick: (item: AssignedAssessmentItem) => void;
}

export function AssignmentsList({ items, onItemClick }: AssignmentsListProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item) => (
        <Card
          key={item.documentId || String(item.id)}
          className="cursor-pointer hover:shadow-md transition-shadow bg-card rounded-xl border border-border"
          onClick={() => onItemClick(item)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                {item.status && (
                  <Badge
                    variant={item.status === 'completed' ? 'default' : 'secondary'}
                    className="mt-1 text-[10px]"
                  >
                    {item.status}
                  </Badge>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
