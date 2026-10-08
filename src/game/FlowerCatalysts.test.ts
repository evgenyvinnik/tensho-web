import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { acceptsFlowerCatalyst } from '../systems/flowerCatalysts'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useProgressionStore } from '../stores/progressionStore'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import type { BlessingPack, Decree } from '../systems/types'

beforeEach(() => {
  useProgressionStore.getState().resetProgression()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
  useProgressionStore.getState().resetProgression()
  eventBus.clear()
  runRandom.reset()
})
const catalog = (id: string) => ALL_DECREES.find((d) => d.id === id)!
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
function visit(count = 4, id = 'tanyao_dispensation') {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem = new FlowerSystem()
  state.decreeSystem = new DecreeSystem()
  state.seasonSystem.clear()
  for (let type = 1; type <= count; type++) {
    const slots = state.flowerSystem.getBonusDecreeSlots()
    state.flowerSystem.addFlower(Tile.createFlower(type, `flower-${type}`))
    if (state.flowerSystem.getBonusDecreeSlots() > slots)
      state.decreeSystem.addSlot()
  }
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
    }).success
  ).toBe(true)
  expect(state.phase).toBe('shop')
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.itemOfferings[0]
  offer.itemType = 'Decree'
  offer.item = { ...catalog(id) }
  offer.baseCost = offer.item.cost
  offer.editionCost = 0
  offer.finalCost = offer.item.cost
  offer.isPurchased = false
  offer.isLocked = false
  return { game, state, shop: game.shop, offer }
}

it('offers catalysts only for real Yaku changes, not ordinary bonuses labeled YakuDoctrine', () => {
  expect(
    ALL_DECREES.filter(acceptsFlowerCatalyst)
      .map((d) => d.id)
      .sort()
  ).toEqual([
    'decree-yaku-amplifier',
    'decree-yaku-nexus',
    'tanyao_dispensation',
  ])
  expect(acceptsFlowerCatalyst(catalog('decree-yakuman-seeker'))).toBe(false)
})

it.each(['tanyao_dispensation', 'decree-yaku-amplifier', 'decree-yaku-nexus'])(
  'spends one chosen Flower for %s with no gold spend or resale windfall',
  (id) => {
    const { game, state, shop, offer } = visit(4, id)
    state.gold = 0
    const payment = { type: 'flower' as const, flowerId: 'flower-2' }
    const before = json(game.captureRun())
    expect(shop.validatePurchase(offer.id)).toEqual({
      success: false,
      reason: 'notEnoughGold',
    })
    expect(shop.validatePurchase(offer.id, payment)).toEqual({ success: true })
    expect(game.captureRun()).toEqual(before)
    expect(shop.purchase(offer.id, payment)).toEqual({ success: true })
    expect(state.gold).toBe(0)
    expect(state.flowerSystem.getFlowerCount()).toBe(3)
    expect(state.flowerSystem.hasFlowerType('Orchid')).toBe(false)
    expect(state.flowerSystem.getEffectivenessMultiplier()).toBe(1)
    expect(shop.visitTotals).toEqual({ goldSpent: 0, itemsPurchased: 1 })
    expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(0)
    const acquired = state.decreeSystem
      .getOwnedDecrees()
      .find((d) => d.id === id)!
    expect(acquired.sellValue).toBe(0)
    expect(shop.purchase(offer.id, payment).success).toBe(false)
    const saved = parseClassicRunSnapshot(json(game.captureRun()))
    game.restoreRun(saved)
    expect(game.captureRun()).toEqual(saved)
    expect(game.sellDecree(acquired.instanceId!).success).toBe(true)
    expect(game.getState().gold).toBe(0)
    expect(game.getState().flowerSystem.hasFlowerType('Orchid')).toBe(false)
  }
)

it('keeps the normal discounted gold purchase unchanged and does not choose a Flower implicitly', () => {
  const { state, shop, offer } = visit()
  offer.finalCost = 3
  expect(shop.purchase(offer.id).success).toBe(true)
  expect(state.gold).toBe(97)
  expect(state.flowerSystem.getFlowerCount()).toBe(4)
  expect(shop.visitTotals.goldSpent).toBe(3)
  expect(state.decreeSystem.getOwnedDecrees()[0].sellValue).toBe(1)
})

