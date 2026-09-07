/**
 * Table Loop — content definitions.
 *
 * Every number here is a playtest starting point, not a balanced value. The
 * experiments document is explicit that targets and rewards must be retuned
 * once people play the loop; keeping them in one file makes that cheap.
 *
 * @module tableloop/content
 */

import type {
  MilestoneDefinition,
  MilestoneId,
  TableDecreeDefinition,
  TableDecreeId,
  TableRoundDefinition,
} from './types'

// =============================================================================
// MILESTONES (E02)
// =============================================================================

/**
 * Patterns that pay before the table is complete.
 *
 * Open question 2 asks whether these should pay fixed points, an additive
 * multiplier, a multiplicative bonus, or a small combination.
 * `scripts/tableloop-attribution.mts` walks the causal chain and adds up who
 * paid: multiplication accounted for 9.4% of all score, against 59.9% for group
 * base and 13.2% for these rewards. In a four-placement round a multiplier
 * earned midway has almost nothing left to multiply.
 *
 * So the points are the income, and the multiplier is not — its real job is to
 * be what a pattern costs to break, the commitment that stopped a slot being
 * re-scored indefinitely. Sized for that job rather than for income, it is
 * double what it was: breaking Pure Suit now actually hurts, while measured
 * clear rates are unchanged at 82/57/50%.
 *
 * Named descriptively first, as the document asks. Traditional names belong in
 * the detail panel, not in the rule, because these are Tensho bonuses rather
 * than claims about Riichi scoring.
 *
 * `points` are paid once, the first time the table shows the pattern. `mult` is
 * carried only while the pattern is still standing, so breaking it — by
 * revising one of its groups, or by placing something that ends it — gives the
 * multiplier back. Section 10 asked whether revision should be universal;
 * measuring it found a policy spending half its actions revising because doing
 * so cost nothing but the action.
 */
export const MILESTONES: readonly MilestoneDefinition[] = [
  {
    id: 'twin_sequence',
    name: 'Twin Sequence',
    description: 'Two identical sequences stand together on the table.',
    points: 80,
    mult: 1.0,
  },
  {
    id: 'pure_suit',
    name: 'Pure Suit',
    description: 'Two or more groups, every one of them in the same suit.',
    points: 60,
    mult: 0.8,
  },
  {
    id: 'three_suit_sequence',
    name: 'Three-Suit Sequence',
    description: 'The same run of three ranks, once in every suit.',
    points: 150,
    mult: 2,
  },
  {
    id: 'dragon_duet',
    name: 'Dragon Duet',
    description: 'Two different Dragons hold the table.',
    points: 180,
    mult: 1.2,
  },
  {
    id: 'dragon_court',
    name: 'Dragon Court',
    description: 'All three Dragons answer one another.',
    points: 200,
    mult: 3.0,
  },
  {
    id: 'four_sequences',
    name: 'Four Sequences',
    description: 'Every meld slot holds a sequence, and the pair is placed.',
    points: 90,
    mult: 2,
  },
]

const MILESTONES_BY_ID = new Map<MilestoneId, MilestoneDefinition>(
  MILESTONES.map((milestone) => [milestone.id, milestone])
)

export function getMilestone(id: MilestoneId): MilestoneDefinition {
  const definition = MILESTONES_BY_ID.get(id)
  if (!definition) throw new Error(`Unknown milestone: ${id}`)
  return definition
}

/** Paid once, the first time all four melds and the pair are on the table. */
export const TABLE_COMPLETION_POINTS = 250

// =============================================================================
// DECREES (E03 / E04)
// =============================================================================

/**
 * Eight effects that interact with one another and with the milestones.
 *
 * Three are starters, so the opening choice answers "which tiles do I want
 * now, and why?" rather than describing an exception to a rule the player has
 * not met yet. The other five stock the shop, and every one of them changes
 * which draw the player hopes for.
 */
