import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useOmenStore } from '../stores/omenStore'
import { useProgressionStore } from '../stores/progressionStore'
import { DecreeSystem } from '../systems/DecreeSystem'
import { THE_MOUTH } from '../config/mandateDefinitions'
import { metaProgressionSystem } from '../systems/MetaProgressionSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { runMetaContext } from './RunMetaContext'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'

const earned = () =>
  useAchievementStore.getState().achievements.speed_run.unlocked
const record = () => useAchievementStore.getState().stats.fastestWinPaidTurns
function start() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  return game
}

// Control scoring/mandates only, leaving actual action debits and settlement live.
// This is lifecycle evidence, not a claim of naturally winning balance.
function prepare(game: GameOrchestrator, target = 1) {
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.faceDownTileIds.clear()
  Object.assign(state, {
    targetScore: target,
    score: 0,
    handsRemaining: 3,
    redrawsRemaining: 0,
    handTiles: [
      new Tile(TileSuit.Manzu, 5, 'speed-a'),
      new Tile(TileSuit.Manzu, 5, 'speed-b'),
    ],
  })
  state.roundManager.getCurrentRound()!.scoreTarget = target
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  return state
}

function play(game: GameOrchestrator) {
  const result = game.processAction({
    type: 'play',
    tileIds: game.getHandTiles().map((t) => t.id),
  })
  expect(result.success, JSON.stringify(result.errors)).toBe(true)
}

function finish(game: GameOrchestrator, victory = true) {
  const state = prepare(game, victory ? 1 : 1e12)
  state.roundManager.startAct(8)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.roundManager.getCurrentRound()!.scoreTarget = state.targetScore
  Object.assign(state, { currentAct: 8, currentRound: 3, handsRemaining: 1 })
  play(game)
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

it.each([47, 48, 49])(
  'settles a %i-Turn win at the inclusive boundary after resume',
  (total) => {
    const game = start()
    runMetaContext.current!.paidTurns = total - 1
    const saved = game.captureRun()
    const resumed = new GameOrchestrator()
    resumed.restoreRun(
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(saved)))
    )
    expect(resumed.captureRun().meta?.paidTurns).toBe(total - 1)
    const notices = vi.fn()
    const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
      if (achievementId === 'speed_run') notices()
    })
    try {
      finish(resumed)
      expect(record()).toBe(total)
      expect(useProgressionStore.getState().stats.fastestWinPaidTurns).toBe(
        total
      )
      expect(
        useProgressionStore.getState().isUnlocked('unlock_swift_andy')
      ).toBe(total <= 48)
      expect(earned()).toBe(total <= 48)
      expect(notices).toHaveBeenCalledTimes(total <= 48 ? 1 : 0)
      resumed.restoreRun(resumed.captureRun())
      useAchievementStore.getState().checkAchievements()
      expect(notices).toHaveBeenCalledTimes(total <= 48 ? 1 : 0)
    } finally {
      off()
    }
  }
)

it('counts all 24 rounds through the public loop and awards a 48-Turn victory', () => {
  const game = start()
  for (let round = 0; round < 24; round++) {
    const state = prepare(game)
    expect(
      game.processAction({ type: 'redraw', tileIds: [state.handTiles[0].id] })
        .success
    ).toBe(true)
    // Restore a known pair after REDRAW, without resetting the run counter.
    prepare(game)
    state.handsRemaining = 1 // Suppress swift-clear Omens in this fixture.
    play(game)
    expect(game.captureRun().meta?.paidTurns).toBe((round + 1) * 2)
    if (round < 23) {
      expect(state.phase).toBe('shop')
      expect(earned()).toBe(false)
      game.exitShop()
      expect(state.phase).toBe('gameplay')
    }
  }
  expect(game.getState().hasWonRun).toBe(true)
  expect(useProgressionStore.getState().stats.currentRunRoundsCompleted).toBe(
    24
  )
  expect(record()).toBe(48)
  expect(earned()).toBe(true)
})

it('ignores rejected actions, previews and free redraws, but counts paid redraws once per action', () => {
  const game = start()
  const state = prepare(game, 1e12)
  const ids = state.handTiles.map((t) => t.id)
  game.previewScore(ids)
  expect(game.processAction({ type: 'play', tileIds: [] }).success).toBe(false)
  expect(
    game.processAction({ type: 'redraw', tileIds: ['missing'] }).success
  ).toBe(false)
  expect(game.captureRun().meta?.paidTurns).toBe(0)
  state.redrawsRemaining = 1
  expect(game.processAction({ type: 'redraw', tileIds: ids }).success).toBe(
    true
  )
  expect(game.captureRun().meta?.paidTurns).toBe(0)
  expect(
    game.processAction({
      type: 'redraw',
      tileIds: game
        .getHandTiles()
        .slice(0, 3)
        .map((t) => t.id),
    }).success
  ).toBe(true)
  expect(game.captureRun().meta?.paidTurns).toBe(1)
  prepare(game, 1e12)
  play(game)
  expect(game.captureRun().meta?.paidTurns).toBe(2)
  expect(record()).toBe(Infinity)
})

