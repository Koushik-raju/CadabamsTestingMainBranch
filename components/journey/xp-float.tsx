'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XpFloatProps {
  show: boolean;
}

export function XpFloat({ show }: XpFloatProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    setFading(false);

    const fadeTimer = setTimeout(() => setFading(true), 900);
    const hideTimer = setTimeout(() => setVisible(false), 1300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none',
        'flex items-center gap-1 bg-primary text-primary-foreground text-sm font-extrabold px-3 py-1.5 rounded-full shadow-lg shadow-primary/30',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        fading && 'transition-all duration-400 opacity-0 -translate-y-6'
      )}
      style={{ top: '20%' }}
    >
      <Zap className="w-3.5 h-3.5" />
      +10 XP
    </div>
  );
}
