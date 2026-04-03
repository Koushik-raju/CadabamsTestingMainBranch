'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function WorksheetRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/worksheet/form?id=${id}`);
    } else {
      router.replace('/assessments');
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Skeleton className="h-16 w-16 rounded-full" />
    </div>
  );
}

export default function WorksheetEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      }
    >
      <WorksheetRedirectContent />
    </Suspense>
  );
}
