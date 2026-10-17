import { describe, expect, it } from "vitest";
import {
  activePlayerOf,
  buildLogExport,
  createInitialState,
  DEFAULT_STARTING_LP,
  duelReducer,
  LOG_LIMIT,
  MAX_TURN,
  otherPlayer,
  sanitizeState,
  type DuelAction,
} from "@/lib/duel";
import { PHASES, PHASE_LABELS, type DuelState, type PlayerId } from "@/types/duel";

/** Apply a list of actions in order. */
function apply(state: DuelState, ...actions: DuelAction[]): DuelState {
  return actions.reduce(duelReducer, state);
}

/** Timestamp used in tests so log text and ids are deterministic. */
const T = 1_700_000_000_000;

const namesOf = (state: DuelState) => state.players.map((p) => p.name);
const lpsOf = (state: DuelState) => state.players.map((p) => p.lp);
const logText = (state: DuelState) => state.log.map((entry) => entry.text);

describe("createInitialState", () => {
  it("starts both players at the default LP", () => {
    const state = createInitialState();
    expect(lpsOf(state)).toEqual([DEFAULT_STARTING_LP, DEFAULT_STARTING_LP]);
    expect(state.startingLP).toBe(DEFAULT_STARTING_LP);
  });

  it("starts on turn 1, in the Draw Phase, with player 1 first", () => {
    const state = createInitialState();
    expect(state.currentTurn).toBe(1);
    expect(state.currentPhase).toBe("draw");
    expect(state.firstPlayer).toBe(1);
    expect(activePlayerOf(state)).toBe(1);
    expect(state.log).toEqual([]);
  });

  it("honours a custom starting LP and first player", () => {
    const state = createInitialState({ startingLP: 4000, firstPlayer: 2 });
    expect(lpsOf(state)).toEqual([4000, 4000]);
    expect(activePlayerOf(state)).toBe(2);
  });

  it("rejects a non-positive starting LP", () => {
    expect(createInitialState({ startingLP: 0 }).startingLP).toBe(DEFAULT_STARTING_LP);
    expect(createInitialState({ startingLP: -100 }).startingLP).toBe(DEFAULT_STARTING_LP);
  });
});

