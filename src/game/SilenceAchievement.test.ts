import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { THE_HOOK } from '../config/mandateDefinitions'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { DEAD_WALL_WRIT, DecreeSystem } from '../systems/DecreeSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

const progress = () =>
  useAchievementStore.getState().stats.roundsWonWithoutHonorDiscards
const earned = () =>
  useAchievementStore.getState().achievements.master_of_silence.unlocked
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

function start() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  return { game, state }
}

function win(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  state.handTiles = [
    new Tile(TileSuit.Wind, 1, 'winning-a'),
    new Tile(TileSuit.Wind, 1, 'winning-b'),
  ]
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  expect(
    game.processAction({ type: 'play', tileIds: ['winning-a', 'winning-b'] })
      .success
  ).toBe(true)
  expect(state.phase).toBe('shop')
}

function redraw(game: GameOrchestrator, tile: Tile) {
  const state = game.getState() as OrchestratorState
  state.handTiles[0] = tile
  state.faceDownTileIds.clear()
  expect(
    game.processAction({ type: 'redraw', tileIds: [tile.id] }).success
  ).toBe(true)
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useAchievementStore.getState().resetAchievements()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
  runRandom.reset()
})

it('earns three qualifying wins, allowing Honors to be played rather than discarded', () => {
  const notified = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'master_of_silence') notified()
  })
  try {
    for (let i = 1; i <= 3; i++) {
      const { game } = start()
      win(game)
      expect(progress()).toBe(i)
      expect(earned()).toBe(i === 3)
    }
    expect(notified).toHaveBeenCalledTimes(1)
  } finally {
    off()
  }
})

it.each([TileSuit.Wind, TileSuit.Dragon])(
  'does not credit a win after redrawing %s',
  (suit) => {
    const { game } = start()
    redraw(game, new Tile(suit, 1, 'honor-redraw'))
    win(game)
    expect(progress()).toBe(0)
  }
)

it('allows a suited redraw and a Stone tile whose original face was an Honor', () => {
  const { game } = start()
  redraw(game, new Tile(TileSuit.Manzu, 2, 'suited-redraw'))
  redraw(
    game,
    new Tile(TileSuit.Wind, 1, 'stone-redraw').withEnhancement(
      EnhancementType.Stone
    )
  )
  win(game)
  expect(progress()).toBe(1)
})

it('counts Honor discards forced by The Hook', () => {
  const { game, state } = start()
  const honor = new Tile(TileSuit.Wind, 1, 'hook-honor')
  const suited = new Tile(TileSuit.Manzu, 2, 'hook-suited')
  state.handTiles = [suited, honor]
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Manzu, 2, `hook-wall-${i}`)
  )
  state.drawIndex = 0
  state.mandateEffectSystem = new MandateEffectSystem()
  state.mandateEffectSystem.activateMandate(THE_HOOK, state.handTiles, [])
  // The sorted Honor is last; select it using the unseeded fixture's RNG.
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
  expect(
    game.processAction({ type: 'redraw', tileIds: [suited.id] }).success
  ).toBe(true)
  expect(state.discards.some((tile) => tile.id === honor.id)).toBe(true)
  state.mandateEffectSystem.deactivateMandate()
  win(game)
  expect(progress()).toBe(0)
})

it('counts an Honor swapped away with Dead Wall Writ', () => {
  const { game, state } = start()
  state.decreeSystem.acquireDecree(DEAD_WALL_WRIT)
  state.handTiles[0] = new Tile(TileSuit.Dragon, 1, 'writ-honor')
  state.deadWall = [new Tile(TileSuit.Souzu, 9, 'writ-draw')]
  expect(game.useDeadWallWrit('writ-honor').success).toBe(true)
  win(game)
  expect(progress()).toBe(0)
})

it('counts an Honor sent to the Dead Pool by a Script penalty', () => {
  const { game, state } = start()
  state.handTiles = [
    new Tile(TileSuit.Wind, 1, 'script-a'),
    new Tile(TileSuit.Dragon, 1, 'script-b'),
  ]
  state.faceDownTileIds.clear()
  const definition = Object.values(VOID_SCRIPTS).find(
    (script) => script.penalty.type === 'lock_tile'
  )!
  const script = VoidScriptSystem.createVoidScriptInstance(definition)
  expect(game.addVoidScript(script)).toBe(true)
  expect(
    game.processAction({
      type: 'useScript',
      scriptId: script.instanceId,
      targets: ['script-a'],
    }).success
  ).toBe(true)
  expect(state.honorDiscardsThisRound).toBeGreaterThan(0)
  win(game)
  expect(progress()).toBe(0)
})

it('does not credit defeats or Full Unlock wins', () => {
  const { game, state } = start()
  state.handsRemaining = 1
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.slice(0, 2).map((tile) => tile.id),
    }).success
  ).toBe(true)
  expect(state.phase).toBe('gameOver')
  expect(progress()).toBe(0)
  const next = start()
  useProgressionStore.setState({ fullUnlockEnabled: true })
  win(next.game)
  expect(progress()).toBe(0)
})

it('keeps a disqualified round across save/restore, then resets eligibility for the next round', () => {
  const { game } = start()
  redraw(game, new Tile(TileSuit.Wind, 1, 'saved-honor'))
  const saved = parseClassicRunSnapshot(json(game.captureRun()))
  expect(saved.state.honorDiscardsThisRound).toBeGreaterThan(0)
  game.restoreRun(saved)
  win(game)
  expect(progress()).toBe(0)
  game.exitShop()
  expect(game.getState().honorDiscardsThisRound).toBe(0)
  win(game)
  expect(progress()).toBe(1)
})

it('does not invent eligibility for a legacy mid-round save', () => {
  const { game } = start()
  const saved = json(game.captureRun())
  delete saved.state.honorDiscardsThisRound
  game.restoreRun(parseClassicRunSnapshot(saved))
  win(game)
  expect(progress()).toBe(0)
  game.exitShop()
  win(game)
  expect(progress()).toBe(1)
})

it('rejects invalid saved Honor-discard counters', () => {
  const { game } = start()
  for (const value of [-1, 0.5, '0', null]) {
    const saved = json(game.captureRun())
    Object.assign(saved.state, { honorDiscardsThisRound: value })
    expect(() => parseClassicRunSnapshot(saved)).toThrow()
  }
})

it('persists qualifying wins and does not count a settled round again on resume', async () => {
  const { game } = start()
  win(game)
  const completed = parseClassicRunSnapshot(json(game.captureRun()))
  game.restoreRun(completed)
  expect(progress()).toBe(1)
  expect(
    game.processAction({ type: 'play', tileIds: ['winning-a', 'winning-b'] })
      .success
  ).toBe(false)
  expect(progress()).toBe(1)
  win(start().game)
  const { stats, achievements } = useAchievementStore.getState()
  const profile = JSON.stringify({ state: { stats, achievements }, version: 2 })
  useAchievementStore.getState().resetAchievements()
  vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-achievements' ? profile : null
  )
  await useAchievementStore.persist.rehydrate()
  expect(progress()).toBe(2)
  expect(earned()).toBe(false)
  win(start().game)
  expect(progress()).toBe(3)
  expect(earned()).toBe(true)
})
