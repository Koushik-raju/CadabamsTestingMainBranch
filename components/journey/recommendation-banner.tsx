"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecommendationBannerProps {
  category?: string;
  count?: number;
  onPress?: () => void;
}

export function RecommendationBanner({ category, count, onPress }: RecommendationBannerProps) {
  const router = useRouter();

  if (!category) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/journeys?category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <button
      onClick={handlePress}
      className="w-full flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-all"
    >
      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-primary uppercase tracking-wide">
          Recommended for You
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          Based on your {category.toLowerCase()} assessment, we found {count ?? "some"} journeys
          that might help.
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
    </button>
  );
}
