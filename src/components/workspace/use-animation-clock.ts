import { useLayoutEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import type { MotionValue } from "motion/react";

export function useAnimationClock({
  frame,
  previous,
  hasMotion,
  duration,
  paused,
  onAnimatingChange,
}: {
  frame: unknown;
  previous?: unknown;
  hasMotion: boolean;
  duration: number;
  paused: boolean;
  onAnimatingChange?: (active: boolean) => void;
}): MotionValue<number> {
  const reduced = useReducedMotion();
  const progress = useMotionValue(1);
  const last = useRef<{ frame?: unknown; previous?: unknown }>({});
  useLayoutEffect(() => {
    const changed = last.current.frame !== frame || last.current.previous !== previous;
    last.current = { frame, previous };
    if (reduced || !hasMotion) {
      progress.set(1);
      onAnimatingChange?.(false);
      return;
    }
    if (changed) progress.set(0);
    const remaining = 1 - progress.get();
    if (remaining <= 0) {
      onAnimatingChange?.(false);
      return;
    }
    onAnimatingChange?.(true);
    if (paused) return;
    const controls = animate(progress, 1, {
      duration: duration * remaining,
      ease: "linear",
      onComplete: () => onAnimatingChange?.(false),
    });
    return () => {
      controls.stop();
      onAnimatingChange?.(false);
    };
  }, [frame, previous, duration, paused, reduced, hasMotion, progress, onAnimatingChange]);
  return progress;
}
