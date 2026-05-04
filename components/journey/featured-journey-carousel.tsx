/**
 * FILE: components/journey/featured-journey-carousel.tsx
 *
 * PURPOSE:
 *   Embla-powered carousel of FeaturedJourneyCard slides with auto-play, looping,
 *   drag/swipe, and dot pagination. Used at the top of the Journeys Explore tab
 *   to surface enrolled journeys (priority) or the top 5 trending journeys.
 *
 * LOGIC OVERVIEW:
 *   1. useEmblaCarousel initialises an embla instance with loop + drag enabled.
 *   2. A setInterval auto-advances to the next slide every 4s; paused while the
 *      user interacts (pointerDown) and resumed on pointerUp/select.
 *   3. onSelect handler keeps local `active` state in sync for dot rendering.
 *   4. Dots are clickable — calling scrollTo(i) on embla.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   slides       — FeaturedSlide[] rendered one per embla slide
 *   emblaRef     — ref to be attached to the viewport element
 *   emblaApi     — embla imperative API (scrollTo, selectedScrollSnap, …)
 *   active       — index of currently selected slide (for dot styling)
 *
 * DEPENDENCIES:
 *   embla-carousel-react — useEmblaCarousel hook
 *   FeaturedJourneyCard — rendered inside each slide
 *   cn — classname helper from @/lib/utils
 *
 * LAST UPDATED: 2026-04-20 — upgraded from CSS snap scroll to embla carousel
 */
"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FeaturedJourneyCard } from "./featured-journey-card";

export interface FeaturedSlide {
  key: string;
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  dayCount: number;
  badgeLabel?: string;
  ctaLabel?: string;
  progress?: { currentDay: number; totalDays: number };
}

interface FeaturedJourneyCarouselProps {
  slides: FeaturedSlide[];
  autoplayMs?: number;
}

export function FeaturedJourneyCarousel({
  slides,
  autoplayMs = 4000,
}: FeaturedJourneyCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: false,
  });
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActive(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    const onPointerDown = () => (pausedRef.current = true);
    const onPointerUp = () => (pausedRef.current = false);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1 || autoplayMs <= 0) return;
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      emblaApi.scrollNext();
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [emblaApi, slides.length, autoplayMs]);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  if (slides.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden -mx-4 px-4 gap-x-4" ref={emblaRef}>
        <div className="flex gap-3 touch-pan-y">
          {slides.map((s) => (
            <div key={s.key} className="min-w-0 flex-[0_0_100%]">
              <FeaturedJourneyCard
                id={s.id}
                name={s.name}
                description={s.description}
                imageUrl={s.imageUrl}
                dayCount={s.dayCount}
                badgeLabel={s.badgeLabel}
                ctaLabel={s.ctaLabel}
                progress={s.progress}
              />
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3 gap-x-4">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === active ? "w-4 bg-primary" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
