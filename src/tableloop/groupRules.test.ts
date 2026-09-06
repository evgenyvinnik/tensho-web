import { describe, it, expect } from 'vitest'
import { Tile, TileSuit, DragonType, WindType, FlowerType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import {
  classifyGroup,
  createEmptySlots,
  compatibleEmptySlots,
  dragonTypeOf,
  enumerateRackGroups,
  hasLegalPlacement,
  isGappedRun,
  isTableComplete,
  slotAccepts,
  slotKindFor,
} from './groupRules'
import { PAIR_SLOT_INDEX, type TableSlot } from './types'

let counter = 0
const suited = (suit: TileSuit, rank: number) =>
  new Tile(suit, rank, `t${counter++}`)
const dragon = (type: DragonType) =>
  new Tile(TileSuit.Dragon, type, `t${counter++}`)
const wind = (type: WindType) => new Tile(TileSuit.Wind, type, `t${counter++}`)

describe('classifyGroup', () => {
  it('accepts a sequence, triplet, quad and pair', () => {
    expect(
      classifyGroup([
        suited(TileSuit.Souzu, 3),
        suited(TileSuit.Souzu, 4),
        suited(TileSuit.Souzu, 5),
      ])
    ).toEqual({ ok: true, type: MeldType.Sequence })

    expect(
      classifyGroup([dragon(DragonType.Red), dragon(DragonType.Red), dragon(DragonType.Red)])
    ).toEqual({ ok: true, type: MeldType.Triplet })

    expect(
      classifyGroup([
        suited(TileSuit.Pinzu, 2),
        suited(TileSuit.Pinzu, 2),
        suited(TileSuit.Pinzu, 2),
        suited(TileSuit.Pinzu, 2),
      ])
    ).toEqual({ ok: true, type: MeldType.Quad })

    expect(classifyGroup([wind(WindType.East), wind(WindType.East)])).toEqual({
      ok: true,
      type: MeldType.Pair,
    })
  })

  it('refuses consecutive honors, mixed suits and loose tiles', () => {
    const honorRun = classifyGroup([
      wind(WindType.East),
      wind(WindType.South),
      wind(WindType.West),
    ])
    expect(honorRun.ok).toBe(false)

    const mixed = classifyGroup([
      suited(TileSuit.Souzu, 3),
      suited(TileSuit.Pinzu, 4),
      suited(TileSuit.Manzu, 5),
    ])
    expect(mixed.ok).toBe(false)
  })

  it('refuses bonus tiles and selections outside two to four tiles', () => {
    const bonus = classifyGroup([
      new Tile(TileSuit.Flower, FlowerType.Plum, `t${counter++}`),
      new Tile(TileSuit.Flower, FlowerType.Plum, `t${counter++}`),
    ])
    expect(bonus.ok).toBe(false)
    if (!bonus.ok) expect(bonus.rejection.key).toBe('tableLoop.reject.bonusTile')

    expect(classifyGroup([suited(TileSuit.Souzu, 3)]).ok).toBe(false)
    expect(
      classifyGroup([
        suited(TileSuit.Souzu, 1),
        suited(TileSuit.Souzu, 1),
        suited(TileSuit.Souzu, 1),
        suited(TileSuit.Souzu, 1),
        suited(TileSuit.Souzu, 1),
      ]).ok
    ).toBe(false)
  })
})

describe('slots', () => {
  it('separates meld slots from the pair slot', () => {
    expect(slotKindFor(0)).toBe('meld')
    expect(slotKindFor(PAIR_SLOT_INDEX)).toBe('pair')
    expect(slotAccepts('pair', MeldType.Pair)).toBe(true)
    expect(slotAccepts('pair', MeldType.Sequence)).toBe(false)
    expect(slotAccepts('meld', MeldType.Quad)).toBe(true)
    expect(slotAccepts('meld', MeldType.Pair)).toBe(false)
  })

  it('reports compatible empty slots and completion', () => {
    const slots = createEmptySlots()
    expect(compatibleEmptySlots(slots, MeldType.Sequence)).toEqual([0, 1, 2, 3])
    expect(compatibleEmptySlots(slots, MeldType.Pair)).toEqual([PAIR_SLOT_INDEX])
    expect(isTableComplete(slots)).toBe(false)

    const filled: TableSlot[] = slots.map((slot) => ({
      ...slot,
      group: {
        type: slot.kind === 'pair' ? MeldType.Pair : MeldType.Triplet,
        tiles: [],
        placementOrder: slot.index + 1,
      },
    }))
    expect(isTableComplete(filled)).toBe(true)
  })
})

describe('enumerateRackGroups', () => {
  it('finds sequences and identical-tile groups without duplicating identities', () => {
    const rack = [
      suited(TileSuit.Souzu, 3),
      suited(TileSuit.Souzu, 4),
      suited(TileSuit.Souzu, 5),
      dragon(DragonType.White),
      dragon(DragonType.White),
      dragon(DragonType.White),
    ]
    const groups = enumerateRackGroups(rack)
    const types = groups
      .map((group) => {
        const classified = classifyGroup(group)
        return classified.ok ? classified.type : null
      })
      .filter(Boolean)

    expect(types).toContain(MeldType.Sequence)
    expect(types).toContain(MeldType.Triplet)
    expect(types).toContain(MeldType.Pair)
    // Two dragons only ever produce one pair identity, not three.
    expect(types.filter((type) => type === MeldType.Pair)).toHaveLength(1)
  })
})

describe('hasLegalPlacement', () => {
  it('is false when only the pair slot is open and the rack holds no pair', () => {
    const slots = createEmptySlots().map((slot) =>
      slot.kind === 'meld'
        ? {
            ...slot,
            group: {
              type: MeldType.Triplet,
              tiles: [],
              placementOrder: slot.index + 1,
            },
          }
        : slot
    )
    const rack = [
      suited(TileSuit.Souzu, 1),
      suited(TileSuit.Pinzu, 4),
      suited(TileSuit.Manzu, 7),
    ]
    expect(hasLegalPlacement(rack, slots)).toBe(false)

    const withPair = [...rack, suited(TileSuit.Souzu, 1)]
    expect(hasLegalPlacement(withPair, slots)).toBe(true)
  })
})

describe('dragonTypeOf', () => {
  it('identifies a uniform dragon group and rejects anything else', () => {
    expect(dragonTypeOf([dragon(DragonType.Green), dragon(DragonType.Green)])).toBe(
      DragonType.Green
    )
    expect(dragonTypeOf([dragon(DragonType.Green), dragon(DragonType.Red)])).toBeNull()
    expect(dragonTypeOf([wind(WindType.East), wind(WindType.East)])).toBeNull()
    expect(dragonTypeOf([])).toBeNull()
  })
})

describe('Gap Bridge', () => {
  const gapped = [
    suited(TileSuit.Manzu, 3),
    suited(TileSuit.Manzu, 4),
    suited(TileSuit.Manzu, 6),
  ]

  it('is not a group unless a bridge is available', () => {
    expect(classifyGroup(gapped).ok).toBe(false)

    const bridged = classifyGroup(gapped, { allowGap: true })
    expect(bridged.ok).toBe(true)
    if (bridged.ok) {
      expect(bridged.type).toBe(MeldType.Sequence)
      expect(bridged.usedGap).toBe(true)
    }
  })

  it('accepts either shape of one-rank gap, and nothing wider', () => {
    const early = [
      suited(TileSuit.Pinzu, 2),
      suited(TileSuit.Pinzu, 4),
      suited(TileSuit.Pinzu, 5),
    ]
    expect(isGappedRun(early)).toBe(true)
    expect(isGappedRun(gapped)).toBe(true)

    // Two ranks missing spans four, not three.
    const wide = [
      suited(TileSuit.Pinzu, 2),
      suited(TileSuit.Pinzu, 4),
      suited(TileSuit.Pinzu, 6),
    ]
    expect(isGappedRun(wide)).toBe(false)

    // Honors have no ranks to bridge.
    expect(
      isGappedRun([wind(WindType.East), wind(WindType.South), wind(WindType.West)])
    ).toBe(false)

    // A real run is not a gapped one.
    expect(
      isGappedRun([
        suited(TileSuit.Souzu, 3),
        suited(TileSuit.Souzu, 4),
        suited(TileSuit.Souzu, 5),
      ])
    ).toBe(false)
  })

  it('does not report a bridged run as placeable without the bridge', () => {
    const slots = createEmptySlots()
    expect(hasLegalPlacement(gapped, slots)).toBe(false)
    expect(hasLegalPlacement(gapped, slots, { allowGap: true })).toBe(true)
  })
})
