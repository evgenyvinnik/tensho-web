import { describe, it, expect } from 'vitest'
import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import { createEmptySlots } from './groupRules'
import { groupTilePoints, neighborSlots, scorePlacement } from './scoring'
import { TABLE_COMPLETION_POINTS } from './content'
import {
  PAIR_SLOT_INDEX,
  type PlacedGroup,
  type TableDecreeId,
  type TableSlot,
} from './types'

let counter = 0
const t = (suit: TileSuit, rank: number) => new Tile(suit, rank, `s${counter++}`)
const seq = (suit: TileSuit, start: number) => [
  t(suit, start),
  t(suit, start + 1),
  t(suit, start + 2),
]
const trip = (suit: TileSuit, rank: number) => [
  t(suit, rank),
  t(suit, rank),
  t(suit, rank),
]

interface Placement {
  slot: number
  type: MeldType
  tiles: Tile[]
}

function tableWith(entries: Placement[]): TableSlot[] {
  const slots = createEmptySlots()
  entries.forEach((entry, index) => {
    slots[entry.slot] = {
      ...slots[entry.slot],
      group: { type: entry.type, tiles: entry.tiles, placementOrder: index + 1 },
    }
  })
  return slots
}

function score(
  entries: Placement[],
  target: number,
  options: {
    decrees?: TableDecreeId[]
    tableMult?: number
    claimed?: Parameters<typeof scorePlacement>[1]['claimedMilestones']
    boss?: Parameters<typeof scorePlacement>[1]['bossRule']
    completionAlreadyPaid?: boolean
  } = {}
) {
  const slots = tableWith(entries)
  const group = slots[target].group as PlacedGroup
  return scorePlacement(group, {
    slots,
    slotIndex: target,
    ownedDecrees: options.decrees ?? [],
    tableMult: options.tableMult ?? 0,
    claimedMilestones: options.claimed ?? [],
    bossRule: options.boss ?? null,
    completionAlreadyPaid: options.completionAlreadyPaid ?? false,
  })
}

describe('base placement scoring', () => {
  it('pays tile points plus structure points', () => {
    // Souzu 3-4-5: three simples (5 each) plus a sequence (40).
    const result = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) }],
      0
    )
    expect(result.points).toBe(55)
    expect(result.mult).toBe(1)
    expect(result.total).toBe(55)
  })

  it('makes the group the first stage and the total the last', () => {
    const result = score(
      [{ slot: 0, type: MeldType.Triplet, tiles: trip(TileSuit.Dragon, DragonType.Red) }],
      0
    )
    expect(result.stages[0].kind).toBe('group')
    expect(result.stages.at(-1)?.kind).toBe('total')
    expect(result.stages.at(-1)?.points).toBe(result.total)
  })
})

describe('the boss rule', () => {
  it('halves Honor tile points and leaves structure alone', () => {
    const honors = trip(TileSuit.Dragon, DragonType.White)
    expect(groupTilePoints(honors, null)).toBe(45)
    expect(groupTilePoints(honors, 'frost_magistrate')).toBe(21)

    const result = score(
      [{ slot: 0, type: MeldType.Triplet, tiles: honors }],
      0,
      { boss: 'frost_magistrate' }
    )
    expect(result.points).toBe(21 + 45)
    expect(result.stages.some((stage) => stage.kind === 'boss')).toBe(true)
  })

  it('leaves suited groups untouched', () => {
    const result = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 2) }],
      0,
      { boss: 'frost_magistrate' }
    )
    expect(result.points).toBe(55)
    expect(result.stages.some((stage) => stage.kind === 'boss')).toBe(false)
  })
})

