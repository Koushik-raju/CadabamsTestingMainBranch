'use client';

import { ChevronLeft } from 'lucide-react';
import { useSafeBack } from '@/hooks/use-safe-back';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  fallback?: string;
  className?: string;
  onClick?: () => void;
}

export function BackButton({ fallback, className, onClick }: BackButtonProps) {
  const goBack = useSafeBack(fallback);
  const handleClick = onClick ?? goBack;
  return (
    <Button variant="ghost" size="icon" onClick={handleClick} className={className}>
      <ChevronLeft className="h-5 w-5" />
    </Button>
  );
}
