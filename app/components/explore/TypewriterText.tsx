"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@twelvelabs-io/react";

type Props = {
  /** Single string to type once, or omit when using `texts` rotation. */
  text?: string;
  /** Rotate through strings with type/delete cycle. */
  texts?: string[];
  className?: string;
  /** ms per character */
  speed?: number;
  /** pause at end of each string when rotating */
  pauseMs?: number;
  cursor?: boolean;
  /** Delay typing until true (single-string mode). Defaults to true. */
  start?: boolean;
  onComplete?: () => void;
};

export function TypewriterText({
  text,
  texts,
  className,
  speed = 42,
  pauseMs = 2200,
  cursor = true,
  start = true,
  onComplete,
}: Props) {
  const rotating = texts && texts.length > 0;
  const [display, setDisplay] = useState("");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    if (!rotating) setDisplay("");
  }, [rotating, text, start]);

  useEffect(() => {
    if (!rotating && text && start) {
      let i = 0;
      setDisplay("");
      const id = window.setInterval(() => {
        i += 1;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(id);
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
        }
      }, speed);
      return () => window.clearInterval(id);
    }
  }, [rotating, text, speed, start, onComplete]);

  useEffect(() => {
    if (!rotating || !texts || !start) return;
    const current = texts[index % texts.length];
    let timeout: number;

    if (!deleting && display.length < current.length) {
      timeout = window.setTimeout(() => {
        setDisplay(current.slice(0, display.length + 1));
      }, speed);
    } else if (!deleting && display.length === current.length) {
      timeout = window.setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && display.length > 0) {
      timeout = window.setTimeout(() => {
        setDisplay(current.slice(0, display.length - 1));
      }, speed / 2);
    } else {
      setDeleting(false);
      setIndex((i) => (i + 1) % texts.length);
    }

    return () => window.clearTimeout(timeout);
  }, [rotating, texts, index, deleting, display, speed, pauseMs, start]);

  return (
    <span className={cn("inline", className)}>
      {display}
      {cursor && (
        <span
          className={cn(
            "ml-px inline-block animate-pulse opacity-70 transition-opacity duration-300",
          )}
          aria-hidden
        >
          |
        </span>
      )}
    </span>
  );
}
