import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { eventBus } from '../game/EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from '../game/MetaProgressionBridge'
import { useAchievementStore } from './achievementStore'
import { useArchiveStore } from './archiveStore'
import { useProgressionStore } from './progressionStore'
import { useStakeStore } from './stakeStore'

const stakeAwards = [
  { id: 'red_path', tier: 2 },
  { id: 'black_path', tier: 4 },
  { id: 'golden_path', tier: 8 },
]

function win(wallId: string, tier: number) {
  useStakeStore.getState().recordVictory(10000, 8, wallId, tier)
}

function earned(id: string) {
  return useAchievementStore.getState().achievements[id].unlocked
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useStakeStore.getState().resetAllProgress()
  useAchievementStore.getState().resetAchievements()
})

afterEach(() => shutdownMetaProgressionBridge())

describe.each(stakeAwards)('$id', ({ id, tier }) => {
  it('requires a recorded victory, not a selected or unlocked difficulty', () => {
    useStakeStore.setState({
      currentStakeTier: tier,
      globalHighestCompleted: tier,
    })
    useAchievementStore.getState().checkAchievements()
    expect(earned(id)).toBe(false)
    win('green_felt', tier)
    useAchievementStore.getState().checkAchievements()
    expect(earned(id)).toBe(true)
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'counts a tier %i victory only at or above the required difficulty',
    (completedTier) => {
      win('green_felt', completedTier)
      useAchievementStore.getState().checkAchievements()
      expect(earned(id)).toBe(completedTier >= tier)
    }
  )

  it('does not combine lower-tier wins into a qualifying victory', () => {
    for (let lower = 1; lower < tier; lower++) win('green_felt', lower)
    useAchievementStore.getState().checkAchievements()
    expect(earned(id)).toBe(false)
    win('green_felt', tier)
    useAchievementStore.getState().checkAchievements()
    expect(earned(id)).toBe(true)
  })

  it('recognizes restored victory history without changing its records', () => {
    win('green_felt', tier)
    const wallProgress = JSON.parse(
      JSON.stringify(useStakeStore.getState().wallProgress)
    )
    useStakeStore.getState().resetAllProgress()
    useStakeStore.setState({ wallProgress })
    useAchievementStore.getState().checkAchievements()
    expect(earned(id)).toBe(true)
    expect(useStakeStore.getState().wallProgress).toEqual(wallProgress)
  })

  it('does not award a defeat, then announces the real win once', () => {
    initializeMetaProgressionBridge()
    const notifications = vi.fn()
    const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
      if (achievementId === id) notifications()
    })
    try {
      eventBus.emit('runStart', {
        seed: 7,
        stake: tier,
        wallVariant: 'green_felt',
      })
      eventBus.emit('runEnd', {
        victory: false,
        score: 10000,
        act: 8,
        round: 3,
        decreesOwned: 0,
      })
      expect(earned(id)).toBe(false)
      eventBus.emit('runStart', {
        seed: 8,
        stake: tier,
        wallVariant: 'green_felt',
      })
      eventBus.emit('runEnd', {
        victory: true,
        score: 10000,
        act: 8,
        round: 3,
        decreesOwned: 0,
      })
      expect(earned(id)).toBe(true)
      expect(notifications).toHaveBeenCalledTimes(1)
      useAchievementStore.getState().markAsSeen(id)
      shutdownMetaProgressionBridge()
      initializeMetaProgressionBridge()
      useAchievementStore.getState().checkAchievements()
      expect(notifications).toHaveBeenCalledTimes(1)
      expect(useAchievementStore.getState().getUnseenUnlocks()).not.toContain(
        id
      )
    } finally {
      off()
    }
  })
})

it('announces all three path awards once for a first recorded Gold win', () => {
  initializeMetaProgressionBridge()
  const notifications: string[] = []
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (stakeAwards.some(({ id }) => id === achievementId))
      notifications.push(achievementId)
  })
  try {
    eventBus.emit('runStart', {
      seed: 9,
      stake: 8,
      wallVariant: 'green_felt',
    })
    eventBus.emit('runEnd', {
      victory: true,
      score: 10000,
      act: 8,
      round: 3,
      decreesOwned: 0,
    })
    expect(notifications).toEqual(stakeAwards.map(({ id }) => id))
    useAchievementStore.getState().checkAchievements()
    expect(notifications).toHaveLength(3)
    expect(
      useStakeStore.getState().wallProgress.green_felt.victories
    ).toHaveLength(1)
  } finally {
    off()
  }
})

it('requires a Gold victory with every current playable table, not retired walls', () => {
  const tables = TABLE_STYLE_DEFINITIONS.map((table) => table.id)
  expect(tables).not.toContain('jade_wall')
  expect(tables).not.toContain('ivory_wall')
  const last = tables.at(-1)!
  for (const wallId of tables.slice(0, -1)) win(wallId, 8)
  win(last, 7)
  win('jade_wall', 8)
  win('ivory_wall', 8)
  useAchievementStore.getState().checkAchievements()
  expect(earned('archive_complete_plus')).toBe(false)
  win(last, 8)
  useAchievementStore.getState().checkAchievements()
  expect(earned('archive_complete_plus')).toBe(true)
})

it('does not award table mastery from maximum-tier summary fields alone', () => {
  useStakeStore.setState({
    globalHighestCompleted: 8,
    wallProgress: Object.fromEntries(
      TABLE_STYLE_DEFINITIONS.map(({ id }) => [
        id,
        {
          wallId: id,
          highestCompleted: 8,
          victories: [],
        },
      ])
    ),
  })
  useAchievementStore.getState().checkAchievements()
  expect(earned('archive_complete_plus')).toBe(false)
})

it('does not create stakes or mastery achievements in Full Unlock mode', () => {
  for (const { id } of TABLE_STYLE_DEFINITIONS) {
    for (const { tier } of stakeAwards) win(id, tier)
  }
  useProgressionStore.setState({ fullUnlockEnabled: true })
  useAchievementStore.getState().checkAchievements()
  for (const id of [
    ...stakeAwards.map((award) => award.id),
    'archive_complete_plus',
  ]) {
    expect(earned(id)).toBe(false)
  }
})
