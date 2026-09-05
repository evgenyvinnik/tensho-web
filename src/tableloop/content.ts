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
 * Named descriptively first, as the document asks. Traditional names belong in
 * the detail panel, not in the rule, because these are Tensho bonuses rather
 * than claims about Riichi scoring.
 */
export const MILESTONES: readonly MilestoneDefinition[] = [
  {
    id: 'twin_sequence',
    name: 'Twin Sequence',
    description: 'Two identical sequences stand together on the table.',
    points: 80,
    mult: 0.5,
  },
  {
    id: 'pure_suit',
    name: 'Pure Suit',
    description: 'Two or more groups, every one of them in the same suit.',
    points: 60,
    mult: 0.4,
  },
  {
    id: 'three_suit_sequence',
    name: 'Three-Suit Sequence',
    description: 'The same run of three ranks, once in every suit.',
    points: 150,
    mult: 1,
  },
  {
    id: 'dragon_duet',
    name: 'Dragon Duet',
    description: 'Two different Dragons hold the table.',
    points: 90,
    mult: 0.6,
  },
  {
    id: 'dragon_court',
    name: 'Dragon Court',
    description: 'All three Dragons answer one another.',
    points: 200,
    mult: 1.5,
  },
  {
    id: 'four_sequences',
    name: 'Four Sequences',
    description: 'Every meld slot holds a sequence, and the pair is placed.',
    points: 180,
    mult: 1,
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
    description: 'The pair scores +30 for every meld already on the table.',
    isStarter: true,
    cost: 10,
  },
  {
    id: 'dragon_lantern',
    name: 'Dragon Lantern',
    description:
      'A Dragon group lights its slot. Every later group placed beside a lit slot gains +0.5 Mult.',
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
