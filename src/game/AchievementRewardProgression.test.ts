import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_DECREES } from '../config/decreeDefinitions'
import { isDecreeAvailable } from '../config/decreeUnlocks'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { getUnlockById } from '../config/unlockDefinitions'
import {
  ACHIEVEMENT_DEFINITIONS,
  useAchievementStore,
} from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { useTableStyleStore } from '../stores/tableStyleStore'
import { getAllFateSeals } from '../systems/FateSealSystem'
import { getAllCelestialOrbs } from '../systems/CelestialOrbSystem'
import { metaProgressionSystem } from '../systems/MetaProgressionSystem'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
  synchronizePersistedMetaState,
} from './MetaProgressionBridge'
import { activateFullUnlock, resetAllProgress } from './resetProgress'

const rewards = [
  ['first_steps', 'stage_master'],
  ['ascending', 'flower_pot'],
  ['fortune_built', 'satellite'],
  ['speed_run', 'swift_andy'],
  ['score_10k', 'lucky_sixes'],
  ['score_1m', 'the_idol'],
  ['score_100m', 'stuntman'],
  ['seal_scholar', 'cartomancer'],
  ['star_gazer', 'astronomer'],
  ['red_path', 'crimson_wall'],
  ['black_path', 'obsidian_wall'],
] as const

const unlocked = (id: string) =>
  useProgressionStore.getState().isItemUnlocked(id)
const earned = (id: string) =>
  useAchievementStore.getState().achievements[id].unlocked

function start(stake = 1) {
  eventBus.emit('runStart', { seed: 7, stake, wallVariant: 'green_felt' })
}
function end(victory = true) {
  eventBus.emit('runEnd', {
    victory,
    score: 100,
    act: 8,
    round: 3,
    decreesOwned: 0,
  })
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useAchievementStore.getState().resetAchievements()
  useArchiveStore.getState().resetArchive()
  useStakeStore.getState().resetAllProgress()
  useTableStyleStore.getState().resetAllProgress()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
})

it.each(rewards)(
  '%s references real gated content with the existing unlock identity',
  (achievementId, itemId) => {
    const wall = itemId.endsWith('_wall')
    const reward = ACHIEVEMENT_DEFINITIONS.find(
      ({ id }) => id === achievementId
    )!.reward
    expect(reward).toEqual({
      category: wall ? 'tableStyles' : 'decrees',
      itemId,
    })
    const catalog = wall ? TABLE_STYLE_DEFINITIONS : ALL_DECREES
    expect(catalog.find(({ id }) => id === itemId)).toBeDefined()
    expect(getUnlockById(`unlock_${itemId}`)).toMatchObject({
      unlocksId: itemId,
      category: wall ? 'table_style' : 'decree',
    })
    initializeMetaProgressionBridge()
    expect(unlocked(itemId)).toBe(false)
    if (wall)
      expect(useTableStyleStore.getState().selectStyle(itemId)).toBe(false)
    else expect(isDecreeAvailable(itemId, unlocked)).toBe(false)
    expect(
      useArchiveStore.getState().getEntry(wall ? 'walls' : 'decrees', itemId)
        ?.isUnlocked
    ).toBe(false)
  }
)

describe.each([
  ['first_steps', 'stage_master', 'highestActReached', 4],
  ['ascending', 'flower_pot', 'highestActReached', 8],
  ['fortune_built', 'satellite', 'maxGoldInRun', 400],
  ['score_10k', 'lucky_sixes', 'highestSingleHandScore', 10_000],
  ['score_1m', 'the_idol', 'highestSingleHandScore', 1_000_000],
  ['score_100m', 'stuntman', 'highestSingleHandScore', 100_000_000],
] as const)('%s milestone', (achievementId, itemId, stat, target) => {
  it.each(['achievement', 'progression'] as const)(
    'reconciles the exact boundary from saved %s evidence',
    (source) => {
      const store =
        source === 'achievement' ? useAchievementStore : useProgressionStore
      store.getState().setStat(stat, target - 1)
      initializeMetaProgressionBridge()
      expect(unlocked(itemId)).toBe(false)
      store.getState().setStat(stat, target)
      const savedStats = store.getState().stats
      synchronizePersistedMetaState()
      expect(earned(achievementId)).toBe(true)
      expect(unlocked(itemId)).toBe(true)
      expect(isDecreeAvailable(itemId, unlocked)).toBe(true)
      expect(store.getState().stats[stat]).toBe(savedStats[stat])
      expect(useProgressionStore.getState().stats.totalRunsWon).toBe(0)
      expect(useStakeStore.getState().wallProgress).toEqual({})
      expect(useProgressionStore.getState().recentUnlocks).toEqual([])
    }
  )
})

