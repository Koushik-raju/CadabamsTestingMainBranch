'use client';

import { Clock, ShieldCheck, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AssessmentItem } from '@/types/assessment';
import { extractTextFromRich } from '@/types/assessment';

interface AssessmentLandingProps {
  assessment: AssessmentItem;
  onStart: () => void;
  onBack: () => void;
}

export function AssessmentLanding({ assessment, onStart, onBack }: AssessmentLandingProps) {
  const landing = assessment.landingTitle;
  const landingTitle = landing?.title ? extractTextFromRich(landing.title) : assessment.title;
  const landingDescription = landing?.landingDescription ?? assessment.description ?? '';
  const minutes = landing?.minutes;
  const questionCount = landing?.numberOfQuestion;
  const badgeText = landing?.badgeText ? extractTextFromRich(landing.badgeText) : null;
  const actionLabel = landing?.actionLabel ? extractTextFromRich(landing.actionLabel) : 'Start Assessment';
  const points = landing?.points ?? [];

  return (
    <div className="min-h-screen bg-[#F6F3EC] flex flex-col">
      <header className="px-5 pt-12 pb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-white/40 hover:bg-white/80"
          onClick={onBack}
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        <div className="mt-6 space-y-3">
          {badgeText && (
            <Badge className="bg-orange-100 text-orange-600 border border-orange-200 w-max">
              {badgeText}
            </Badge>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {landingTitle}
          </h1>
          {landingDescription && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {landingDescription}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 pb-32 space-y-6">
        {assessment.image && (
          <div className="w-full overflow-hidden rounded-3xl bg-gradient-to-br from-orange-200 via-orange-100 to-white border border-orange-100 shadow-sm">
            <div className="aspect-[4/3] flex items-center justify-center">
              <img
                src={assessment.image}
                alt={assessment.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {minutes && (
            <Card className="border border-orange-100 bg-white">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-orange-500 font-medium">Duration</span>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {minutes} min
                </span>
              </CardContent>
            </Card>
          )}
          {questionCount && (
            <Card className="border border-orange-100 bg-white">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-orange-500 font-medium">Questions</span>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {questionCount}
                </span>
              </CardContent>
            </Card>
          )}
        </div>

        {points.length > 0 && (
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-500" />
                  What to expect
                </h2>
              </div>
              <ul className="space-y-3">
                {points.map((point, index) => (
                  <li key={point.id ?? index} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <span>{point.item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {assessment.citationText && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 leading-relaxed">
            <p className="font-medium text-slate-600 mb-1">Note</p>
            <p>{assessment.citationText}</p>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 inset-x-0 bg-[#F6F3EC]/95 backdrop-blur px-5 pb-8 pt-4 border-t border-orange-100">
        <Button
          size="lg"
          className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-500/90 hover:to-orange-600/90"
          onClick={onStart}
        >
          {actionLabel}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </footer>
    </div>
  );
}
