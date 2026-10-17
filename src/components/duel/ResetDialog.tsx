"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useDuel } from "@/hooks/useDuel";
import { DEFAULT_STARTING_LP } from "@/lib/duel";
import { clamp } from "@/lib/format";

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Destructive-action confirmation.
 *
 * Resetting also lets you change the starting LP for the next duel, which is
 * how "editable before the duel starts" is implemented — you configure it once
 * and every reset restores to that value.
 */
export function ResetDialog({ open, onOpenChange }: ResetDialogProps) {
  const { state, dispatch } = useDuel();

  const handleConfirm = (startingLP: number) => {
    const value =
      Number.isFinite(startingLP) && startingLP > 0
        ? clamp(startingLP, 1, 99_999_999)
        : DEFAULT_STARTING_LP;
    dispatch({ type: "RESET_DUEL", startingLP: value });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="mb-1.5 text-lg font-extrabold uppercase tracking-wider text-white">
          Reset Duel
        </DialogTitle>
        <DialogDescription className="mb-4 text-[13px] leading-relaxed text-muted">
          Restores both players to the starting life points, resets the turn count, phase and
          turn player, clears the duel log, and sets the match score back to 0&ndash;0 at
          Duel 1. Player names are kept. This cannot be undone.
        </DialogDescription>

        {/* Mounted only while the dialog is open, so the field always starts
            from the current value without syncing via an effect. */}
        <StartingLpForm
          initialStartingLP={state.startingLP}
          onConfirm={handleConfirm}
        />
      </DialogContent>
    </Dialog>
  );
}

function StartingLpForm({
  initialStartingLP,
  onConfirm,
}: {
  initialStartingLP: number;
  onConfirm: (value: number) => void;
}) {
  const [startingLP, setStartingLP] = React.useState(String(initialStartingLP));

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Label htmlFor="starting-lp">Starting LP</Label>
        <Input
          id="starting-lp"
          type="number"
          inputMode="numeric"
          min={1}
          step={100}
          value={startingLP}
          onChange={(event) => setStartingLP(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onConfirm(Number(startingLP));
          }}
          className="flex-1"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
        </DialogClose>
        <Button variant="danger" onClick={() => onConfirm(Number(startingLP))}>
          Reset Duel
        </Button>
      </div>
    </>
  );
}