it('unlocks act, score and gold rewards immediately from real domain events', () => {
  initializeMetaProgressionBridge()
  start()
  eventBus.emit('roundStart', {
    actNumber: 4,
    roundNumber: 1,
    roundType: 'Small',
    target: 100,
  })
  expect(unlocked('stage_master')).toBe(true)
  eventBus.emit('roundStart', {
    actNumber: 8,
    roundNumber: 1,
    roundType: 'Small',
    target: 100,
  })
  expect(unlocked('flower_pot')).toBe(true)
  eventBus.emit('goldChanged', {
    previousGold: 400,
    delta: 0,
    newGold: 400,
    reason: 'reconcile',
  })
  expect(unlocked('satellite')).toBe(true)
  eventBus.emit('handPlayed', {
    tiles: ['a', 'b'],
    score: 100_000_000,
    yakuIds: [],
    pattern: 'pair',
    equation: {
      points: 100_000_000,
      multiplier: 1,
      adjustment: 0,
      total: 100_000_000,
    },
  })
  for (const id of ['lucky_sixes', 'the_idol', 'stuntman'])
    expect(unlocked(id)).toBe(true)
})

it.each([0, 47, 48, 49])(
  'requires a real win with 1–48 paid turns (%i)',
  (turns) => {
    initializeMetaProgressionBridge()
    start()
    for (let i = 0; i < turns; i++)
      eventBus.emit('paidTurnSpent', { action: 'play' })
    expect(unlocked('swift_andy')).toBe(false)
    end()
    expect(unlocked('swift_andy')).toBe(turns > 0 && turns <= 48)
    expect(earned('speed_run')).toBe(turns > 0 && turns <= 48)
  }
)

it('does not infer turn efficiency from old rounds or a defeat', () => {
  useProgressionStore.getState().updateStats({ fastestWinRounds: 1 })
  initializeMetaProgressionBridge()
  expect(unlocked('swift_andy')).toBe(false)
  start()
  eventBus.emit('paidTurnSpent', { action: 'play' })
  end(false)
  expect(unlocked('swift_andy')).toBe(false)
})

describe.each([
  [
    'seal_scholar',
    'cartomancer',
    'fateSealsDiscovered',
    getAllFateSeals,
    'FateSeal',
  ],
  [
    'star_gazer',
    'astronomer',
    'celestialOrbsDiscovered',
    getAllCelestialOrbs,
    'CelestialOrb',
  ],
] as const)(
  '%s discovery',
  (achievementId, itemId, stat, getCatalog, itemType) => {
    it('ignores fake IDs and requires the final current catalog member', () => {
      const ids = getCatalog().map(({ id }) => id)
      const missing = ids.at(-1)!
      useProgressionStore.getState().updateStats({
        [stat]: new Set([
          ...ids.slice(0, -1),
          ...Array.from({ length: 100 }, (_, i) => `fake-${i}`),
        ]),
      })
      useAchievementStore.getState().setStat(stat, 999)
      initializeMetaProgressionBridge()
      const condition = getUnlockById(`unlock_${itemId}`)!.conditions[0]
      const result = metaProgressionSystem.evaluateCondition(condition, {
        stats: useProgressionStore.getState().stats,
        unlockedIds: new Set(),
      })
      expect(result).toMatchObject({
        current: ids.length - 1,
        target: ids.length,
        isMet: false,
      })
      expect(earned(achievementId)).toBe(false)
      expect(unlocked(itemId)).toBe(false)
      eventBus.emit('consumableAcquired', {
        consumableType: itemType,
        itemId: missing,
        instanceId: `test-${missing}`,
        name: missing,
        source: 'purchase',
      })
      expect(earned(achievementId)).toBe(true)
      expect(unlocked(itemId)).toBe(true)
    })

    it('reconciles actual Archive discoveries without manufacturing acquisition or win history', () => {
      for (const { id } of getCatalog()) {
        useArchiveStore.getState().unlockItem('consumables', id)
        useArchiveStore
          .getState()
          .discoverItem('consumables', id, 'purchase', 1, 1)
      }
      const before = useProgressionStore.getState().stats
      initializeMetaProgressionBridge()
      expect(unlocked(itemId)).toBe(true)
      expect(earned(achievementId)).toBe(true)
      expect(useProgressionStore.getState().stats).toBe(before)
      expect(useProgressionStore.getState().recentUnlocks).toEqual([])
    })
  }
)

