import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NORMAL_RUN_ACTS } from '../config/runProgression'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { SealType } from '../core/TileModifier'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { DecreeSystem } from '../systems/DecreeSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { runRandom } from './RunRandom'
import { ClassicRunPersistence } from './ClassicRunPersistence'
import { ClassicSaveRepository } from './classicSavedRun'

const earned = () =>
  useAchievementStore.getState().achievements.keeper_of_winds.unlocked
const progress = () => useAchievementStore.getState().stats.maxWindYakuInRun
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

function start(stake = 1, table = 'green_felt') {
  const game = new GameOrchestrator()
  game.startNewRun(7, stake, table)
  return game
}

function windHand(game: GameOrchestrator, suit = TileSuit.Wind, rank = 1) {
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.targetScore = 1e12
  state.roundManager.getCurrentRound()!.scoreTarget = 1e12
  state.handsRemaining = 20
  state.handsAllowance = 20
  const groups: [TileSuit, number[]][] = [
    [suit, [rank, rank, rank]],
    [TileSuit.Manzu, [1, 2, 3]],
    [TileSuit.Pinzu, [4, 5, 6]],
    [TileSuit.Souzu, [7, 8, 9, 5, 5]],
  ]
  state.handTiles = groups.flatMap(([suit, ranks], group) =>
    ranks.map(
      (rank, i) =>
        new Tile(suit, rank, `wind-${state.playsThisRound}-${group}-${i}`)
    )
  )
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  return state.handTiles.map((tile) => tile.id)
}

function playWind(game: GameOrchestrator) {
  const ids = windHand(game)
  expect(
    game.previewScore(ids)!.detectedYaku.filter((y) => y.honorSource === 'wind')
  ).toHaveLength(2)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
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
  runRandom.reset()
  vi.restoreAllMocks()
})

it('requires ten paid Wind Yaku in one run, never previews or lifetime totals', () => {
  const first = start()
  for (let i = 0; i < 3; i++) playWind(first)
  expect(progress()).toBe(6)
  const second = start()
  for (let i = 0; i < 2; i++) playWind(second)
  expect(useAchievementStore.getState().stats.totalWindYakuScored).toBe(10)
  expect(progress()).toBe(6)
  expect(earned()).toBe(false)
  for (let i = 0; i < 2; i++) playWind(second)
  const ids = windHand(second)
  second.previewScore(ids)
  second.previewScore(ids)
  expect(progress()).toBe(8)
  expect(earned()).toBe(false)
  expect(second.processAction({ type: 'play', tileIds: ids }).success).toBe(
    true
  )
  expect(progress()).toBe(10)
  expect(earned()).toBe(true)
  start()
  expect(progress()).toBe(10)
  expect(earned()).toBe(true)
})

it.each([
  [TileSuit.Dragon, 1],
  [TileSuit.Wind, 2],
] as const)('does not count a %s %i set as a scoring Wind', (suit, rank) => {
  const game = start()
  const ids = windHand(game, suit, rank)
  const yaku = game.previewScore(ids)!.detectedYaku
  expect(yaku.filter((y) => y.honorSource === 'wind')).toHaveLength(0)
  if (suit === TileSuit.Dragon)
    expect(yaku.filter((y) => y.honorSource === 'dragon')).toHaveLength(1)
  expect(progress()).toBe(0)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(progress()).toBe(0)
})

it('counts scored occurrences once, excluding zero/blocked plays and detection events', () => {
  start()
  const hand = {
    tiles: ['wind'],
    yakuIds: ['yakuhai', 'yakuhai'],
    windYakuScored: 2,
    pattern: 'mahjong' as const,
    score: 100,
    equation: { points: 100, multiplier: 1, adjustment: 0, total: 100 },
  }
  eventBus.emit('handPlayed', { ...hand, blocked: true })
  eventBus.emit('handPlayed', { ...hand, score: 0 })
  eventBus.emit('yakuScored', {
    yakuId: 'yakuhai_wind',
    yakuName: 'Wind',
    multiplier: 1.2,
  })
  eventBus.emit('yakumanScored', {
    yakuId: 'yakuhai_wind',
    yakuName: 'Ascended Wind',
  })
  expect(progress()).toBe(0)
  eventBus.emit('handPlayed', hand)
  expect(progress()).toBe(2)
})

