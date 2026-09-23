import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { useProgressionStore } from '../stores/progressionStore'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { useOmenStore } from '../stores/omenStore'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { TEA_HOUSE_BASE_CHARTERS } from '../systems/TeaHouseSystem'
import { VoidScriptSystem, VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { Tile, TileSuit } from '../core/Tile'

beforeEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  useProgressionStore.getState().resetProgression()
  initializeArchive()
  useArchiveStore.getState().resetArchive()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
  vi.restoreAllMocks()
})
function start() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.wallTemplate = state.wallTemplate.filter((tile) => !tile.isSeason)
  state.roundManager.getCurrentAct()!.rounds.forEach((round) => {
    round.bossMandate = undefined
  })
  return { game, state }
}
function charter(game: GameOrchestrator, id: string) {
  expect(
    game.addImperialCharter(
      TEA_HOUSE_BASE_CHARTERS.find((item) => item.id === id)!
    )
  ).toBe(true)
}
function script(game: GameOrchestrator, id: string) {
  const item = VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id])
  expect(game.addVoidScript(item)).toBe(true)
  return game.processAction({ type: 'useScript', scriptId: item.instanceId })
}
function pair(state: OrchestratorState) {
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 2, 'build-a'),
    new Tile(TileSuit.Pinzu, 2, 'build-b'),
  ]
}

it('requires five simultaneous editioned Decrees and retains the unlock after a sale/new run', () => {
  const { game, state } = start()
  charter(game, 'sharp_edge')
  const base = ALL_DECREES.find((decree) => !decree.flowerRequirement)!
  for (let index = 0; index < 5; index++) {
    expect(
      game.addDecree({ ...base, id: `edition-${index}`, edition: 'Negative' })
    ).toBe(true)
    expect(useProgressionStore.getState().stats.editionDecreesOwned).toBe(
      index + 1
    )
    expect(useProgressionStore.getState().isItemUnlocked('radiant_edge')).toBe(
      index === 4
    )
  }
  expect(
    useArchiveStore.getState().getEntry('charters', 'radiant_edge')!.isUnlocked
  ).toBe(true)
  expect(game.sellDecree('edition-0').success).toBe(true)
  expect(useProgressionStore.getState().stats.editionDecreesOwned).toBe(4)
  expect(useProgressionStore.getState().stats.currentRunDecreesOwned).toBe(
    state.decreeSystem.getOwnedDecrees().length
  )
  game.startNewRun(8)
  expect(useProgressionStore.getState().stats.editionDecreesOwned).toBe(0)
  expect(useProgressionStore.getState().isItemUnlocked('radiant_edge')).toBe(
    true
  )
})

it('does not count five separate buy/sell cycles as five simultaneously owned editions', () => {
  const { game } = start()
  charter(game, 'sharp_edge')
  for (let index = 0; index < 5; index++) {
    expect(
      game.addDecree({
        ...ALL_DECREES[0],
        id: `cycle-${index}`,
        edition: 'Negative',
      })
    ).toBe(true)
    expect(game.sellDecree(`cycle-${index}`).success).toBe(true)
  }
  expect(useProgressionStore.getState().stats.editionDecreesOwned).toBe(0)
  expect(useProgressionStore.getState().isItemUnlocked('radiant_edge')).toBe(
    false
  )
})

it('tracks an edition applied by a real Script without requiring another purchase', () => {
  const { game, state } = start()
  charter(game, 'sharp_edge')
  for (const decree of state.decreeSystem.getOwnedDecrees())
    game.sellDecree(decree.id)
  for (let index = 0; index < 4; index++)
    game.addDecree({
      ...ALL_DECREES[0],
      id: `negative-${index}`,
      edition: 'Negative',
    })
  game.addDecree({ ...ALL_DECREES[0], id: 'plain' })
  vi.spyOn(runRandom, 'next').mockReturnValue(0.99) // Select the last, plain Decree.
  expect(script(game, 'script_of_ectoplasm').success).toBe(true)
  expect(useProgressionStore.getState().stats.editionDecreesOwned).toBe(5)
  expect(useProgressionStore.getState().isItemUnlocked('radiant_edge')).toBe(
    true
  )
})

