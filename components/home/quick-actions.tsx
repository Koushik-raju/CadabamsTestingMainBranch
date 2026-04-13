import { ClipboardList, Map, BookOpen, Sparkles, Package, Wind, MessageCircle, PlayCircle, FileText, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Action {
  key: string;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const ACTIONS: Action[] = [
  { key: 'assessment', title: 'Assessments', description: 'Check anxiety, mood & more.', badge: '2 new suggested', icon: ClipboardList, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { key: 'journey', title: 'Guided journeys', description: 'Duolingo-style paths for your mind.', badge: 'Day 9 of 36%', icon: Map, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { key: 'packages', title: 'Packages', description: 'Comprehensive care plans.', badge: 'Browse now', icon: Package, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { key: 'journal', title: 'Journal & reflect', description: 'Free-flow or guided prompts.', badge: '3-min gratitude', icon: BookOpen, iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  { key: 'breathe', title: 'Quick relief', description: 'Breath, audio & visual resets.', badge: 'Under 5 min', icon: Sparkles, iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { key: 'mindful-minutes', title: 'Mindful Minutes', description: 'Short guided mindfulness sessions.', badge: 'Start now', icon: Wind, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  { key: 'chat', title: 'Chat', description: 'Message your care team anytime.', badge: 'Open chat', icon: MessageCircle, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { key: 'videos', title: 'Videos', description: 'Expert-led mental wellness content.', badge: 'Watch now', icon: PlayCircle, iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { key: 'documents', title: 'Documents', description: 'Access your reports & prescriptions.', badge: 'View files', icon: FileText, iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
];

interface Props {
  onActionClick?: (type: string) => void;
}

export function QuickActions({ onActionClick }: Props) {
  return (
    <div className="px-4 mb-10">
      <h3 className="text-lg font-bold mb-5">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ key, title, description, badge, icon: Icon, iconBg, iconColor }) => (
          <Card
            key={key}
            className="cursor-pointer active:scale-95 transition-all overflow-hidden"
            onClick={() => onActionClick?.(key)}
          >
            <CardContent className="p-4 flex flex-col items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
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