it('can spend an owned Flower under Drought without erasing its earned awakening', () => {
  const { state, shop, offer } = visit()
  state.flowerSystem.unlockMutation('plum_overlap')
  state.seasonSystem.forceSetSeason('Summer', true)
  expect(
    shop.purchase(offer.id, { type: 'flower', flowerId: 'flower-1' }).success
  ).toBe(true)
  expect(state.flowerSystem.hasMutation('plum_overlap')).toBe(false)
  expect(state.flowerSystem.toState().unlockedMutations).toContain(
    'plum_overlap'
  )
  state.flowerSystem.addFlower(Tile.createFlower(FlowerType.Plum, 'new-plum'))
  expect(state.flowerSystem.hasMutation('plum_overlap')).toBe(true)
})

it.each([undefined, 'Negative'] as const)(
  'checks post-payment capacity including a %s edition',
  (edition) => {
    const { game, state, shop, offer } = visit(2)
    for (let i = 0; i < 5; i++)
      state.decreeSystem.acquireDecree(catalog('moonlit_seal'))
    offer.item = { ...offer.item, edition } as Decree
    const before = json(game.captureRun())
    const payment = { type: 'flower' as const, flowerId: 'flower-1' }
    if (!edition) {
      expect(shop.validatePurchase(offer.id, payment)).toEqual({
        success: false,
        reason: 'inventoryFull',
      })
      expect(shop.purchase(offer.id, payment)).toEqual({
        success: false,
        reason: 'inventoryFull',
      })
      expect(game.captureRun()).toEqual(before)
    } else {
      expect(shop.purchase(offer.id, payment).success).toBe(true)
      expect(state.decreeSystem.getMaxSlots()).toBe(6)
      expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(6)
      expect(state.flowerSystem.getBonusDecreeSlots()).toBe(0)
    }
  }
)

it('removes only the two-Flower slot and exposes only settled state to event observers', () => {
  const { state, shop, offer } = visit(2)
  const beforeSlots = state.decreeSystem.getMaxSlots()
  const observations: unknown[] = []
  eventBus.on('itemPurchased', ({ cost }) =>
    observations.push({
      cost,
      flowers: state.flowerSystem.getFlowerCount(),
      slots: state.decreeSystem.getMaxSlots(),
      owned: state.decreeSystem.getOwnedDecrees().length,
      bought: offer.isPurchased,
      repeat: shop.purchase(offer.id, { type: 'flower', flowerId: 'flower-2' })
        .success,
    })
  )
  expect(
    shop.purchase(offer.id, { type: 'flower', flowerId: 'flower-1' }).success
  ).toBe(true)
  expect(observations).toEqual([
    {
      cost: 0,
      flowers: 1,
      slots: beforeSlots - 1,
      owned: 1,
      bought: true,
      repeat: false,
    },
  ])
})

it('rejects missing Flowers, ordinary items, invalid quotes and stale offers without mutation', () => {
  const { game, shop, offer } = visit()
  const ordinary = catalog('moonlit_seal')
  for (const [item, flowerId, cost, locked] of [
    [offer.item, 'missing', 6, false],
    [ordinary, 'flower-1', 6, false],
    [offer.item, 'flower-1', NaN, false],
    [offer.item, 'flower-1', 6, true],
  ] as const) {
    offer.item = item
    offer.finalCost = cost
    offer.isLocked = locked
    const before = game.captureRun()
    expect(shop.purchase(offer.id, { type: 'flower', flowerId }).success).toBe(
      false
    )
    expect(game.captureRun()).toEqual(before)
  }
})

