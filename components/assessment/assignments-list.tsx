'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssignedAssessmentItem } from '@/hooks/use-assessments';

interface AssignmentsListProps {
  items: AssignedAssessmentItem[];
  onItemClick: (item: AssignedAssessmentItem) => void;
}

export function AssignmentsList({ items, onItemClick }: AssignmentsListProps) {
  return (
    <Card>
      <CardContent className="py-0 px-4">
        {items.map((item, i) => (
          <div key={item.documentId || String(item.id)}>
            <div
              className="flex items-center gap-3 py-3 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted rounded-lg"
              onClick={() => onItemClick(item)}
              role="button"
              tabIndex={0}
              aria-label={item.label}
              onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
            >
              {/* Icon tile */}
              <div className={cn(
                'w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center',
                item.status === 'completed'
                  ? 'bg-emerald-50'
                  : 'bg-primary/10',
              )}>
                <ClipboardCheck className={cn(
                  'w-6 h-6',
                  item.status === 'completed' ? 'text-emerald-600' : 'text-primary',
                )} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-snug">
                  {item.label}
                </p>
                {item.status && (
                  <Badge
                    variant={item.status === 'completed' ? 'default' : 'secondary'}
                    className="mt-1 text-[10px] h-4 px-1.5"
                  >
                    {item.status}
                  </Badge>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
            {i < items.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
