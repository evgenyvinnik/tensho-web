/**
 * Table Loop — pattern milestones (E02).
 *
 * Milestones read the committed table, never the rack or a staged selection.
 * Each one pays at most once per round: revising a slot cannot re-claim a
 * milestone the table already showed, which is the constraint the experiments
 * document sets out for repeated scoring.
 *
 * @module tableloop/milestones
 */

import { MeldType } from '../core/Meld'
import { TileSuit } from '../core/Tile'
import { dragonTypeOf } from './groupRules'
import { PAIR_SLOT_INDEX, type MilestoneId, type TableSlot } from './types'

const SUITED = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]

/** Groups currently on the table, in placement order. */
function placedGroups(slots: readonly TableSlot[]) {
  return slots
    .filter((slot) => slot.group !== null)
    .map((slot) => ({ slot, group: slot.group! }))
    .sort((left, right) => left.group.placementOrder - right.group.placementOrder)
}

/** Identity of a sequence: the suit and the rank it starts on. */
function sequenceKey(tiles: readonly { suit: TileSuit; rank: number }[]): string {
  const ranks = tiles.map((tile) => tile.rank).sort((a, b) => a - b)
  return `${tiles[0].suit}:${ranks[0]}`
}

/**
 * Every milestone the table currently satisfies, claimed or not.
 *
 * Returned in definition order so a placement that trips two at once resolves
 * them predictably.
 */
export function satisfiedMilestones(slots: readonly TableSlot[]): MilestoneId[] {
  const entries = placedGroups(slots)
  const groups = entries.map((entry) => entry.group)
  const found: MilestoneId[] = []

  const sequences = groups.filter((group) => group.type === MeldType.Sequence)

  // Twin Sequence: the same run, twice.
  const sequenceCounts = new Map<string, number>()
  for (const sequence of sequences) {
    const key = sequenceKey(sequence.tiles)
    sequenceCounts.set(key, (sequenceCounts.get(key) ?? 0) + 1)
  }
  if ([...sequenceCounts.values()].some((count) => count >= 2)) {
    found.push('twin_sequence')
  }

  // Pure Suit: two or more groups, all suited, all the same suit.
  if (groups.length >= 2) {
    const suits = new Set(groups.map((group) => group.tiles[0].suit))
    if (suits.size === 1 && SUITED.includes([...suits][0])) {
      found.push('pure_suit')
    }
  }

  // Three-Suit Sequence: the same starting rank in all three suits.
  const startsBySuit = new Map<number, Set<TileSuit>>()
  for (const sequence of sequences) {
    const ranks = sequence.tiles.map((tile) => tile.rank).sort((a, b) => a - b)
    const start = ranks[0]
    const suitSet = startsBySuit.get(start) ?? new Set<TileSuit>()
    suitSet.add(sequence.tiles[0].suit)
    startsBySuit.set(start, suitSet)
  }
  if ([...startsBySuit.values()].some((suits) => suits.size === 3)) {
    found.push('three_suit_sequence')
  }

  // Dragons: two different for the duet, all three for the court.
  const dragons = new Set(
    groups
      .map((group) => dragonTypeOf(group.tiles))
      .filter((dragon): dragon is NonNullable<typeof dragon> => dragon !== null)
  )
  if (dragons.size >= 2) found.push('dragon_duet')
  if (dragons.size >= 3) found.push('dragon_court')

  // Four Sequences: every meld slot is a sequence and the pair is placed.
  const meldSlots = slots.filter((slot) => slot.index !== PAIR_SLOT_INDEX)
  const pairSlot = slots.find((slot) => slot.index === PAIR_SLOT_INDEX)
  if (
    pairSlot?.group &&
    meldSlots.length > 0 &&
    meldSlots.every((slot) => slot.group?.type === MeldType.Sequence)
  ) {
    found.push('four_sequences')
  }

  return found
}

/**
 * Milestones this table shows that have not been paid yet.
 */
export function newlyClaimedMilestones(
  slots: readonly TableSlot[],
  alreadyClaimed: readonly MilestoneId[]
): MilestoneId[] {
  const claimed = new Set(alreadyClaimed)
  return satisfiedMilestones(slots).filter((id) => !claimed.has(id))
}

/**
 * How close the table is to each unclaimed milestone, for the progress track.
 *
 * `progress` and `goal` are counts of the relevant groups, so the UI can show
 * "1 / 2 Dragons" without knowing the rule.
 */
export interface MilestoneProgress {
  readonly id: MilestoneId
  readonly progress: number
  readonly goal: number
}

export function milestoneProgress(
  slots: readonly TableSlot[]
): MilestoneProgress[] {
  const groups = placedGroups(slots).map((entry) => entry.group)
  const sequences = groups.filter((group) => group.type === MeldType.Sequence)

  const sequenceCounts = new Map<string, number>()
  for (const sequence of sequences) {
    const key = sequenceKey(sequence.tiles)
    sequenceCounts.set(key, (sequenceCounts.get(key) ?? 0) + 1)
  }

  const startsBySuit = new Map<number, Set<TileSuit>>()
  for (const sequence of sequences) {
    const ranks = sequence.tiles.map((tile) => tile.rank).sort((a, b) => a - b)
    const suitSet = startsBySuit.get(ranks[0]) ?? new Set<TileSuit>()
    suitSet.add(sequence.tiles[0].suit)
    startsBySuit.set(ranks[0], suitSet)
  }

  const dragons = new Set(
    groups
      .map((group) => dragonTypeOf(group.tiles))
      .filter((dragon): dragon is NonNullable<typeof dragon> => dragon !== null)
  )

  const sameSuitRun = groups.length >= 1 &&
    new Set(groups.map((group) => group.tiles[0].suit)).size === 1 &&
    SUITED.includes(groups[0].tiles[0].suit)
      ? groups.length
      : 0

  return [
    {
      id: 'twin_sequence',
      progress: Math.max(0, ...sequenceCounts.values(), 0),
      goal: 2,
    },
    { id: 'pure_suit', progress: sameSuitRun, goal: 2 },
    {
      id: 'three_suit_sequence',
      progress: Math.max(
        0,
        ...[...startsBySuit.values()].map((suits) => suits.size),
        0
      ),
      goal: 3,
    },
    { id: 'dragon_duet', progress: dragons.size, goal: 2 },
    { id: 'dragon_court', progress: dragons.size, goal: 3 },
    {
      id: 'four_sequences',
      progress:
        sequences.length +
        (slots.find((slot) => slot.index === PAIR_SLOT_INDEX)?.group ? 1 : 0),
      goal: 5,
    },
  ]
}
