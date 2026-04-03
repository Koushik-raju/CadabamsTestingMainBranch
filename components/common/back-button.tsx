'use client';

import { ChevronLeft } from 'lucide-react';
import { useSafeBack } from '@/hooks/use-safe-back';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  fallback?: string;
  className?: string;
}

export function BackButton({ fallback, className }: BackButtonProps) {
  const goBack = useSafeBack(fallback);
  return (
    <Button variant="ghost" size="icon" onClick={goBack} className={className}>
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
}
