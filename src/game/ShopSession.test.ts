import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  BlessingPackSystem,
  type PackContent,
} from '../systems/BlessingPackSystem'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
} from '../systems/TeaHouseSystem'
import { ALL_DECREES } from '../systems/DecreeSystem'
import type { FateSeal } from '../systems/FateSealSystem'
import type { BlessingPack, Decree } from '../systems/types'
import { FlowerType, Tile } from '../core/Tile'

// Explicit integration fixtures: these isolate transactions, not progression balance.
function visit(style = 'green_felt', afterBoss = false) {
  const game = new GameOrchestrator()
  game.startNewRun(7, 1, style)
  const state = game.getState() as OrchestratorState
  state.phase = 'shop'
  state.lastCompletedRoundType = afterBoss ? 'Boss' : 'Small'
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  return { game, state, shop: game.shop }
}

function seals(): PackContent[] {
  return new BlessingPackSystem().generateOfferingsForPacks([
    {
      id: 'fixture-seals',
      type: 'Arcana',
      size: 'Mega',
      cost: 8,
      choiceCount: 5,
      selectCount: 2,
    },
  ])[0].contents
}

function packFixture(game: GameOrchestrator, contents = seals()) {
  const offer = game.shop.state.packOfferings[0]
  const pack = game.shop.packOfferings.find(
    (p) => p.pack.id === (offer.item as BlessingPack).id
  )!
  pack.contents = contents
  pack.maxSelections = 2
  offer.finalCost = 8
  return { offer, pack, contents }
}

afterEach(() => {
  eventBus.clear()
  vi.restoreAllMocks()
})

