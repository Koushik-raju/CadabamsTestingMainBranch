import { ClipboardList, Map, BookOpen, Sparkles, Package, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Action {
  key: string;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
}

const ACTIONS: Action[] = [
  { key: 'assessment', title: 'Assessments', description: 'Check anxiety, mood & more.', badge: '2 new suggested', icon: ClipboardList },
  { key: 'journey', title: 'Guided journeys', description: 'Duolingo-style paths for your mind.', badge: 'Day 9 of 36%', icon: Map },
  { key: 'packages', title: 'Packages', description: 'Comprehensive care plans.', badge: 'Browse now', icon: Package },
  { key: 'journal', title: 'Journal & reflect', description: 'Free-flow or guided prompts.', badge: '3-min gratitude', icon: BookOpen },
  { key: 'breathe', title: 'Quick relief', description: 'Breath, audio & visual resets.', badge: 'Under 5 min', icon: Sparkles },
];

interface Props {
  onActionClick?: (type: string) => void;
}

export function QuickActions({ onActionClick }: Props) {
  return (
    <div className="px-4 mb-10">
      <h3 className="text-lg font-bold mb-5">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ key, title, description, badge, icon: Icon }) => (
          <Card
            key={key}
            className="cursor-pointer active:scale-95 transition-all overflow-hidden"
            onClick={() => onActionClick?.(key)}
          >
            <CardContent className="p-4 flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-[15px] font-bold leading-snug">{title}</h4>
                <p className="text-muted-foreground text-[11px] font-medium leading-tight line-clamp-2">
                  {description}
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] mt-auto">
                {badge}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
