"use client";

import { useEffect, useRef, useState } from "react";

interface TweenOptions {
  /** Animation length in ms. */
  duration?: number;
  /**
   * When true the value jumps straight to the target with no animation.
   * Used for resets and whenever the user prefers reduced motion.
   */
  immediate?: boolean;
}

/**
 * Animate a displayed number towards a target value.
 *
 * Two hard-won details are baked in:
 *
 * 1. `requestAnimationFrame` is suspended in background tabs and throttled in
 *    some embedded webviews. Without a fallback the number would freeze at a
 *    stale value — unacceptable for a life-point scoreboard. A watchdog timer
 *    guarantees the final value always lands.
 *
 * 2. The displayed value lives in React state, so there is exactly one source
 *    of truth. An in-flight animation can never overwrite a reset, because the
 *    next render simply re-targets the same state.
 */
export function useTweenedNumber(target: number, options: TweenOptions = {}): number {
  const { duration = 460, immediate = false } = options;

  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cancel = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      rafRef.current = null;
      timerRef.current = null;
    };

    cancel();

    const from = fromRef.current;
    const delta = target - from;

    if (immediate || delta === 0 || typeof requestAnimationFrame !== "function") {
      fromRef.current = target;
      setDisplay(target);
      return cancel;
    }

    const startedAt = performance.now();

    const finish = () => {
      cancel();
      fromRef.current = target;
      setDisplay(target);
    };

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(from + delta * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        finish();
      }
    };

    rafRef.current = requestAnimationFrame(step);
    // Watchdog: lands the final value even if rAF never fires again.
    timerRef.current = setTimeout(finish, duration + 150);

    return cancel;
  }, [target, duration, immediate]);

  return display;
}
