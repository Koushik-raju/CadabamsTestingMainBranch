'use client';

import { useEffect } from 'react';

interface AgreementProps {
  title?: string;
  text?: string;
  description?: string;
  onComplete: () => void;
}

export function Agreement({ title, text, description, onComplete }: AgreementProps) {
  // Agreement steps auto-complete — displaying the content implies acceptance
  // (matches old frontend behavior)
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
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card p-4">
          <div className="max-w-none text-sm text-foreground/80 leading-relaxed">
            {content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-3">{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