it.each([1, 2, 3, 4, 5, 8])(
  'unlocks selectable Walls only after a victory at tier %i',
  (tier) => {
    initializeMetaProgressionBridge()
    start(tier)
    expect(unlocked('crimson_wall')).toBe(false)
    expect(unlocked('obsidian_wall')).toBe(false)
    end(false)
    expect(unlocked('crimson_wall')).toBe(false)
    start(tier)
    end()
    expect(useTableStyleStore.getState().stats.highestTierWon).toBe(tier)
    for (const [id, minimum] of [
      ['crimson_wall', 2],
      ['obsidian_wall', 4],
    ] as const) {
      expect(unlocked(id)).toBe(tier >= minimum)
      expect(useTableStyleStore.getState().selectStyle(id)).toBe(
        tier >= minimum
      )
      expect(useArchiveStore.getState().getEntry('walls', id)?.isUnlocked).toBe(
        tier >= minimum
      )
    }
  }
)

it.each(['stake', 'progression'] as const)(
  'restores Walls from actual legacy %s victories, including retired walls',
  (source) => {
    if (source === 'stake')
      useStakeStore.getState().recordVictory(100, 8, 'red_wall', 5)
    else
      useProgressionStore
        .getState()
        .updateStats({ stakeVictories: { red_wall: [5] } })
    const history = useStakeStore.getState().wallProgress
    const stats = useProgressionStore.getState().stats
    initializeMetaProgressionBridge()
    expect(unlocked('crimson_wall')).toBe(true)
    expect(unlocked('obsidian_wall')).toBe(true)
    expect(useStakeStore.getState().wallProgress).toBe(history)
    expect(useProgressionStore.getState().stats).toBe(stats)
    expect(useProgressionStore.getState().recentUnlocks).toEqual([])
    expect(useTableStyleStore.getState().stats.highestTierWon).toBe(5)
  }
)

it.each([0, 1.5, 9, Infinity, NaN])(
  'rejects invalid legacy victory tier %s and selection-only evidence',
  (tier) => {
    useStakeStore.setState({ globalHighestCompleted: 8, currentStakeTier: 8 })
    useStakeStore.getState().recordVictory(100, 8, 'green_felt', tier)
    useProgressionStore
      .getState()
      .updateStats({ stakeVictories: { green_felt: [tier] } })
    initializeMetaProgressionBridge()
    expect(unlocked('crimson_wall')).toBe(false)
    expect(unlocked('obsidian_wall')).toBe(false)
    expect(useTableStyleStore.getState().stats.highestTierWon).toBe(0)
  }
)

it('rejects a legacy victory filed under a different wall', () => {
  useStakeStore.getState().recordVictory(100, 8, 'green_felt', 8)
  const record = useStakeStore.getState().wallProgress.green_felt
  useStakeStore.setState({ wallProgress: { red_wall: record } })
  initializeMetaProgressionBridge()
  expect(unlocked('crimson_wall')).toBe(false)
  expect(unlocked('obsidian_wall')).toBe(false)
  expect(useTableStyleStore.getState().stats.highestTierWon).toBe(0)
})

it('defaults missing legacy table victory evidence to zero and displays partial proven progress', () => {
  const legacyStats = { ...useTableStyleStore.getState().stats }
  delete legacyStats.highestTierWon
  useTableStyleStore.setState({ stats: legacyStats })
  useStakeStore.setState({ globalHighestCompleted: 8, currentStakeTier: 8 })
  initializeMetaProgressionBridge()
  expect(useTableStyleStore.getState().stats.highestTierWon).toBe(0)
  expect(useTableStyleStore.getState().getUnlockProgress('crimson_wall')).toBe(
    0
  )
  useStakeStore.getState().recordVictory(100, 8, 'red_wall', 1)
  synchronizePersistedMetaState()
  expect(useTableStyleStore.getState().stats.highestTierWon).toBe(1)
  expect(useTableStyleStore.getState().getUnlockProgress('crimson_wall')).toBe(
    0.5
  )
  expect(useTableStyleStore.getState().getUnlockProgress('obsidian_wall')).toBe(
    0.25
  )
})

