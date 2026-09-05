/**
 * Table Loop — the authored practice deal.
 *
 * Section 7 of `docs/GAMEPLAY_EXPERIMENTS.md` asks the first session to run in
 * a specific order: a short deal with an obvious sequence and an alternative
 * pair, the chosen group left visible while the rack refills, an opportunity
 * for the next group to interact with the first, the interaction resolved and
 * named *after* the player has seen it, and then one upgrade whose relevance is
 * easy to understand.
 *
 * Section 3 sanctions an authored deal for exactly this, "when clearly
 * presented as practice", which is why the interface labels it.
 *
 * @module tableloop/practice
 */

import { Tile, TileSuit, WindType, DragonType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import type { TableDecreeId, TableLoopState } from './types'

/** The Decree the practice deal ends by offering. */
export const PRACTICE_DECREE: TableDecreeId = 'echoing_bamboo'

let practiceCounter = 0
const tile = (suit: TileSuit, rank: number) =>
  new Tile(suit, rank, `practice-${practiceCounter++}`)

/**
 * The authored wall, in draw order.
 *
 * The first twelve tiles are the opening rack and hold exactly two groups: an
 * obvious Bamboo run and a pair of terminals. Nothing else in them combines, so
 * the first decision is legible.
 *
 * The tiles behind them guarantee a second Bamboo 3·4·5 whichever group the
 * player commits first, so the interaction the guide promises always arrives.
 */
export function createPracticeCollection(): Tile[] {
  practiceCounter = 0
  return [
    // Opening rack: one run, one pair, and nine tiles that form nothing.
    tile(TileSuit.Souzu, 3),
    tile(TileSuit.Souzu, 4),
    tile(TileSuit.Souzu, 5),
    tile(TileSuit.Pinzu, 9),
    tile(TileSuit.Pinzu, 9),
    tile(TileSuit.Manzu, 2),
    tile(TileSuit.Manzu, 5),
    tile(TileSuit.Manzu, 8),
    tile(TileSuit.Pinzu, 2),
    tile(TileSuit.Pinzu, 5),
    tile(TileSuit.Souzu, 8),
    tile(TileSuit.Wind, WindType.East),

    // The answer to the first group, however the player got there.
    tile(TileSuit.Souzu, 3),
    tile(TileSuit.Souzu, 4),
    tile(TileSuit.Souzu, 5),
    tile(TileSuit.Souzu, 3),
    tile(TileSuit.Souzu, 4),
    tile(TileSuit.Souzu, 5),

    // Enough behind it that an exchange or two never strands the deal.
    tile(TileSuit.Dragon, DragonType.Green),
    tile(TileSuit.Dragon, DragonType.Green),
    tile(TileSuit.Dragon, DragonType.Green),
    tile(TileSuit.Manzu, 1),
    tile(TileSuit.Manzu, 1),
    tile(TileSuit.Pinzu, 6),
    tile(TileSuit.Pinzu, 7),
    tile(TileSuit.Pinzu, 8),
    tile(TileSuit.Manzu, 4),
    tile(TileSuit.Manzu, 6),
    tile(TileSuit.Souzu, 1),
    tile(TileSuit.Wind, WindType.South),
  ]
}

// =============================================================================
// GUIDE STEPS
// =============================================================================

export type PracticeStepId =
  | 'choose'
  | 'interact'
  | 'upgrade'
  | 'ready'
  | 'done'

export interface PracticeStep {
  readonly id: PracticeStepId
  /** English fallback; the UI prefers `tableLoop.practice.<id>.*`. */
  readonly title: string
  readonly body: string
}

const STEPS: Record<Exclude<PracticeStepId, 'done'>, PracticeStep> = {
  choose: {
    id: 'choose',
    title: 'Two moves, and they are not the same move',
    body: 'Your rack holds one run of Bamboo and one pair of nines. A run goes in a meld slot, a pair only fits the pair slot. Tap a group, then tap the slot it lights up — the forecast on the slot is exactly what it will pay.',
  },
  interact: {
    id: 'interact',
    title: 'Your groups can answer each other',
    body: 'That group stays on the table for the rest of the round. Look for a second run just like the first one: two identical runs standing together are worth more than either of them alone.',
  },
  upgrade: {
    id: 'upgrade',
    title: 'That was a Twin Sequence',
    body: 'It paid once, and it raised the multiplier for everything you place afterwards. Echoing Bamboo suits a table built this way: a Bamboo run scores twice the moment you place it.',
  },
  ready: {
    id: 'ready',
    title: 'That is the whole loop',
    body: 'Place groups, watch them answer each other, and spend what you earn on Decrees that suit the table you are building. The practice deal was authored; a real run is dealt from a shuffled wall.',
  },
}

/**
 * Where the practice deal has got to, derived from the run state alone.
 *
 * Deriving it means the guide cannot disagree with the table: it advances
 * because the player did the thing, not because a counter was incremented.
 */
export function practiceStep(state: TableLoopState): PracticeStep | null {
  if (!state.practice) return null

  const hasPlaced = state.slots.some((slot) => slot.group !== null)
  const hasTwin = state.claimedMilestones.includes('twin_sequence')
  const hasDecree = state.ownedDecrees.includes(PRACTICE_DECREE)

  if (!hasPlaced) return STEPS.choose
  if (!hasTwin) return STEPS.interact
  if (!hasDecree) return STEPS.upgrade
  return STEPS.ready
}

/**
 * The two opening moves, so the guide can point at them.
 *
 * Returned as tile ids from the live rack rather than hardcoded, so a player
 * who exchanged before reading the guide still gets a truthful highlight.
 */
export function practiceOpeningMoves(state: TableLoopState): {
  readonly run: string[]
  readonly pair: string[]
} {
  const run: Tile[] = []
  for (const rank of [3, 4, 5]) {
    const match = state.rack.find(
      (candidate) =>
        candidate.suit === TileSuit.Souzu &&
        candidate.rank === rank &&
        !run.includes(candidate)
    )
    if (match) run.push(match)
  }

  const nines = state.rack.filter(
    (candidate) => candidate.suit === TileSuit.Pinzu && candidate.rank === 9
  )

  return {
    run: run.length === 3 ? run.map((candidate) => candidate.id) : [],
    pair: nines.length >= 2 ? nines.slice(0, 2).map((candidate) => candidate.id) : [],
  }
}

/** The slot kind each opening move needs, for the guide's explanation. */
export const PRACTICE_MOVE_SLOTS = {
  run: MeldType.Sequence,
  pair: MeldType.Pair,
} as const