describe('decrees', () => {
  it('Echoing Bamboo doubles a Bamboo sequence and nothing else', () => {
    const bamboo = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) }],
      0,
      { decrees: ['echoing_bamboo'] }
    )
    expect(bamboo.total).toBe(110)

    const circles = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Pinzu, 3) }],
      0,
      { decrees: ['echoing_bamboo'] }
    )
    expect(circles.total).toBe(55)

    const bambooTriplet = score(
      [{ slot: 0, type: MeldType.Triplet, tiles: trip(TileSuit.Souzu, 3) }],
      0,
      { decrees: ['echoing_bamboo'] }
    )
    expect(bambooTriplet.total).toBe(15 + 45)
  })

  it('Patient Pair scales with the melds already waiting', () => {
    const pairTiles = [t(TileSuit.Pinzu, 9), t(TileSuit.Pinzu, 9)]
    const result = score(
      [
        { slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 1) },
        { slot: 1, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 4) },
        { slot: PAIR_SLOT_INDEX, type: MeldType.Pair, tiles: pairTiles },
      ],
      PAIR_SLOT_INDEX,
      { decrees: ['patient_pair'] }
    )
    // Two terminals (10 each) + pair structure (15) + 2 melds x 30.
    expect(result.points).toBe(20 + 15 + 60)
  })

  it('Dragon Lantern only lights groups placed later beside the Dragon', () => {
    const dragonFirst = score(
      [
        { slot: 1, type: MeldType.Triplet, tiles: trip(TileSuit.Dragon, DragonType.Green) },
        { slot: 2, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 2) },
      ],
      2,
      { decrees: ['dragon_lantern'] }
    )
    expect(dragonFirst.mult).toBeCloseTo(1.5)

    const dragonLater = score(
      [
        { slot: 2, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 2) },
        { slot: 1, type: MeldType.Triplet, tiles: trip(TileSuit.Dragon, DragonType.Green) },
      ],
      2,
      { decrees: ['dragon_lantern'] }
    )
    expect(dragonLater.mult).toBe(1)

    const notAdjacent = score(
      [
        { slot: 0, type: MeldType.Triplet, tiles: trip(TileSuit.Dragon, DragonType.Green) },
        { slot: 3, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 2) },
      ],
      3,
      { decrees: ['dragon_lantern'] }
    )
    expect(notAdjacent.mult).toBe(1)
  })

  it('Honor Court pays per honor tile, and Terminal Gate per qualifying group', () => {
    const winds = score(
      [{ slot: 0, type: MeldType.Triplet, tiles: trip(TileSuit.Wind, WindType.South) }],
      0,
      { decrees: ['honor_court'] }
    )
    expect(winds.mult).toBeCloseTo(1.9)

    const terminals = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Pinzu, 1) }],
      0,
      { decrees: ['terminal_gate'] }
    )
    expect(terminals.points).toBe(10 + 5 + 5 + 40 + 40)

    const noTerminal = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Pinzu, 3) }],
      0,
      { decrees: ['terminal_gate'] }
    )
    expect(noTerminal.points).toBe(55)
  })

  it('Jade Ledger pays gold for a placement', () => {
    const withLedger = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Pinzu, 3) }],
      0,
      { decrees: ['jade_ledger'] }
    )
    expect(withLedger.gold).toBe(2)
  })
})

describe('milestones in a placement', () => {
  it('adds milestone points and reports the claim', () => {
    const result = score(
      [
        { slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) },
        { slot: 1, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) },
      ],
      1
    )
    expect(result.claimedMilestones).toEqual(
      expect.arrayContaining(['twin_sequence', 'pure_suit'])
    )
    // Group 55 x1, plus Twin Sequence 80 and Pure Suit 60.
    expect(result.total).toBe(55 + 80 + 60)
  })

  it('does not pay a milestone that was already claimed', () => {
    const result = score(
      [
        { slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) },
        { slot: 1, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) },
      ],
      1,
      { claimed: ['twin_sequence', 'pure_suit'] }
    )
    expect(result.claimedMilestones).toEqual([])
    expect(result.total).toBe(55)
  })

  it('Twin Flame doubles milestone points but not the milestone multiplier', () => {
    const result = score(
      [
        { slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) },
        { slot: 1, type: MeldType.Sequence, tiles: seq(TileSuit.Souzu, 3) },
      ],
      1,
      { decrees: ['twin_flame'] }
    )
    expect(result.total).toBe(55 + 160 + 120)
    const twin = result.stages.find(
      (stage) => stage.kind === 'milestone' && stage.mult === 0.5
    )
    expect(twin?.mult).toBe(0.5)
  })

  it('applies standing table momentum to the new group', () => {
    const result = score(
      [{ slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Pinzu, 3) }],
      0,
      { tableMult: 0.5 }
    )
    expect(result.mult).toBeCloseTo(1.5)
    expect(result.total).toBe(82)
  })
})

describe('completing the table', () => {
  const fullTable: Placement[] = [
    { slot: 0, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 1) },
    { slot: 1, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 4) },
    { slot: 2, type: MeldType.Sequence, tiles: seq(TileSuit.Manzu, 7) },
    { slot: 3, type: MeldType.Triplet, tiles: trip(TileSuit.Manzu, 2) },
    {
      slot: PAIR_SLOT_INDEX,
      type: MeldType.Pair,
      tiles: [t(TileSuit.Manzu, 6), t(TileSuit.Manzu, 6)],
    },
  ]

  it('pays a completion bonus scaled by the multiplier the table has earned', () => {
    const result = score(fullTable, PAIR_SLOT_INDEX)
    const completion = result.stages.find((stage) => stage.kind === 'completion')
    expect(completion).toBeDefined()
    // Pure Suit (0.4) is claimed by this same placement and lifts the bonus.
    expect(completion?.points).toBe(Math.floor(TABLE_COMPLETION_POINTS * 1.4))
  })

  it('never pays the completion bonus twice', () => {
    const result = score(fullTable, PAIR_SLOT_INDEX, {
      completionAlreadyPaid: true,
    })
    expect(result.stages.some((stage) => stage.kind === 'completion')).toBe(false)
  })
})

describe('neighborSlots', () => {
  it('stays inside the row of five', () => {
    expect(neighborSlots(0)).toEqual([1])
    expect(neighborSlots(2)).toEqual([1, 3])
    expect(neighborSlots(PAIR_SLOT_INDEX)).toEqual([3])
  })
})
