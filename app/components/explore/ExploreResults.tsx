"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  cn,
} from "@twelvelabs-io/react";
import type { ResolvedClip } from "@/lib/types";
import { ExploreClipCard } from "./ExploreClipCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const AUTO_ADVANCE_MS = 5500;

export function FeaturedCarousel({ clips }: { clips: ResolvedClip[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = clips.length;

  useEffect(() => {
    setIndex(0);
  }, [clips]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => go(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, go]);

  if (count === 0) return null;

  return (
    <section
      data-testid="featured-pick"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {count > 1 && (
        <>
          <IconButton
            type="button"
            variant="outlined-gray"
            size="regular"
            aria-label="Previous featured clip"
            data-testid="featured-carousel-prev"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-surface-white/90 shadow-md backdrop-blur-sm motion-safe:md:-left-4"
            onClick={() => go(-1)}
          >
            <ChevronLeftIcon className="size-4" />
          </IconButton>
          <IconButton
            type="button"
            variant="outlined-gray"
            size="regular"
            aria-label="Next featured clip"
            data-testid="featured-carousel-next"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-surface-white/90 shadow-md backdrop-blur-sm motion-safe:md:-right-4"
            onClick={() => go(1)}
          >
            <ChevronRightIcon className="size-4" />
          </IconButton>
        </>
      )}

      <div className="overflow-hidden">
        <div
          className="flex motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {clips.map((clip, slideIndex) => (
            <div
              key={`${clip.id}-${clip.assetId}-${slideIndex}`}
              className="w-full shrink-0"
              aria-hidden={slideIndex !== index}
              inert={slideIndex !== index ? true : undefined}
              {...(slideIndex === index
                ? { "data-testid": "featured-carousel-active-slide" }
                : {})}
            >
              <ExploreClipCard
                clip={clip}
                variant="featured"
                previewActive={slideIndex === index}
                testId={slideIndex === index ? "featured-clip-card" : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-label="Featured carousel pagination">
          {clips.map((clip, dotIndex) => (
            <button
              key={`dot-${clip.id}-${dotIndex}`}
              type="button"
              aria-label={`Go to featured clip ${dotIndex + 1}`}
              aria-current={dotIndex === index ? "true" : undefined}
              data-testid={`featured-carousel-dot-${dotIndex}`}
              className={cn(
                "size-1.5 rounded-full transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-misc-ring/50 focus-visible:ring-offset-2",
                dotIndex === index
                  ? "w-5 bg-foreground-body"
                  : "bg-border-secondary hover:bg-foreground-subtle",
              )}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function CategoryRail({
  railId,
  title,
  subtitle,
  clips,
}: {
  railId: string;
  title: string;
  subtitle: string;
  clips: ResolvedClip[];
}) {
  if (clips.length === 0) return null;

  return (
    <RevealOnScroll>
      <section className="mb-10" data-testid={`category-rail-${railId}`}>
        <div className="mb-4">
          <h3 className="text-lg font-normal">{title}</h3>
          <p className="text-sm text-foreground-subtle">{subtitle}</p>
        </div>
        <div className="rail-scroll">
          {clips.map((clip, index) => (
            <RevealOnScroll
              key={`${clip.id}-${clip.assetId}-${index}`}
              staggerIndex={index}
              className="group shrink-0"
            >
              <ExploreClipCard clip={clip} variant="rail" />
            </RevealOnScroll>
          ))}
        </div>
      </section>
    </RevealOnScroll>
  );
}
