"use client";

import { cn } from "@/lib/utils";

interface SubscribeFooterProps {
  durationMonths?: number;
  isPremium?: boolean;
  isSubscribed?: boolean;
  isLoading?: boolean;
  label?: string;
  onPress: () => void;
}

export function SubscribeFooter({
  durationMonths,
  isPremium = false,
  isSubscribed = false,
  isLoading = false,
  label: labelOverride,
  onPress,
}: SubscribeFooterProps) {
  const label =
    labelOverride ??
    (isSubscribed
      ? "Continue Journey →"
      : isPremium
        ? "Unlock Premium Journey"
        : "Subscribe to Journey →");

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 pt-3 pb-6 z-20">
      {durationMonths && (
        <p className="text-xs text-muted-foreground mb-3 text-center">
          Total Duration:{" "}
          <span className="font-bold text-foreground">
            {durationMonths} {durationMonths === 1 ? "Month" : "Months"}
          </span>
        </p>
      )}
      <button
        onClick={onPress}
        disabled={isLoading}
        className={cn(
          "w-full h-14 rounded-2xl font-bold text-base transition-all active:scale-[0.98]",
          isLoading ? "opacity-60 cursor-not-allowed" : "",
          isPremium && !isSubscribed
            ? "bg-foreground text-background"
            : "bg-primary text-primary-foreground",
        )}
      >
        {isLoading ? "Please wait..." : label}
      </button>
    </div>
  );
}