export const TABLE_DECREES: readonly TableDecreeDefinition[] = [
  {
    id: 'echoing_bamboo',
    name: 'Echoing Bamboo',
    description: 'A Bamboo sequence scores twice when you place it.',
    isStarter: true,
    cost: 10,
  },
  {
    id: 'patient_pair',
    name: 'Patient Pair',
    // Measured at 45% of runs finished against 22% and 11%, and trimmed for
    // it — then measured again once revisions stopped paying full price. Most
    // of its lead had been the pair slot being re-scored over and over, so the
    // trim was undoing an exploit rather than a Decree. Restored.
    description: 'The pair scores +30 for every meld already on the table.',
    isStarter: true,
    cost: 10,
  },
  {
    id: 'watch_fire',
    name: 'Watch Fire',
    // Began as the document's Dragon Lantern, a pure neighbour bonus, and was
    // measured four times. Dragon groups fired in 25% of runs — the wall
    // offered sixteen across three hundred. Doubling the reward moved it one
    // point; widening the trigger to Honor groups reached 12%; widening it to
    // any set reached 10%. A policy that deliberately set up adjacency did
    // worse still, and so did every other Decree under it. The finding is
    // structural: with five slots and about four placements a round, there are
    // not enough placements left after a setup for adjacency alone to pay.
    //
    // So the adjacency is upside on a base that always does something. Sets are
    // common, which makes this the third legible build beside Bamboo runs and
    // pair timing, and the slot still lights, so where you put it still matters.
    description:
      'A triplet or quad scores +0.5 Mult and lights its slot. A group beside a lit slot gains +0.5 Mult.',
    isStarter: true,
    cost: 10,
  },
  {
    id: 'twin_flame',
    name: 'Twin Flame',
    description: 'Milestone rewards pay double points.',
    isStarter: false,
    cost: 12,
  },
  {
    id: 'river_merchant',
    name: 'Whispering Merchant',
    description:
      'Once per round, take one tile back out of the river into your rack.',
    isStarter: false,
    cost: 8,
  },
  {
    id: 'jade_ledger',
    name: 'Jade Ledger',
    description: 'Earn ¥2 for every group you place. Start each round with one fewer redraw.',
    isStarter: false,
    cost: 7,
  },
  {
    id: 'honor_court',
    name: 'Honor Court',
    description: 'Groups of Winds or Dragons gain +0.3 Mult for each of their tiles.',
    isStarter: false,
    cost: 12,
  },
  {
    id: 'wide_rack',
    name: 'Wide Rack',
    // The pool was eight passive score modifiers. Measured, owning one barely
    // changed what a player placed: 17.5% Bamboo runs with Echoing Bamboo
    // against 17.0% with an unrelated Decree. E04 asks a purchase to change
    // the next draw you want, and principle 3 prefers an effect that changes
    // what you keep or place over another percentage. These last two do that.
    description: 'Hold two more tiles in your rack.',
    isStarter: false,
    cost: 12,
  },
  {
    id: 'gap_bridge',
    name: 'Gap Bridge',
    description:
      'Once a round, a run may skip one rank: 3·5·7 counts as a sequence.',
    isStarter: false,
    cost: 11,
  },
  {
    id: 'terminal_gate',
    name: 'Terminal Gate',
    description: 'A group containing a 1 or a 9 scores +40.',
    isStarter: false,
    cost: 9,
  },
]

const DECREES_BY_ID = new Map<TableDecreeId, TableDecreeDefinition>(
  TABLE_DECREES.map((decree) => [decree.id, decree])
)

export function getTableDecree(id: TableDecreeId): TableDecreeDefinition {
  const definition = DECREES_BY_ID.get(id)
  if (!definition) throw new Error(`Unknown table decree: ${id}`)
  return definition
}

export const STARTER_DECREE_IDS: readonly TableDecreeId[] = TABLE_DECREES.filter(
  (decree) => decree.isStarter
).map((decree) => decree.id)

// =============================================================================
// ROUNDS
// =============================================================================

/**
 * Three short rounds: two ordinary and one gentle, telegraphed boss.
 *
 * Frost Magistrate halves Honor tile points. It asks an Honor build to lean on
 * structure and milestones for one round instead of deleting it, and it is
 * announced before the round starts.
 */
/**
 * Targets come from `scripts/tableloop-sim.mts`, not from the classic curve.
 * A greedy policy that never revises and never plans a milestone clears them
 * about 82% / 55% / 44% of the time, and clears round one without finishing
 * the table in roughly a third of its runs — so intermediate placements matter
 * on their own, and the boss is a real test rather than a coin flip.
 */
export const TABLE_ROUNDS: readonly TableRoundDefinition[] = [
  {
    index: 0,
    name: 'First Light',
    target: 200,
    placementActions: 6,
    redraws: 3,
    bossRule: null,
    reward: 10,
  },
  {
    index: 1,
    name: 'Rising Court',
    target: 300,
    placementActions: 6,
    redraws: 3,
    bossRule: null,
    reward: 12,
  },
  {
    index: 2,
    name: 'Frost Magistrate',
    target: 380,
    placementActions: 6,
    redraws: 3,
    bossRule: 'frost_magistrate',
    reward: 15,
  },
]

/**
 * Tiles held in the rack while the wall lasts.
 *
 * Open question 1 of the experiments document asks whether eight or ten tiles
 * make the clearest choices. `scripts/tableloop-sim.mts` says both are too dry
 * for a table that needs four melds: at ten the greedy policy manages 3.6
 * placements out of six actions and finishes the table a quarter of the time,
 * which is the "too rare to plan around" failure the document warns about. At
 * fourteen the table finishes 72% of the time and placement stops being a
 * decision. Twelve sits between them.
 */
export const RACK_SIZE = 12

/** Most rack tiles a single redraw may exchange. */
export const MAX_REDRAW_TILES = 3

/** Face-up offers in the draft row when that variant is on (E06). */
export const DRAFT_ROW_SIZE = 3