it.each([false, true])(
  'does not award defeat or Full Unlock (full: %s)',
  (full) => {
    useProgressionStore.setState({ fullUnlockEnabled: full })
    finish(start(), full)
    expect(earned()).toBe(false)
    expect(record()).toBe(Infinity)
    expect(useProgressionStore.getState().stats.fastestWinPaidTurns).toBe(
      Infinity
    )
  }
)

it('counts a complete Mahjong play once, independent of its fourteen tiles and Yaku', () => {
  const game = start()
  const state = prepare(game, 1e12)
  state.handTiles = [1, 2, 3, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9].map(
    (rank, i) => new Tile(TileSuit.Manzu, rank, `complete-${i}`)
  )
  expect(game.previewScore(state.handTiles.map((t) => t.id))).not.toBeNull()
  play(game)
  expect(game.captureRun().meta?.paidTurns).toBe(1)
})

it('counts a paid play even when the Mouth makes it score zero', () => {
  const game = start()
  const state = prepare(game, 1e12)
  state.mandateEffectSystem.activateMandate(THE_MOUTH, state.handTiles, [])
  play(game) // Locks the pair pattern.
  const before = state.score
  state.handTiles = [1, 2, 3].map(
    (rank, i) => new Tile(TileSuit.Manzu, rank, `blocked-${i}`)
  )
  play(game)
  expect(state.score).toBe(before)
  expect(game.captureRun().meta?.paidTurns).toBe(2)
})

it('does not award from an unset or zero-spending profile record', () => {
  useAchievementStore.getState().setStat('fastestWinRounds', 1)
  useAchievementStore.getState().checkAchievements()
  expect(earned()).toBe(false)
  useAchievementStore.getState().setStat('fastestWinPaidTurns', 0)
  useAchievementStore.getState().checkAchievements()
  expect(earned()).toBe(false)
})

it.each(['missing-count', 'missing-meta'])(
  'fails closed for a legacy save with %s, then starts fresh',
  (legacy) => {
    const game = start()
    const saved = game.captureRun()
    if (legacy === 'missing-meta') saved.meta = null
    else delete saved.meta!.paidTurns
    game.restoreRun(parseClassicRunSnapshot(JSON.parse(JSON.stringify(saved))))
    finish(game)
    expect(record()).toBe(Infinity)
    expect(earned()).toBe(false)
    finish(start())
    expect(record()).toBe(1)
    expect(earned()).toBe(true)
  }
)

it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid saved Turn count %s',
  (paidTurns) => {
    const game = start()
    const saved = game.captureRun()
    saved.meta!.paidTurns = paidTurns
    expect(() => parseClassicRunSnapshot(saved)).toThrow()
    expect(game.captureRun().meta?.paidTurns).toBe(0)
  }
)

it('preserves the secured record through Endless without replay, and clears spending for a new run', () => {
  const game = start()
  runMetaContext.current!.paidTurns = 47
  finish(game)
  expect(record()).toBe(48)
  expect(game.continueEndless()).toBe(true)
  game.exitShop()
  finish(game, false)
  expect(record()).toBe(48)
  expect(earned()).toBe(true)
  const fresh = start()
  expect(fresh.captureRun().meta?.paidTurns).toBe(0)
  finish(fresh)
  expect(record()).toBe(1)
})

it.each([undefined, null])(
  'does not infer a paid-Turn record from old profile rounds (%s)',
  async (fastestWinPaidTurns) => {
    const saved = {
      version: 3,
      state: {
        stats: { fastestWinRounds: 1, fastestWinPaidTurns },
        achievements: {
          speed_run: { id: 'speed_run', unlocked: true, seen: true },
        },
      },
    }
    vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(saved))
    await useAchievementStore.persist.rehydrate()
    expect(record()).toBe(Infinity)
    expect(earned()).toBe(true) // Preserve an award actually recorded by an older client.
    const profile = JSON.parse(
      JSON.stringify(
        metaProgressionSystem.serializeStats(
          useProgressionStore.getState().stats
        )
      )
    )
    profile.fastestWinPaidTurns = fastestWinPaidTurns
    profile.fastestWinRounds = 1
    expect(
      metaProgressionSystem.deserializeStats(profile).fastestWinPaidTurns
    ).toBe(Infinity)
  }
)
