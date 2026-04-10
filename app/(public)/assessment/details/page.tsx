'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { Clock, ListChecks, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAssessmentById, mapStrapiAssessment } from '@/hooks/use-assessments';

async function checkCompletion(leadId: string, assessmentId: string): Promise<boolean> {
  try {
    const snap = await get(ref(database, `assessments/${leadId}/${assessmentId}`));
    return snap.exists();
  } catch {
    return false;
  }
}

function AssessmentDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assessmentId = searchParams.get('id');

  const { data: assessmentData, isLoading, error } = useAssessmentById(assessmentId);

  const assessment = useMemo(() => {
    if (!assessmentData?.data) return null;
    return mapStrapiAssessment(assessmentData.data);
  }, [assessmentData]);

  const imageUrl = useMemo(() => {
    if (!assessment?.image) return null;
    const url = String(assessment.image);
    if (url.startsWith('http')) return url.split('?')[0];
    return `https://admin.mindtalkbuddy.com${url}`.split('?')[0];
  }, [assessment?.image]);

  const questionCount = assessment?.landingTitle?.numberOfQuestion || String(assessment?.Questions?.length || 0);
  const durationMins = assessment?.landingTitle?.minutes || 5;
  const badgeText = assessment?.landingTitle?.badgeText;
  const points = assessment?.landingTitle?.points || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center">{error ? String(error) : 'Assessment not found.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
        <BackButton fallback="/assessments" />
        <h1 className="text-base sm:text-lg font-semibold text-foreground line-clamp-1">
          Assessment Details
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {imageUrl && (
          <div className="relative w-full h-48 sm:h-64 bg-muted overflow-hidden">
            <img
              src={imageUrl}
              alt={assessment.title || 'Assessment'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {assessment.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              {badgeText && (
                <Badge className="gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {badgeText}
                </Badge>
              )}
              {assessment.category?.map((cat, i) => (
                <Badge key={i} variant="secondary" className="capitalize">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-4 p-3 bg-muted rounded-xl">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ListChecks className="w-4 h-4 text-primary" />
              <span><strong className="text-foreground">{questionCount}</strong> questions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span><strong className="text-foreground">{durationMins}</strong> min</span>
            </div>
          </div>

          {assessment.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">About this Assessment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {assessment.description}
              </p>
            </div>
          )}

          {points.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">What you&apos;ll gain</h3>
              <ul className="space-y-2">
                {points.map((point) => (
                  <li key={point.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {point.item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/assessment/analysis?id=${assessmentId}`)}
        >
          View Analysis
        </Button>
        <Button
          className="w-full"
          size="lg"
          onClick={() => router.push(`/assessment/${assessmentId}`)}
        >
          Start Assessment
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function AssessmentDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      }
    >
      <AssessmentDetailsContent />
    </Suspense>
  );
}
