"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDuel } from "@/hooks/useDuel";
import { useTweenedNumber } from "@/hooks/useTweenedNumber";
import { useMediaQuery } from "@/hooks/usePersistentPreference";
import { isActivePlayer, playerIndex } from "@/lib/duel";
import { formatDelta, formatLP } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlayerId } from "@/types/duel";

const ADD_DELTAS = [100, 500, 1000] as const;
const SUBTRACT_DELTAS = [100, 500, 1000] as const;

interface LifePointPanelProps {
  player: PlayerId;
}

/**
 * One player's life-point console: readout plus every way to change it.
 *
 * Feedback is deliberately redundant — the number tweens, the panel flashes
 * green or red, and a floating delta appears — because in a real duel you are
 * looking at the table, not the screen.
 */
export function LifePointPanel({ player }: LifePointPanelProps) {
  const { state, dispatch } = useDuel();
  const index = playerIndex(player);
  const { name, lp } = state.players[index];
  const isActive = isActivePlayer(state, player);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const displayLp = useTweenedNumber(lp, { immediate: reducedMotion });

  const [customAmount, setCustomAmount] = React.useState("");
  const [customInvalid, setCustomInvalid] = React.useState(false);

  // Track the last real change so we can flash and show a delta. Comparing in
  // an effect (rather than during render) keeps render pure.
  const previousLp = React.useRef(lp);
  const flashId = React.useRef(0);
  const [flash, setFlash] = React.useState<{
    direction: "up" | "down";
    amount: number;
    id: number;
  } | null>(null);

  React.useEffect(() => {
    const before = previousLp.current;
    if (lp === before) return;
    flashId.current += 1;
    setFlash({
      direction: lp > before ? "up" : "down",
      amount: Math.abs(lp - before),
      id: flashId.current,
    });
    previousLp.current = lp;
  }, [lp]);

  React.useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 1300);
    return () => clearTimeout(timer);
  }, [flash]);

  const readCustomAmount = (): number | null => {
    const parsed = Number(customAmount);
    if (customAmount.trim() === "" || !Number.isFinite(parsed) || parsed <= 0) {
      setCustomInvalid(true);
      setTimeout(() => setCustomInvalid(false), 420);
      return null;
    }
    return Math.round(parsed);
  };

  const handleApplyCustom = (mode: "add" | "subtract") => {
    const amount = readCustomAmount();
    if (amount === null) return;
    dispatch({
      type: "ADJUST_LP",
      player,
      delta: mode === "add" ? amount : -amount,
    });
    setCustomAmount("");
  };

  const handleSetToCustom = () => {
    const amount = readCustomAmount();
    if (amount === null) return;
    dispatch({ type: "SET_LP", player, value: amount });
    setCustomAmount("");
  };

  return (
    <section
      aria-labelledby={`player-${player}-heading`}
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 backdrop-blur-xl",
        "bg-surface/60 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.85)]",
        "transition-[border-color,box-shadow] duration-300",
        isActive
          ? player === 1
            ? "border-p1/60 shadow-[0_0_34px_-8px_var(--color-p1)]"
            : "border-p2/60 shadow-[0_0_34px_-8px_var(--color-p2)]"
          : "border-white/10",
        // Damage / heal flashes. Keyed by id so repeated hits replay.
        flash?.direction === "down" && "animate-[flash-damage_700ms_ease-out] border-danger/70",
        flash?.direction === "up" && "animate-[flash-heal_700ms_ease-out] border-success/60",
        "motion-reduce:animate-none",
      )}
    >
      <header className="flex items-center gap-2">
        <label htmlFor={`player-${player}-name`} className="sr-only">
          {`Player ${player} name`}
        </label>
        <input
          id={`player-${player}-name`}
          value={name}
          maxLength={16}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) =>
            dispatch({ type: "SET_PLAYER_NAME", player, name: event.target.value })
          }
          onBlur={(event) => {
            if (event.target.value.trim() === "") {
              dispatch({ type: "SET_PLAYER_NAME", player, name: `Player ${player}` });
            }
          }}
          className={cn(
            "min-w-0 flex-1 border-b border-dashed border-white/15 bg-transparent pb-1",
            "text-base font-bold uppercase tracking-wider text-ink outline-none",
            "transition-colors focus:border-solid",
            player === 1 ? "focus:border-p1" : "focus:border-p2",
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "size-2.5 shrink-0 rounded-full transition-all",
            isActive
              ? player === 1
                ? "bg-p1 shadow-[0_0_14px_var(--color-p1)]"
                : "bg-p2 shadow-[0_0_14px_var(--color-p2)]"
              : "bg-white/15",
          )}
        />
      </header>

      <div className="text-center">
        <h2
          id={`player-${player}-heading`}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted"
        >
          Life Points
        </h2>
        <p
          aria-hidden="true"
          className={cn(
            "font-mono text-[clamp(2.6rem,8vw,4.5rem)] font-extrabold leading-none tracking-tight text-white",
            player === 1
              ? "drop-shadow-[0_0_30px_rgba(0,229,255,0.45)]"
              : "drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]",
          )}
        >
          {formatLP(displayLp)}
        </p>

        {/* Announces only real state changes, never the animation frames. */}
        <span role="status" aria-live="polite" className="sr-only">
          {`${name || `Player ${player}`} life points: ${formatLP(lp)}`}
        </span>

        <span
          aria-hidden="true"
          className={cn(
            "mt-1 block h-5 font-mono text-sm font-bold transition-opacity duration-300",
            flash
              ? flash.direction === "up"
                ? "text-success opacity-100 drop-shadow-[0_0_12px_var(--color-success)]"
                : "text-danger opacity-100 drop-shadow-[0_0_12px_var(--color-danger)]"
              : "opacity-0",
          )}
        >
          {flash
            ? formatDelta(flash.direction === "up" ? flash.amount : -flash.amount)
            : "\u00A0"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ADD_DELTAS.map((amount) => (
          <Button
            key={`add-${amount}`}
            variant="success"
            className="h-12 font-mono text-sm"
            aria-label={`Add ${amount} life points to ${name || `player ${player}`}`}
            onClick={() => dispatch({ type: "ADJUST_LP", player, delta: amount })}
          >
            +{amount}
          </Button>
        ))}
        {SUBTRACT_DELTAS.map((amount) => (
          <Button
            key={`subtract-${amount}`}
            variant="danger"
            className="h-12 font-mono text-sm"
            aria-label={`Subtract ${amount} life points from ${name || `player ${player}`}`}
            onClick={() => dispatch({ type: "ADJUST_LP", player, delta: -amount })}
          >
            &minus;{amount}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <label htmlFor={`player-${player}-custom`} className="sr-only">
          {`Custom life point amount for player ${player}`}
        </label>
        <Input
          id={`player-${player}-custom`}
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Custom amount"
          value={customAmount}
          aria-invalid={customInvalid}
          onChange={(event) => setCustomAmount(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleApplyCustom("add");
          }}
          className={cn(
            "flex-1",
            customInvalid && "border-danger animate-[shake_300ms_ease-in-out]",
          )}
        />
        <Button
          variant="outline"
          className="px-3 text-[11px]"
          onClick={() => handleApplyCustom("add")}
        >
          Add
        </Button>
        <Button
          variant="outline"
          className="px-3 text-[11px]"
          onClick={() => handleApplyCustom("subtract")}
        >
          Sub
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="ghost"
          className="font-mono"
          aria-label={`Halve ${name || `player ${player}`} life points`}
          onClick={() => dispatch({ type: "HALVE_LP", player })}
        >
          &frac12;
        </Button>
        <Button
          variant="ghost"
          className="font-mono"
          aria-label={`Double ${name || `player ${player}`} life points`}
          onClick={() => dispatch({ type: "DOUBLE_LP", player })}
        >
          &times;2
        </Button>
        <Button
          variant="ghost"
          aria-label={`Set ${name || `player ${player}`} life points to the custom amount`}
          onClick={handleSetToCustom}
        >
          Set
        </Button>
        <Button
          variant="ghost"
          aria-label={`Restore ${name || `player ${player}`} to starting life points`}
          onClick={() => dispatch({ type: "RESET_LP", player })}
        >
          Reset
        </Button>
      </div>
    </section>
  );
}