describe("turn order", () => {
  it("gives the turn player to whoever is first on odd turns", () => {
    let state = createInitialState({ firstPlayer: 1 });
    expect(activePlayerOf(state)).toBe(1);
    state = apply(state, { type: "NEXT_TURN" });
    expect(activePlayerOf(state)).toBe(2);
    state = apply(state, { type: "NEXT_TURN" });
    expect(activePlayerOf(state)).toBe(1);
  });

  it("starts with player 2 when they are set to go first", () => {
    let state = createInitialState({ firstPlayer: 2 });
    expect(activePlayerOf(state)).toBe(2);
    state = apply(state, { type: "NEXT_TURN" });
    expect(activePlayerOf(state)).toBe(1);
  });

  it("handles otherPlayer for both sides", () => {
    expect(otherPlayer(1)).toBe(2);
    expect(otherPlayer(2)).toBe(1);
  });

  /**
   * The behaviour that motivated deriving the turn player: one player runs the
   * whole turn through all six phases, then the opponent starts again at Draw.
   */
  it("walks a full turn for player 1 then hands over to player 2 at Draw", () => {
    let state = createInitialState({ firstPlayer: 1 });

    const seen: Array<[string, number, PlayerId]> = [
      [state.currentPhase, state.currentTurn, activePlayerOf(state)],
    ];

    // Player 1's turn: five "next phase" presses reach the End Phase.
    for (let i = 0; i < 5; i += 1) {
      state = apply(state, { type: "NEXT_PHASE" });
      seen.push([state.currentPhase, state.currentTurn, activePlayerOf(state)]);
    }

    expect(seen).toEqual([
      ["draw", 1, 1],
      ["standby", 1, 1],
      ["main1", 1, 1],
      ["battle", 1, 1],
      ["main2", 1, 1],
      ["end", 1, 1],
    ]);

    // Sixth press leaves the End Phase: turn 2, Draw Phase, opponent's turn.
    state = apply(state, { type: "NEXT_PHASE" });
    expect(state.currentPhase).toBe("draw");
    expect(state.currentTurn).toBe(2);
    expect(activePlayerOf(state)).toBe(2);

    // Player 2 now runs their own full turn, still owning every phase.
    for (let i = 0; i < 5; i += 1) {
      state = apply(state, { type: "NEXT_PHASE" });
      expect(activePlayerOf(state)).toBe(2);
      expect(state.currentTurn).toBe(2);
    }
    expect(state.currentPhase).toBe("end");

    // And back to player 1.
    state = apply(state, { type: "NEXT_PHASE" });
    expect(state.currentTurn).toBe(3);
    expect(state.currentPhase).toBe("draw");
    expect(activePlayerOf(state)).toBe(1);
  });

  it("keeps the same turn player while stepping backwards within a turn", () => {
    let state = createInitialState();
    state = apply(state, { type: "NEXT_PHASE" }, { type: "NEXT_PHASE" });
    expect(activePlayerOf(state)).toBe(1);
    state = apply(state, { type: "PREVIOUS_PHASE" });
    expect(activePlayerOf(state)).toBe(1);
    expect(state.currentTurn).toBe(1);
  });

  it("returns to the previous turn's End Phase when rewinding out of Draw", () => {
    let state = createInitialState();
    state = apply(state, { type: "NEXT_PHASE" }, { type: "NEXT_PHASE" });
    state = apply(state, { type: "SET_PHASE", phase: "draw" });
    state = apply(state, { type: "PREVIOUS_PHASE" });
    expect(state.currentPhase).toBe("end");
    expect(state.currentTurn).toBe(1);
    expect(activePlayerOf(state)).toBe(1);
  });

  it("does not rewind below turn 1", () => {
    let state = createInitialState();
    state = apply(state, { type: "PREVIOUS_PHASE" });
    expect(state.currentTurn).toBe(1);
    expect(state.currentPhase).toBe("end");
    expect(activePlayerOf(state)).toBe(1);
  });

  it("PASS_TURN hands the turn to the opponent and resets to Draw", () => {
    let state = createInitialState();
    state = apply(state, { type: "NEXT_PHASE" }, { type: "NEXT_PHASE" }); // Main Phase 1
    expect(state.currentPhase).toBe("main1");

    state = apply(state, { type: "PASS_TURN" });
    expect(state.currentTurn).toBe(2);
    expect(state.currentPhase).toBe("draw");
    expect(activePlayerOf(state)).toBe(2);
  });

  it("SET_FIRST_PLAYER changes who owns turn 1 and logs it", () => {
    let state = createInitialState();
    state = apply(state, { type: "SET_FIRST_PLAYER", player: 2, at: T });
    expect(state.firstPlayer).toBe(2);
    expect(activePlayerOf(state)).toBe(2);
    expect(logText(state)[0]).toBe("Player 2 takes the first turn");
  });

  it("announces whose turn it is in the log on each rollover", () => {
    let state = createInitialState();
    state = apply(state, { type: "PASS_TURN", at: T });
    expect(logText(state)[0]).toBe("Turn 2 — Player 2's turn");
  });

  it("clamps the turn counter to 1..MAX_TURN", () => {
    let state = createInitialState();
    state = apply(state, { type: "PREVIOUS_TURN" });
    expect(state.currentTurn).toBe(1);

    let high = createInitialState();
    for (let i = 0; i < MAX_TURN + 5; i += 1) high = apply(high, { type: "NEXT_TURN" });
    expect(high.currentTurn).toBe(MAX_TURN);
  });

  it("uses player names in the turn announcement", () => {
    let state = createInitialState({ names: ["Kaiba", "Yugi"] });
    state = apply(state, { type: "PASS_TURN", at: T });
    expect(logText(state)[0]).toBe("Turn 2 — Yugi's turn");
  });
});

