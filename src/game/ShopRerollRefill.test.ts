import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { useOmenStore } from '../stores/omenStore'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const charter = (id: string) =>
  [...TEA_HOUSE_BASE_CHARTERS, ...TEA_HOUSE_UPGRADED_CHARTERS].find(
    (entry) => entry.id === id
  )!

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

it.each([1, 2])(
  'refills %i bought slots through the paid run-owned reroll and exact restore',
  (purchases) => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState()
    Object.assign(state, { targetScore: 1, gold: 100 })
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
      }).success
    ).toBe(true)
    expect(game.shop.open()).toBe(true)
    const original = json(game.shop.state.itemOfferings)
    for (const offer of original.slice(0, purchases))
      expect(game.shop.purchase(offer.id).success).toBe(true)
    const before = json(game.captureRun())
    const cost = game.shop.state.currentRerollCost
    expect(game.shop.reroll().success).toBe(true)
    const after = json(game.captureRun())
    expect(game.shop.state.itemOfferings).toHaveLength(2)
    expect(game.shop.state.itemOfferings.every((o) => !o.isPurchased)).toBe(
      true
    )
    expect(
      game.shop.state.itemOfferings.every(
        (o) => !original.some((old) => old.id === o.id)
      )
    ).toBe(true)
    expect(after.shop.packs).toEqual(before.shop.packs)
    expect(after.shop.teaHouse.packOfferings).toEqual(
      before.shop.teaHouse.packOfferings
    )
    expect(after.shop.teaHouse.charterOffering).toEqual(
      before.shop.teaHouse.charterOffering
    )
    expect(after.state).toEqual({
      ...before.state,
      gold: before.state.gold - cost,
    })
    expect(after.shop.spent).toBe(before.shop.spent + cost)
    expect(after.shop.purchases).toBe(before.shop.purchases)
    for (const offer of original)
      expect(game.shop.purchase(offer.id).success).toBe(false)
    expect(game.captureRun()).toEqual(after)
    game.restoreRun(parseClassicRunSnapshot(after))
    expect(game.captureRun()).toEqual(after)
    expect(game.shop.open()).toBe(true)
    expect(game.captureRun()).toEqual(after)
    expect(game.shop.reroll().success).toBe(true)
    expect(game.shop.state.itemOfferings.every((o) => !o.isPurchased)).toBe(
      true
    )
    expect(game.getState().gold).toBe(after.state.gold - cost - 1)
  }
)

it.each([2, 3, 4])(
  'refreshes every ordinary slot at capacity %i without repeating free Omen stock',
  (slots) => {
    const shop = new TeaHouseSystem(1, () => 0.3)
    if (slots >= 3) shop.applyCharter(charter('abundant_stock'))
    if (slots === 4) shop.applyCharter(charter('plentiful_stock'))
    shop.applyCharter(charter('discount_sale'))
    shop.generateShop([], true, {
      guaranteedItemTypes: ['FateSeal', 'CelestialOrb', 'VoidScript'],
      discountPercentage: 20,
      freeRerolls: 1,
    })
    const before = json(shop.getState())
    for (const offer of before.itemOfferings)
      expect(shop.purchaseOffering(offer.id).success).toBe(true)
    expect(shop.rerollItems()?.cost).toBe(0)
    const after = shop.getState()
    expect(after.itemOfferings).toHaveLength(slots)
    expect(after.itemOfferings.every((o) => !o.isPurchased)).toBe(true)
    expect(after.itemOfferings.map((o) => o.slotIndex)).toEqual(
      Array.from({ length: slots }, (_, i) => i)
    )
    for (const offer of after.itemOfferings)
      expect(offer.finalCost).toBe(
        Math.floor(
          Math.max(1, Math.floor((offer.baseCost + offer.editionCost) * 0.75)) *
            0.8
        )
      )
    expect(after.packOfferings).toEqual(before.packOfferings)
    expect(after.charterOffering).toEqual(before.charterOffering)
    expect(after.rerollsThisVisit).toBe(1)
  }
)
