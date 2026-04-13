'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Clock3, CalendarClock } from 'lucide-react';
import type { AssessmentItem } from '@/hooks/use-assessments';
import { getCategoryInfo } from './assessment-category';

interface AssessmentCardProps {
  assessment: AssessmentItem;
  onClick: (assessment: AssessmentItem) => void;
}

function extractHintCategory(hint: string | null): string | null {
  if (!hint) return null;
  const splittedHint = hint.split('|');
  if (splittedHint.length < 2) return null;
  const last = splittedHint.at(-1)?.trim();
  if (!last) return null;
  return last.split(',')[0]?.trim() || null;
}

export function AssessmentCard({ assessment, onClick }: AssessmentCardProps) {
  const { icon: Icon, bgColor, textColor } = getCategoryInfo(assessment);
  const hintCategory = extractHintCategory(assessment.hint);
  const minutes = assessment.landingTitle?.minutes;

  return (
    <Card
      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] overflow-hidden"
      onClick={() => onClick(assessment)}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-7 h-7 ${textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-base leading-snug">
            {assessment.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {hintCategory && (
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
                {hintCategory}
              </span>
            )}
            {minutes && (
              <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
                {minutes} min
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendedAssessmentCardProps {
  assessment: AssessmentItem;
  onClick: (assessment: AssessmentItem) => void;
}

export function RecommendedAssessmentCard({
  assessment,
  onClick,
}: RecommendedAssessmentCardProps) {
  const { icon: Icon, textColor } = getCategoryInfo(assessment);
  const hintCategory = extractHintCategory(assessment.hint);

  return (
    <Card
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl overflow-hidden relative min-h-[170px]"
      onClick={() => onClick(assessment)}
    >
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
            Recommended
          </span>
        </div>
        <h3 className="text-[22px] font-extrabold tracking-tight mb-2 leading-tight max-w-[200px]">
          {assessment.title}
        </h3>
        <p className="text-[12px] text-white/65 leading-relaxed max-w-[195px] mb-4">
          {assessment.description ||
            'Track your mood patterns and get personalized insights.'}
        </p>
        <div className="flex items-center gap-4 text-[12px] text-white/70">
          <span className="flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" />
            {assessment.landingTitle?.minutes || 5} min
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {assessment.landingTitle?.numberOfQuestion || 12} Questions
          </span>
        </div>
        {hintCategory && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-[11px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
              {hintCategory}
            </span>
          </div>
        )}
        <div className="absolute right-4 bottom-4 opacity-40">
          <Icon className={`w-20 h-20 ${textColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