it('uses current Flowers for later stock and blocks fully ineligible pre-generated packs before charging', () => {
  const { game, state, shop, offer } = visit(3)
  const flowerDecree = ALL_DECREES.find((d) => d.flowerRequirement === 3)!
  const packOffer = shop.state.packOfferings[0]
  const pack = shop.packOfferings.find(
    (p) => p.pack.id === (packOffer.item as BlessingPack).id
  )!
  pack.contents = [
    {
      id: flowerDecree.id,
      type: 'Decree',
      name: flowerDecree.name,
      description: flowerDecree.description,
      rarity: 'rare',
      data: flowerDecree,
    },
  ]
  expect(
    shop.purchase(offer.id, { type: 'flower', flowerId: 'flower-1' }).success
  ).toBe(true)
  expect(shop.toState().teaHouse.flowerCountForVisit).toBe(2)
  const before = game.captureRun()
  expect(shop.validatePurchase(packOffer.id)).toEqual({
    success: false,
    reason: 'flowerRequirement',
  })
  expect(shop.purchase(packOffer.id)).toEqual({
    success: false,
    reason: 'flowerRequirement',
  })
  expect(game.captureRun()).toEqual(before)
  expect(shop.reroll().success).toBe(true)
  for (const stock of shop.state.itemOfferings)
    if (stock.itemType === 'Decree')
      expect((stock.item as Decree).flowerRequirement ?? 0).toBeLessThanOrEqual(
        state.flowerSystem.getFlowerCount()
      )
})

it('retains run-earned awakening and historical four-type progress across spending and reload', () => {
  const flowers = new FlowerSystem()
  for (const type of [
    FlowerType.Plum,
    FlowerType.Orchid,
    FlowerType.Chrysanthemum,
  ])
    flowers.addFlower(Tile.createFlower(type, `owned-${type}`))
  flowers.consumeFlower('owned-1')
  const restored = FlowerSystem.fromState(json(flowers.toState()))
  expect(restored.toState()).toEqual(flowers.toState())
  restored.addFlower(Tile.createFlower(FlowerType.Bamboo, 'bamboo'))
  expect(restored.canRebloom()).toBe(true)
  expect(restored.getFlowerCount()).toBe(3)
  restored.addFlower(Tile.createFlower(FlowerType.Bamboo, 'duplicate'))
  expect(restored.hasMutation('bamboo_wild_anchor')).toBe(true)
  restored.consumeFlower('bamboo')
  expect(restored.hasMutation('bamboo_wild_anchor')).toBe(false)
  const again = FlowerSystem.fromState(json(restored.toState()))
  again.addFlower(Tile.createFlower(FlowerType.Bamboo, 'new-bamboo'))
  expect(again.hasMutation('bamboo_wild_anchor')).toBe(true)
  expect(again.canRebloom()).toBe(true)
})

it('keeps mixed packs usable while rejecting only the Flower-ineligible choice', () => {
  const { game, shop, offer, state } = visit(3)
  const gated = ALL_DECREES.find((d) => d.flowerRequirement === 3)!
  const ordinary = catalog('moonlit_seal')
  const packOffer = shop.state.packOfferings[0]
  const pack = shop.packOfferings.find(
    (p) => p.pack.id === (packOffer.item as BlessingPack).id
  )!
  pack.contents = [gated, ordinary].map((data) => ({
    id: data.id,
    type: 'Decree',
    name: data.name,
    description: data.description,
    rarity: 'rare',
    data,
  }))
  expect(
    shop.purchase(offer.id, { type: 'flower', flowerId: 'flower-1' }).success
  ).toBe(true)
  expect(shop.purchase(packOffer.id).success).toBe(true)
  const before = json(game.captureRun())
  expect(shop.validatePackSelection([0])).toEqual({
    success: false,
    reason: 'flowerRequirement',
  })
  expect(shop.confirmPack([0])).toEqual({
    success: false,
    reason: 'flowerRequirement',
  })
  expect(game.captureRun()).toEqual(before)
  expect(shop.confirmPack([1])).toEqual({ success: true })
  expect(
    state.decreeSystem.getOwnedDecrees().some((d) => d.id === ordinary.id)
  ).toBe(true)
  expect(
    state.decreeSystem.getOwnedDecrees().some((d) => d.id === gated.id)
  ).toBe(false)
})

