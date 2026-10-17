"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuel } from "@/hooks/useDuel";
import { playerName } from "@/lib/duel";
import { cn } from "@/lib/utils";
import type { PlayerId } from "@/types/duel";

/**
 * Match mode: a match is first to win the most duels, so we track which duel
 * is in progress and each player's win count. Awarding a win closes the
 * current duel and resets the board for the next one.
 */
export function MatchTracker() {
  const { state, dispatch } = useDuel();

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      <span className="rounded-full border border-white/10 bg-white/4 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-muted sm:px-2.5 sm:py-1 sm:text-[11px]">
        DUEL <b className="text-ink">{state.match.duel}</b>
      </span>

      {([1, 2] as PlayerId[]).map((player) => (
        <span
          key={player}
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide sm:px-2.5 sm:py-1 sm:text-[11px]",
            player === 1 ? "border-p1/35 text-p1/85" : "border-p2/35 text-p2/85",
          )}
        >
          {`P${player} WINS`} <b className="text-white">{state.match.wins[player - 1]}</b>
        </span>
      ))}

      <div className="flex flex-wrap gap-1.5">
        {([1, 2] as PlayerId[]).map((player) => (
          <Button
            key={player}
            variant="ghost"
            className="h-11 px-3 text-[11px] sm:h-9"
            aria-label={`Award Duel ${state.match.duel} to ${playerName(state, player)}`}
            onClick={() => dispatch({ type: "AWARD_WIN", player })}
          >
            <Trophy aria-hidden="true" className="size-3.5" />
            {`P${player} Wins`}
          </Button>
        ))}
      </div>
    </div>
  );
}