it.each(rewards)(
  'preserves earned %s records and restores their reward quietly',
  (achievementId, itemId) => {
    useAchievementStore.getState().unlockAchievement(achievementId)
    useAchievementStore.getState().markAsSeen(achievementId)
    const record = useAchievementStore.getState().achievements[achievementId]
    const stats = useProgressionStore.getState().stats
    const notified = vi.fn()
    const off = eventBus.on('achievementUnlocked', notified)
    try {
      initializeMetaProgressionBridge()
      expect(unlocked(itemId)).toBe(true)
      const unlock = useProgressionStore.getState().unlocks[`unlock_${itemId}`]
      synchronizePersistedMetaState()
      expect(useProgressionStore.getState().unlocks[`unlock_${itemId}`]).toBe(
        unlock
      )
      expect(useAchievementStore.getState().achievements[achievementId]).toBe(
        record
      )
      expect(useProgressionStore.getState().stats).toBe(stats)
      expect(useProgressionStore.getState().recentUnlocks).toEqual([])
      expect(notified).not.toHaveBeenCalled()
    } finally {
      off()
    }
  }
)

it('preserves existing unlock timestamps without inventing achievement history', () => {
  useProgressionStore.getState().unlockItem('unlock_stage_master', false)
  const record = useProgressionStore.getState().unlocks.unlock_stage_master
  initializeMetaProgressionBridge()
  expect(useProgressionStore.getState().unlocks.unlock_stage_master).toBe(
    record
  )
  expect(earned('first_steps')).toBe(false)
})

it('does not re-award secured rewards during Endless events or reconnect', () => {
  initializeMetaProgressionBridge()
  start(4)
  eventBus.emit('paidTurnSpent', { action: 'play' })
  end()
  const achievements = useAchievementStore.getState().achievements
  const unlocks = useProgressionStore.getState().unlocks
  const history = useTableStyleStore.getState().unlockHistory
  const wins = useProgressionStore.getState().stats.totalRunsWon
  useProgressionStore.getState().clearRecentUnlocks()
  const notified = vi.fn()
  const off = eventBus.on('achievementUnlocked', notified)
  try {
    eventBus.emit('roundStart', {
      actNumber: 9,
      roundNumber: 1,
      roundType: 'Small',
      target: 100,
    })
    // Act 9 may genuinely earn progression accolades; only secured awards are stable.
    notified.mockClear()
    eventBus.emit('gameOver', {
      reason: 'defeat',
      finalScore: 100,
    })
    shutdownMetaProgressionBridge()
    initializeMetaProgressionBridge()
    for (const id of ['red_path', 'black_path', 'speed_run'])
      expect(useAchievementStore.getState().achievements[id]).toBe(
        achievements[id]
      )
    for (const id of [
      'unlock_crimson_wall',
      'unlock_obsidian_wall',
      'unlock_swift_andy',
    ])
      expect(useProgressionStore.getState().unlocks[id]).toBe(unlocks[id])
    expect(
      useTableStyleStore
        .getState()
        .unlockHistory.filter(({ styleId }) => styleId.endsWith('_wall'))
    ).toEqual(history.filter(({ styleId }) => styleId.endsWith('_wall')))
    expect(useProgressionStore.getState().stats.totalRunsWon).toBe(wins)
    expect(notified).not.toHaveBeenCalled()
  } finally {
    off()
  }
})

it('Full Unlock enables all 11 without awards, survives reload, and a full reset relocks them', async () => {
  initializeMetaProgressionBridge()
  const achievements = useAchievementStore.getState().achievements
  expect(activateFullUnlock()).toEqual({ success: true })
  start(8)
  eventBus.emit('paidTurnSpent', { action: 'play' })
  end()
  shutdownMetaProgressionBridge()
  initializeMetaProgressionBridge()
  for (const [, itemId] of rewards) expect(unlocked(itemId)).toBe(true)
  expect(useTableStyleStore.getState().selectStyle('obsidian_wall')).toBe(true)
  expect(useAchievementStore.getState().achievements).toBe(achievements)
  expect(useProgressionStore.getState().recentUnlocks).toEqual([])
  expect(useTableStyleStore.getState().stats.highestTierWon).toBe(0)
  expect(await resetAllProgress()).toEqual({ success: true })
  for (const [, itemId] of rewards) expect(unlocked(itemId)).toBe(false)
  expect(
    useTableStyleStore
      .getState()
      .getUnlockedStyles()
      .map(({ id }) => id)
  ).toEqual(['green_felt'])
})