it('preserves editions and Rental obligations without turning Flower payment into gold resale', () => {
  const { state, shop, offer, game } = visit(4)
  offer.item = {
    ...catalog('tanyao_dispensation'),
    edition: 'Holographic',
    stickers: [{ type: 'Rental', goldPerRound: 3 }],
  }
  expect(
    shop.purchase(offer.id, { type: 'flower', flowerId: 'flower-1' }).success
  ).toBe(true)
  const acquired = state.decreeSystem.getOwnedDecrees()[0]
  expect(acquired.edition).toBe('Holographic')
  expect(acquired.stickers).toEqual([{ type: 'Rental', goldPerRound: 3 }])
  expect(acquired.sellValue).toBe(0)
  const saved = parseClassicRunSnapshot(json(game.captureRun()))
  game.restoreRun(saved)
  expect(game.getState().decreeSystem.getOwnedDecrees()[0]).toEqual(acquired)
})

it('rejects forged Flower history but preserves legacy history-free snapshots exactly', () => {
  const { game } = visit(2)
  const saved = json(game.captureRun())
  expect(saved.state.flowerSystem.collectedTypes).toBeUndefined()
  game.restoreRun(parseClassicRunSnapshot(saved))
  expect(game.captureRun()).toEqual(saved)
  for (const history of [
    ['Plum'],
    ['Plum', 'Orchid', 'Plum'],
    ['Plum', 'Fake'],
  ]) {
    const bad = json(saved)
    Object.assign(bad.state.flowerSystem, { collectedTypes: history })
    expect(() => parseClassicRunSnapshot(bad)).toThrow()
  }
})

it('earns the four-type profile unlock through real draws across catalyst consumption and resume', () => {
  const game = new GameOrchestrator()
  let index = 0
  const startingDraw = vi
    .spyOn(
      game as unknown as { drawTileInternal(): Tile | null },
      'drawTileInternal'
    )
    .mockImplementation(
      () => new Tile(TileSuit.Manzu, (++index % 9) + 1, `starting-${index}`)
    )
  game.startNewRun(7)
  startingDraw.mockRestore()
  const state = game.getState() as OrchestratorState
  const tail = (prefix: string) =>
    Array.from(
      { length: 40 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `${prefix}-${i}`)
    )
  state.wall = [
    ...[1, 2, 3].map((type) => Tile.createFlower(type, `real-flower-${type}`)),
    ...tail('first-tail'),
  ]
  state.deadWall = Array.from(
    { length: 20 },
    (_, i) => new Tile(TileSuit.Wind, 1, `replacement-${i}`)
  )
  state.drawIndex = 0
  const discard = () =>
    expect(
      game.processAction({ type: 'discard', tileId: game.getHandTiles()[0].id })
        .success
    ).toBe(true)
  for (let i = 0; i < 3; i++) discard()
  expect(state.flowerSystem.getFlowerCount()).toBe(3)
  expect(useProgressionStore.getState().isItemUnlocked('bamboo_mat')).toBe(
    false
  )
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((tile) => tile.id),
    }).success
  ).toBe(true)
  game.shop.open()
  const offer = game.shop.state.itemOfferings[0]
  Object.assign(offer, {
    itemType: 'Decree',
    item: catalog('tanyao_dispensation'),
    baseCost: 6,
    editionCost: 0,
    finalCost: 6,
    edition: undefined,
    isPurchased: false,
    isLocked: false,
  })
  expect(
    game.shop.purchase(offer.id, { type: 'flower', flowerId: 'real-flower-1' })
      .success
  ).toBe(true)
  state.wallTemplate = state.wallTemplate.filter((tile) => !tile.isBonus)
  const saved = parseClassicRunSnapshot(json(game.captureRun()))
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
  game.exitShop()
  const next = game.getState() as OrchestratorState
  next.wall = [
    Tile.createFlower(FlowerType.Bamboo, 'real-bamboo'),
    ...tail('next-tail'),
  ]
  next.drawIndex = 0
  discard()
  expect(next.flowerSystem.getFlowerCount()).toBe(3)
  expect(next.flowerSystem.canRebloom()).toBe(true)
  expect(useProgressionStore.getState().isItemUnlocked('bamboo_mat')).toBe(true)
  expect(next.flowerSystem.hasMutation('bamboo_wild_anchor')).toBe(false)
  next.wall = [
    Tile.createFlower(FlowerType.Bamboo, 'duplicate-bamboo'),
    ...tail('duplicate-tail'),
  ]
  next.drawIndex = 0
  discard()
  expect(next.flowerSystem.hasMutation('bamboo_wild_anchor')).toBe(true)
})