describe("life points", () => {
  it("adds and subtracts", () => {
    let state = createInitialState();
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: 1000, at: T });
    expect(lpsOf(state)[0]).toBe(9000);
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -500, at: T });
    expect(lpsOf(state)[0]).toBe(8500);
  });

  it("never goes below zero", () => {
    const state = apply(createInitialState(), {
      type: "ADJUST_LP",
      player: 1,
      delta: -99999,
      at: T,
    });
    expect(lpsOf(state)[0]).toBe(0);
  });

  it("ignores a zero delta", () => {
    const state = createInitialState();
    expect(apply(state, { type: "ADJUST_LP", player: 1, delta: 0 })).toBe(state);
  });

  it("ignores damage when already at zero", () => {
    const state = apply(createInitialState(), {
      type: "ADJUST_LP",
      player: 1,
      delta: -8000,
      at: T,
    });
    const after = apply(state, { type: "ADJUST_LP", player: 1, delta: -500, at: T });
    expect(after).toBe(state);
  });

  it("logs gains and losses with the resulting total", () => {
    let state = createInitialState({ names: ["Kaiba", "Yugi"] });
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -1500, at: T });
    expect(logText(state)[0]).toBe("Kaiba lost 1,500 LP  (6,500)");
    expect(state.log[0].kind).toBe("lp-down");

    state = apply(state, { type: "ADJUST_LP", player: 2, delta: 500, at: T });
    expect(logText(state)[0]).toBe("Yugi gained 500 LP  (8,500)");
    expect(state.log[0].kind).toBe("lp-up");
  });

  it("halves and doubles, rounding a half down", () => {
    let state = createInitialState();
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -1, at: T });
    expect(lpsOf(state)[0]).toBe(7999);
    state = apply(state, { type: "HALVE_LP", player: 1, at: T });
    expect(lpsOf(state)[0]).toBe(3999);
    state = apply(state, { type: "DOUBLE_LP", player: 1, at: T });
    expect(lpsOf(state)[0]).toBe(7998);
  });

  it("sets LP to an exact value", () => {
    const state = apply(createInitialState(), { type: "SET_LP", player: 2, value: 1234, at: T });
    expect(lpsOf(state)[1]).toBe(1234);
    expect(logText(state)[0]).toBe("Player 2's LP set to 1,234  (was 8,000)");
  });

  it("resets a single player to the starting LP", () => {
    let state = createInitialState({ startingLP: 4000 });
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -1000, at: T });
    state = apply(state, { type: "RESET_LP", player: 1, at: T });
    expect(lpsOf(state)[0]).toBe(4000);
  });

  it("only touches the targeted player", () => {
    const state = apply(createInitialState(), {
      type: "ADJUST_LP",
      player: 1,
      delta: -2000,
      at: T,
    });
    expect(lpsOf(state)).toEqual([6000, 8000]);
  });
});

describe("player names", () => {
  it("updates a name", () => {
    const state = apply(createInitialState(), {
      type: "SET_PLAYER_NAME",
      player: 1,
      name: "Kaiba",
    });
    expect(namesOf(state)).toEqual(["Kaiba", "Player 2"]);
  });

  it("truncates names to 16 characters", () => {
    const state = apply(createInitialState(), {
      type: "SET_PLAYER_NAME",
      player: 1,
      name: "a".repeat(40),
    });
    expect(namesOf(state)[0]).toHaveLength(16);
  });

  it("does not write a log entry for a rename", () => {
    const state = apply(createInitialState(), {
      type: "SET_PLAYER_NAME",
      player: 1,
      name: "Kaiba",
    });
    expect(state.log).toHaveLength(0);
  });
});

describe("match mode", () => {
  it("records a win and starts the next duel", () => {
    let state = createInitialState();
    state = apply(state, { type: "ADJUST_LP", player: 2, delta: -7000, at: T });
    state = apply(state, { type: "AWARD_WIN", player: 1, at: T });

    expect(state.match.wins).toEqual([1, 0]);
    expect(state.match.duel).toBe(2);
    // Board resets for the next duel.
    expect(lpsOf(state)).toEqual([DEFAULT_STARTING_LP, DEFAULT_STARTING_LP]);
    expect(state.currentTurn).toBe(1);
    expect(state.currentPhase).toBe("draw");
    expect(activePlayerOf(state)).toBe(state.firstPlayer);
  });

  it("logs the win and the new duel", () => {
    const state = apply(createInitialState({ names: ["Kaiba", "Yugi"] }), {
      type: "AWARD_WIN",
      player: 2,
      at: T,
    });
    expect(logText(state)[0]).toBe("New duel started — 8,000 LP each");
    expect(logText(state)[1]).toBe("★ Yugi wins Duel 1  (match 0–1)");
  });

  it("accumulates wins across duels", () => {
    let state = createInitialState();
    state = apply(state, { type: "AWARD_WIN", player: 1, at: T });
    state = apply(state, { type: "AWARD_WIN", player: 1, at: T });
    state = apply(state, { type: "AWARD_WIN", player: 2, at: T });
    expect(state.match.wins).toEqual([2, 1]);
    expect(state.match.duel).toBe(4);
  });

  it("keeps the log across duels", () => {
    let state = createInitialState();
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -1000, at: T });
    state = apply(state, { type: "AWARD_WIN", player: 1, at: T });
    expect(logText(state).some((t) => t.includes("lost 1,000 LP"))).toBe(true);
  });
});

