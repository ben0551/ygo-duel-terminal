/**
 * Pure duel logic: state shape, reducer, and helpers.
 *
 * Everything in this module is side-effect free and deterministic given its
 * inputs, which is what makes it directly unit-testable (see duel.test.ts).
 * Timestamps and log-entry ids are injectable via `action.at` so tests do not
 * depend on the wall clock.
 */

import {
  PHASES,
  PHASE_LABELS,
  type DuelState,
  type LogEntry,
  type LogKind,
  type Phase,
  type PlayerId,
  type PlayerState,
} from "@/types/duel";
import { clamp, formatLP } from "@/lib/format";

export const DEFAULT_STARTING_LP = 8000;
export const MIN_LP = 0;
export const MAX_LP = 99_999_999;
export const MAX_TURN = 999;
export const LOG_LIMIT = 400;

/* ------------------------------------------------------------------ *
 * Log helpers
 * ------------------------------------------------------------------ */

/**
 * Monotonic counter appended to log ids. Two entries created in the same
 * millisecond would otherwise collide as React list keys.
 */
let logSequence = 0;

export function createLogEntry(
  text: string,
  kind: LogKind,
  at: number = Date.now(),
): LogEntry {
  logSequence += 1;
  return { id: `${at}-${logSequence}`, at, text, kind };
}

/**
 * Add entries to the log, newest first, capped at LOG_LIMIT.
 * `entries` must be supplied oldest-first; they are reversed here so callers
 * can read chronologically at the call site.
 */
function prependLog(log: LogEntry[], entries: LogEntry[]): LogEntry[] {
  if (entries.length === 0) return log;
  return [...entries].reverse().concat(log).slice(0, LOG_LIMIT);
}

/* ------------------------------------------------------------------ *
 * Small pure helpers
 * ------------------------------------------------------------------ */

export function clampLP(value: number): number {
  return clamp(value, MIN_LP, MAX_LP);
}

/** Map a PlayerId to its 0-based index in `DuelState.players`. */
export function playerIndex(player: PlayerId): 0 | 1 {
  return player === 1 ? 0 : 1;
}

/** Display name for a player, falling back when the name field is blank. */
export function playerName(state: DuelState, player: PlayerId): string {
  const name = state.players[playerIndex(player)].name.trim();
  return name.length > 0 ? name : `Player ${player}`;
}

/** The opposing player. */
export function otherPlayer(player: PlayerId): PlayerId {
  return player === 1 ? 2 : 1;
}

/**
 * Whose turn it is.
 *
 * A turn is owned by exactly one player from the Draw Phase through the End
 * Phase; the next turn belongs to the opponent. Turn 1 goes to `firstPlayer`,
 * so the turn player simply alternates with the parity of the turn number.
 * Deriving it means the turn player can never disagree with the turn counter.
 */
export function activePlayerOf(state: DuelState): PlayerId {
  return state.currentTurn % 2 === 1 ? state.firstPlayer : otherPlayer(state.firstPlayer);
}

/** True when the given player owns the current turn. */
export function isActivePlayer(state: DuelState, player: PlayerId): boolean {
  return activePlayerOf(state) === player;
}

/** Immutably replace one player's fields. */
function withPlayer(
  players: DuelState["players"],
  index: 0 | 1,
  patch: Partial<PlayerState>,
): DuelState["players"] {
  const next: DuelState["players"] = [players[0], players[1]];
  next[index] = { ...next[index], ...patch };
  return next;
}

/* ------------------------------------------------------------------ *
 * Phase navigation
 * ------------------------------------------------------------------ */

export function nextPhaseOf(phase: Phase): Phase {
  return PHASES[(PHASES.indexOf(phase) + 1) % PHASES.length];
}

export function previousPhaseOf(phase: Phase): Phase {
  return PHASES[(PHASES.indexOf(phase) - 1 + PHASES.length) % PHASES.length];
}

