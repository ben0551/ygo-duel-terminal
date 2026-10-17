"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";
import { cn } from "@/lib/utils";

const ROLL_DURATION_MS = 720;
const TICK_MS = 60;

/**
 * Dice roller for the two dice the game actually asks for: D6 and D20.
 *
 * While rolling we tick a random face for visual feedback, then settle on the
 * real result. The value is only committed to state (and the log) once, at the
 * end, so the log never records the flicker frames.
 */
export function DiceRoller() {
  const { dispatch } = useDuel();
  const [face, setFace] = React.useState<number | null>(null);
  const [sides, setSides] = React.useState<6 | 20>(6);
  const [isRolling, setIsRolling] = React.useState(false);
  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const endRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (tickRef.current !== null) clearInterval(tickRef.current);
      if (endRef.current !== null) clearTimeout(endRef.current);
    };
  }, []);

  const roll = (dieSides: 6 | 20) => {
    if (isRolling) return;
    setIsRolling(true);
    setSides(dieSides);

    tickRef.current = setInterval(() => {
      setFace(1 + Math.floor(Math.random() * dieSides));
    }, TICK_MS);

    endRef.current = setTimeout(() => {
      if (tickRef.current !== null) clearInterval(tickRef.current);
      const value = 1 + Math.floor(Math.random() * dieSides);
      setFace(value);
      setIsRolling(false);
      dispatch({ type: "LOG_ROLL", sides: dieSides, value });
    }, ROLL_DURATION_MS);
  };

  return (
    <section
      aria-labelledby="dice-roller-heading"
      className="flex flex-col gap-2 rounded-2xl border border-accent-2/15 bg-surface/60 p-2.5 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] sm:gap-3 sm:p-4"
    >
      <h3
        id="dice-roller-heading"
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-2"
      >
        &#9670; Dice Roller
      </h3>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
        <div
          aria-hidden="true"
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-accent-2/55 sm:size-20",
            "bg-gradient-to-br from-accent-2/35 to-accent/15 font-mono text-2xl font-extrabold text-white sm:text-3xl",
            "shadow-[0_0_22px_-4px_var(--color-accent-2),inset_0_2px_0_rgba(255,255,255,0.14)]",
            isRolling && "animate-[die-roll_340ms_ease-in-out_infinite]",
            "motion-reduce:animate-none",
          )}
        >
          {face ?? "?"}
        </div>

        <div className="w-full min-w-0 flex-1">
          <p
            role="status"
            aria-live="polite"
            className="text-center font-mono text-lg font-extrabold text-white drop-shadow-[0_0_22px_rgba(168,85,247,0.6)] sm:text-left sm:text-2xl"
          >
            {face === null ? "\u2014" : face}
            <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-muted sm:text-[10px]">
              {isRolling ? `Rolling D${sides}` : face === null ? "Awaiting roll" : `D${sides}`}
            </span>
          </p>
          <div className="mt-1.5 flex gap-2">
            <Button
              variant="outline"
              className="h-11 flex-1 px-0 font-mono text-[13px]"
              disabled={isRolling}
              onClick={() => roll(6)}
            >
              D6
            </Button>
            <Button
              variant="outline"
              className="h-11 flex-1 px-0 font-mono text-[13px]"
              disabled={isRolling}
              onClick={() => roll(20)}
            >
              D20
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
