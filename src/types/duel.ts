/**
 * Core domain types for the duel tracker.
 *
 * Design note: the brief sketched `player1LP` / `player2LP` as flat fields.
 * We model players as a fixed two-element tuple instead, so every component
 * can map over players and run identical logic for either side. That removes
 * a whole class of "forgot to update player 2" bugs and keeps the UI
 * components symmetric.
 */

/** The six phases of a turn, in the order they are played. */
export const PHASES = ["draw", "standby", "main1", "battle", "main2", "end"] as const;

export type Phase = (typeof PHASES)[number];

/** Human-readable phase names, used in the UI and the duel log. */
export const PHASE_LABELS: Record<Phase, string> = {
  draw: "Draw Phase",
  standby: "Standby Phase",
  main1: "Main Phase 1",
  battle: "Battle Phase",
  main2: "Main Phase 2",
  end: "End Phase",
};

/** Compact phase names for the phase rail on narrow screens. */
export const PHASE_SHORT_LABELS: Record<Phase, string> = {
  draw: "Draw",
  standby: "Standby",
  main1: "Main 1",
  battle: "Battle",
  main2: "Main 2",
  end: "End",
};

export type PlayerId = 1 | 2;

export const PLAYER_IDS = [1, 2] as const satisfies readonly PlayerId[];

/** Log entry categories — drive the colour coding in the duel log. */
export type LogKind =
  | "lp-up"
  | "lp-down"
  | "turn"
  | "phase"
  | "roll"
  | "flip"
  | "win"
  | "system";

export interface LogEntry {
  /** Stable key for React lists. */
  id: string;
  /** Epoch milliseconds. Formatted for display only. */
  at: number;
  text: string;
  kind: LogKind;
}

export interface PlayerState {
  name: string;
  lp: number;
}

export interface MatchState {
  /** Which duel of the match is in progress (1-based). */
  duel: number;
  /** Wins for player 1 and player 2, indexed by `playerIndex()`. */
  wins: [number, number];
}

export interface DuelState {
  players: [PlayerState, PlayerState];
  /** LP each player starts a duel with. Configurable via the reset dialog. */
  startingLP: number;
  /**
   * Which player takes turn 1.
   *
   * The turn player is NOT stored separately: in Yu-Gi-Oh! a single turn runs
   * through all six phases for one player, then passes to the opponent. So the
   * active player is a pure function of the turn number and who started —
   * see `activePlayerOf()`. Keeping it derived makes it impossible for the
   * turn player and the turn counter to disagree.
   */
  firstPlayer: PlayerId;
  currentTurn: number;
  currentPhase: Phase;
  match: MatchState;
  /** Newest entry first. */
  log: LogEntry[];
}

/** Which side of the right-hand panel is showing. */
export type SidePanelTab = "actions" | "log";
