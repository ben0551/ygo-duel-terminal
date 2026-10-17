"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";
import { phaseIndex } from "@/lib/duel";
import { PHASES, PHASE_LABELS, PHASE_SHORT_LABELS } from "@/types/duel";
import { cn } from "@/lib/utils";

/**
 * Phase readout plus a rail of jump-to-phase chips.
 *
 * Advancing past the End Phase rolls the turn counter and returns to the Draw
 * Phase — that wrap lives in the reducer, not here, so the keyboard shortcuts
 * and the buttons cannot drift apart.
 */
export function PhaseTracker() {
  const { state, dispatch } = useDuel();
  const current = phaseIndex(state.currentPhase);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="shrink-0 px-3 text-[11px]"
          aria-label="Previous phase"
          onClick={() => dispatch({ type: "PREVIOUS_PHASE" })}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Phase</span>
        </Button>

        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Current Phase
          </span>
          <p
            aria-live="polite"
            aria-atomic="true"
            className="truncate bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-lg font-extrabold uppercase tracking-wide text-transparent sm:text-xl"
          >
            {PHASE_LABELS[state.currentPhase]}
          </p>
        </div>

        <Button
          variant="outline"
          className="shrink-0 px-3 text-[11px]"
          aria-label="Next phase"
          onClick={() => dispatch({ type: "NEXT_PHASE" })}
        >
          <span className="hidden sm:inline">Phase</span>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <div
        role="group"
        aria-label="Jump to a specific phase"
        className="flex flex-wrap gap-1.5"
      >
        {PHASES.map((phase, index) => {
          const isCurrent = index === current;
          const isPast = index < current;
          return (
            <button
              key={phase}
              type="button"
              aria-label={`Go to ${PHASE_LABELS[phase]}`}
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => dispatch({ type: "SET_PHASE", phase })}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em]",
                "outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent",
                isCurrent
                  ? "border-accent bg-gradient-to-br from-accent to-[#6EE7FF] text-[#02121A] shadow-[0_0_20px_-4px_var(--color-accent)]"
                  : isPast
                    ? "border-white/6 bg-white/3 text-muted/60 hover:border-accent/30 hover:text-ink"
                    : "border-white/10 bg-white/4 text-muted hover:border-accent/35 hover:text-ink",
              )}
            >
              {PHASE_SHORT_LABELS[phase]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
