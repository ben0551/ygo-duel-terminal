"use client";

import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  onNextPhase: () => void;
  onPreviousPhase: () => void;
  onNextTurn?: () => void;
  onPreviousTurn?: () => void;
  /** Set false while a modal is open so shortcuts do not fire behind it. */
  enabled?: boolean;
}

/**
 * Global phase/turn shortcuts for fast tournament play.
 *
 * Guards that matter:
 * - Ignore keys while the user is typing in a field, otherwise pressing space
 *   in the LP input would advance the phase.
 * - Ignore keys when focus is on a button, so Space activates that button
 *   instead of also advancing the phase.
 * - Ignore keys while a dialog is open.
 */
export function useKeyboardShortcuts({
  onNextPhase,
  onPreviousPhase,
  onNextTurn,
  onPreviousTurn,
  enabled = true,
}: KeyboardShortcutHandlers): void {
  useEffect(() => {
    if (!enabled) return;

    const isTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
      );
    };

    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return target.closest("button, a, [role='button'], [role='tab']") !== null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      switch (event.key) {
        case " ":
        case "Spacebar":
          // Let a focused button handle its own activation.
          if (isInteractiveTarget(event.target)) return;
          event.preventDefault();
          onNextPhase();
          break;
        case "ArrowRight":
          event.preventDefault();
          onNextPhase();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onPreviousPhase();
          break;
        case "ArrowUp":
          if (!onNextTurn) return;
          event.preventDefault();
          onNextTurn();
          break;
        case "ArrowDown":
          if (!onPreviousTurn) return;
          event.preventDefault();
          onPreviousTurn();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onNextPhase, onPreviousPhase, onNextTurn, onPreviousTurn, enabled]);
}
