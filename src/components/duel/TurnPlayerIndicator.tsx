"use client";

import { ChevronsRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";
import { activePlayerOf, playerName } from "@/lib/duel";
import { cn } from "@/lib/utils";
import { PLAYER_IDS, type PlayerId } from "@/types/duel";

/**
 * Whose turn it is, plus the two controls that matter for turn order.
 *
 * The turn player is derived from the turn number (see `activePlayerOf`), so
 * advancing past the End Phase automatically hands the turn to the opponent
 * and returns them to their Draw Phase — exactly how a real turn works.
 *
 * "Pass turn" is the explicit version of that: finish my turn now.
 * "First turn" sets who owns turn 1, which is what the coin toss decides.
 */
export function TurnPlayerIndicator({ className }: { className?: string }) {
  const { state, dispatch } = useDuel();
  const activeId = activePlayerOf(state);
  const active = playerName(state, activeId);
  const isPlayerTwo = activeId === 2;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="hidden size-14 place-items-center rounded-full border border-white/10 bg-black/30 font-mono text-lg font-extrabold tracking-widest text-white/30 md:grid"
      >
        VS
      </span>

      <div className="text-center">
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Turn player
        </span>
        <b
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "block text-xs font-bold uppercase tracking-wider",
            isPlayerTwo
              ? "text-p2 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
              : "text-p1 drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]",
          )}
        >
          {active}
        </b>
      </div>

      <Button
        variant="primary"
        className="px-3 text-[11px]"
        aria-label={`End ${active}'s turn and pass it to the opponent`}
        onClick={() => dispatch({ type: "PASS_TURN" })}
      >
        <ChevronsRight aria-hidden="true" className="size-4" />
        Pass turn
      </Button>

      <fieldset className="flex items-center gap-1.5">
        <legend className="sr-only">Which player takes the first turn</legend>
        <Flag aria-hidden="true" className="size-3 text-muted" />
        <span aria-hidden="true" className="text-[9px] font-bold uppercase tracking-widest text-muted">
          First
        </span>
        {PLAYER_IDS.map((player: PlayerId) => {
          const selected = state.firstPlayer === player;
          return (
            <button
              key={player}
              type="button"
              aria-pressed={selected}
              aria-label={`${playerName(state, player)} takes turn 1`}
              onClick={() => dispatch({ type: "SET_FIRST_PLAYER", player })}
              className={cn(
                "rounded-md border px-2 py-1 font-mono text-[10px] font-bold",
                "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                selected
                  ? player === 1
                    ? "border-p1/60 bg-p1/20 text-p1"
                    : "border-p2/60 bg-p2/20 text-p2"
                  : "border-white/10 bg-white/4 text-muted hover:text-ink",
              )}
            >
              {`P${player}`}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
