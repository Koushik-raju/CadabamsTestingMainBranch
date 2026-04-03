'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/common/back-button';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, BarChart3, AlertCircle, ChevronRight } from 'lucide-react';

interface SubmissionEntry {
  date?: string;
  [key: string]: unknown;
}

interface Submission {
  date: string;
  data: SubmissionEntry;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function SubmissionCard({ submission, index }: { submission: Submission; index: number }) {
  const entries = Object.entries(submission.data).filter(
    ([key]) => key !== 'date' && !key.startsWith('_')
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Submission #{index + 1}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(submission.date)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {entries.slice(0, 5).map(([key, value]) => {
            const entryData = value as SubmissionEntry;
            const questionText = entryData?.questionText as string | undefined;
            const selected = entryData?.selected;
            const text = entryData?.text;

            if (!questionText) return null;

            return (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground line-clamp-1">{questionText}</span>
                {selected !== undefined && (
                  <Badge variant="secondary" className="self-start text-xs">
                    {String(selected)}
                  </Badge>
                )}
                {Boolean(text) && (
                  <p className="text-xs text-foreground line-clamp-2">{String(text)}</p>
                )}
              </div>
            );
          })}
          {entries.length > 5 && (
            <p className="text-xs text-muted-foreground">
              +{entries.length - 5} more responses
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentAnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const assessmentId = searchParams.get('id');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
        const leadId = String(user?.lead_id || JSON.parse(localStorage.getItem('user') || '{}').lead_id || '');
        if (!leadId) {
          setError('Please log in to view your assessment history.');
          setLoading(false);
          return;
        }

        const snap = await get(ref(database, `assessments/${leadId}/${assessmentId}`));
        if (!snap.exists()) {
          setSubmissions([]);
          setLoading(false);
          return;
        }

        const data = snap.val() as Record<string, SubmissionEntry>;
        const list: Submission[] = Object.values(data)
          .filter(Boolean)
          .map((entry) => ({
            date: entry.date as string || new Date().toISOString(),
            data: entry,
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setSubmissions(list);
      } catch (err) {
        console.error('Error loading analysis:', err);
        setError('Failed to load assessment history.');
      } finally {
        setLoading(false);
      }
    }

    fetch();
  }, [assessmentId, user?.lead_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border bg-card">
        <BackButton fallback="/assessments" />
        <h1 className="text-base sm:text-lg font-semibold text-foreground">Assessment History</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete the assessment to see your results here.
            </p>
            <Button onClick={() => router.push(`/assessment/form?id=${assessmentId}`)}>
              Take Assessment
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''} found
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/assessment/form?id=${assessmentId}`)}
              >
                Retake
              </Button>
            </div>
            {submissions.map((submission, index) => (
              <SubmissionCard
                key={submission.date + index}
                submission={submission}
                index={index}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function AssessmentAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      }
    >
      <AssessmentAnalysisContent />
    </Suspense>
  );
}
