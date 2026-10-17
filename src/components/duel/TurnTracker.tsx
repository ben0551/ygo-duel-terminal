"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";

/** Turn counter with step controls. Bounded to 1..999 by the reducer. */
export function TurnTracker() {
  const { state, dispatch } = useDuel();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous turn"
        onClick={() => dispatch({ type: "PREVIOUS_TURN" })}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>

      <div className="min-w-[4.5rem] text-center">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Turn
        </span>
        <p
          aria-live="polite"
          aria-atomic="true"
          className="font-mono text-3xl font-extrabold leading-tight text-white drop-shadow-[0_0_20px_rgba(0,229,255,0.65)]"
        >
          {state.currentTurn}
        </p>
      </div>

      <Button
        variant="outline"
        size="icon"
        aria-label="Next turn"
        onClick={() => dispatch({ type: "NEXT_TURN" })}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}
