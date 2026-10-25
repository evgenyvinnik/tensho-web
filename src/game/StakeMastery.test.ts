import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NORMAL_RUN_ACTS } from '../config/runProgression'
import { Tile, TileSuit } from '../core/Tile'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { getGoldDecreeProgress, getWonStakeTiers } from '../utils/stakeMastery'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { runRandom } from './RunRandom'

const ownedId = 'decree-echo-stone'
const soldId = 'river_tax'
const entry = (id = ownedId) =>
  useArchiveStore.getState().getEntry('decrees', id)!
const mastery = () =>
  useAchievementStore.getState().achievements.archive_complete_plus_plus
    .unlocked

function start(stake = 8) {
  const game = new GameOrchestrator()
  game.startNewRun(7, stake, 'green_felt')
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.roundManager.startAct(NORMAL_RUN_ACTS)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.mandateEffectSystem.deactivateMandate()
  Object.assign(state, {
    currentAct: NORMAL_RUN_ACTS,
    currentRound: 3,
    score: 0,
    targetScore: 1,
    handTiles: [
      new Tile(TileSuit.Manzu, 5, 'win-a'),
      new Tile(TileSuit.Manzu, 5, 'win-b'),
    ],
  })
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  return game
}

function acquire(game: GameOrchestrator, id: string) {
  expect(
    game.addDecree(ALL_DECREES.find((d) => d.id === id)!, 'pack_open')
  ).toBe(true)
}

function play(game: GameOrchestrator) {
  expect(
    game.processAction({
      type: 'play',
      tileIds: game.getHandTiles().map((t) => t.id),
    }).success
  ).toBe(true)
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useAchievementStore.getState().resetAchievements()
  useStakeStore.getState().resetAllProgress()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
  runRandom.reset()
})

it.each([1, 2, 3, 4, 5, 6, 7, 8])(
  'records held Decrees and the table on a real tier %i victory',
  (tier) => {
    const game = start(tier)
    acquire(game, ownedId)
    acquire(game, ownedId)
    acquire(game, soldId)
    expect(game.sellDecree(soldId).success).toBe(true)
    expect(getWonStakeTiers(entry())).toEqual([])
    play(game)
    expect(game.getState().hasWonRun).toBe(true)
    expect(getWonStakeTiers(entry())).toEqual([tier])
    expect(getWonStakeTiers(entry(soldId))).toEqual([])
    expect(
      getWonStakeTiers(
        useArchiveStore.getState().getEntry('walls', 'green_felt')
      )
    ).toEqual([tier])
    expect(
      getGoldDecreeProgress(useArchiveStore.getState().entries).completed
    ).toBe(tier === 8 ? 1 : 0)
  }
)

it('does not award stickers on defeat or in Full Unlock mode', () => {
  const game = start()
  acquire(game, ownedId)
  const state = game.getState() as OrchestratorState
  state.handsRemaining = 1
  state.targetScore = 1e12
  state.roundManager.getCurrentRound()!.scoreTarget = 1e12
  play(game)
  expect(state.hasWonRun).toBe(false)
  expect(getWonStakeTiers(entry())).toEqual([])
  useProgressionStore.setState({ fullUnlockEnabled: true })
  const unlocked = start()
  acquire(unlocked, ownedId)
  play(unlocked)
  expect(unlocked.getState().hasWonRun).toBe(true)
  expect(getWonStakeTiers(entry())).toEqual([])
})

it('restores before victory and never credits later Endless acquisitions', () => {
  const game = start()
  acquire(game, ownedId)
  const resumed = new GameOrchestrator()
  resumed.restoreRun(game.captureRun())
  const record = vi.spyOn(useArchiveStore.getState(), 'recordStakeVictory')
  play(resumed)
  expect(record).toHaveBeenCalledTimes(1)
  const result = new GameOrchestrator()
  result.restoreRun(resumed.captureRun())
  expect(record).toHaveBeenCalledTimes(1)
  expect(result.continueEndless()).toBe(true)
  result.exitShop()
  acquire(result, soldId)
  expect(getWonStakeTiers(entry())).toEqual([8])
  expect(getWonStakeTiers(entry(soldId))).toEqual([])
  expect(useAchievementStore.getState().stats.runsWon).toBe(1)
})

