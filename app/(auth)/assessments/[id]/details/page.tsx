'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import {
  Clock,
  ListChecks,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAssessmentById } from '@/hooks/assessments/use-assessment-detail';

export default function AssessmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assessmentId } = use(params);
  const router = useRouter();

  const { data: assessmentData, isLoading, error } = useAssessmentById(assessmentId);

  const assessment = assessmentData;

  const imageUrl = useMemo(() => {
    if (!assessment?.image) return null;
    const url = String(assessment.image);
    if (url.startsWith('http')) return url.split('?')[0];
    return `https://admin.mindtalkbuddy.com${url}`.split('?')[0];
  }, [assessment?.image]);

  const questionCount =
    assessment?.landingTitle?.numberOfQuestion ||
    String(assessment?.Questions?.length || 0);
  const durationMins = assessment?.landingTitle?.minutes || 5;
  const badgeText = assessment?.landingTitle?.badgeText;
  const points = assessment?.landingTitle?.points || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Skeleton className="h-56 w-full" />
          <div className="p-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center">
          {error ? String(error) : 'Assessment not found.'}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center px-2 py-2 border-b border-border bg-background">
        <BackButton fallback="/assessments" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Hero image */}
        {imageUrl ? (
          <div className="w-full aspect-[4/3] bg-muted overflow-hidden">
            <img
              src={imageUrl}
              alt={assessment.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-muted" />
        )}

        <div className="px-5 pt-5 space-y-5">
          {/* Badge */}
          {badgeText && (
            <p className="text-xs font-semibold text-primary tracking-wide uppercase">
              {badgeText}
            </p>
          )}
          {!badgeText && (
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold text-primary tracking-wide">
                Clinically Validated
              </p>
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {assessment.title}
          </h1>

          {/* Description */}
          {assessment.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {assessment.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex gap-6 py-3 border-y border-border">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{durationMins} min</p>
                <p className="text-[11px] text-muted-foreground">Duration</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ListChecks className="w-4 h-4 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{questionCount} Questions</p>
                <p className="text-[11px] text-muted-foreground">Length</p>
              </div>
            </div>
          </div>

          {/* Benefit points */}
          {points.length > 0 && (
            <ul className="space-y-4">
              {points.map((point) => (
                <li key={point.id} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{point.item}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground text-center pb-2">
            This assessment is for educational purposes only and is not a diagnostic
            tool or a substitute for professional medical advice.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-background border-t border-border">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base h-14 rounded-2xl"
          onClick={() => router.push(`/assessments/${assessmentId}`)}
        >
          Start Assessment
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
