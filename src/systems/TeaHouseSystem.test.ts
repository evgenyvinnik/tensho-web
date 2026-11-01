import { describe, expect, it } from 'vitest'
import { Tile } from '../core/Tile'
import { ALL_DECREES } from './DecreeSystem'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from './TeaHouseSystem'
import type { BlessingPack, Decree } from './types'

function charter(id: string) {
  const result = [...TEA_HOUSE_BASE_CHARTERS, ...TEA_HOUSE_UPGRADED_CHARTERS]
    .find((candidate) => candidate.id === id)
  if (!result) throw new Error(`Missing Charter fixture: ${id}`)
  return result
}

describe('TeaHouseSystem visit modifiers', () => {
  it('adapts the complete canonical Charter catalog', () => {
    expect(TEA_HOUSE_BASE_CHARTERS).toHaveLength(16)
    expect(TEA_HOUSE_UPGRADED_CHARTERS).toHaveLength(16)
    expect(TEA_HOUSE_BASE_CHARTERS.map(({ id }) => id)).toContain('tile_trading')
    expect(TEA_HOUSE_BASE_CHARTERS.map(({ id }) => id)).toContain('directors_take')
    expect(TEA_HOUSE_UPGRADED_CHARTERS.map(({ id }) => id)).toContain('observatory')
  })

  it('offers the matching earned upgrade after its base Charter is redeemed', () => {
    const teaHouse = new TeaHouseSystem(1, () => 0)
    teaHouse.setCharterUnlockResolver(id => id === 'plentiful_stock')
    teaHouse.applyCharter(charter('abundant_stock'))

    const shop = teaHouse.generateShop([], true)

    expect(shop.itemOfferings).toHaveLength(3)
    expect(shop.charterOffering?.item).toMatchObject({ id: 'plentiful_stock' })
  })

  it('increases Decree edition frequency from canonical Charter effects', () => {
    const baseline = new TeaHouseSystem(1, () => 0.3)
    expect(
      baseline.generateShop().itemOfferings
        .filter((offering) => offering.itemType === 'Decree')
        .every((offering) => offering.edition === undefined)
    ).toBe(true)

    const enhanced = new TeaHouseSystem(1, () => 0.3)
    enhanced.applyCharter(charter('sharp_edge'))
    expect(
      enhanced.generateShop().itemOfferings
        .filter((offering) => offering.itemType === 'Decree')
        .every((offering) => offering.edition !== undefined)
    ).toBe(true)
  })

  it('gives Arcana Packs one more choice with Crystal Lens, including restored runs', () => {
    // 0.5 rolls Arcana for every pack; 0.7 rolls Celestial.
    const packs = (teaHouse: TeaHouseSystem) =>
      teaHouse.generateShop().packOfferings.map((o) => o.item as BlessingPack)
    const baseline = packs(new TeaHouseSystem(1, () => 0.5))
    expect(baseline.every((pack) => pack.type === 'Arcana')).toBe(true)

    const lens = new TeaHouseSystem(1, () => 0.5)
    lens.applyCharter(charter('crystal_lens'))
    expect(packs(lens).map((pack) => pack.choiceCount)).toEqual(
      baseline.map((pack) => pack.choiceCount + 1)
    )

    const restored = TeaHouseSystem.fromSerializedState(
      {
        ...new TeaHouseSystem().toSerializedState(),
        purchasedCharterIds: ['crystal_lens'],
      },
      { random: () => 0.5 }
    )
    expect(packs(restored).map((pack) => pack.choiceCount)).toEqual(
      baseline.map((pack) => pack.choiceCount + 1)
    )

    const celestial = new TeaHouseSystem(1, () => 0.7)
    celestial.applyCharter(charter('crystal_lens'))
    expect(packs(celestial)).toEqual(
      packs(new TeaHouseSystem(1, () => 0.7)).map((pack) =>
        expect.objectContaining({ type: 'Celestial', choiceCount: pack.choiceCount })
      )
    )
  })

  it('generates purchasable wall tiles with Illusion modifiers', () => {
    const rolls = [0.99, 0, 0, 0, 0]
    let rollIndex = 0
    const teaHouse = new TeaHouseSystem(
      1,
      () => rolls[rollIndex++ % rolls.length]
    )
    teaHouse.applyCharter(charter('tile_trading'))
    teaHouse.applyCharter(charter('illusion_tiles'))

    const tiles = teaHouse
      .generateShop()
      .itemOfferings.filter((offering) => offering.itemType === 'Tile')

    expect(tiles).toHaveLength(2)
    expect(tiles.every((offering) => offering.item instanceof Tile)).toBe(true)
    expect(tiles.every((offering) => (offering.item as Tile).hasModifiers)).toBe(true)
  })

  it('guarantees Omen items, applies visit discounts, and grants free rerolls', () => {
    const teaHouse = new TeaHouseSystem()
    const shop = teaHouse.generateShop([], false, {
      guaranteedItemTypes: ['VoidScript'],
      discountPercentage: 25,
      freeRerolls: 2,
    })

    const voidOffering = shop.itemOfferings.find(
      (offering) => offering.itemType === 'VoidScript'
    )
    expect(voidOffering).toBeDefined()
    expect(voidOffering!.finalCost).toBeLessThan(voidOffering!.baseCost)
    expect(shop.currentRerollCost).toBe(0)

    expect(teaHouse.rerollItems([])?.cost).toBe(0)
    expect(teaHouse.rerollItems([])?.cost).toBe(0)
    expect(teaHouse.getCurrentRerollCost()).toBeGreaterThan(0)
  })

  it('makes a guaranteed Blessing Pack free', () => {
    const teaHouse = new TeaHouseSystem()
    const shop = teaHouse.generateShop([], false, {
      guaranteedItemTypes: ['BlessingPack'],
    })

    expect(shop.packOfferings.some((offering) => offering.finalCost === 0)).toBe(
      true
    )
  })

  it('turns an Omen Decree into a free authoritative edition', () => {
    const teaHouse = new TeaHouseSystem()
    const shop = teaHouse.generateShop([], false, {
      guaranteedItemTypes: ['Decree'],
      decreeEdition: 'Negative',
    })
    const decree = shop.itemOfferings.find(
      (offering) => offering.itemType === 'Decree'
    )!

    expect(decree.edition).toBe('Negative')
    expect(decree.finalCost).toBe(0)
    expect('edition' in decree.item && decree.item.edition).toBe('Negative')
  })
})

