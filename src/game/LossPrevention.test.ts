import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { TeaHouseSystem } from '../systems/TeaHouseSystem'
import { CRIMSON_HEART } from '../config/mandateDefinitions'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import type { Decree } from '../systems/types'

const phoenix = ALL_DECREES.find((d) => d.id === 'decree-phoenix')!
const immortal = ALL_DECREES.find((d) => d.id === 'decree-immortal-decree')!
// Ordinary slots never stock special-sources-only Decrees; stock the power
// under a shop tier to test its stickers.
const asShopTier = (decree: Decree): Decree => ({
  ...decree,
  rarity: 'LocalEdict',
})

it.each(['decree-immortal-decree', 'decree-glass-cannon'])(
  'retains Eternal for non-consuming and destruction-risk powers: %s',
  (id) => {
    vi.spyOn(DecreeSystem, 'getShopCandidates').mockReturnValue([
      asShopTier(ALL_DECREES.find((d) => d.id === id)!),
    ])
    const zero = () => 0
    const shop = new TeaHouseSystem(8, zero, zero)
    const offer = shop.generateShop().itemOfferings[0]
    expect((offer.item as Decree).stickers?.map((s) => s.type)).toEqual([
      'Eternal',
      'Rental',
    ])
  }
)

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  vi.restoreAllMocks()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  return { game, state, system: state.decreeSystem }
}

function lose(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  state.handsRemaining = 1
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const result = game.processAction({
    type: 'play',
    tileIds: state.handTiles.slice(0, 2).map((tile) => tile.id),
  })
  expect(result.success).toBe(true)
  return result
}

it.each([
  { rolls: [0, 0, 0], types: ['Perishable', 'Rental'] },
  { rolls: [0, 0.9, 0], types: ['Rental'] },
  { rolls: [0, 0.9, 0.9], types: [] },
])(
  'does not offer Eternal Phoenix while retaining eligible rolls: $types',
  ({ rolls, types }) => {
    vi.spyOn(DecreeSystem, 'getShopCandidates').mockReturnValue([
      asShopTier(phoenix),
    ])
    const random = vi.fn(() => 0.9)
    for (const value of [0, 0, 0, 0.9]) random.mockReturnValueOnce(value)
    const stickerRandom = vi.fn(() => 0.9)
    for (const value of rolls) stickerRandom.mockReturnValueOnce(value)
    const offer = new TeaHouseSystem(8, random, stickerRandom).generateShop()
      .itemOfferings[0]
    expect((offer.item as Decree).id).toBe(phoenix.id)
    expect((offer.item as Decree).stickers?.map((s) => s.type)).toEqual(types)
    if (types.includes('Rental')) expect(offer.baseCost).toBe(1)
    // Eligibility must not shift later seeded offers.
    expect(random).toHaveBeenCalledTimes(9)
    expect(stickerRandom).toHaveBeenCalledTimes(3)
  }
)

it.each([false, true])(
  'a legacy Eternal Phoenix cannot grant unconsumed rescues (array=%s)',
  (array) => {
    const { game, system } = fixture()
    system.acquireDecree({
      ...phoenix,
      ...(array
        ? { stickers: [{ type: 'Eternal' as const }] }
        : { sticker: { type: 'Eternal' as const } }),
    })
    const saved = parseClassicRunSnapshot(game.captureRun())
    game.restoreRun(saved)
    expect(game.captureRun()).toEqual(saved)
    const result = lose(game)
    expect(game.getState().phase).toBe('gameOver')
    expect(game.getState().decreeSystem.getOwnedDecrees()).toHaveLength(1)
    expect(
      result.effects.some(
        (e) =>
          e.type === 'decree_triggered' && e.description.includes('prevented')
      )
    ).toBe(false)
    expect(() => parseClassicRunSnapshot(game.captureRun())).not.toThrow()
  }
)

it('consumes an eligible physical Phoenix instead of an earlier Eternal sibling', () => {
  const { game, state, system } = fixture()
  const protectedCopy = system.acquireDecree(phoenix, { type: 'Eternal' })!
  const expendable = system.acquireDecree({ ...phoenix, edition: 'Negative' })!
  expect(system.getMaxSlots()).toBe(6)
  lose(game)
  expect(state.phase).toBe('shop')
  expect(system.getOwnedDecrees()).toEqual([protectedCopy])
  expect(system.getOwnedDecree(expendable.instanceId!)).toBeUndefined()
  expect(system.getMaxSlots()).toBe(5)
  game.exitShop()
  lose(game)
  expect(state.phase).toBe('gameOver')
})

it('still prefers an Eternal permanent saver and applies its penalty without consuming Phoenix', () => {
  const { game, state, system } = fixture()
  const oneShot = system.acquireDecree(phoenix)!
  const permanent = system.acquireDecree(immortal, { type: 'Eternal' })!
  lose(game)
  expect(state.phase).toBe('shop')
  expect(state.lossPreventionScorePenalty).toBe(0.5)
  expect(system.getOwnedDecrees()).toEqual([oneShot, permanent])
})

it('does not activate a Phoenix disabled by the boss mandate', () => {
  const { game, state, system } = fixture()
  const owned = system.acquireDecree(phoenix)!
  state.mandateEffectSystem.activateMandate(CRIMSON_HEART, state.handTiles, [
    owned,
  ])
  expect(state.mandateEffectSystem.getDisabledDecreeIds()).toContain(
    owned.instanceId
  )
  lose(game)
  expect(state.phase).toBe('gameOver')
  expect(system.getOwnedDecrees()).toEqual([owned])
})
