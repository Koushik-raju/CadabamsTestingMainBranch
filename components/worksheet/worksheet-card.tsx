'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { AssignedWorksheetItem } from '@/services/assessment.service';

interface WorksheetCardProps {
  item: AssignedWorksheetItem;
  onOpen: (item: AssignedWorksheetItem) => void;
}

export function WorksheetCard({ item, onOpen }: WorksheetCardProps) {
  const assignedDate = item.assignedAt
    ? new Date(item.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
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
                  variant={item.isCompleted ? 'default' : 'secondary'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {item.isCompleted ? 'Completed' : 'Pending'}
                </Badge>
                {assignedDate && (
                  <span className="text-xs text-muted-foreground">
                    Assigned: {assignedDate}
                  </span>
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