/** Small deterministic stream so shop rolls cover every rarity branch. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function decreeOffers(
  teaHouse: TeaHouseSystem,
  visits: number,
  ownedDecreeIds: string[] = []
): Decree[] {
  const offers: Decree[] = []
  for (let visit = 0; visit < visits; visit++) {
    const shop = teaHouse.generateShop(ownedDecreeIds, false, {
      flowerCount: 5,
    })
    offers.push(
      ...shop.itemOfferings
        .filter((offering) => offering.itemType === 'Decree')
        .map((offering) => offering.item as Decree)
    )
  }
  return offers
}

describe('TeaHouseSystem Decree tiers', () => {
  it('never stocks a special-sources-only Decree in an ordinary slot', () => {
    const teaHouse = new TeaHouseSystem(1, seeded(17))
    teaHouse.setDecreeUnlockResolver(() => true)
    const offers = decreeOffers(teaHouse, 300)

    expect(offers.some((decree) => decree.rarity === 'ImperialDecree')).toBe(
      true
    )
    expect(
      offers.filter((decree) => decree.rarity === 'HeavenlyOrdinance')
    ).toEqual([])
    expect(offers.map((decree) => decree.id)).not.toContain(
      'decree-midas-touch'
    )
  })

  it('falls back to another shop tier when the rolled tier is exhausted', () => {
    const keep = 'decree-golden-age'
    const owned = ALL_DECREES.filter(
      (decree) => decree.rarity !== 'HeavenlyOrdinance' && decree.id !== keep
    ).map((decree) => decree.id)
    const teaHouse = new TeaHouseSystem(1, seeded(3))
    teaHouse.setDecreeUnlockResolver(() => true)
    const offers = decreeOffers(teaHouse, 30, owned)

    expect(offers.length).toBeGreaterThan(0)
    // At most once per shelf: the other Decree rolls stay empty.
    expect(offers.length).toBeLessThanOrEqual(30)
    expect(new Set(offers.map((decree) => decree.id))).toEqual(new Set([keep]))
  })
})

describe('TeaHouseSystem Decree shelf', () => {
  const shelfDecrees = (teaHouse: TeaHouseSystem) =>
    teaHouse
      .getState()
      .itemOfferings.filter((offering) => offering.itemType === 'Decree')
      .map((offering) => (offering.item as Decree).id)

  it('never offers the same Decree twice on one shelf', () => {
    // A constant roll lands on the same Decree in every slot.
    const teaHouse = new TeaHouseSystem(1, () => 0)
    teaHouse.setCharterUnlockResolver((id) => id === 'plentiful_stock')
    teaHouse.applyCharter(charter('abundant_stock'))
    const shop = teaHouse.generateShop([], true, {
      guaranteedItems: Array.from({ length: 4 }, () => ({
        itemType: 'Decree' as const,
      })),
    })

    expect(shelfDecrees(teaHouse)).toHaveLength(4)
    expect(new Set(shelfDecrees(teaHouse)).size).toBe(4)

    teaHouse.purchaseOffering(shop.charterOffering!.id)
    expect(new Set(shelfDecrees(teaHouse)).size).toBe(
      shelfDecrees(teaHouse).length
    )

    teaHouse.rerollItems()
    expect(shelfDecrees(teaHouse)).toHaveLength(4)
    expect(new Set(shelfDecrees(teaHouse)).size).toBe(4)
  })

  it('prices every Decree at its listed cost', () => {
    const teaHouse = new TeaHouseSystem(1, seeded(11))
    teaHouse.setDecreeUnlockResolver(() => true)
    const prices = new Map<string, Set<number>>()
    for (let visit = 0; visit < 200; visit++) {
      const shelf = teaHouse
        .generateShop([], false, { flowerCount: 5 })
        .itemOfferings.filter((offering) => offering.itemType === 'Decree')
      expect(
        new Set(shelf.map((offering) => (offering.item as Decree).id)).size
      ).toBe(shelf.length)
      for (const offering of shelf) {
        const decree = offering.item as Decree
        expect(offering.baseCost).toBe(decree.cost)
        // An edition adds its own listed cost on top.
        if (offering.edition) continue
        prices.set(
          decree.id,
          (prices.get(decree.id) ?? new Set()).add(offering.finalCost)
        )
      }
    }

    expect(prices.get('decree-humble-power')).toEqual(new Set([4]))
  })
})