it('does not treat a temporarily sparse rack, previews or rejected actions as a capacity reduction', () => {
  const { game, state } = start()
  charter(game, 'brush_stroke')
  pair(state)
  const before = useProgressionStore.getState().stats.minHandSizeAchieved
  game.previewScore(state.handTiles.map((tile) => tile.id))
  expect(game.processAction({ type: 'play', tileIds: [] }).success).toBe(false)
  state.targetScore = 1000000
  state.roundManager.getCurrentRound()!.scoreTarget = state.targetScore
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.map((tile) => tile.id),
    }).success
  ).toBe(true)
  expect(useProgressionStore.getState().stats.minHandSizeAchieved).toBe(before)
  expect(useProgressionStore.getState().isItemUnlocked('full_palette')).toBe(
    false
  )
})

it('unlocks Full Palette only when actual Script costs reduce rack capacity to five', () => {
  const { game, state } = start()
  charter(game, 'brush_stroke') // Ordinary capacity 14 + 1, not a reduced test configuration.
  for (let index = 0; index < 10; index++) {
    pair(state)
    expect(script(game, 'script_of_the_ouija').success).toBe(true)
    expect(useProgressionStore.getState().isItemUnlocked('full_palette')).toBe(
      index === 9
    )
    if (index === 9) break
    state.seasonSystem.clear()
    state.mandateEffectSystem.deactivateMandate()
    state.roundManager.getCurrentAct()!.rounds.forEach((round) => {
      round.bossMandate = undefined
    })
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    pair(state)
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.map((tile) => tile.id),
      }).success
    ).toBe(true)
    game.shop.open()
    game.exitShop()
  }
  expect(useProgressionStore.getState().stats.minHandSizeAchieved).toBe(5)
  expect(
    useArchiveStore.getState().getEntry('charters', 'full_palette')!.isUnlocked
  ).toBe(true)
})

it('uses the final inventory after an Ankh copy and destruction, not its temporary fifth edition', () => {
  const { game, state } = start()
  charter(game, 'sharp_edge')
  for (const decree of state.decreeSystem.getOwnedDecrees())
    game.sellDecree(decree.id)
  for (let index = 0; index < 4; index++)
    game.addDecree({
      ...ALL_DECREES[0],
      id: `ankh-${index}`,
      edition: 'Negative',
    })
  expect(script(game, 'script_of_the_ankh').success).toBe(true)
  expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(2)
  expect(useProgressionStore.getState().stats.editionDecreesOwned).toBe(2)
  expect(useProgressionStore.getState().isItemUnlocked('radiant_edge')).toBe(
    false
  )
})

it('a downside-protected Script cannot earn the missing capacity reduction', () => {
  const { game, state } = start()
  charter(game, 'brush_stroke')
  state.voidScriptSystem = VoidScriptSystem.fromState({
    ...state.voidScriptSystem.toState(),
    handSizePenalty: 9,
  })
  useOmenStore.getState().addTag('omen_of_ash')
  pair(state)
  expect(script(game, 'script_of_the_ouija').success).toBe(true)
  expect(state.voidScriptSystem.getHandSizePenalty()).toBe(9)
  expect(useProgressionStore.getState().stats.minHandSizeAchieved).toBe(6)
  expect(useProgressionStore.getState().isItemUnlocked('full_palette')).toBe(
    false
  )
})

it('an unexpected action exception cannot leave later inventory notifications suspended', () => {
  const { game, state } = start()
  vi.spyOn(state.voidScriptSystem, 'useScript').mockImplementationOnce(() => {
    throw new Error('fixture failure')
  })
  expect(() => script(game, 'script_of_ectoplasm')).toThrow('fixture failure')
  expect(
    game.addDecree({
      ...ALL_DECREES[0],
      id: 'after-error',
      edition: 'Negative',
    })
  ).toBe(true)
  expect(useProgressionStore.getState().stats.editionDecreesOwned).toBe(1)
})
