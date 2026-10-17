"use client";

import { ChevronsRight, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";
import { activePlayerOf, playerName } from "@/lib/duel";
import { cn } from "@/lib/utils";
import { PLAYER_IDS, type PlayerId } from "@/types/duel";

interface TurnPlayerIndicatorProps {
  className?: string;
  /**
   * `column` is the tall centre column that sits between the two life-point
   * panels on wide screens. `bar` is a single compact row for phones, where
   * both panels share the width instead and this moves into the turn bar.
   */
  variant?: "column" | "bar";
}

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
export function TurnPlayerIndicator({
  className,
  variant = "column",
}: TurnPlayerIndicatorProps) {
  const { state, dispatch } = useDuel();
  const activeId = activePlayerOf(state);
  const active = playerName(state, activeId);
  const isPlayerTwo = activeId === 2;
  const isBar = variant === "bar";

  return (
    <div
      className={cn(
        isBar
          ? "flex w-full flex-wrap items-center gap-2"
          : "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "place-items-center rounded-full border border-white/10 bg-black/30 font-mono font-extrabold tracking-widest text-white/30",
          isBar ? "hidden size-9 text-[11px] sm:grid" : "hidden size-14 text-lg md:grid",
        )}
      >
        VS
      </span>

      <div className={cn(isBar ? "min-w-0 text-left" : "text-center")}>
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Turn player
        </span>
        <b
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "block truncate text-xs font-bold uppercase tracking-wider",
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
        className={cn("h-11 text-[11px]", isBar ? "ml-auto px-3" : "px-3")}
        aria-label={`End ${active}'s turn and pass it to the opponent`}
        onClick={() => dispatch({ type: "PASS_TURN" })}
      >
        <ChevronsRight aria-hidden="true" className="size-4" />
        Pass turn
      </Button>

      <fieldset className="flex items-center gap-1">
        <legend className="sr-only">Which player takes the first turn</legend>
        <Flag
          aria-hidden="true"
          className={cn("size-3 shrink-0 text-muted", isBar && "hidden sm:block")}
        />
        <span
          aria-hidden="true"
          className={cn(
            "text-[9px] font-bold uppercase tracking-widest text-muted",
            isBar && "hidden sm:inline",
          )}
        >
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
                "rounded-md border font-mono font-bold",
                "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                isBar ? "h-11 min-w-11 px-2 text-[11px]" : "px-2 py-1 text-[10px]",
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