it('restores an eight-Yaku run without resetting, replaying, or double-counting its award', async () => {
  const data = new Map<string, string>()
  vi.spyOn(localStorage, 'getItem').mockImplementation(
    (key) => data.get(key) ?? null
  )
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    data.set(key, value)
  })
  const game = start()
  for (let i = 0; i < 4; i++) playWind(game)
  const saved = parseClassicRunSnapshot(json(game.captureRun()))
  expect(saved.meta?.windYakuScored).toBe(8)
  const storage = useAchievementStore.persist.getOptions().storage!
  const profile = await storage.getItem('tensho-achievements')
  useAchievementStore.getState().resetAchievements()
  await storage.setItem('tensho-achievements', profile!)
  await useAchievementStore.persist.rehydrate()
  shutdownMetaProgressionBridge()
  initializeMetaProgressionBridge()
  const notified = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'keeper_of_winds') notified()
  })
  try {
    game.restoreRun(saved)
    expect(progress()).toBe(8)
    expect(notified).not.toHaveBeenCalled()
    playWind(game)
    expect(progress()).toBe(10)
    expect(notified).toHaveBeenCalledTimes(1)
    game.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
    playWind(game)
    expect(notified).toHaveBeenCalledTimes(1)
  } finally {
    off()
  }
})

it('does not infer a single-run record from legacy lifetime totals or missing save fields', () => {
  useAchievementStore.getState().setStat('totalWindYakuScored', 100)
  useAchievementStore.getState().checkAchievements()
  expect(earned()).toBe(false)
  const game = start()
  const saved = json(game.captureRun())
  delete saved.meta!.windYakuScored
  game.restoreRun(parseClassicRunSnapshot(saved))
  playWind(game)
  expect(progress()).toBe(2)
  expect(earned()).toBe(false)
  useAchievementStore.getState().unlockAchievement('keeper_of_winds')
  start()
  expect(earned()).toBe(true)
})

it('suppresses Full Unlock progress, including the active-run counter', () => {
  const game = start()
  useProgressionStore.setState({ fullUnlockEnabled: true })
  playWind(game)
  expect(progress()).toBe(0)
  expect(game.captureRun().meta?.windYakuScored).toBe(0)
  useProgressionStore.setState({ fullUnlockEnabled: false })
  playWind(game)
  expect(progress()).toBe(2)
})

it('validates optional per-run Wind counts rather than accepting corrupted saves', () => {
  const saved = json(start().captureRun())
  for (const bad of [-1, 1.5, null, '9']) {
    const invalid = json(saved)
    Object.assign(invalid.meta!, { windYakuScored: bad })
    expect(() => parseClassicRunSnapshot(invalid)).toThrow()
  }
  expect(() => parseClassicRunSnapshot(saved)).not.toThrow()
  delete saved.meta!.windYakuScored
  expect(() => parseClassicRunSnapshot(saved)).not.toThrow()
})

it('does not multiply Wind achievement credit through tile retriggers', () => {
  const game = start()
  const ids = windHand(game)
  const state = game.getState() as OrchestratorState
  state.handTiles[0] = state.handTiles[0].withSeal(SealType.Red)
  expect(game.previewScore(ids)!.retriggeredTiles).toContain(ids[0])
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(progress()).toBe(2)
})

it('does not treat a tactical Wind pair as a complete-hand Yaku', () => {
  const game = start()
  const ids = windHand(game).slice(0, 2)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(progress()).toBe(0)
})

