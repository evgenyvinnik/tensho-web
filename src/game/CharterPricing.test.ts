import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { decreeKey } from '../systems/decreeIdentity'
import { useOmenStore } from '../stores/omenStore'
import {
  SEAL_OMEN,
  OMEN_OF_CRESCENTS,
  VOID_OMEN,
  FOIL_OMEN,
} from '../config/omenDefinitions'
import { parseClassicRunSnapshot } from './validateClassicRun'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'

const charter = (id: string) =>
  [...TEA_HOUSE_BASE_CHARTERS, ...TEA_HOUSE_UPGRADED_CHARTERS].find(
    (entry) => entry.id === id
  )!
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

it('records paid consumable prices and a zero-price Omen Decree without changing catalog rewards', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.addImperialCharter(charter('discount_sale'))
  const state = game.getState() as OrchestratorState
  Object.assign(state, { phase: 'shop', gold: 100 })
  for (const omen of [SEAL_OMEN, OMEN_OF_CRESCENTS, VOID_OMEN, FOIL_OMEN])
    useOmenStore.getState().addOmen(omen)
  expect(game.shop.open()).toBe(true)
  const offers = game.shop.state.itemOfferings
  expect(offers.map((o) => o.itemType)).toEqual([
    'FateSeal',
    'CelestialOrb',
    'VoidScript',
    'Decree',
  ])
  const quoted = json(offers.map((o) => o.item))
  for (const offer of offers) {
    expect(game.shop.purchase(offer.id).success).toBe(true)
    const owned = [
      ...state.fateSeals,
      ...state.celestialOrbs,
      ...state.voidScripts,
      ...state.decreeSystem.getOwnedDecrees(),
    ].find((item) => item.id === offer.item.id)!
    expect(owned.cost).toBe('cost' in offer.item ? offer.item.cost : undefined)
    expect(owned.sellValue).toBe(Math.floor(offer.finalCost / 2))
  }
  expect(json(offers.map((o) => o.item))).toEqual(quoted)
  const free = state.decreeSystem
    .getOwnedDecrees()
    .find((d) => d.id === offers[3].item.id)!
  expect(free.sellValue).toBe(0)
  const gold = state.gold
  expect(game.sellDecree(decreeKey(free)).success).toBe(true)
  expect(state.gold).toBe(gold)
  const saved = parseClassicRunSnapshot(json(game.captureRun()))
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
})

it.each([0, 25, 50])(
  'keeps a purchased Decree sale value tied to its actual price (%i percent discount)',
  (discount) => {
    const game = new GameOrchestrator()
    game.setCharterUnlockResolver(() => true)
    game.startNewRun(7)
    if (discount >= 25) game.addImperialCharter(charter('discount_sale'))
    if (discount === 50) game.addImperialCharter(charter('liquidation_sale'))
    const state = game.getState() as OrchestratorState
    Object.assign(state, { phase: 'shop', gold: 100 })
    expect(game.shop.open()).toBe(true)
    const offer = game.shop.state.itemOfferings.find(
      (o) => o.itemType === 'Decree'
    )!
    expect(offer).toBeDefined()
    const price = offer.finalCost
    expect(game.shop.purchase(offer.id).success).toBe(true)
    const acquired = state.decreeSystem
      .getOwnedDecrees()
      .find((d) => d.id === offer.item.id)!
    expect(acquired.cost).toBe(
      'cost' in offer.item ? offer.item.cost : undefined
    )
    expect(acquired.sellValue).toBe(Math.floor(price / 2))
    const snapshot = json(game.captureRun())
    game.restoreRun(snapshot)
    expect(game.sellDecree(decreeKey(acquired)).success).toBe(true)
    expect(game.getState().gold).toBe(100 - price + Math.floor(price / 2))
  }
)

