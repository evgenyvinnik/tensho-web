import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { ORACLES_OMEN } from '../config/omenDefinitions'
import { NORMAL_RUN_ACTS } from '../config/runProgression'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useOmenStore } from '../stores/omenStore'
import { useProgressionStore } from '../stores/progressionStore'
import { DecreeSystem } from '../systems/DecreeSystem'
import { clearRound } from '../test/roundHelpers'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'

const earned = () => useAchievementStore.getState().achievements.purist.unlocked
const wins = () => useAchievementStore.getState().stats.winsWithoutReroll

function start() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  return game
}

function visit(game: GameOrchestrator, free = false) {
  if (free) useOmenStore.getState().addOmen(ORACLES_OMEN)
  clearRound(game)
  const state = game.getState() as OrchestratorState
  state.gold = 100
  expect(game.shop.open()).toBe(true)
}

function finish(game: GameOrchestrator, victory = true) {
  if (game.getState().phase === 'shop') game.exitShop()
  const state = game.getState() as OrchestratorState
  const hadWon = state.hasWonRun
  state.roundManager.startAct(NORMAL_RUN_ACTS)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  Object.assign(state, {
    currentAct: NORMAL_RUN_ACTS,
    currentRound: 3,
    score: 0,
    targetScore: victory ? 1 : 1e12,
    handsRemaining: 1,
    handTiles: [
      new Tile(TileSuit.Manzu, 5, 'purist-a'),
      new Tile(TileSuit.Manzu, 5, 'purist-b'),
    ],
  })
  state.roundManager.getCurrentRound()!.scoreTarget = state.targetScore
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.map((t) => t.id),
    }).success
  ).toBe(true)
  expect(state.hasWonRun).toBe(hadWon || victory)
  expect(state.phase).toBe('gameOver')
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
  useOmenStore.getState().clearForNewRun()
  vi.restoreAllMocks()
  runRandom.reset()
})

it('awards a real no-reroll victory once, including after a mid-run restore', () => {
  const game = start()
  visit(game)
  expect(wins()).toBe(0)
  const saved = game.captureRun()
  expect(saved.meta?.shopRerolls).toBe(0)
  const resumed = new GameOrchestrator()
  resumed.restoreRun(parseClassicRunSnapshot(JSON.parse(JSON.stringify(saved))))
  expect(resumed.captureRun()).toEqual(saved)
  const notifications = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'purist') notifications()
  })
  try {
    finish(resumed)
    expect(wins()).toBe(1)
    expect(earned()).toBe(true)
    expect(notifications).toHaveBeenCalledTimes(1)
    const result = resumed.captureRun()
    resumed.restoreRun(result)
    useAchievementStore.getState().checkAchievements()
    expect(wins()).toBe(1)
    expect(notifications).toHaveBeenCalledTimes(1)
  } finally {
    off()
  }
})

it.each([false, true])(
  'disqualifies a successful shop reroll (free: %s) after save/resume',
  (free) => {
    const game = start()
    visit(game, free)
    const cost = game.shop.state.currentRerollCost
    expect(cost === 0).toBe(free)
    const gold = game.getState().gold
    expect(game.shop.reroll().success).toBe(true)
    expect(game.getState().gold).toBe(gold - cost)
    const saved = game.captureRun()
    expect(saved.meta?.shopRerolls).toBe(1)
    const resumed = new GameOrchestrator()
    resumed.restoreRun(
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(saved)))
    )
    expect(resumed.captureRun()).toEqual(saved)
    finish(resumed)
    expect(useAchievementStore.getState().stats.runsWon).toBe(1)
    expect(wins()).toBe(0)
    expect(earned()).toBe(false)
  }
)

it('does not count failed reroll attempts, ordinary purchases or tile redraws', () => {
  const game = start()
  expect(game.shop.reroll().success).toBe(false)
  expect(
    game.processAction({ type: 'redraw', tileIds: [game.getHandTiles()[0].id] })
      .success
  ).toBe(true)
  visit(game)
  const state = game.getState() as OrchestratorState
  state.gold = 0
  expect(game.shop.reroll().success).toBe(false)
  state.gold = 100
  const pack = game.shop.state.packOfferings[0]
  expect(game.shop.purchase(pack.id).success).toBe(true)
  expect(game.shop.reroll().success).toBe(false)
  expect(game.shop.skipPack().success).toBe(true)
  finish(game)
  expect(wins()).toBe(1)
})

it('does not award a no-reroll defeat or Full Unlock victory', () => {
  finish(start(), false)
  expect(wins()).toBe(0)
  expect(earned()).toBe(false)
  useProgressionStore.setState({ fullUnlockEnabled: true })
  finish(start())
  expect(wins()).toBe(0)
  expect(earned()).toBe(false)
})

it('starts fresh after a rerolled run without using lifetime totals', () => {
  const game = start()
  visit(game)
  expect(game.shop.reroll().success).toBe(true)
  game.resetGame()
  expect(useProgressionStore.getState().stats.totalRerolls).toBe(1)
  finish(start())
  expect(wins()).toBe(1)
  expect(earned()).toBe(true)
})

it.each(['missing-count', 'missing-meta'])(
  'does not infer zero rerolls from a legacy save with %s',
  (legacy) => {
    const game = start()
    visit(game)
    const saved = game.captureRun()
    if (legacy === 'missing-meta') saved.meta = null
    else delete saved.meta!.shopRerolls
    const resumed = new GameOrchestrator()
    resumed.restoreRun(
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(saved)))
    )
    finish(resumed)
    expect(useAchievementStore.getState().stats.runsWon).toBe(1)
    expect(wins()).toBe(0)
    expect(earned()).toBe(false)
    finish(start())
    expect(wins()).toBe(1)
  }
)

it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid saved reroll count %s',
  (shopRerolls) => {
    const game = start()
    const saved = game.captureRun()
    saved.meta!.shopRerolls = shopRerolls
    expect(() => parseClassicRunSnapshot(saved)).toThrow()
    expect(game.captureRun().meta?.shopRerolls).toBe(0)
  }
)

it('does not replay or revoke a secured Purist win when rerolling in Endless', () => {
  const game = start()
  finish(game)
  expect(wins()).toBe(1)
  expect(game.continueEndless()).toBe(true)
  const state = game.getState() as OrchestratorState
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  expect(game.shop.reroll().success).toBe(true)
  const saved = game.captureRun()
  const resumed = new GameOrchestrator()
  resumed.restoreRun(saved)
  finish(resumed, false)
  expect(wins()).toBe(1)
  expect(earned()).toBe(true)
})