describe('run-owned shop transactions', () => {
  it('opens a visit once without consuming another Omen or replacing offers', () => {
    const { game, shop } = visit()
    const prepare = vi.spyOn(game, 'prepareShopVisit')
    const first = shop.state
    const packs = shop.packOfferings
    expect(shop.open()).toBe(true)
    expect(shop.open()).toBe(true)
    expect(prepare).not.toHaveBeenCalled()
    expect(shop.state).toEqual(first)
    expect(shop.packOfferings).toEqual(packs)
  })

  it('does not open or mutate offers outside an active shop phase', () => {
    const game = new GameOrchestrator()
    expect(game.shop.open()).toBe(false)
    game.startNewRun(7)
    expect(game.shop.open()).toBe(false)
    expect(game.shop.purchase('missing')).toEqual({
      success: false,
      reason: 'unavailable',
    })
    expect(game.shop.state.itemOfferings).toHaveLength(0)
  })

  it('rejects wrong-phase, unaffordable, locked and non-finite purchases without marking or charging', () => {
    const { shop, state } = visit()
    const offer = shop.state.itemOfferings[0]
    state.phase = 'gameplay'
    expect(shop.purchase(offer.id).success).toBe(false)
    state.phase = 'shop'
    for (const cost of [NaN, Infinity, -1, 101]) {
      offer.finalCost = cost
      expect(shop.purchase(offer.id).success).toBe(false)
      expect(offer.isPurchased).toBe(false)
      expect(state.gold).toBe(100)
    }
    offer.finalCost = 0
    offer.isLocked = true
    expect(shop.purchase(offer.id).success).toBe(false)
    expect(state.gold).toBe(100)
  })

  it('rejects non-finite direct payment inputs', () => {
    const { game, state } = visit()
    expect(game.purchaseItem('bad', NaN)).toBe(false)
    expect(game.purchaseItem('bad', Infinity)).toBe(false)
    expect(state.gold).toBe(100)
  })

  it('grants an ordinary item exactly once and publishes only settled inventory', () => {
    const { shop, state } = visit()
    const offer = shop.state.itemOfferings[0]
    offer.itemType = 'FateSeal'
    offer.item = seals()[0].data as FateSeal
    offer.finalCost = 4
    const observer = vi.fn(() => ({
      inventory: state.fateSeals.length,
      purchased: offer.isPurchased,
      repeat: shop.purchase(offer.id).success,
      close: shop.close(),
    }))
    eventBus.on('goldChanged', observer)
    expect(shop.purchase(offer.id).success).toBe(true)
    expect(observer).toHaveBeenCalledOnce()
    expect(observer).toHaveReturnedWith({
      inventory: 1,
      purchased: true,
      repeat: false,
      close: false,
    })
    expect(shop.purchase(offer.id).success).toBe(false)
    expect(state.gold).toBe(96)
    expect(shop.visitTotals).toEqual({ goldSpent: 4, itemsPurchased: 1 })
  })

  it('does not charge or mark an ordinary consumable when the shared inventory is full', () => {
    const { shop, state } = visit()
    const contents = seals()
    state.fateSeals = contents.slice(0, 3).map((c) => c.data as FateSeal)
    const offer = shop.state.itemOfferings[0]
    offer.itemType = 'FateSeal'
    offer.item = contents[3].data as FateSeal
    expect(shop.purchase(offer.id)).toEqual({
      success: false,
      reason: 'inventoryFull',
    })
    expect(offer.isPurchased).toBe(false)
    expect(state.gold).toBe(100)
    expect(state.fateSeals).toHaveLength(3)
  })

  it('validates Decree requirements, not just slot capacity', () => {
    const { shop, state } = visit()
    state.flowerSystem.clear()
    const offer = shop.state.itemOfferings[0]
    offer.itemType = 'Decree'
    offer.item = { ...ALL_DECREES[0], flowerRequirement: 4 }
    expect(shop.purchase(offer.id).success).toBe(false)
    expect(state.gold).toBe(100)
    expect(offer.isPurchased).toBe(false)
  })

  it('retains a bought Mega pack when its combined rewards cannot fit, without partial grants', () => {
    const { game, shop, state } = visit()
    const { offer, contents } = packFixture(game)
    state.fateSeals = contents.slice(2, 4).map((c) => c.data as FateSeal)
    expect(shop.purchase(offer.id).success).toBe(true)
    const pending = shop.pendingPack
    expect(shop.confirmPack([0, 1])).toEqual({
      success: false,
      reason: 'inventoryFull',
    })
    expect(state.fateSeals).toHaveLength(2)
    expect(state.gold).toBe(92)
    expect(shop.pendingPack).toBe(pending)
    expect(shop.confirmPack([1]).success).toBe(true)
    expect(state.fateSeals).toHaveLength(3)
    expect(state.fateSeals[2]).toBe(contents[1].data)
    expect(shop.pendingPack).toBeNull()
    expect(shop.confirmPack([0]).success).toBe(false)
    expect(state.gold).toBe(92)
  })

  it.each([[0, 0], [], [NaN], [0.5], [-1], [99], [0, 1, 2]])(
    'rejects invalid selection %j and preserves the open pack',
    (...indices) => {
      const { game, shop, state } = visit()
      const { offer } = packFixture(game)
      shop.purchase(offer.id)
      expect(shop.confirmPack(indices).success).toBe(false)
      expect(shop.pendingPack).not.toBeNull()
      expect(state.fateSeals).toHaveLength(0)
      expect(state.gold).toBe(92)
    }
  )

  it('retains pending choices across reopening and blocks exit, reroll, or another purchase', () => {
    const { game, shop, state } = visit()
    const { offer } = packFixture(game)
    shop.purchase(offer.id)
    const pending = shop.pendingPack
    shop.open()
    expect(shop.pendingPack).toBe(pending)
    expect(shop.reroll().success).toBe(false)
    expect(shop.purchase(shop.state.itemOfferings[0].id).success).toBe(false)
    game.exitShop()
    expect(state.phase).toBe('shop')
    expect(shop.skipPack().success).toBe(true)
    expect(shop.skipPack().success).toBe(false)
    game.exitShop()
    expect(state.phase).toBe('gameplay')
    expect(shop.isOpen).toBe(false)
  })

  it('rejects Temple Flower pack rewards without settling the pack', () => {
    const { game, shop, state } = visit('temple_stone')
    const { offer } = packFixture(game, [
      {
        id: 'flower',
        type: 'Tile',
        name: 'Plum',
        description: '',
        rarity: 'common',
        data: Tile.createFlower(FlowerType.Plum),
      },
    ])
    shop.purchase(offer.id)
    expect(shop.confirmPack([0]).success).toBe(false)
    expect(shop.pendingPack).not.toBeNull()
    expect(state.wallTemplate.some((tile) => tile.isFlower)).toBe(false)
  })

  it('validates Negative Decrees in the same order they are granted', () => {
    const { game, shop, state } = visit()
    const ordinary: Decree = {
      ...ALL_DECREES[0],
      edition: undefined,
      flowerRequirement: undefined,
    }
    while (state.decreeSystem.acquireDecree(ordinary)) {
      /* Fill slots. */
    }
    const negative: Decree = {
      ...ordinary,
      id: 'fixture-negative',
      edition: 'Negative',
    }
    const contents: PackContent[] = [negative, negative].map((d, i) => ({
      id: `negative-${i}`,
      type: 'Decree',
      name: d.name,
      description: '',
      rarity: 'common',
      data: { ...d, id: `negative-${i}` },
    }))
    const { offer } = packFixture(game, contents)
    shop.purchase(offer.id)
    const count = state.decreeSystem.getOwnedDecrees().length
    expect(shop.confirmPack([0, 1]).success).toBe(true)
    expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(count + 2)
  })

  it('resets pending packs, reroll costs and purchased charters for a new run', () => {
    const { game, shop, state } = visit()
    const charter = TEA_HOUSE_BASE_CHARTERS[0]
    game.addImperialCharter(charter)
    shop.reroll()
    const { offer } = packFixture(game)
    shop.purchase(offer.id)
    expect(shop.pendingPack).not.toBeNull()
    game.startNewRun(9)
    expect(shop.isOpen).toBe(false)
    expect(shop.pendingPack).toBeNull()
    expect(shop.state.itemOfferings).toHaveLength(0)
    expect(game.getState().charterSystem.getPurchasedIds().size).toBe(0)
    expect(game.getState()).not.toBe(state)
    game.resetGame()
    expect(shop.open()).toBe(false)
  })

  it('redeems a Charter through the purchase path and carries its shop slots into later visits once', () => {
    const { shop, state } = visit('green_felt', true)
    const charter = TEA_HOUSE_BASE_CHARTERS.find(
      (c) => c.id === 'abundant_stock'
    )!
    const offer = shop.state.charterOffering!
    offer.item = charter
    offer.finalCost = 10
    expect(shop.purchase(offer.id).success).toBe(true)
    expect(state.charterSystem.getPurchasedIds().has(charter.id)).toBe(true)
    expect(state.gold).toBe(90)
    expect(shop.purchase(offer.id).success).toBe(false)
    for (let visitNumber = 0; visitNumber < 2; visitNumber++) {
      expect(shop.close()).toBe(true)
      expect(shop.open()).toBe(true)
      expect(shop.state.itemOfferings).toHaveLength(3)
    }
  })

  it('charges rerolls once, preserves packs and charter, and rejects insufficient funds', () => {
    const { shop, state } = visit()
    const before = shop.state
    state.gold = 0
    expect(shop.reroll().success).toBe(false)
    expect(shop.state).toEqual(before)
    state.gold = 100
    expect(shop.reroll().success).toBe(true)
    expect(state.gold).toBe(100 - before.currentRerollCost)
    expect(shop.state.rerollsThisVisit).toBe(1)
    expect(shop.state.packOfferings).toEqual(before.packOfferings)
    expect(shop.state.charterOffering).toEqual(before.charterOffering)
    expect(shop.state.itemOfferings).not.toEqual(before.itemOfferings)
  })

  it('gives identically typed packs distinct identities within the same millisecond', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1)
    const system = new TeaHouseSystem(1, () => 0)
    const packs = system
      .generateShop([], false)
      .packOfferings.map((o) => o.item as BlessingPack)
    expect(packs[0].type).toBe(packs[1].type)
    expect(packs[0].size).toBe(packs[1].size)
    expect(packs[0].id).not.toBe(packs[1].id)
  })
})
