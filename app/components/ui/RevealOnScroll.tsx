"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@twelvelabs-io/react";

const MAX_STAGGER_STEPS = 6;

type Props = {
  children: ReactNode;
  className?: string;
  /** Index used for a short stagger when several items enter together. */
  staggerIndex?: number;
  staggerMs?: number;
};

export function RevealOnScroll({
  children,
  className,
  staggerIndex = 0,
  staggerMs = 55,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = {
    "--reveal-delay": `${Math.min(staggerIndex, MAX_STAGGER_STEPS) * staggerMs}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={cn("reveal-on-scroll", visible && "is-visible", className)}
      style={style}
    >
      {children}
    </div>
  );
}
