/**
 * Beginner reference for what is legal in each phase.
 *
 * Sourced from the official Yu-Gi-Oh! TRADING CARD GAME rulebooks
 * (v8/v9/v10). Kept as plain data so the UI can render it and it stays easy
 * to correct without touching components.
 */

import { PHASES, type Phase } from "@/types/duel";

export interface PhaseGuide {
  phase: Phase;
  /** One-line summary of what the phase is for. */
  summary: string;
  /** Things the turn player is allowed to do. */
  actions: string[];
  /** Common beginner mistakes / hard restrictions. */
  warnings: string[];
}

export const PHASE_GUIDES: Record<Phase, PhaseGuide> = {
  draw: {
    phase: "draw",
    summary: "The turn player draws 1 card. Nothing else is required.",
    actions: [
      "Draw 1 card from the top of your Deck \u2014 only the turn player draws.",
      "Resolve any \u201cwhen you draw\u201d trigger effects.",
      "Trap Cards and Quick-Play Spell Cards may be activated before moving on.",
    ],
    warnings: [
      "The player who goes first does NOT draw during the Draw Phase of their first turn.",
      "If your Deck is empty and you cannot draw, you lose the Duel.",
    ],
  },
  standby: {
    phase: "standby",
    summary: "Maintenance costs and \u201cduring the Standby Phase\u201d effects resolve here.",
    actions: [
      "Resolve effects and pay costs that say \u201cduring the Standby Phase\u201d.",
      "Trap Cards and Quick-Play Spell Cards may still be activated.",
    ],
    warnings: [
      "No Normal Summon, no Set, and no changing battle positions in this phase.",
      "No attacks \u2014 the Battle Phase comes later.",
    ],
  },
  main1: {
    phase: "main1",
    summary: "Your main action phase \u2014 where most of a turn happens.",
    actions: [
      "Normal Summon OR Set 1 monster (once per turn, in total across both Main Phases).",
      "Tribute Summon: Level 5\u20136 needs 1 Tribute, Level 7 or higher needs 2.",
      "Special Summon as many times as your cards allow.",
      "Flip Summon a face-down monster to face-up Attack Position.",
      "Change the battle position of each monster once per turn.",
      "Activate and Set Spell & Trap Cards, and activate monster effects.",
    ],
    warnings: [
      "You may only Normal Summon OR Set once per turn \u2014 not one of each.",
      "A monster that was played onto the field this turn cannot change its battle position.",
    ],
  },
  battle: {
    phase: "battle",
    summary: "Declare attacks with your monsters. Entering this phase is optional.",
    actions: [
      "Run the steps in order: Start Step \u2192 Battle Step \u2192 Damage Step \u2192 End Step.",
      "Each monster may attack once per turn, unless its effect says otherwise.",
      "Choose which monsters attack \u2014 attacking with all of them is not required.",
      "Counter Traps, or cards that directly change ATK/DEF, may be activated in the Damage Step.",
    ],
    warnings: [
      "The player who goes first cannot conduct a Battle Phase on their first turn.",
      "You cannot attack on the turn a monster is Summoned, unless it has an effect that allows it.",
      "Only cards that directly change ATK/DEF or Counter Traps can be activated during the Damage Step.",
    ],
  },
  main2: {
    phase: "main2",
    summary: "A second Main Phase, available only after your Battle Phase.",
    actions: [
      "Same actions as Main Phase 1 \u2014 activate, Set, and Special Summon.",
      "Normal Summon or Set here if you have not done so yet this turn.",
      "A good place to Set Traps and leave monsters in Defence for the opponent's turn.",
    ],
    warnings: [
      "No further attacks once you have left the Battle Phase.",
      "A monster that attacked this turn cannot change its battle position here.",
    ],
  },
  end: {
    phase: "end",
    summary: "Effects resolve, you discard down to the hand limit, and the turn passes.",
    actions: [
      "Resolve every \u201cduring the End Phase\u201d effect, in turn-player order.",
      "Trap Cards and Quick-Play Spell Cards may still be activated.",
      "Hand size limit: discard down to 6 cards in hand.",
    ],
    warnings: [
      "\u201cUntil the End Phase\u201d effects wear off here \u2014 read the wording carefully.",
      "The hand-size discard happens last, after effects have resolved.",
    ],
  },
};

/** Short, always-visible reminders for newer players. */
export const GENERAL_TIPS: string[] = [
  "Zones: 5 Monster, 5 Spell & Trap, 1 Field Spell (it does not count toward the 5), and 2 Extra Monster Zones.",
  "Normal Spells can only be activated during your own Main Phases.",
  "Quick-Play Spells can be activated during any phase of your own turn. On your opponent's turn only if you Set them first \u2014 and not the turn they were Set.",
  "Special Summon and Flip Summon have no per-turn limit. Normal Summon or Set is once per turn.",
  "When advancing past the End Phase, the tracker starts the next turn at the Draw Phase.",
];

export const PHASE_ORDER = PHASES;
