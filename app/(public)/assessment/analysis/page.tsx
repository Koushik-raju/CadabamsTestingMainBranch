'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ref, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/shared/navigation/back-button';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, BarChart3, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';

interface SubmissionEntry {
  date?: string;
  [key: string]: unknown;
}

interface Submission {
  date: string;
  data: SubmissionEntry;
}

interface SubmissionData {
  submissions: Submission[];
  isLoading: boolean;
  error: string | null;
}

async function fetchSubmissions(leadId: string, assessmentId: string): Promise<Submission[]> {
  const snap = await get(ref(database, `assessments/${leadId}/${assessmentId}`));
  if (!snap.exists()) return [];
  const data = snap.val() as Record<string, SubmissionEntry>;
  return Object.values(data)
    .filter(Boolean)
    .map((entry) => ({
      date: entry.date as string || new Date().toISOString(),
      data: entry,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

function deriveScoreSummary(submissions: Submission[]): { label: string; value: string } | null {
  if (submissions.length === 0) return null;
  const latest = submissions[0];
  const entries = Object.entries(latest.data).filter(([key]) => key !== 'date' && !key.startsWith('_'));
  const numericScores: number[] = [];
  entries.forEach(([, value]) => {
    const entryData = value as SubmissionEntry;
    const selected = entryData?.selected;
    if (typeof selected === 'number') {
      numericScores.push(selected);
    }
  });
  if (numericScores.length === 0) return null;
  const avg = numericScores.reduce((a, b) => a + b, 0) / numericScores.length;
  const maxPossible = 5;
  const percentage = Math.round((avg / maxPossible) * 100);
  let label = 'Low';
  if (percentage >= 80) label = 'High';
  else if (percentage >= 60) label = 'Moderate';
  else if (percentage >= 40) label = 'Low';
  else label = 'Very Low';
  return { label, value: `${label} (${percentage}%)` };
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

  const leadId = useMemo(() => {
    if (user?.lead_id) return String(user.lead_id);
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.lead_id ? String(parsed.lead_id) : null;
      }
    } catch {}
    return null;
  }, [user]);

  const { data: submissions, isLoading, error } = useSWR<Submission[]>(
    leadId && assessmentId ? ['assessment-submissions', leadId, assessmentId] : null,
    () => fetchSubmissions(leadId!, assessmentId!)
  );

  const scoreSummary = useMemo(() => deriveScoreSummary(submissions || []), [submissions]);

  if (isLoading) {
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

  if (error || !leadId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-destructive text-center">{error || 'Please log in to view your assessment history.'}</p>
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
        <h1 className="text-base sm:text-lg font-semibold text-foreground">Assessment Report</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(!submissions || submissions.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No submissions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete the assessment to see your results here.
            </p>
            <Button onClick={() => router.push(`/assessment/${assessmentId}`)}>
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
                onClick={() => router.push(`/assessment/${assessmentId}`)}
              >
                Retake
              </Button>
            </div>

            {scoreSummary && (
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                      AI-generated summary
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Overall Score</p>
                      <p className="text-xs text-muted-foreground">Based on your latest submission</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{scoreSummary.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-blue-800">
                  This summary is generated by AI based on your answers. It is for informational purposes only and does not replace professional medical advice.
                </p>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => router.push('/consult/appointments')}
            >
              Book appointment with a specialist
            </Button>

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
