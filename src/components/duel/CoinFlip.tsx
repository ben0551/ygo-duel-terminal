"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";
import { cn } from "@/lib/utils";

type CoinFace = "heads" | "tails";

const FLIP_DURATION_MS = 1150;

/**
 * Coin flip with a real 3D rotation.
 *
 * IMPORTANT: do not add a CSS `filter` (drop-shadow/blur) to the element that
 * carries `transform-style: preserve-3d`. A filter forces the element to
 * flatten its children, which silently disables `backface-visibility` and
 * makes the rear face show through mirrored. The glow lives on the faces as
 * box-shadow instead.
 */
export function CoinFlip() {
  const { dispatch } = useDuel();
  const [rotation, setRotation] = React.useState(0);
  const [result, setResult] = React.useState<CoinFace | null>(null);
  const [isFlipping, setIsFlipping] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    const landsOnHeads = Math.random() < 0.5;
    // Full spins for show, plus a half turn when the result is tails.
    setRotation(
      (previous) => previous + 360 * (4 + Math.floor(Math.random() * 3)) + (landsOnHeads ? 0 : 180),
    );

    timerRef.current = setTimeout(() => {
      const face: CoinFace = landsOnHeads ? "heads" : "tails";
      setResult(face);
      setIsFlipping(false);
      dispatch({ type: "LOG_COIN_FLIP", result: face });
    }, FLIP_DURATION_MS);
  };

  return (
    <section
      aria-labelledby="coin-flip-heading"
      className="flex flex-col gap-2 rounded-2xl border border-accent/15 bg-surface/60 p-2.5 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] sm:gap-3 sm:p-4"
    >
      <h3
        id="coin-flip-heading"
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent"
      >
        &#9679; Coin Flip
      </h3>

      <div className="flex flex-col items-center gap-2 [perspective:700px] sm:flex-row sm:gap-4">
        <div
          aria-hidden="true"
          className={cn(
            "relative size-14 shrink-0 transition-transform [transform-style:preserve-3d] sm:size-20",
            "duration-[1150ms] ease-[cubic-bezier(0.22,0.75,0.25,1)] motion-reduce:transition-none",
          )}
          style={{ transform: `rotateY(${rotation}deg)` }}
        >
          <span className="absolute inset-0 grid place-items-center rounded-full border-2 border-accent/55 bg-[radial-gradient(circle_at_34%_28%,#EAF9FF,#7FD8F5_42%,#0E7FA8_100%)] font-mono text-[13px] font-extrabold tracking-wide text-[#04222E] shadow-[0_0_16px_var(--color-accent)] [backface-visibility:hidden] sm:text-lg">
            HEADS
          </span>
          <span className="absolute inset-0 grid place-items-center rounded-full border-2 border-accent-2/55 bg-[radial-gradient(circle_at_34%_28%,#F0E6FF,#C9A6F5_42%,#6D28D9_100%)] font-mono text-[13px] font-extrabold tracking-wide text-[#210B3A] shadow-[0_0_16px_var(--color-accent-2)] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:text-lg">
            TAILS
          </span>
        </div>

        <div className="w-full min-w-0 flex-1">
          <p
            role="status"
            aria-live="polite"
            className="text-center font-mono text-lg font-extrabold uppercase tracking-widest text-white drop-shadow-[0_0_22px_rgba(0,229,255,0.6)] sm:text-left sm:text-2xl"
          >
            {result === null ? "\u2014" : result}
            <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-muted sm:text-[10px]">
              {isFlipping ? "Flipping" : result === null ? "Awaiting flip" : "Face up"}
            </span>
          </p>
          <Button
            variant="primary"
            className="mt-1.5 h-11 w-full text-[11px] sm:text-[13px]"
            disabled={isFlipping}
            onClick={handleFlip}
          >
            Flip Coin
          </Button>
        </div>
      </div>
    </section>
  );
}
