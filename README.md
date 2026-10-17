# Duel Terminal — Yu-Gi-Oh! Duel Tracker

A life point, turn and phase tracker for Yu-Gi-Oh! duels. Built for tournament
play on a phone, with a per-phase rules reference so newer players always know
what they are allowed to do.

No backend, no database, no accounts. All state lives in `localStorage`.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Production

```bash
npm run build
npm start
```

### All scripts

| Script               | What it does                           |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Development server with hot reload     |
| `npm run build`      | Optimised production build             |
| `npm start`          | Serve the production build             |
| `npm run lint`       | ESLint (Next.js + React hooks rules)   |
| `npm run typecheck`  | `tsc --noEmit` in strict mode          |
| `npm test`           | Unit tests for the duel logic (Vitest) |
| `npm run test:watch` | Unit tests in watch mode               |
| `npm run verify`     | typecheck + lint + test in one go      |

**Requirements:** Node.js 20.9 or newer (developed on Node 26).

---

## Features

**Life points** — 8,000 each by default, editable before a duel starts. Quick
±100/±500/±1000 buttons, a custom amount field with Add/Sub, plus half, double,
set and reset. The number animates, the panel flashes green or red, and a
floating delta appears, because during a real duel you are looking at the table
rather than the screen.

**Turn and phases** — a turn belongs to one player from the Draw Phase through
the End Phase, then passes to the opponent. The tracker enforces that: advancing
past the End Phase increments the turn, hands the turn to the other player and
returns to the Draw Phase. You choose who takes turn 1 (the coin toss), and
"Pass turn" ends your turn early.

**Phase reference** — the current phase's legal actions stay visible at all
times, and every phase is documented in the side panel. Rules are sourced from
the official Yu-Gi-Oh! TRADING CARD GAME rulebooks (v8/v9/v10).

**Duel log** — every action is timestamped, colour-coded by kind, and exportable
as a plain-text file. The log is not always needed, so the side panel toggles
between the phase reference and the log — and the current phase's actions remain
visible either way.

**Match mode** — tracks which duel of the match is in progress and each player's
win count. Awarding a win closes the duel and resets the board for the next one.

**Utilities** — coin flip with a real 3D flip, and D6/D20 dice. Both log their
results.

**Keyboard shortcuts** — `Space` / `→` next phase, `←` previous phase,
`↑` / `↓` next / previous turn. Shortcuts are ignored while typing in a field,
while a button has focus, and while the reset dialog is open.

**Persistence** — LP, names, turn, phase, turn order, match score and the log are
saved automatically and restored on reload. Corrupt or hand-edited storage is
repaired field by field rather than crashing the app.

---

## Project structure

```
src/
├── app/
│   ├── globals.css          # Design tokens (@theme) + keyframes
│   ├── layout.tsx           # Fonts, metadata, viewport
│   └── page.tsx             # Thin shell around the provider
├── components/
│   ├── duel/                # Feature components
│   │   ├── DuelBoard.tsx           # Top-level composition + shortcuts
│   │   ├── LifePointPanel.tsx      # One player's LP console
│   │   ├── TurnTracker.tsx         # Turn counter + step controls
│   │   ├── PhaseTracker.tsx        # Phase readout + jump rail
│   │   ├── TurnPlayerIndicator.tsx # Whose turn, pass turn, turn order
│   │   ├── MatchTracker.tsx        # Duel number and win counts
│   │   ├── SidePanel.tsx           # Tabs: phase reference | duel log
│   │   ├── CurrentPhaseCard.tsx    # Always-visible "what can I do now?"
│   │   ├── PhaseReference.tsx      # All phases + general tips
│   │   ├── DuelLog.tsx             # Log list, export, clear
│   │   ├── CoinFlip.tsx
│   │   ├── DiceRoller.tsx
│   │   └── ResetDialog.tsx
│   ├── providers/
│   │   ├── DuelProvider.tsx # Reducer + localStorage persistence
│   │   └── duel-context.ts  # Context object (separate for fast refresh)
│   └── ui/                  # shadcn/ui-style primitives
│       ├── button.tsx, card.tsx, dialog.tsx, input.tsx
│       └── segmented-control.tsx
├── hooks/
│   ├── useDuel.ts                  # Context consumer
│   ├── useTweenedNumber.ts         # Animated LP readout
│   ├── useKeyboardShortcuts.ts     # Global phase/turn keys
│   └── usePersistentPreference.ts  # UI prefs + media queries
├── lib/
│   ├── duel.ts              # Pure reducer, selectors, export (unit-tested)
│   ├── duel.test.ts         # 51 Vitest cases
│   ├── phase-guide.ts       # Per-phase rules content
│   ├── format.ts            # Number and time formatting
│   ├── storage.ts           # Safe localStorage access
│   └── utils.ts             # cn()
└── types/
    └── duel.ts              # Domain types and phase constants
```

---

## Architecture notes

**The reducer is the single source of truth.** All duel logic lives in
`src/lib/duel.ts` as a pure function `(state, action) => state`. Components only
dispatch; they never compute LP totals or phase transitions themselves. That is
what makes the logic directly unit-testable without a DOM, and what keeps the
buttons, the keyboard shortcuts and the log from drifting apart.

**The turn player is derived, not stored.** `activePlayerOf(state)` returns
`firstPlayer` on odd turns and the opponent on even ones. An earlier version
stored the active player as its own field, which allowed it to disagree with the
turn counter — the turn player stayed on the same side after the turn rolled
over. Deriving it makes that impossible.

**Timestamps are injectable.** Log-producing actions accept an optional `at`, so
tests are deterministic instead of depending on the wall clock.

**Hydration is deliberate.** The reducer starts from a fresh duel on both the
server and the client's first render, so the HTML matches. Persisted state is
merged in from an effect after mount. Reading `localStorage` during the first
render would cause a hydration mismatch.

**Animation never blocks the truth.** `useTweenedNumber` animates towards the
target with `requestAnimationFrame` but also arms a watchdog timer, because
`requestAnimationFrame` is suspended in background tabs and throttled in some
webviews — without it the LP readout would freeze at a stale value.
`prefers-reduced-motion` skips the animation entirely.

---

## Accessibility

- Every control is a real `<button>` / `<input>` with an accessible name; LP
  buttons announce the player and amount ("Add 500 life points to Kaiba").
- LP changes are announced through a polite live region that updates on state
  change only, never on animation frames.
- The side panel toggle is a proper ARIA tab list with roving tabindex and
  arrow-key navigation.
- Phase jump chips use `aria-current="step"`; the accordion uses
  `aria-expanded` / `aria-controls`.
- The reset dialog is Radix-based, so focus trapping, focus restore and Escape
  to close come for free.
- Visible focus rings throughout, and a global `prefers-reduced-motion` reset.

---

## Testing

```bash
npm test
```

51 cases covering LP arithmetic and clamping, phase ordering and the
End-Phase-to-Draw rollover, turn-player alternation across a full turn, match
scoring, reset semantics, log ordering and capping, corrupt-storage repair
(including migration of the older saved format), and log export.

---

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui-style components on Radix primitives · Vitest.

---

## Deployment

The app is fully static — `next build` prerenders `/` and everything runs
client-side. Any static or Node host works; on Vercel, import the repository and
deploy with no configuration.
