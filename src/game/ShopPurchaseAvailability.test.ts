import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { Tile, TileSuit } from '../core/Tile'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  vi.restoreAllMocks()
})
function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.phase = 'shop'
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.itemOfferings[0]
  Object.assign(offer, {
    itemType: 'Decree',
    item: ALL_DECREES.find((d) => d.id === 'decree-polished-stone')!,
    finalCost: 4,
    isPurchased: false,
    isLocked: false,
  })
  state.decreeSystem = new DecreeSystem(1)
  return { game, state, offer, shop: game.shop }
}

it('repeated checks leave the complete run snapshot and event stream unchanged', () => {
  const { game, shop } = fixture()
  const changed = vi.fn()
  for (const event of ['goldChanged', 'shopUpdated', 'decreeAcquired'] as const)
    eventBus.on(event, changed)
  const before = game.captureRun()
  const ids = [...shop.state.itemOfferings, ...shop.state.packOfferings].map(
    (o) => o.id
  )
  for (let i = 0; i < 10; i++) for (const id of ids) shop.validatePurchase(id)
  expect(game.captureRun()).toEqual(before)
  expect(changed).not.toHaveBeenCalled()
})

it.each(['missing', 'locked', 'purchased', 'poor', 'nan', 'phase', 'closed'])(
  'preflight and commitment agree for %s without side effects',
  (kind) => {
    const { game, state, offer, shop } = fixture()
    if (kind === 'locked') offer.isLocked = true
    if (kind === 'purchased') offer.isPurchased = true
    if (kind === 'poor') state.gold = 0
    if (kind === 'nan') offer.finalCost = NaN
    if (kind === 'phase') state.phase = 'gameplay'
    if (kind === 'closed') shop.close()
    const id = kind === 'missing' ? 'missing' : offer.id
    const before = game.captureRun()
    const expected = shop.validatePurchase(id)
    expect(expected).toEqual({
      success: false,
      reason: kind === 'poor' ? 'notEnoughGold' : 'unavailable',
    })
    expect(shop.purchase(id)).toEqual(expected)
    expect(game.captureRun()).toEqual(before)
  }
)

it('distinguishes Flowers from capacity and reevaluates both when the build changes', () => {
  const { shop, offer, state } = fixture()
  state.flowerSystem.clear()
  offer.item = { ...ALL_DECREES[0], flowerRequirement: 3 }
  expect(shop.validatePurchase(offer.id)).toEqual({
    success: false,
    reason: 'flowerRequirement',
  })
  expect(shop.purchase(offer.id)).toEqual(shop.validatePurchase(offer.id))
  for (let rank = 1; rank <= 3; rank++)
    state.flowerSystem.addFlower(
      new Tile(TileSuit.Flower, rank, `test-flower-${rank}`)
    )
  expect(shop.validatePurchase(offer.id)).toEqual({ success: true })
  state.decreeSystem.acquireDecree(ALL_DECREES[0])
  expect(shop.validatePurchase(offer.id)).toEqual({
    success: false,
    reason: 'inventoryFull',
  })
})

it('allows Negative expansion, but does not pretend selling a Negative creates a free slot', () => {
  const { game, state, offer, shop } = fixture()
  state.decreeSystem.acquireDecree(ALL_DECREES[0])
  expect(shop.validatePurchase(offer.id)).toEqual({
    success: false,
    reason: 'inventoryFull',
  })
  offer.item = { ...ALL_DECREES[0], edition: 'Negative' }
  expect(shop.validatePurchase(offer.id)).toEqual({ success: true })
  expect(shop.purchase(offer.id).success).toBe(true)
  const negative = state.decreeSystem.getOwnedDecrees()[1]
  expect(game.sellDecree(negative.instanceId!).success).toBe(true)
  const next = shop.state.itemOfferings[1]
  Object.assign(next, {
    itemType: 'Decree',
    item: ALL_DECREES[0],
    finalCost: 0,
  })
  expect(shop.validatePurchase(next.id)).toEqual({
    success: false,
    reason: 'inventoryFull',
  })
})

it('checks shared consumable capacity and prevents a stale successful preview from paying', () => {
  const { game, state, offer, shop } = fixture()
  const seal = () =>
    FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_sage)
  offer.itemType = 'FateSeal'
  offer.item = seal()
  expect(shop.validatePurchase(offer.id)).toEqual({ success: true })
  state.fateSeals = [seal(), seal(), seal()]
  const before = game.captureRun()
  expect(shop.purchase(offer.id)).toEqual({
    success: false,
    reason: 'inventoryFull',
  })
  expect(game.captureRun()).toEqual(before)
  state.fateSeals.pop()
  expect(shop.validatePurchase(offer.id)).toEqual({ success: true })
  expect(shop.purchase(offer.id).success).toBe(true)
  expect(shop.validatePurchase(offer.id)).toEqual({
    success: false,
    reason: 'unavailable',
  })
})

it('keeps pack contents hidden and blocks other purchases while a paid choice is pending', () => {
  const { shop, offer } = fixture()
  const pack = shop.state.packOfferings[0]
  expect(shop.validatePurchase(pack.id)).toEqual({ success: true })
  expect(shop.pendingPack).toBeNull()
  expect(shop.purchase(pack.id).success).toBe(true)
  expect(shop.validatePurchase(offer.id)).toEqual({
    success: false,
    reason: 'unavailable',
  })
})

it('reports unavailable inside transaction event callbacks without reentrant purchases', () => {
  const { shop, offer } = fixture()
  const observer = vi.fn(() =>
    shop.validatePurchase(shop.state.itemOfferings[1].id)
  )
  eventBus.on('goldChanged', observer)
  expect(shop.purchase(offer.id).success).toBe(true)
  expect(observer).toHaveReturnedWith({ success: false, reason: 'unavailable' })
})
