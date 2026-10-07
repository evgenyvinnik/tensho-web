import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { FlowerSystem } from '../systems/FlowerSystem'
import { useProgressionStore } from '../stores/progressionStore'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
  useProgressionStore.getState().resetProgression()
  runRandom.reset()
  eventBus.clear()
})

function setup(flowers: FlowerType[]) {
  const game = new GameOrchestrator()
  let i = 0
  const draw = vi
    .spyOn(
      game as unknown as { drawTileInternal(): Tile | null },
      'drawTileInternal'
    )
    .mockImplementation(
      () => new Tile(TileSuit.Manzu, (++i % 9) + 1, `start-${i}`)
    )
  game.startNewRun(7)
  draw.mockRestore()
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.wall = [
    ...flowers.map((type, i) => Tile.createFlower(type, `flower-${i}`)),
    ...Array.from(
      { length: 40 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `tail-${i}`)
    ),
  ]
  state.drawIndex = 0
  state.deadWall = Array.from(
    { length: 20 },
    (_, i) => new Tile(TileSuit.Wind, (i % 4) + 1, `replacement-${i}`)
  )
  state.discardsRemaining = 20
  const drawFlower = () =>
    expect(
      game.processAction({ type: 'discard', tileId: game.getHandTiles()[0].id })
        .success
    ).toBe(true)
  return { game, state, drawFlower }
}

it('requires four different Flowers, then awakens only the next duplicate through a real draw', () => {
  const { game, state, drawFlower } = setup([
    FlowerType.Plum,
    FlowerType.Orchid,
    FlowerType.Chrysanthemum,
    FlowerType.Bamboo,
    FlowerType.Orchid,
    FlowerType.Orchid,
  ])
  for (let i = 0; i < 3; i++) {
    drawFlower()
    expect(state.flowerSystem.canRebloom()).toBe(false)
  }
  drawFlower()
  expect(state.flowerSystem.canRebloom()).toBe(true)
  expect(useProgressionStore.getState().isItemUnlocked('bamboo_mat')).toBe(true)
  expect(state.flowerSystem.toState().unlockedMutations).toEqual([])
  const slots = state.decreeSystem.getMaxSlots()
  drawFlower()
  expect(state.flowerSystem.toState().unlockedMutations).toEqual([
    'orchid_double_dragons',
  ])
  const owned = state.flowerSystem
    .getFlowers()
    .find((flower) => flower.type === 'Orchid')!
  expect(owned.id).toBe('flower-1')
  expect(owned.mutation?.isUnlocked).toBe(true)
  const saved = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
  drawFlower()
  expect(game.getState().flowerSystem.toState().unlockedMutations).toEqual([
    'orchid_double_dragons',
  ])
  expect(game.getState().flowerSystem.getFlowerCount()).toBe(4)
  expect(game.getState().decreeSystem.getMaxSlots()).toBe(slots)
  expect(game.getHandTiles()).toHaveLength(14)
})

it('repeated copies of one Flower do not earn the four-type unlock', () => {
  const { state, drawFlower } = setup(Array(5).fill(FlowerType.Plum))
  for (let i = 0; i < 5; i++) drawFlower()
  expect(state.flowerSystem.getFlowerCount()).toBe(1)
  expect(state.flowerSystem.canRebloom()).toBe(false)
  expect(state.flowerSystem.toState().unlockedMutations).toEqual([])
  expect(useProgressionStore.getState().isItemUnlocked('bamboo_mat')).toBe(
    false
  )
})

it('an earned profile unlock enables later runs but never grants a mutation on the first Flower draw', () => {
  useProgressionStore.getState().unlockItem('unlock_bamboo_mat', false)
  const { game, state, drawFlower } = setup([
    FlowerType.Bamboo,
    FlowerType.Bamboo,
  ])
  expect(state.flowerSystem.canRebloom()).toBe(true)
  drawFlower()
  expect(state.flowerSystem.toState().unlockedMutations).toEqual([])
  drawFlower()
  expect(state.flowerSystem.hasMutation('bamboo_wild_anchor')).toBe(true)
  const next = setup([FlowerType.Bamboo])
  next.drawFlower()
  expect(next.state.flowerSystem.hasMutation('bamboo_wild_anchor')).toBe(false)
  expect(game.getState().flowerSystem.hasMutation('bamboo_wild_anchor')).toBe(
    true
  )
})

it('loading uses saved eligibility rather than newer profile unlocks', () => {
  const { game, drawFlower } = setup([FlowerType.Plum, FlowerType.Plum])
  drawFlower()
  const saved = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  expect(saved.state.flowerSystem.rebloomUnlocked).toBeUndefined()
  useProgressionStore.getState().unlockItem('unlock_bamboo_mat', false)
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
  drawFlower()
  expect(game.getState().flowerSystem.hasMutation('plum_overlap')).toBe(false)
})

it('a saved eligible run retains eligibility even if the profile is reset elsewhere', () => {
  useProgressionStore.getState().unlockItem('unlock_bamboo_mat', false)
  const { game, drawFlower } = setup([
    FlowerType.Chrysanthemum,
    FlowerType.Chrysanthemum,
  ])
  drawFlower()
  const saved = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  expect(saved.state.flowerSystem.rebloomUnlocked).toBe(true)
  useProgressionStore.getState().resetProgression()
  game.restoreRun(saved)
  expect(game.captureRun()).toEqual(saved)
  drawFlower()
  expect(
    game.getState().flowerSystem.hasMutation('chrysanthemum_exponential')
  ).toBe(true)
})

it('legacy four-Flower saves can rebloom on their next real duplicate without awakening during load', () => {
  const flowers = new FlowerSystem()
  for (const type of [
    FlowerType.Plum,
    FlowerType.Orchid,
    FlowerType.Chrysanthemum,
    FlowerType.Bamboo,
  ])
    flowers.addFlower(Tile.createFlower(type, `original-${type}`))
  const legacy = flowers.toState()
  delete legacy.rebloomUnlocked
  const restored = FlowerSystem.fromState(legacy)
  expect(restored.toState()).toEqual(legacy)
  expect(restored.canRebloom()).toBe(true)
  expect(restored.toState().unlockedMutations).toEqual([])
  restored.addFlower(Tile.createFlower(FlowerType.Plum, 'duplicate'))
  expect(restored.hasMutation('plum_overlap')).toBe(true)
})
