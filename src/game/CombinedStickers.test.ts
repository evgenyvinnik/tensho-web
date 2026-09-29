import { afterEach, expect, it, vi } from 'vitest'
import { TeaHouseSystem } from '../systems/TeaHouseSystem'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import type { Decree, Sticker } from '../systems/types'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { Tile, TileSuit } from '../core/Tile'
import { decree as checkOfferedDecree } from './classicSaveItems'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  vi.restoreAllMocks()
})

it.each([
  { rolls: [0, 0, 0], types: ['Eternal', 'Rental'] },
  { rolls: [0.9, 0, 0], types: ['Perishable', 'Rental'] },
])(
  'retains both stickers from actual shop generation: $types',
  ({ rolls, types }) => {
    // Item type, rarity, candidate, no edition, three sticker rolls, old cost draw.
    const random = vi.fn(() => 0.9)
    for (const value of [0, 0, 0, 0.9, ...rolls, 0.5])
      random.mockReturnValueOnce(value)
    const offer = new TeaHouseSystem(8, random).generateShop().itemOfferings[0]
    expect(offer.itemType).toBe('Decree')
    expect((offer.item as Decree).stickers?.map((s) => s.type)).toEqual(types)
    expect(offer.baseCost).toBe(1)
    expect(offer.finalCost).toBe(1)
    // Eight draws for this Decree, one for the Orb item type (its catalog uses
    // the run stream), then two type/size draws for each of the two packs.
    expect(random).toHaveBeenCalledTimes(13)
  }
)

it.each([1, 3, 4, 6, 7, 8])(
  'keeps sticker thresholds and shop RNG draw counts at stake %i',
  (stake) => {
    const random = vi.fn(() => 0)
    const shop = new TeaHouseSystem(stake, random).generateShop()
    const stickers = (shop.itemOfferings[0].item as Decree).stickers!
    expect(stickers.map((s) => s.type)).toEqual(
      stake < 4 ? [] : stake < 8 ? ['Eternal'] : ['Eternal', 'Rental']
    )
    if (stake === 8) {
      expect(shop.itemOfferings[0]).toMatchObject({
        baseCost: 1,
        edition: 'Negative',
        finalCost: 6,
      })
    }
    // Two Decrees: type, rarity, candidate, edition, enabled sticker rolls, cost;
    // each of the two packs then rolls type and size.
    expect(random).toHaveBeenCalledTimes(
      14 + (stake >= 4 ? 2 : 0) + (stake >= 7 ? 2 : 0) + (stake >= 8 ? 2 : 0)
    )
  }
)

it('keeps copied timers independent, charges expired Rental, and protects Eternal copies', () => {
  const system = new DecreeSystem()
  const stickers: Sticker[] = [
    { type: 'Perishable', roundsRemaining: 1 },
    { type: 'Rental', goldPerRound: 3 },
  ]
  const first = system.acquireDecree({ ...ALL_DECREES[0], stickers })!
  const copy = system.acquireDecree(first)!
  expect(first.stickers).not.toBe(stickers)
  expect(copy.stickers?.[0]).not.toBe(first.stickers?.[0])
  system.onRoundStart()
  system.onRoundEnd()
  expect(first.stickers?.[0].roundsRemaining).toBe(0)
  expect(copy.stickers?.[0].roundsRemaining).toBe(0)
  expect(first.isDebuffed).toBe(true)
  expect(system.calculateRentalCosts()).toBe(6)
  expect(system.getActiveDecrees()).toHaveLength(0)
  const eternal = system.acquireDecree({
    ...ALL_DECREES[1],
    stickers: [{ type: 'Eternal' }, { type: 'Rental', goldPerRound: 0 }],
  })!
  expect(system.sellDecree(eternal.instanceId!)).toBe(0)
  expect(system.removeDecree(eternal.instanceId!)).toBe(false)
  expect(system.calculateRentalCosts()).toBe(6)
  expect(system.removeDecree(copy.instanceId!)).toBe(true)
  expect(system.calculateRentalCosts()).toBe(3)
})