export function phaseIndex(phase: Phase): number {
  return PHASES.indexOf(phase);
}

/* ------------------------------------------------------------------ *
 * State construction and sanitisation
 * ------------------------------------------------------------------ */

export interface CreateDuelOptions {
  startingLP?: number;
  names?: [string, string];
  firstPlayer?: PlayerId;
}

/** A brand-new duel in its default configuration. */
export function createInitialState(options: CreateDuelOptions = {}): DuelState {
  const startingLP = clampLP(options.startingLP ?? DEFAULT_STARTING_LP) || DEFAULT_STARTING_LP;
  return {
    players: [
      { name: options.names?.[0] ?? "Player 1", lp: startingLP },
      { name: options.names?.[1] ?? "Player 2", lp: startingLP },
    ],
    startingLP,
    firstPlayer: options.firstPlayer === 2 ? 2 : 1,
    currentTurn: 1,
    currentPhase: "draw",
    match: { duel: 1, wins: [0, 0] },
    log: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Coerce anything (including hand-edited or corrupted localStorage) into a
 * valid DuelState. Every field is validated independently so one bad value
 * cannot take the whole app down.
 */
export function sanitizeState(input: unknown): DuelState {
  const base = createInitialState();
  if (!isRecord(input)) return base;

  const startingLP = clampLP(Number(input.startingLP)) || DEFAULT_STARTING_LP;

  const rawPlayers = Array.isArray(input.players) ? input.players : [];
  const players: DuelState["players"] = [0, 1].map((i) => {
    const raw = isRecord(rawPlayers[i]) ? rawPlayers[i] : {};
    const name = typeof raw.name === "string" ? raw.name.slice(0, 16) : "";
    return {
      name: name.trim().length > 0 ? name : `Player ${i + 1}`,
      lp: raw.lp === undefined ? startingLP : clampLP(Number(raw.lp)),
    };
  }) as DuelState["players"];

  const rawMatch = isRecord(input.match) ? input.match : {};
  const rawWins = Array.isArray(rawMatch.wins) ? rawMatch.wins : [];

  const phase = PHASES.includes(input.currentPhase as Phase)
    ? (input.currentPhase as Phase)
    : "draw";

  const currentTurn = clamp(Number(input.currentTurn), 1, MAX_TURN);

  /**
   * `firstPlayer` is the current field. Older saved states stored a
   * manually-toggled `activePlayer` instead; migrate those by working out who
   * must have started given the turn the duel was on.
   */
  let firstPlayer: PlayerId = input.firstPlayer === 2 ? 2 : 1;
  if (input.firstPlayer === undefined && (input.activePlayer === 1 || input.activePlayer === 2)) {
    const legacyActive = input.activePlayer;
    firstPlayer = currentTurn % 2 === 1 ? legacyActive : otherPlayer(legacyActive);
  }

  return {
    players,
    startingLP,
    firstPlayer,
    currentTurn,
    currentPhase: phase,
    match: {
      duel: Math.max(1, clamp(Number(rawMatch.duel), 1, 999)),
      wins: [
        Math.max(0, clamp(Number(rawWins[0]), 0, 999)),
        Math.max(0, clamp(Number(rawWins[1]), 0, 999)),
      ],
    },
    log: Array.isArray(input.log)
      ? (input.log.filter(isRecord) as unknown as LogEntry[]).slice(0, LOG_LIMIT)
      : [],
  };
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export type DuelAction =
  | { type: "HYDRATE"; state: DuelState }
  | { type: "ADJUST_LP"; player: PlayerId; delta: number; at?: number }
  | { type: "SET_LP"; player: PlayerId; value: number; at?: number }
  | { type: "HALVE_LP"; player: PlayerId; at?: number }
  | { type: "DOUBLE_LP"; player: PlayerId; at?: number }
  | { type: "RESET_LP"; player: PlayerId; at?: number }
  | { type: "SET_PLAYER_NAME"; player: PlayerId; name: string }
  | { type: "NEXT_TURN"; at?: number }
  | { type: "PREVIOUS_TURN"; at?: number }
  | { type: "NEXT_PHASE"; at?: number }
  | { type: "PREVIOUS_PHASE"; at?: number }
  | { type: "SET_PHASE"; phase: Phase; at?: number }
  /** End the current player's turn: next turn, next player, back to Draw. */
  | { type: "PASS_TURN"; at?: number }
  /** Choose who takes turn 1. The turn player alternates from there. */
  | { type: "SET_FIRST_PLAYER"; player: PlayerId; at?: number }
  | { type: "AWARD_WIN"; player: PlayerId; at?: number }
  | { type: "START_NEW_DUEL"; at?: number }
  | { type: "RESET_DUEL"; startingLP?: number; at?: number }
  | { type: "LOG_ROLL"; sides: number; value: number; at?: number }
  | { type: "LOG_COIN_FLIP"; result: "heads" | "tails"; at?: number }
  | { type: "CLEAR_LOG" };

/* ------------------------------------------------------------------ *
 * Reducer
 * ------------------------------------------------------------------ */

/**
 * Reset the board for a fresh duel while preserving match score, player
 * names, the configured starting LP, and the duel log.
 */
function resetBoard(state: DuelState): DuelState {
  return {
    ...state,
    players: [
      { ...state.players[0], lp: state.startingLP },
      { ...state.players[1], lp: state.startingLP },
    ],
    currentTurn: 1,
    currentPhase: "draw",
  };
}

/** Log line announcing whose turn it now is. */
function turnAnnouncement(state: DuelState, turn: number, at?: number): LogEntry {
  const owner = activePlayerOf({ ...state, currentTurn: turn });
  return createLogEntry(
    `Turn ${turn} \u2014 ${playerName(state, owner)}'s turn`,
    "turn",
    at,
  );
}

/** Shared implementation for NEXT_PHASE / PREVIOUS_PHASE / SET_PHASE. */
function moveToPhase(state: DuelState, target: number, at?: number): DuelState {
  let index = target;
  let turn = state.currentTurn;
  const entries: LogEntry[] = [];

  if (index >= PHASES.length) {
    // End Phase -> next turn -> the opponent's Draw Phase.
    index = 0;
    turn = Math.min(MAX_TURN, turn + 1);
    entries.push(turnAnnouncement(state, turn, at));
  } else if (index < 0) {
    // Draw Phase -> previous turn -> End Phase.
    index = PHASES.length - 1;
    if (turn > 1) {
      turn -= 1;
      entries.push(turnAnnouncement(state, turn, at));
    }
  }

  const phase = PHASES[index];
  if (phase === state.currentPhase && turn === state.currentTurn) return state;

  entries.push(createLogEntry(`Phase changed to ${PHASE_LABELS[phase]}`, "phase", at));

  return { ...state, currentPhase: phase, currentTurn: turn, log: prependLog(state.log, entries) };
}

export function duelReducer(state: DuelState, action: DuelAction): DuelState {
  switch (action.type) {
    case "HYDRATE":
      return sanitizeState(action.state);

    case "ADJUST_LP": {
      const delta = Math.round(action.delta);
      if (!Number.isFinite(delta) || delta === 0) return state;

      const index = playerIndex(action.player);
      const before = state.players[index].lp;
      const after = clampLP(before + delta);
      if (after === before) return state;

      const entry = createLogEntry(
        `${playerName(state, action.player)} ${delta > 0 ? "gained" : "lost"} ` +
          `${formatLP(Math.abs(delta))} LP  (${formatLP(after)})`,
        delta > 0 ? "lp-up" : "lp-down",
        action.at,
      );

      return {
        ...state,
        players: withPlayer(state.players, index, { lp: after }),
        log: prependLog(state.log, [entry]),
      };
    }

    case "SET_LP": {
      const index = playerIndex(action.player);
      const before = state.players[index].lp;
      const after = clampLP(action.value);
      if (after === before) return state;

      const entry = createLogEntry(
        `${playerName(state, action.player)}'s LP set to ${formatLP(after)}  (was ${formatLP(before)})`,
        after >= before ? "lp-up" : "lp-down",
        action.at,
      );

      return {
        ...state,
        players: withPlayer(state.players, index, { lp: after }),
        log: prependLog(state.log, [entry]),
      };
    }

    case "HALVE_LP": {
      const index = playerIndex(action.player);
      const before = state.players[index].lp;
      const after = clampLP(Math.floor(before / 2));
      if (after === before) return state;

      return {
        ...state,
        players: withPlayer(state.players, index, { lp: after }),
        log: prependLog(state.log, [
          createLogEntry(
            `${playerName(state, action.player)}'s LP halved  (${formatLP(before)} \u2192 ${formatLP(after)})`,
            "lp-down",
            action.at,
          ),
        ]),
      };
    }

    case "DOUBLE_LP": {
      const index = playerIndex(action.player);
      const before = state.players[index].lp;
      const after = clampLP(before * 2);
      if (after === before) return state;

      return {
        ...state,
        players: withPlayer(state.players, index, { lp: after }),
        log: prependLog(state.log, [
          createLogEntry(
            `${playerName(state, action.player)}'s LP doubled  (${formatLP(before)} \u2192 ${formatLP(after)})`,
            "lp-up",
            action.at,
          ),
        ]),
      };
    }

    case "RESET_LP": {
      const index = playerIndex(action.player);
      const before = state.players[index].lp;
      const after = state.startingLP;
      if (after === before) return state;

      return {
        ...state,
        players: withPlayer(state.players, index, { lp: after }),
        log: prependLog(state.log, [
          createLogEntry(
            `${playerName(state, action.player)}'s LP reset to ${formatLP(after)}  (was ${formatLP(before)})`,
            "system",
            action.at,
          ),
        ]),
      };
    }

    case "SET_PLAYER_NAME": {
      const index = playerIndex(action.player);
      const name = action.name.slice(0, 16);
      if (state.players[index].name === name) return state;
      return { ...state, players: withPlayer(state.players, index, { name }) };
    }

    case "NEXT_TURN":
    case "PREVIOUS_TURN": {
      const direction = action.type === "NEXT_TURN" ? 1 : -1;
      const turn = clamp(state.currentTurn + direction, 1, MAX_TURN);
      if (turn === state.currentTurn) return state;
      return {
        ...state,
        currentTurn: turn,
        log: prependLog(state.log, [turnAnnouncement(state, turn, action.at)]),
      };
    }

    case "NEXT_PHASE":
      return moveToPhase(state, phaseIndex(state.currentPhase) + 1, action.at);

    case "PREVIOUS_PHASE":
      return moveToPhase(state, phaseIndex(state.currentPhase) - 1, action.at);

    case "SET_PHASE":
      return moveToPhase(state, phaseIndex(action.phase), action.at);

    case "PASS_TURN": {
      // Finish the current player's turn: the turn counter advances and the
      // opponent begins at their Draw Phase.
      const turn = Math.min(MAX_TURN, state.currentTurn + 1);
      if (turn === state.currentTurn && state.currentPhase === "draw") return state;
      return {
        ...state,
        currentTurn: turn,
        currentPhase: "draw",
        log: prependLog(state.log, [turnAnnouncement(state, turn, action.at)]),
      };
    }

    case "SET_FIRST_PLAYER": {
      if (state.firstPlayer === action.player) return state;
      const next: DuelState = { ...state, firstPlayer: action.player };
      return {
        ...next,
        log: prependLog(state.log, [
          createLogEntry(
            `${playerName(state, action.player)} takes the first turn`,
            "turn",
            action.at,
          ),
        ]),
      };
    }

    case "AWARD_WIN": {
      const winner = playerName(state, action.player);
      const duelNumber = state.match.duel;
      const wins: [number, number] = [state.match.wins[0], state.match.wins[1]];
      wins[playerIndex(action.player)] += 1;

      // Awarding a win closes the duel, so the board resets for the next one.
      const next = resetBoard(state);
      return {
        ...next,
        match: { duel: duelNumber + 1, wins },
        // Oldest first: the win is recorded, then the next duel begins.
        log: prependLog(state.log, [
          createLogEntry(
            `\u2605 ${winner} wins Duel ${duelNumber}  (match ${wins[0]}\u2013${wins[1]})`,
            "win",
            action.at,
          ),
          createLogEntry(`New duel started \u2014 ${formatLP(state.startingLP)} LP each`, "system", action.at),
        ]),
      };
    }

    case "START_NEW_DUEL": {
      const next = resetBoard(state);
      return {
        ...next,
        match: { ...state.match, duel: state.match.duel + 1 },
        log: prependLog(state.log, [
          createLogEntry(`New duel started \u2014 ${formatLP(state.startingLP)} LP each`, "system", action.at),
        ]),
      };
    }

    case "RESET_DUEL": {
      const startingLP =
        action.startingLP === undefined
          ? state.startingLP
          : clampLP(action.startingLP) || DEFAULT_STARTING_LP;

      // A full reset clears the log AND the match score, then records itself
      // as the first log entry. Player names are preserved.
      const reset: DuelState = {
        ...state,
        startingLP,
        match: { duel: 1, wins: [0, 0] },
        log: [],
      };
      const next = resetBoard(reset);
      return {
        ...next,
        log: prependLog(next.log, [
          createLogEntry(`Duel reset \u2014 ${formatLP(startingLP)} LP each`, "system", action.at),
        ]),
      };
    }

    case "LOG_ROLL": {
      return {
        ...state,
        log: prependLog(state.log, [
          createLogEntry(`Rolled D${action.sides}: ${action.value}`, "roll", action.at),
        ]),
      };
    }

    case "LOG_COIN_FLIP": {
      return {
        ...state,
        log: prependLog(state.log, [
          createLogEntry(`Coin flip: ${action.result.toUpperCase()}`, "flip", action.at),
        ]),
      };
    }

    case "CLEAR_LOG":
      return state.log.length === 0 ? state : { ...state, log: [] };

    default: {
      // Exhaustiveness guard: if a new action is added, this fails to compile.
      const unreachable: never = action;
      return unreachable;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Export helper
 * ------------------------------------------------------------------ */

/** Plain-text rendering of the duel log, newest last, with a header block. */
export function buildLogExport(state: DuelState, now: Date = new Date()): string {
  const header = [
    "YU-GI-OH! DUEL TERMINAL \u2014 DUEL LOG",
    `Exported: ${now.toLocaleString("en-GB")}`,
    `Match: ${playerName(state, 1)} ${state.match.wins[0]} \u2013 ${state.match.wins[1]} ${playerName(state, 2)}` +
      `   (Duel ${state.match.duel})`,
    `Final LP: ${playerName(state, 1)} ${formatLP(state.players[0].lp)}  |  ` +
      `${playerName(state, 2)} ${formatLP(state.players[1].lp)}`,
    `Turn: ${state.currentTurn}   Phase: ${PHASE_LABELS[state.currentPhase]}   ` +
      `Turn player: ${playerName(state, activePlayerOf(state))}`,
    "".padEnd(58, "="),
    "",
  ].join("\n");

  const body = [...state.log]
    .reverse()
    .map((entry) => `[${new Date(entry.at).toLocaleTimeString("en-GB", { hour12: false })}]  ${entry.text}`)
    .join("\n");

  return `${header}${body}\n`;
}
