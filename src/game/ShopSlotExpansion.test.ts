import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { useOmenStore } from '../stores/omenStore'
import {
  SEAL_OMEN,
  OMEN_OF_CRESCENTS,
  VOID_OMEN,
  FOIL_OMEN,
} from '../config/omenDefinitions'
import { BOSS_MANDATES } from '../systems/RoundManager'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const charter = (id: string) =>
  [...TEA_HOUSE_BASE_CHARTERS, ...TEA_HOUSE_UPGRADED_CHARTERS].find(
    (c) => c.id === id
  )!

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

it.each([0, 20, 100])(
  'applies a %i percent visit discount to the extra offer and excludes owned Decrees',
  (discount) => {
    const shop = new TeaHouseSystem(1, () => 0.3)
    shop.applyCharter(charter('discount_sale'))
    shop.generateShop([], true, { discountPercentage: discount })
    const stock = shop.getState()
    const excluded = stock.itemOfferings[0].item.id
    const offer = stock.charterOffering!
    Object.assign(offer, { item: charter('abundant_stock') })
    const before = json(stock.itemOfferings)
    expect(shop.purchaseOffering(offer.id, [excluded]).success).toBe(true)
    const after = shop.getState().itemOfferings
    expect(after.slice(0, -1)).toEqual(before)
    expect(after).toHaveLength(3)
    expect(after[2].itemType).toBe('Decree')
    expect(after[2].item.id).not.toBe(excluded)
    expect(after[2].finalCost).toBe(
      Math.floor(
        Math.max(
          1,
          Math.floor((after[2].baseCost + after[2].editionCost) * 0.75)
        ) *
          (1 - discount / 100)
      )
    )
  }
)

for (const upgraded of [false, true])
  for (const overflow of [false, true])
    it(`immediately fills the purchased ${upgraded ? 'fourth' : 'third'} slot without replacing stock (Omen overflow=${overflow})`, () => {
      const game = new GameOrchestrator()
      game.setCharterUnlockResolver(() => true)
      game.startNewRun(7)
      game.addImperialCharter(charter('discount_sale'))
      if (upgraded) game.addImperialCharter(charter('abundant_stock'))
      game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate =
        BOSS_MANDATES.find((m) => m.id === 'the_wall')!
      for (let i = 0; i < 3; i++) {
        const state = game.getState()
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        Object.assign(state, { gold: 100, targetScore: 1 })
        state.roundManager.getCurrentRound()!.scoreTarget = 1
        expect(
          game.processAction({
            type: 'play',
            tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
          }).success
        ).toBe(true)
        if (i === 2 && overflow)
          for (const omen of [
            SEAL_OMEN,
            OMEN_OF_CRESCENTS,
            VOID_OMEN,
            FOIL_OMEN,
          ])
            useOmenStore.getState().addOmen(omen)
        expect(game.shop.open()).toBe(true)
        if (i < 2) game.exitShop()
      }
      const offer = game.shop.state.charterOffering!
      Object.assign(offer, {
        item: charter(upgraded ? 'plentiful_stock' : 'abundant_stock'),
      })
      // Purchase one real ordinary offer before expanding; its receipt/reward stays.
      expect(
        game.shop.purchase(game.shop.state.itemOfferings[0].id).success
      ).toBe(true)
      const before = json(game.captureRun())
      const cost = offer.finalCost
      Object.assign(game.getState(), { gold: 0 })
      const unavailable = json(game.captureRun())
      expect(game.shop.purchase(offer.id).success).toBe(false)
      expect(game.captureRun()).toEqual(unavailable)
      Object.assign(game.getState(), { gold: before.state.gold })
      expect(game.shop.purchase(offer.id).success).toBe(true)
      const after = json(game.captureRun())
      expect(after.shop.teaHouse.itemSlotCount).toBe(upgraded ? 4 : 3)
      expect(after.shop.teaHouse.itemOfferings).toHaveLength(
        before.shop.teaHouse.itemOfferings.length + 1
      )
      expect(after.shop.teaHouse.itemOfferings.slice(0, -1)).toEqual(
        before.shop.teaHouse.itemOfferings
      )
      const added =
        after.shop.teaHouse.itemOfferings[
          after.shop.teaHouse.itemOfferings.length - 1
        ]
      expect(added.isPurchased).toBe(false)
      expect(added.slotIndex).toBeGreaterThan(
        Math.max(...before.shop.teaHouse.itemOfferings.map((o) => o.slotIndex))
      )
      expect(added.finalCost).toBe(
        Math.max(1, Math.floor((added.baseCost + added.editionCost) * 0.75))
      )
      expect(after.shop.packs).toEqual(before.shop.packs)
      expect(after.shop.teaHouse.packOfferings).toEqual(
        before.shop.teaHouse.packOfferings
      )
      expect(after.state.gold).toBe(before.state.gold - cost)
      expect(after.state.decreeSystem).toEqual(before.state.decreeSystem)
      expect(after.state.fateSeals).toEqual(before.state.fateSeals)
      expect(after.shop.purchases).toBe(before.shop.purchases + 1)
      expect(after.shop.spent).toBe(before.shop.spent + cost)
      expect(after.shop.teaHouse.rerollsThisVisit).toBe(0)
      expect(game.shop.purchase(offer.id).success).toBe(false)
      expect(game.captureRun()).toEqual(after)
      game.restoreRun(parseClassicRunSnapshot(after))
      expect(game.captureRun()).toEqual(after)
      expect(game.shop.open()).toBe(true)
      expect(game.captureRun()).toEqual(after)
      expect(game.shop.reroll().success).toBe(true)
      expect(game.shop.state.itemOfferings).toHaveLength(upgraded ? 4 : 3)
    })
