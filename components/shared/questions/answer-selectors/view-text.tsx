'use client';

import { useEffect } from 'react';

interface ViewTextProps {
  title?: string;
  text?: string;
  description?: string;
  onComplete: () => void;
}

export function ViewText({ title, text, description, onComplete }: ViewTextProps) {
  // View-text steps are always "complete" — they're informational only
  useEffect(() => {
    onComplete();
  }, [onComplete]);

  const content = text || description || '';

  return (
    <div className="flex flex-col px-5 pt-6 pb-4 w-full">
      {title && (
        <h2 className="text-xl font-bold text-foreground mb-4 leading-snug">
          {title}
        </h2>
      )}
      {content && (
        <div className="max-w-none text-sm text-foreground/80 leading-relaxed">
          {content.split('\n').map((paragraph, i) => (
            <p key={i} className="mb-3">{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
}
