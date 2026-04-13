'use client';

interface ContinueFooterProps {
  allComplete?: boolean;
  onContinue: () => void;
}

export function ContinueFooter({ allComplete = false, onContinue }: ContinueFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 pt-3 pb-6 z-20">
      {allComplete ? (
        <div className="w-full h-14 rounded-2xl bg-muted flex items-center justify-center">
          <span className="text-base font-bold text-foreground">Journey Complete 🎉</span>
        </div>
      ) : (
        <button
          onClick={onContinue}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base tracking-widest uppercase transition-all active:scale-[0.98]"
        >
          Continue
        </button>
      )}
    </div>
  );
}
