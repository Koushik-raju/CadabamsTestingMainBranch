import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function PremiumBadge({ className, size = 'md' }: PremiumBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'bg-amber-100 text-amber-700 border-amber-200 font-semibold',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        className
      )}
    >
      <Sparkles className={cn('mr-1', size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      Premium
    </Badge>
  );
}