it('keeps all earned tiers without downgrading or duplicating them', () => {
  const store = useArchiveStore.getState()
  const key = `decrees:${ownedId}`
  for (const tier of [8, 2, 2, 1, 8]) store.recordStakeVictory([key, key], tier)
  expect(getWonStakeTiers(entry())).toEqual([1, 2, 8])
  expect(entry().timesWonWith).toBe(0)
})

it('requires Gold for every current catalog Decree, not old counters or retired IDs', () => {
  const store = useArchiveStore.getState()
  const keys = [...new Set(ALL_DECREES.map((d) => `decrees:${d.id}`))]
  const missing = keys.at(-1)!
  store.recordStakeVictory(keys.slice(0, -1), 8)
  store.recordStakeVictory([missing], 7)
  useArchiveStore.setState(({ entries }) => ({
    entries: {
      ...entries,
      'decrees:retired': {
        ...entry(),
        key: 'decrees:retired',
        itemId: 'retired',
        wonStakeTiers: [8],
      },
      [missing]: { ...entries[missing], timesWonWith: 999 },
    },
  }))
  useAchievementStore.getState().checkAchievements()
  expect(mastery()).toBe(false)
  expect(getGoldDecreeProgress(useArchiveStore.getState().entries)).toEqual({
    completed: keys.length - 1,
    total: keys.length,
  })
  store.recordStakeVictory([missing], 8)
  useAchievementStore.getState().checkAchievements()
  expect(mastery()).toBe(true)
})

it('announces mastery once when the last missing Decree wins', () => {
  useArchiveStore.getState().recordStakeVictory(
    ALL_DECREES.filter((d) => d.id !== ownedId).map((d) => `decrees:${d.id}`),
    8
  )
  const game = start()
  acquire(game, ownedId)
  const notifications = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'archive_complete_plus_plus') notifications()
  })
  try {
    play(game)
    expect(mastery()).toBe(true)
    useAchievementStore.getState().checkAchievements()
    expect(notifications).toHaveBeenCalledTimes(1)
  } finally {
    off()
  }
})

it('does not infer Decree stickers from legacy victory counts or acquired-then-sold history', () => {
  const store = useArchiveStore.getState()
  for (const decree of ALL_DECREES) store.addToCurrentRun('decrees', decree.id)
  store.incrementWins(useArchiveStore.getState().currentRunItems)
  expect(entry().timesWonWith).toBe(1)
  eventBus.emit('runStart', { seed: 1, stake: 8, wallVariant: 'green_felt' })
  eventBus.emit('runEnd', {
    victory: true,
    score: 1000,
    act: NORMAL_RUN_ACTS,
    round: 3,
    decreesOwned: 5,
  })
  expect(
    getGoldDecreeProgress(useArchiveStore.getState().entries).completed
  ).toBe(0)
  expect(mastery()).toBe(false)
})

it('preserves stickers through profile hydration and removes them on confirmed reset', async () => {
  const store = useArchiveStore.getState()
  store.recordStakeVictory([`decrees:${ownedId}`], 8)
  const saved = JSON.stringify({
    version: 1,
    state: {
      entries: useArchiveStore.getState().entries,
      discoveryHistory: [],
    },
  })
  store.resetArchive()
  vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-archive' ? saved : null
  )
  await useArchiveStore.persist.rehydrate()
  expect(getWonStakeTiers(entry())).toEqual([8])
  store.resetArchive()
  expect(getWonStakeTiers(entry())).toEqual([])
})

it.each([-1, 0, 1.5, 9, NaN, Infinity])(
  'ignores an invalid victory tier %s',
  (tier) => {
    useArchiveStore.getState().recordStakeVictory([`decrees:${ownedId}`], tier)
    expect(getWonStakeTiers(entry())).toEqual([])
  }
)