it('purchases and restores combined shop and owned stickers without changing RNG or charging twice', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7, 8)
  const state = game.getState() as OrchestratorState
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Small'
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.itemOfferings[0]
  offer.itemType = 'Decree'
  offer.item = {
    ...ALL_DECREES[0],
    stickers: [{ type: 'Eternal' }, { type: 'Rental', goldPerRound: 3 }],
  }
  offer.baseCost = 1
  offer.editionCost = 0
  offer.finalCost = 1
  offer.edition = undefined
  const snapshot = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(snapshot)
  expect(game.captureRun()).toEqual(snapshot)
  expect(game.shop.purchase(offer.id).success).toBe(true)
  expect(game.getState().gold).toBe(99)
  expect(game.shop.purchase(offer.id).success).toBe(false)
  const owned = game
    .getState()
    .decreeSystem.getOwnedDecrees()
    .find((d) => d.stickers?.length === 2)!
  expect(owned).toBeDefined()
  expect(game.sellDecree(owned.instanceId!).success).toBe(false)
  expect(game.getState().decreeSystem.calculateRentalCosts()).toBe(3)
  const bought = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(bought)
  expect(game.captureRun()).toEqual(bought)
})

it.each([
  [{ type: 'Eternal' }, { type: 'Perishable', roundsRemaining: 5 }],
  [{ type: 'Rental' }, { type: 'Rental' }],
  [{ type: 'Eternal' }, { type: 'Rental' }, { type: 'Rental' }],
] as Sticker[][])(
  'rejects impossible sticker combinations in shop and inventory: %j',
  (...stickers) => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const snapshot = game.captureRun()
    snapshot.state.decreeSystem.ownedDecrees[0].stickers = stickers
    expect(() => parseClassicRunSnapshot(snapshot)).toThrow('stickers')
    expect(() =>
      checkOfferedDecree({ ...ALL_DECREES[0], stickers }, 'offer')
    ).toThrow('stickers')
  }
)

it('rejects ambiguous legacy-plus-array state instead of discarding one effect', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const snapshot = game.captureRun()
  Object.assign(snapshot.state.decreeSystem.ownedDecrees[0], {
    sticker: { type: 'Eternal' },
    stickers: [{ type: 'Rental', goldPerRound: 3 }],
  })
  expect(() => parseClassicRunSnapshot(snapshot)).toThrow('stickers')
})

it('charges combined Rental once on real cash-out, including expired copies, and permits debt', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem()
  const expired = state.decreeSystem.acquireDecree({
    ...ALL_DECREES[0],
    stickers: [
      { type: 'Perishable', roundsRemaining: 0 },
      { type: 'Rental', goldPerRound: 3 },
    ],
    isDebuffed: true,
  })!
  state.decreeSystem.acquireDecree({
    ...ALL_DECREES[0],
    stickers: [{ type: 'Eternal' }, { type: 'Rental', goldPerRound: 3 }],
  })
  state.gold = 0
  const tiles = [4, 5, 6].map(
    (rank) => new Tile(TileSuit.Souzu, rank, `combined-play-${rank}`)
  )
  state.handTiles = [...tiles, ...state.handTiles.slice(3)]
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  const result = game.processAction({
    type: 'play',
    tileIds: tiles.map((tile) => tile.id),
  })
  expect(result.errors ?? []).toEqual([])
  expect(result.success).toBe(true)
  expect(state.lastRoundSummary).toMatchObject({
    rentalCost: 6,
    goldBefore: 0,
    goldAfter: -3,
    netGoldChange: -3,
  })
  expect(state.gold).toBe(-3)
  expect(expired.isDebuffed).toBe(true)
  const snapshot = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(snapshot)
  expect(game.captureRun()).toEqual(snapshot)
  expect(game.getState().gold).toBe(-3)
})