it.each([
  ['discount_sale', 0, 25],
  ['liquidation_sale', 25, 50],
] as const)(
  '%s immediately reprices remaining stock without rerolling it',
  (id, prior, total) => {
    const game = new GameOrchestrator()
    game.setCharterUnlockResolver(() => true)
    game.startNewRun(7)
    if (prior)
      expect(game.addImperialCharter(charter('discount_sale'))).toBe(true)
    const state = game.getState() as OrchestratorState
    Object.assign(state, {
      phase: 'shop',
      lastCompletedRoundType: 'Boss',
      gold: 100,
    })
    expect(game.shop.open()).toBe(true)
    // Isolate an eligible Charter offer; all remaining stock and pack contents
    // come from the real seeded shop generator.
    const offer = game.shop.state.charterOffering!
    Object.assign(offer, {
      item: charter(id),
      baseCost: 10,
      editionCost: 0,
      finalCost: Math.floor(10 * (1 - prior / 100)),
    })
    const before = json(game.shop.toState())
    const random = runRandom.toState()
    const paid = offer.finalCost
    expect(game.shop.purchase(offer.id)).toEqual({ success: true })
    const after = json(game.shop.toState())
    for (const key of ['itemOfferings', 'packOfferings'] as const) {
      expect(after.teaHouse[key]).toEqual(
        before.teaHouse[key].map((item) => {
          const cost =
            item.finalCost === 0
              ? 0
              : Math.max(
                  1,
                  Math.floor(
                    (item.baseCost + item.editionCost) * (1 - total / 100)
                  )
                )
          return { ...item, finalCost: cost, sellValue: Math.floor(cost / 2) }
        })
      )
    }
    expect(after.packs).toEqual(before.packs)
    expect(runRandom.toState()).toEqual(random)
    expect(state.gold).toBe(100 - paid)
    expect(offer.finalCost).toBe(paid)
    expect(game.shop.visitTotals).toEqual({
      goldSpent: paid,
      itemsPurchased: 1,
    })
    expect(game.shop.purchase(offer.id).success).toBe(false)
    const checkpoint = json(game.captureRun())
    game.restoreRun(checkpoint)
    expect(game.captureRun()).toEqual(checkpoint)
    const pack = game.shop.state.packOfferings[0]
    const packCost = pack.finalCost
    expect(game.shop.purchase(pack.id).success).toBe(true)
    expect(game.getState().gold).toBe(100 - paid - packCost)
    expect(game.shop.pendingPack).not.toBeNull()
    const pending = json(game.captureRun())
    game.restoreRun(pending)
    expect(game.captureRun()).toEqual(pending)
  }
)

it.each([0, 20, 25, 100])(
  'recalculates original prices with %i percent visit discount, preserving free and purchased offers',
  (visitDiscount) => {
    runRandom.start(8)
    const shop = new TeaHouseSystem()
    shop.applyCharter(charter('tile_trading'))
    shop.generateShop([], true, {
      discountPercentage: visitDiscount,
      guaranteedItemTypes: [
        'Decree',
        'FateSeal',
        'CelestialOrb',
        'VoidScript',
        'Tile',
        'BlessingPack',
      ],
    })
    const purchased = shop.getState().itemOfferings[0]
    shop.purchaseOffering(purchased.id)
    const before = json(shop.toSerializedState())
    const random = runRandom.toState()
    shop.applyCharter(charter('discount_sale'))
    shop.applyCharter(charter('liquidation_sale'))
    const after = json(shop.toSerializedState())
    for (const key of ['itemOfferings', 'packOfferings'] as const) {
      expect(after[key]).toEqual(
        before[key].map((item) => {
          if (item.isPurchased || item.finalCost === 0) return item
          const charterCost = Math.max(
            1,
            Math.floor((item.baseCost + item.editionCost) * 0.5)
          )
          const cost = Math.max(
            0,
            Math.floor(charterCost * (1 - visitDiscount / 100))
          )
          return { ...item, finalCost: cost, sellValue: Math.floor(cost / 2) }
        })
      )
    }
    expect(runRandom.toState()).toEqual(random)
    shop.applyCharter(charter('discount_sale'))
    shop.applyCharter(charter('liquidation_sale'))
    expect(json(shop.toSerializedState())).toEqual(after)
    const restored = TeaHouseSystem.fromSerializedState(json(after))
    expect(json(restored.toSerializedState())).toEqual(after)
  }
)

it('repairs stale legacy discounts on resume without raising cheaper quotes or altering receipts', () => {
  runRandom.start(8)
  const shop = new TeaHouseSystem()
  shop.applyCharter(charter('discount_sale'))
  shop.generateShop([], true, {
    guaranteedItemTypes: ['FateSeal', 'CelestialOrb', 'VoidScript'],
  })
  const legacy = json(shop.toSerializedState())
  const seal = legacy.itemOfferings[0]
  Object.assign(seal, { baseCost: 4, finalCost: 3, sellValue: 1 })
  const cheapOrb = legacy.itemOfferings[1]
  cheapOrb.finalCost = 1
  cheapOrb.sellValue = 0
  const bought = legacy.itemOfferings[2]
  Object.assign(bought, { isPurchased: true, finalCost: 4, sellValue: 2 })
  const pack = legacy.packOfferings[0]
  Object.assign(pack, { isPurchased: true, finalCost: pack.baseCost })
  const random = runRandom.toState()
  const restored = TeaHouseSystem.fromSerializedState(legacy)
  const after = json(restored.toSerializedState())
  expect(after.itemOfferings[0]).toEqual({
    ...seal,
    baseCost: 3,
    finalCost: 2,
    sellValue: 1,
  })
  expect(after.itemOfferings.slice(1)).toEqual(legacy.itemOfferings.slice(1))
  expect(after.packOfferings).toEqual(legacy.packOfferings)
  expect(runRandom.toState()).toEqual(random)
  expect(
    json(TeaHouseSystem.fromSerializedState(after).toSerializedState())
  ).toEqual(after)
})
