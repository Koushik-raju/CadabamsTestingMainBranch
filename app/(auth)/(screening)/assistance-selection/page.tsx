'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/common/back-button';
import { cn } from '@/lib/utils';

const TAGS = [
  'Anxiety', 'Depression', 'Stress', 'Relationship Issues', 'Sleep Problems',
  'Trauma & PTSD', 'Grief & Loss', 'Self-esteem', 'Anger Management', "I'm Not Sure",
];

function AssistanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleContinue = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tags', selected.join(','));
    router.push(`/notification?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <BackButton />
      <div className="flex-1 flex flex-col gap-6 max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-semibold">What do you need assistance with?</h1>
        <p className="text-muted-foreground text-sm">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button key={tag} onClick={() => toggle(tag)}>
              <Badge
                variant={selected.includes(tag) ? 'default' : 'outline'}
                className={cn('cursor-pointer text-sm py-1.5 px-3', selected.includes(tag) && 'bg-primary text-primary-foreground')}
              >
                {tag}
              </Badge>
            </button>
          ))}
        </div>
      </div>
      <Button onClick={handleContinue} className="w-full max-w-sm mx-auto" disabled={selected.length === 0}>
        Continue
      </Button>
    </div>
  );
}

export default function AssistancePage() {
  return <Suspense><AssistanceContent /></Suspense>;
}