function secureVictory(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  state.roundManager.startAct(NORMAL_RUN_ACTS)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.mandateEffectSystem.deactivateMandate()
  state.currentAct = NORMAL_RUN_ACTS
  state.currentRound = 3
  state.score = 0
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  state.handTiles = [
    new Tile(TileSuit.Manzu, 5, 'victory-pair-a'),
    new Tile(TileSuit.Manzu, 5, 'victory-pair-b'),
  ]
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.map((tile) => tile.id),
    }).success
  ).toBe(true)
  expect(state.hasWonRun).toBe(true)
  expect(state.phase).toBe('gameOver')
}

it('carries proven Wind progress through victory, saved results and explicit Endless without a second victory', () => {
  const game = start()
  for (let i = 0; i < 4; i++) playWind(game)
  secureVictory(game)
  const saved = parseClassicRunSnapshot(json(game.captureRun()))
  expect(saved.meta?.windYakuScored).toBe(8)
  const wins = json(useStakeStore.getState().wallProgress)
  const notified = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'keeper_of_winds') notified()
  })
  try {
    game.restoreRun(saved)
    expect(progress()).toBe(8)
    expect(notified).not.toHaveBeenCalled()
    expect(game.continueEndless()).toBe(true)
    expect(game.continueEndless()).toBe(false)
    game.exitShop()
    expect(game.getState().currentAct).toBe(NORMAL_RUN_ACTS + 1)
    playWind(game)
    expect(progress()).toBe(10)
    expect(earned()).toBe(true)
    expect(notified).toHaveBeenCalledTimes(1)
    game.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
    expect(notified).toHaveBeenCalledTimes(1)
    expect(useAchievementStore.getState().stats.runsWon).toBe(1)
    expect(useAchievementStore.getState().stats.runsCompleted).toBe(1)
    expect(useStakeStore.getState().wallProgress).toEqual(wins)
  } finally {
    off()
  }
})

it.each([false, true])(
  'starts observed-only credit from a legacy null context (already Endless=%s)',
  (alreadyEndless) => {
    const game = start(3, 'red_lacquer')
    for (let i = 0; i < 4; i++) playWind(game)
    secureVictory(game)
    if (alreadyEndless) {
      expect(game.continueEndless()).toBe(true)
      game.exitShop()
    }
    const saved = json(game.captureRun())
    saved.meta = null
    const profile = json(useAchievementStore.getState().stats)
    const parsed = parseClassicRunSnapshot(saved)
    game.restoreRun(parsed)
    expect(json(useAchievementStore.getState().stats)).toEqual(profile)
    expect(game.captureRun().state).toEqual(saved.state)
    expect(game.captureRun().meta?.windYakuScored).toBe(0)
    expect(game.captureRun().meta).toMatchObject({
      stake: 3,
      wallId: 'red_lacquer',
    })
    expect(parsed.meta).toBeNull()
    if (!alreadyEndless) {
      expect(game.continueEndless()).toBe(true)
      game.exitShop()
    }
    playWind(game)
    expect(game.captureRun().meta?.windYakuScored).toBe(2)
    expect(progress()).toBe(8)
    expect(earned()).toBe(false)
    expect(useAchievementStore.getState().stats.runsWon).toBe(1)
    expect(useAchievementStore.getState().stats.runsCompleted).toBe(1)
  }
)

it('clears the active context after an Endless defeat without replaying run settlement', () => {
  const game = start()
  playWind(game)
  secureVictory(game)
  expect(game.continueEndless()).toBe(true)
  game.exitShop()
  const ids = windHand(game)
  const state = game.getState() as OrchestratorState
  state.handsRemaining = 1
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.phase).toBe('gameOver')
  expect(state.hasWonRun).toBe(true)
  expect(progress()).toBe(4)
  expect(game.captureRun().meta).toBeNull()
  game.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
  expect(game.captureRun().meta).toBeNull()
  expect(game.continueEndless()).toBe(false)
  expect(useAchievementStore.getState().stats.runsWon).toBe(1)
  expect(useAchievementStore.getState().stats.runsCompleted).toBe(1)
  game.startNewRun(8)
  expect(game.captureRun().meta?.windYakuScored).toBe(0)
  playWind(game)
  expect(game.captureRun().meta?.windYakuScored).toBe(2)
  expect(progress()).toBe(4)
})

