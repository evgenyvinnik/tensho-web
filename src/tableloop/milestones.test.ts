import { describe, it, expect } from 'vitest'
import { Tile, TileSuit, DragonType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import { createEmptySlots } from './groupRules'
import { milestoneProgress, newlyClaimedMilestones, satisfiedMilestones } from './milestones'
import { PAIR_SLOT_INDEX, type MilestoneId, type TableSlot } from './types'

let counter = 0
const t = (suit: TileSuit, rank: number) => new Tile(suit, rank, `m${counter++}`)

const sequence = (suit: TileSuit, start: number) => [
  t(suit, start),
  t(suit, start + 1),
  t(suit, start + 2),
]
const triplet = (suit: TileSuit, rank: number) => [
  t(suit, rank),
  t(suit, rank),
  t(suit, rank),
]

/** Place groups into slots in order, so placementOrder is meaningful. */
function tableOf(
  entries: { slot: number; type: MeldType; tiles: Tile[] }[]
): TableSlot[] {
  const slots = createEmptySlots()
  entries.forEach((entry, index) => {
    slots[entry.slot] = {
      ...slots[entry.slot],
      group: { type: entry.type, tiles: entry.tiles, placementOrder: index + 1 },
    }
  })
  return slots
}

describe('satisfiedMilestones', () => {
  it('finds a Twin Sequence only when the same run appears twice', () => {
    const one = tableOf([
      { slot: 0, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 3) },
      { slot: 1, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 4) },
    ])
    expect(satisfiedMilestones(one)).not.toContain('twin_sequence')

    const twin = tableOf([
      { slot: 0, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 3) },
      { slot: 1, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 3) },
    ])
    expect(satisfiedMilestones(twin)).toContain('twin_sequence')
  })

  it('finds Pure Suit only for two or more groups in one suited suit', () => {
    const single = tableOf([
      { slot: 0, type: MeldType.Sequence, tiles: sequence(TileSuit.Pinzu, 1) },
    ])
    expect(satisfiedMilestones(single)).not.toContain('pure_suit')

    const pure = tableOf([
      { slot: 0, type: MeldType.Sequence, tiles: sequence(TileSuit.Pinzu, 1) },
      { slot: 1, type: MeldType.Triplet, tiles: triplet(TileSuit.Pinzu, 7) },
    ])
    expect(satisfiedMilestones(pure)).toContain('pure_suit')

    const honorsOnly = tableOf([
      { slot: 0, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.Red) },
      { slot: 1, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.Red) },
    ])
    expect(satisfiedMilestones(honorsOnly)).not.toContain('pure_suit')
  })

  it('finds a Three-Suit Sequence only when all three share a starting rank', () => {
    const mismatched = tableOf([
      { slot: 0, type: MeldType.Sequence, tiles: sequence(TileSuit.Manzu, 2) },
      { slot: 1, type: MeldType.Sequence, tiles: sequence(TileSuit.Pinzu, 2) },
      { slot: 2, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 5) },
    ])
    expect(satisfiedMilestones(mismatched)).not.toContain('three_suit_sequence')

    const matched = tableOf([
      { slot: 0, type: MeldType.Sequence, tiles: sequence(TileSuit.Manzu, 2) },
      { slot: 1, type: MeldType.Sequence, tiles: sequence(TileSuit.Pinzu, 2) },
      { slot: 2, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 2) },
    ])
    expect(satisfiedMilestones(matched)).toContain('three_suit_sequence')
  })

  it('escalates Dragon Duet into Dragon Court', () => {
    const duet = tableOf([
      { slot: 0, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.White) },
      { slot: 1, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.Green) },
    ])
    expect(satisfiedMilestones(duet)).toContain('dragon_duet')
    expect(satisfiedMilestones(duet)).not.toContain('dragon_court')

    const court = tableOf([
      { slot: 0, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.White) },
      { slot: 1, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.Green) },
      { slot: 2, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.Red) },
    ])
    expect(satisfiedMilestones(court)).toEqual(
      expect.arrayContaining(['dragon_duet', 'dragon_court'])
    )
  })

  it('requires the pair before awarding Four Sequences', () => {
    const melds = [0, 1, 2, 3].map((slot) => ({
      slot,
      type: MeldType.Sequence,
      tiles: sequence(TileSuit.Manzu, slot + 1),
    }))
    expect(satisfiedMilestones(tableOf(melds))).not.toContain('four_sequences')

    const withPair = tableOf([
      ...melds,
      {
        slot: PAIR_SLOT_INDEX,
        type: MeldType.Pair,
        tiles: [t(TileSuit.Pinzu, 9), t(TileSuit.Pinzu, 9)],
      },
    ])
    expect(satisfiedMilestones(withPair)).toContain('four_sequences')
  })
})

describe('newlyClaimedMilestones', () => {
  it('never returns a milestone that was already paid', () => {
    const twin = tableOf([
      { slot: 0, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 3) },
      { slot: 1, type: MeldType.Sequence, tiles: sequence(TileSuit.Souzu, 3) },
    ])
    expect(newlyClaimedMilestones(twin, [])).toContain('twin_sequence')
    expect(newlyClaimedMilestones(twin, ['twin_sequence'])).not.toContain(
      'twin_sequence'
    )
  })
})

describe('milestoneProgress', () => {
  it('reports how close each milestone is', () => {
    const table = tableOf([
      { slot: 0, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.White) },
      { slot: 1, type: MeldType.Triplet, tiles: triplet(TileSuit.Dragon, DragonType.Green) },
    ])
    const byId = new Map<MilestoneId, number>(
      milestoneProgress(table).map((entry) => [entry.id, entry.progress])
    )
    expect(byId.get('dragon_duet')).toBe(2)
    expect(byId.get('dragon_court')).toBe(2)
    expect(byId.get('twin_sequence')).toBe(0)
  })
})
