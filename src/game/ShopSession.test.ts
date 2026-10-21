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
import { decreeKey } from '../systems/decreeIdentity'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import {
  FATE_SEALS,
  FateSealSystem,
  type FateSeal,
} from '../systems/FateSealSystem'
import type { BlessingPack, Decree } from '../systems/types'
import { FlowerType, Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { firstSealTargets } from '../gameplay/wallSeals'

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

const seal = (id: string) =>
  FateSealSystem.createFateSealInstance(FATE_SEALS[id])

function sealContent(item: FateSeal): PackContent {
  return {
    id: item.instanceId,
    type: 'FateSeal',
    name: item.name,
    description: item.description,
    rarity: 'common',
    data: item,
  }
}

/** The first offer, made a Seal at a known price. */
function sealOffer(shop: GameOrchestrator['shop'], item: FateSeal) {
  const offer = shop.state.itemOfferings[0]
  Object.assign(offer, { itemType: 'FateSeal', item, finalCost: 4 })
  return offer
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

/** A Mega pack of five Decrees, with one Decree slot left free. */
function decreePackFixture(game: GameOrchestrator, state: OrchestratorState) {
  const catalog = ALL_DECREES.filter((d) => !d.flowerRequirement)
  const fixture = packFixture(
    game,
    catalog.slice(0, 5).map((decree, i) => ({
      id: `fixture-decree:${i}`,
      type: 'Decree',
      name: decree.name,
      description: decree.description,
      rarity: 'common',
      data: decree,
    }))
  )
  const owned = catalog.slice(5)
  while (state.decreeSystem.getAvailableSlots() > 1)
    state.decreeSystem.acquireDecree(owned.shift()!)
  return fixture
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

  it('uses a bought Seal exactly once on the chosen wall tiles and publishes only settled state', () => {
    const { game, shop, state } = visit()
    const offer = sealOffer(shop, seal('seal_of_the_alchemist'))
    const targets = firstSealTargets(
      offer.item as FateSeal,
      game.getSealableWallTiles()
    )
    const lucky = () =>
      state.wallTemplate.filter(
        (tile) =>
          targets.includes(tile.id) &&
          tile.enhancement === EnhancementType.Lucky
      ).length
    const observer = vi.fn(() => ({
      lucky: lucky(),
      held: state.fateSeals.length,
      purchased: offer.isPurchased,
      repeat: shop.purchase(offer.id, { type: 'gold' }, targets).success,
      close: shop.close(),
    }))
    eventBus.on('goldChanged', observer)
    // Before the tiles are chosen it can be bought, but not paid for.
    expect(shop.validatePurchase(offer.id)).toEqual({ success: true })
    expect(shop.purchase(offer.id)).toEqual({
      success: false,
      reason: 'sealUnusable',
      detail: 'Select exactly 2 tiles',
    })
    expect(state.gold).toBe(100)
    expect(shop.purchase(offer.id, { type: 'gold' }, targets).success).toBe(
      true
    )
    expect(observer).toHaveBeenCalledOnce()
    expect(observer).toHaveReturnedWith({
      lucky: 2,
      held: 0,
      purchased: true,
      repeat: false,
      close: false,
    })
    expect(shop.purchase(offer.id, { type: 'gold' }, targets).success).toBe(
      false
    )
    expect(state.gold).toBe(96)
    expect(shop.visitTotals).toEqual({ goldSpent: 4, itemsPurchased: 1 })
  })

  it('changes the wall for the rest of the run, through a save and the next round', () => {
    const { game, shop, state } = visit()
    const offer = sealOffer(shop, seal('seal_of_manzu'))
    const targets = game
      .getSealableWallTiles()
      .filter((tile) => tile.suit === TileSuit.Souzu && tile.rank === 7)
      .slice(0, 3)
      .map((tile) => tile.id)
    expect(shop.purchase(offer.id, { type: 'gold' }, targets).success).toBe(
      true
    )
    const converted = (tiles: readonly Tile[]) =>
      tiles
        .filter((tile) => targets.includes(tile.id))
        .map((tile) => `${tile.suit}${tile.rank}`)
    expect(converted(state.wallTemplate)).toEqual([
      `${TileSuit.Manzu}7`,
      `${TileSuit.Manzu}7`,
      `${TileSuit.Manzu}7`,
    ])
    const restored = new GameOrchestrator()
    restored.restoreRun(
      JSON.parse(JSON.stringify(game.captureRun())) as ReturnType<
        GameOrchestrator['captureRun']
      >
    )
    expect(converted(restored.getState().wallTemplate)).toEqual(
      converted(state.wallTemplate)
    )
    game.exitShop()
    const round = game.getState()
    expect(
      converted([...round.wall, ...round.deadWall, ...round.handTiles])
    ).toEqual(converted(state.wallTemplate))
  })

  it('refuses wall tiles a Seal cannot change without charging or marking the offer', () => {
    const { game, shop, state } = visit()
    const offer = sealOffer(shop, seal('seal_of_manzu'))
    const wall = game.getSealableWallTiles()
    const manzu = wall.find((tile) => tile.suit === TileSuit.Manzu)!
    const bonus = state.wallTemplate.find((tile) => tile.isBonus)!
    for (const targets of [[manzu.id], [bonus.id], ['missing'], []])
      expect(shop.purchase(offer.id, { type: 'gold' }, targets)).toMatchObject({
        success: false,
        reason: 'sealUnusable',
      })
    expect(state.gold).toBe(100)
    expect(offer.isPurchased).toBe(false)
    expect(state.wallTemplate.find((t) => t.id === manzu.id)).toBe(manzu)
  })

  it('pays before a Seal works: the Hermit doubles the gold left after its price', () => {
    const { shop, state } = visit()
    state.gold = 14
    const offer = sealOffer(shop, seal('seal_of_the_hermit'))
    expect(shop.purchase(offer.id).success).toBe(true)
    expect(state.gold).toBe(20)
    expect(state.fateSeals).toHaveLength(0)
  })

  it('names why a Seal has nothing to work on before it is bought', () => {
    const { game, shop, state } = visit()
    game.setConsumableUnlockResolver(() => true)
    const fool = sealOffer(shop, seal('seal_of_the_fool'))
    expect(shop.validatePurchase(fool.id)).toEqual({
      success: false,
      reason: 'sealUnusable',
      detail: 'No Fate Seal or Celestial Orb has been used this run',
    })
    while (state.celestialOrbSystem.canUpgradeAnyYaku())
      state.celestialOrbSystem.useOrb(
        CelestialOrbSystem.createCelestialOrbInstance(
          CELESTIAL_ORBS.black_hole_orb
        )
      )
    const voidSeal = sealOffer(shop, seal('seal_of_the_void'))
    expect(shop.validatePurchase(voidSeal.id)).toEqual({
      success: false,
      reason: 'maxLevel',
    })
    expect(state.gold).toBe(100)
  })

  it('buys a consumable however many are already held; only Decrees have slots', () => {
    const { game, shop, state } = visit()
    const contents = seals()
    state.fateSeals = contents.slice(0, 4).map((c) => c.data as FateSeal)
    const offer = sealOffer(shop, seal('seal_of_glass'))
    const targets = firstSealTargets(
      offer.item as FateSeal,
      game.getSealableWallTiles()
    )
    expect(shop.purchase(offer.id, { type: 'gold' }, targets).success).toBe(
      true
    )
    expect(offer.isPurchased).toBe(true)
    expect(state.gold).toBe(96)
    // The bought Seal is used at once; the held ones wait for the table.
    expect(state.fateSeals).toHaveLength(4)
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

  it('uses both Seals chosen from a Mega pack, the second on the wall the first leaves', () => {
    const { game, shop, state } = visit()
    const release = seal('seal_of_release')
    const manzu = seal('seal_of_manzu')
    const { offer } = packFixture(game, [
      sealContent(release),
      sealContent(manzu),
      sealContent(seal('seal_of_glass')),
    ])
    state.fateSeals = [seal('seal_of_glass')]
    const bamboo = game
      .getSealableWallTiles()
      .filter((tile) => tile.suit === TileSuit.Souzu)
      .map((tile) => tile.id)
    expect(shop.purchase(offer.id).success).toBe(true)
    expect(shop.validatePackSelection([0, 1])).toEqual({ success: true })
    // Converting a tile the Release has just destroyed is refused whole.
    const before = JSON.stringify(game.captureRun())
    expect(
      shop.confirmPack([0, 1], {
        0: bamboo.slice(0, 2),
        1: bamboo.slice(1, 3),
      })
    ).toMatchObject({ success: false, reason: 'sealUnusable' })
    expect(JSON.stringify(game.captureRun())).toBe(before)
    expect(
      shop.confirmPack([0, 1], {
        0: bamboo.slice(0, 2),
        1: bamboo.slice(2, 5),
      }).success
    ).toBe(true)
    const wall = new Map(state.wallTemplate.map((tile) => [tile.id, tile]))
    expect(bamboo.slice(0, 2).some((id) => wall.has(id))).toBe(false)
    expect(bamboo.slice(2, 5).map((id) => wall.get(id)!.suit)).toEqual([
      TileSuit.Manzu,
      TileSuit.Manzu,
      TileSuit.Manzu,
    ])
    expect(state.fateSeals).toHaveLength(1)
    expect(shop.pendingPack).toBeNull()
  })

  it('refuses a pack choice whose Seal has nothing to work on, keeping the pack open', () => {
    const { game, shop, state } = visit()
    const { offer } = packFixture(game, [
      sealContent(seal('seal_of_the_fool')),
      sealContent(seal('seal_of_the_hermit')),
    ])
    expect(shop.purchase(offer.id).success).toBe(true)
    expect(shop.validatePackSelection([0])).toEqual({
      success: false,
      reason: 'sealUnusable',
      detail: 'No Fate Seal or Celestial Orb has been used this run',
    })
    expect(shop.confirmPack([0]).success).toBe(false)
    expect(shop.pendingPack).not.toBeNull()
    // A Seal that takes no tiles is used as it is claimed.
    expect(shop.confirmPack([1]).success).toBe(true)
    expect(state.gold).toBe(92 + 20)
    expect(state.fateSeals).toHaveLength(0)
  })

  it('retains a bought Mega pack when its combined Decrees cannot fit, without partial grants', () => {
    const { game, shop, state } = visit()
    const { offer, contents } = decreePackFixture(game, state)
    const held = state.decreeSystem.getOwnedDecrees().length
    expect(shop.purchase(offer.id).success).toBe(true)
    const pending = shop.pendingPack
    expect(shop.confirmPack([0, 1])).toEqual({
      success: false,
      reason: 'inventoryFull',
    })
    expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(held)
    expect(state.gold).toBe(92)
    expect(shop.pendingPack).toBe(pending)
    expect(shop.confirmPack([1]).success).toBe(true)
    expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(held + 1)
    expect(state.decreeSystem.getOwnedDecrees()[held].id).toBe(
      (contents[1].data as Decree).id
    )
    expect(shop.pendingPack).toBeNull()
    expect(shop.confirmPack([0]).success).toBe(false)
    expect(state.gold).toBe(92)
  })

  it('frees a slot for both Decrees of an open Mega pack when an owned one is sold', () => {
    const { game, shop, state } = visit()
    const { offer, contents } = decreePackFixture(game, state)
    const held = state.decreeSystem.getOwnedDecrees().length
    expect(shop.purchase(offer.id).success).toBe(true)
    const pending = shop.pendingPack
    expect(shop.validatePackSelection([0, 1])).toEqual({
      success: false,
      reason: 'inventoryFull',
    })
    const [sold] = state.decreeSystem.getOwnedDecrees()
    expect(game.sellDecree(decreeKey(sold)).success).toBe(true)
    expect(state.gold).toBe(92 + (sold.sellValue ?? Math.floor(sold.cost / 2)))
    // The paid pack waits through the sale, and the freed slot takes its pair.
    expect(shop.pendingPack).toBe(pending)
    expect(shop.confirmPack([0, 1]).success).toBe(true)
    const owned = state.decreeSystem.getOwnedDecrees()
    expect(owned).toHaveLength(held + 1)
    expect(owned.slice(-2).map((d) => d.id)).toEqual(
      contents.slice(0, 2).map((content) => (content.data as Decree).id)
    )
    expect(shop.pendingPack).toBeNull()
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
