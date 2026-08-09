import { describe, expect, it } from 'vitest'
import { Tile } from '../core/Tile'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from './TeaHouseSystem'

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

  it('offers the matching upgrade after its base Charter is redeemed', () => {
    const teaHouse = new TeaHouseSystem(1, () => 0)
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
