'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { Clock, ListChecks, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

const ASSESSMENT_API = 'https://mindtalkbuddy.com/api/assessments';

interface AssessmentDetail {
  label?: string;
  description?: string;
  image?: { url?: string } | null;
  Questions?: unknown[];
  duration?: number;
  category?: string[];
}

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

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setError('No assessment ID provided.');
      setLoading(false);
      return;
    }

    async function fetch() {
      try {
        const res = await axios.get<{ data: AssessmentDetail }>(
          `${ASSESSMENT_API}/${assessmentId}?pLevel=4`
        );
        setAssessment(res.data.data);

        const raw = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          const leadId = String(user.lead_id || '');
          if (leadId) {
            const done = await checkCompletion(leadId, assessmentId!);
            setIsCompleted(done);
          }
        }
      } catch (err) {
        console.error('Error fetching assessment details:', err);
        setError('Failed to load assessment details.');
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [assessmentId]);

  const getImageUrl = (image: AssessmentDetail['image']): string | null => {
    if (!image?.url) return null;
    const url = String(image.url);
    if (url.startsWith('http')) return url.split('?')[0];
    return `https://admin.mindtalkbuddy.com${url}`.split('?')[0];
  };

  if (loading) {
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
        <p className="text-destructive text-center">{error || 'Assessment not found.'}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const questionCount = assessment.Questions?.length || 0;
  const durationMins = assessment.duration || Math.max(5, Math.ceil(questionCount * 1.5));
  const imageUrl = getImageUrl(assessment.image);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
        <BackButton fallback="/assessments" />
        <h1 className="text-base sm:text-lg font-semibold text-foreground line-clamp-1">
          {assessment.label || 'Assessment Details'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Image */}
        {imageUrl && (
          <div className="relative w-full h-48 sm:h-64 bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={assessment.label || 'Assessment'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4">
          {/* Title & badges */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {assessment.label}
            </h2>
            <div className="flex flex-wrap gap-2">
              {isCompleted && (
                <Badge className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </Badge>
              )}
              {assessment.category?.map((cat, i) => (
                <Badge key={i} variant="secondary" className="capitalize">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats */}
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

          {/* Description */}
          {assessment.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">About this Assessment</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {assessment.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        {isCompleted && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/assessment/analysis?id=${assessmentId}`)}
          >
            View Analysis
          </Button>
        )}
        <Button
          className="w-full"
          size="lg"
          onClick={() => router.push(`/assessment/form?id=${assessmentId}`)}
        >
          {isCompleted ? 'Retake Assessment' : 'Start Assessment'}
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