describe("reset duel", () => {
  it("restores LP, turn, phase and clears the log", () => {
    let state = createInitialState();
    state = apply(
      state,
      { type: "ADJUST_LP", player: 1, delta: -3000, at: T },
      { type: "NEXT_TURN", at: T },
      { type: "NEXT_PHASE", at: T },
    );
    state = apply(state, { type: "RESET_DUEL", at: T });

    expect(lpsOf(state)).toEqual([DEFAULT_STARTING_LP, DEFAULT_STARTING_LP]);
    expect(state.currentTurn).toBe(1);
    expect(state.currentPhase).toBe("draw");
    expect(logText(state)).toEqual(["Duel reset — 8,000 LP each"]);
  });

  it("applies a new starting LP", () => {
    const state = apply(createInitialState(), { type: "RESET_DUEL", startingLP: 4000, at: T });
    expect(state.startingLP).toBe(4000);
    expect(lpsOf(state)).toEqual([4000, 4000]);
    expect(logText(state)[0]).toBe("Duel reset — 4,000 LP each");
  });

  it("clears the match score and returns to duel 1", () => {
    let state = createInitialState();
    state = apply(state, { type: "AWARD_WIN", player: 1, at: T });
    state = apply(state, { type: "AWARD_WIN", player: 2, at: T });
    expect(state.match.duel).toBe(3);

    state = apply(state, { type: "RESET_DUEL", at: T });
    expect(state.match.wins).toEqual([0, 0]);
    expect(state.match.duel).toBe(1);
  });

  it("keeps the player names", () => {
    let state = createInitialState({ names: ["Kaiba", "Yugi"] });
    state = apply(state, { type: "RESET_DUEL", at: T });
    expect(namesOf(state)).toEqual(["Kaiba", "Yugi"]);
  });

  it("rejects a nonsense starting LP", () => {
    const state = apply(createInitialState(), { type: "RESET_DUEL", startingLP: -5, at: T });
    expect(state.startingLP).toBe(DEFAULT_STARTING_LP);
  });
});

