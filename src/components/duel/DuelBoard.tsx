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
 * Two layouts share one component tree:
 *
 * - **Phone (< md).** The two life-point panels sit side by side so both totals
 *   are on screen at once, and the turn-player controls move up into the turn
 *   bar (there is no room for a centre column between the panels). The turn bar
 *   is sticky, so the current phase stays visible while you scroll.
 * - **Tablet / desktop (>= md).** The panels get a centre column with the VS
 *   badge, and from `lg` the side panel docks alongside the board.
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
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-4">
      <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
        <header className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 rounded-2xl border border-accent/15 bg-surface/60 p-2 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] sm:gap-3 sm:p-3">
          <h1 className="flex shrink-0 items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] sm:gap-2 sm:text-sm sm:tracking-[0.2em]">
            <Sparkles
              aria-hidden="true"
              className="size-3.5 text-accent drop-shadow-[0_0_10px_var(--color-accent)] motion-safe:animate-pulse sm:size-4"
            />
            <span>Duel</span>
            <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
              Terminal
            </span>
          </h1>

          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <MatchTracker />
            <Button
              variant="danger"
              className="h-11 min-w-11 px-3 text-[11px] sm:h-9"
              onClick={() => setResetOpen(true)}
              aria-haspopup="dialog"
              aria-label="Reset duel"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </header>

        {/* Sticky on phones so the current phase is always on screen. Turn and
            phase sit side by side at every width, so the bar stays short. */}
        <section
          aria-label="Turn and phase"
          className="sticky top-0 z-30 flex flex-row items-center gap-2 rounded-2xl border border-accent/15 bg-surface/90 p-2 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] sm:gap-3 sm:p-3 md:gap-4"
        >
          <TurnTracker />
          <span
            aria-hidden="true"
            className="hidden h-12 w-px self-stretch bg-gradient-to-b from-transparent via-accent/30 to-transparent md:block"
          />
          <PhaseTracker />
        </section>

        {/* Phone-only: with the panels sharing the width there is no centre
            column, so turn-player controls get their own compact row. */}
        <div className="rounded-2xl border border-accent/15 bg-surface/60 p-2 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)] md:hidden">
          <TurnPlayerIndicator variant="bar" />
        </div>

        <section
          aria-label="Players"
          className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch"
        >
          <LifePointPanel player={1} />
          {/* Centre column is desktop/tablet only; on phones this same
              component is rendered above instead. */}
          <TurnPlayerIndicator className="hidden md:flex" />
          <LifePointPanel player={2} />
        </section>

        <section aria-label="Duel utilities" className="grid grid-cols-2 gap-2 sm:gap-3">
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