it('clears banked victory context on reset without erasing earned progress', () => {
  const game = start()
  playWind(game)
  secureVictory(game)
  expect(game.captureRun().meta?.windYakuScored).toBe(2)
  game.resetGame()
  // Even a later unrelated detection cannot add to the closed run.
  eventBus.emit('handPlayed', {
    tiles: ['stale'],
    windYakuScored: 8,
    score: 1,
    yakuIds: ['yakuhai'],
    pattern: 'mahjong',
    equation: { points: 1, multiplier: 1, adjustment: 0, total: 1 },
  })
  expect(progress()).toBe(2)
  expect(earned()).toBe(false)
  game.startNewRun(8)
  expect(game.captureRun().meta?.windYakuScored).toBe(0)
  expect(useAchievementStore.getState().stats.runsWon).toBe(1)
})

it('reconnects only observed legacy Flowers without awarding missing historical progress', () => {
  const game = start()
  secureVictory(game)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.flowerSystem.addFlower(
    Tile.createFlower(FlowerType.Plum, 'legacy-plum')
  )
  state.flowerSystem.addFlower(
    Tile.createFlower(FlowerType.Orchid, 'legacy-orchid')
  )
  const saved = json(game.captureRun())
  saved.meta = null
  const profile = json(useAchievementStore.getState().stats)
  game.restoreRun(parseClassicRunSnapshot(saved))
  expect(game.captureRun().meta).toMatchObject({
    hadFlowers: true,
    flowerTypes: ['1', '2'],
    pendingCorruptedSeasons: 0,
    windYakuScored: 0,
  })
  expect(json(useAchievementStore.getState().stats)).toEqual(profile)
  const upgraded = parseClassicRunSnapshot(json(game.captureRun()))
  game.restoreRun(upgraded)
  expect(game.captureRun()).toEqual(upgraded)
})

it('writes new Endless credit through the real save coordinator and resumes it once', async () => {
  const original = start()
  secureVictory(original)
  expect(original.continueEndless()).toBe(true)
  original.exitShop()
  const legacy = json(original.captureRun())
  legacy.meta = null
  const data = new Map<string, string>()
  let token = 0
  const repository = new ClassicSaveRepository({
    storage: () => ({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value)
      },
      removeItem: (key) => {
        data.delete(key)
      },
    }),
    exclusive: async (operation) => operation(),
    token: () => `endless-${++token}`,
  })
  const seeded = await repository.replace(null, legacy)
  if (!seeded.ok) throw new Error(`Legacy fixture failed: ${seeded.reason}`)
  const resumed = new GameOrchestrator()
  const persistence = new ClassicRunPersistence(resumed, repository)
  try {
    expect(await persistence.resume(seeded.raw)).toBe(true)
    expect(resumed.captureRun().meta?.windYakuScored).toBe(0)
    playWind(resumed)
    await persistence.flush()
    expect(persistence.getSnapshot().status).toBe('saved')
    const disk = repository.read()
    if (disk.kind !== 'ready')
      throw new Error(`Invalid checkpoint: ${disk.kind}`)
    expect(disk.saved.snapshot.meta?.windYakuScored).toBe(2)
    persistence.dispose()
    const next = new GameOrchestrator()
    const nextPersistence = new ClassicRunPersistence(next, repository)
    try {
      expect(await nextPersistence.resume(disk.raw)).toBe(true)
      expect(next.captureRun()).toEqual(disk.saved.snapshot)
      expect(progress()).toBe(2)
      expect(useAchievementStore.getState().stats.runsWon).toBe(1)
      expect(useAchievementStore.getState().stats.runsCompleted).toBe(1)
    } finally {
      nextPersistence.dispose()
    }
  } finally {
    persistence.dispose()
  }
})
