'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Clock3, CalendarClock, HelpCircle } from 'lucide-react';
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

// Plain row — used in search results list
export function AssessmentCard({ assessment, onClick }: AssessmentCardProps) {
  const { icon: Icon, bgColor, textColor } = getCategoryInfo(assessment);
  const hintCategory = extractHintCategory(assessment.hint);
  const minutes = assessment.landingTitle?.minutes;

  return (
    <div
      className="flex items-center gap-3 py-3 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted rounded-lg"
      onClick={() => onClick(assessment)}
      role="button"
      tabIndex={0}
      aria-label={assessment.title}
      onKeyDown={(e) => e.key === 'Enter' && onClick(assessment)}
    >
      <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug truncate">
          {assessment.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[hintCategory, minutes ? `${minutes} min` : null].filter(Boolean).join(' · ')}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

// Rich full-width card — lively: tinted bg + accent icon ring + colored meta
export function AssessmentGridCard({ assessment, onClick }: AssessmentCardProps) {
  const { icon: Icon, bgColor, textColor } = getCategoryInfo(assessment);
  const hintCategory = extractHintCategory(assessment.hint);
  const minutes = assessment.landingTitle?.minutes;
  const questionCount = assessment.landingTitle?.numberOfQuestion || assessment.Questions?.length;
  const description = assessment.description || assessment.landingTitle?.landingDescription;
  const hasFooter = !!(minutes || questionCount);

  return (
    <div
      className={`${bgColor} rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden relative`}
      onClick={() => onClick(assessment)}
      role="button"
      tabIndex={0}
      aria-label={assessment.title}
      onKeyDown={(e) => e.key === 'Enter' && onClick(assessment)}
    >
      {/* White muting overlay — softens the pastel bg */}
      <div className="absolute inset-0 bg-white/40 rounded-2xl pointer-events-none" />

      {/* Header row: icon + title + chevron */}
      <div className="flex items-start gap-3 relative z-10">
        <div className={`w-12 h-12 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-bold text-foreground leading-snug">
            {assessment.title}
          </p>
          {hintCategory && (
            <span className={`inline-block text-[10px] font-medium ${textColor} bg-white/50 px-2 py-0.5 rounded-full mt-1`}>
              {hintCategory}
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 ${textColor} opacity-60 flex-shrink-0 mt-1`} />
      </div>

      {/* Description */}
      {description && (
        <p className="text-[12px] text-foreground/70 mt-3 leading-relaxed line-clamp-3 relative z-10">
          {description}
        </p>
      )}

      {/* Footer: time + questions */}
      {hasFooter && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/[0.07] relative z-10">
          {minutes != null && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${textColor}`}>
              <Clock3 className="w-3 h-3" />
              {minutes} min
            </span>
          )}
          {questionCount && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${textColor}`}>
              <HelpCircle className="w-3 h-3" />
              {questionCount} Questions
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Hero card — standalone full-width featured card
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
  const minutes = assessment.landingTitle?.minutes;
  const questionCount = assessment.landingTitle?.numberOfQuestion;
  const description = assessment.description || assessment.landingTitle?.landingDescription;

  return (
    <Card
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-lg cursor-pointer transition-all active:scale-[0.98] overflow-hidden relative min-h-[170px] border-0"
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
        {description && (
          <p className="text-[12px] text-white/65 leading-relaxed max-w-[195px] mb-4 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-4 text-[12px] text-white/70">
          <span className="flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" />
            {minutes || 5} min
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {questionCount || assessment.Questions?.length || 12} Questions
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