describe("log", () => {
  it("keeps the newest entry first", () => {
    let state = createInitialState();
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -100, at: T });
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -200, at: T });
    expect(logText(state)[0]).toContain("200");
    expect(logText(state)[1]).toContain("100");
  });

  it("records dice rolls and coin flips", () => {
    let state = createInitialState();
    state = apply(state, { type: "LOG_ROLL", sides: 20, value: 17, at: T });
    expect(logText(state)[0]).toBe("Rolled D20: 17");
    expect(state.log[0].kind).toBe("roll");

    state = apply(state, { type: "LOG_COIN_FLIP", result: "tails", at: T });
    expect(logText(state)[0]).toBe("Coin flip: TAILS");
    expect(state.log[0].kind).toBe("flip");
  });

  it("clears on request", () => {
    let state = createInitialState();
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -100, at: T });
    state = apply(state, { type: "CLEAR_LOG" });
    expect(state.log).toEqual([]);
  });

  it("is capped at LOG_LIMIT entries", () => {
    let state = createInitialState();
    for (let i = 0; i < LOG_LIMIT + 50; i += 1) {
      state = apply(state, { type: "ADJUST_LP", player: 1, delta: -1, at: T });
    }
    expect(state.log).toHaveLength(LOG_LIMIT);
  });

  it("gives every entry a unique id", () => {
    let state = createInitialState();
    for (let i = 0; i < 20; i += 1) {
      state = apply(state, { type: "ADJUST_LP", player: 1, delta: -1, at: T });
    }
    const ids = new Set(state.log.map((entry) => entry.id));
    expect(ids.size).toBe(state.log.length);
  });

  it("does not mutate the previous state", () => {
    const before = createInitialState();
    const snapshot = JSON.stringify(before);
    apply(before, { type: "ADJUST_LP", player: 1, delta: -100, at: T });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("sanitizeState", () => {
  it("falls back to defaults for non-objects", () => {
    expect(sanitizeState(null).currentTurn).toBe(1);
    expect(sanitizeState("nope").players[0].lp).toBe(DEFAULT_STARTING_LP);
    expect(sanitizeState(42).log).toEqual([]);
  });

  it("repairs junk field values", () => {
    const state = sanitizeState({
      players: [{ name: "", lp: "abc" }, { name: 99, lp: null }],
      startingLP: "x",
      currentTurn: -12,
      currentPhase: "not-a-phase",
      firstPlayer: 9,
      match: { duel: -4, wins: "no" },
      log: "not-an-array",
    });
    expect(namesOf(state)).toEqual(["Player 1", "Player 2"]);
    expect(lpsOf(state)).toEqual([0, 0]);
    expect(state.startingLP).toBe(DEFAULT_STARTING_LP);
    expect(state.currentTurn).toBe(1);
    expect(state.currentPhase).toBe("draw");
    expect(state.firstPlayer).toBe(1);
    expect(state.match.duel).toBe(1);
    expect(state.match.wins).toEqual([0, 0]);
    expect(state.log).toEqual([]);
  });

  it("clamps out-of-range numbers instead of rejecting them", () => {
    const state = sanitizeState({ currentTurn: 99999, currentPhase: "battle" });
    expect(state.currentTurn).toBe(MAX_TURN);
    expect(state.currentPhase).toBe("battle");
  });

  it("keeps valid values", () => {
    const state = sanitizeState({
      players: [{ name: "Kaiba", lp: 6500 }, { name: "Yugi", lp: 8500 }],
      startingLP: 8000,
      currentTurn: 7,
      currentPhase: "main2",
      firstPlayer: 2,
      match: { duel: 3, wins: [2, 1] },
      log: [],
    });
    expect(namesOf(state)).toEqual(["Kaiba", "Yugi"]);
    expect(lpsOf(state)).toEqual([6500, 8500]);
    expect(state.currentTurn).toBe(7);
    expect(state.currentPhase).toBe("main2");
    // Turn 7 is odd, so whoever was set to go first owns it.
    expect(activePlayerOf(state)).toBe(2);
  });

  it("migrates the legacy activePlayer field to firstPlayer", () => {
    // Old saves stored a manually toggled activePlayer. On an even turn, the
    // active player must have been the one who did not start.
    const legacy = sanitizeState({ currentTurn: 4, activePlayer: 2 });
    expect(legacy.firstPlayer).toBe(1);
    expect(activePlayerOf(legacy)).toBe(2);

    const legacyOdd = sanitizeState({ currentTurn: 5, activePlayer: 2 });
    expect(legacyOdd.firstPlayer).toBe(2);
    expect(activePlayerOf(legacyOdd)).toBe(2);
  });
});

describe("phase helpers", () => {
  it("exposes all six phases in order", () => {
    expect(PHASES).toEqual(["draw", "standby", "main1", "battle", "main2", "end"]);
  });

  it("has a label for every phase", () => {
    for (const phase of PHASES) {
      expect(PHASE_LABELS[phase]).toBeTruthy();
    }
  });
});

describe("buildLogExport", () => {
  it("includes a header and the log in chronological order", () => {
    let state = createInitialState({ names: ["Kaiba", "Yugi"] });
    state = apply(state, { type: "ADJUST_LP", player: 1, delta: -1000, at: T });
    state = apply(state, { type: "ADJUST_LP", player: 2, delta: 500, at: T });

    const text = buildLogExport(state, new Date(T));
    expect(text).toContain("DUEL LOG");
    expect(text).toContain("Kaiba 0 – 0 Yugi");
    expect(text).toContain("Turn player: Kaiba");

    const first = text.indexOf("lost 1,000 LP");
    const second = text.indexOf("gained 500 LP");
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
  });
});
