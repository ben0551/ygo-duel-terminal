"use client";

import * as React from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoinFlip } from "@/components/duel/CoinFlip";
import { DiceRoller } from "@/components/duel/DiceRoller";
import { LifePointPanel } from "@/components/duel/LifePointPanel";
import { MatchTracker } from "@/components/duel/MatchTracker";
import { PhaseTracker } from "@/components/duel/PhaseTracker";
import { ResetDialog } from "@/components/duel/ResetDialog";
import { SidePanel } from "@/components/duel/SidePanel";
import { TurnPlayerIndicator } from "@/components/duel/TurnPlayerIndicator";
import { TurnTracker } from "@/components/duel/TurnTracker";
import { useDuel } from "@/hooks/useDuel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/**
 * Top-level composition of the duel tracker.
 *
 * Layout is mobile-first: a single stacked column that becomes a two-column
 * board (arena + side panel) from the `lg` breakpoint up.
 */
export function DuelBoard() {
  const { dispatch } = useDuel();
  const [resetOpen, setResetOpen] = React.useState(false);

  // Shortcuts are suspended while the confirmation dialog is open so keys
  // cannot act on the board behind it.
  useKeyboardShortcuts({
    enabled: !resetOpen,
    onNextPhase: () => dispatch({ type: "NEXT_PHASE" }),
    onPreviousPhase: () => dispatch({ type: "PREVIOUS_PHASE" }),
    onNextTurn: () => dispatch({ type: "NEXT_TURN" }),
    onPreviousTurn: () => dispatch({ type: "PREVIOUS_TURN" }),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-4">
        <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/15 bg-surface/60 p-3 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)]">
          <h1 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.2em]">
            <Sparkles
              aria-hidden="true"
              className="size-4 text-accent drop-shadow-[0_0_10px_var(--color-accent)] motion-safe:animate-pulse"
            />
            <span>Duel</span>
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              Terminal
            </span>
          </h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <MatchTracker />
            <Button
              variant="danger"
              size="sm"
              onClick={() => setResetOpen(true)}
              aria-haspopup="dialog"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Reset
            </Button>
          </div>
        </header>

        <section
          aria-label="Turn and phase"
          className="flex flex-col gap-3 rounded-2xl border border-accent/15 bg-surface/60 p-3 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] sm:flex-row sm:items-center sm:gap-4"
        >
          <TurnTracker />
          <span
            aria-hidden="true"
            className="hidden h-12 w-px self-stretch bg-gradient-to-b from-transparent via-accent/30 to-transparent sm:block"
          />
          <PhaseTracker />
        </section>

        <section
          aria-label="Players"
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch"
        >
          <LifePointPanel player={1} />
          <TurnPlayerIndicator className="flex-row justify-center gap-4 md:flex-col md:gap-3" />
          <LifePointPanel player={2} />
        </section>

        <section aria-label="Duel utilities" className="grid gap-3 sm:grid-cols-2">
          <CoinFlip />
          <DiceRoller />
        </section>

        <p className="hidden text-center text-[10.5px] tracking-wide text-muted lg:block">
          <kbd className="rounded border border-white/10 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-ink">
            Space
          </kbd>{" "}
          next phase
          <span className="mx-2 opacity-40">·</span>
          <kbd className="rounded border border-white/10 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-ink">
            &larr;
          </kbd>{" "}
          previous phase
          <span className="mx-2 opacity-40">·</span>
          <kbd className="rounded border border-white/10 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-ink">
            &rarr;
          </kbd>{" "}
          next phase
          <span className="mx-2 opacity-40">·</span>
          <kbd className="rounded border border-white/10 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-ink">
            &uarr;
          </kbd>
          <kbd className="ml-1 rounded border border-white/10 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-ink">
            &darr;
          </kbd>{" "}
          turn
        </p>
      </div>

      <SidePanel />

      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
}
