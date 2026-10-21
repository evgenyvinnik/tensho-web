import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../../i18n'
import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementsByCategory,
  useAchievementStore,
} from '../../stores/achievementStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { AchievementToast } from '../ui/AchievementToast'
import { AchievementsScreen } from './AchievementsScreen'

const deferredIds = ['rule_bender', 'rule_breaker']
const historical = Object.fromEntries(
  deferredIds.map((id) => [
    id,
    { id, unlocked: true, unlockedAt: 123456, progress: 7, seen: false },
  ])
)

beforeEach(async () => {
  // The shared test setup has no-op storage; use real read/write semantics
  // here so hydration and preservation assertions exercise persistence.
  const storage = new Map<string, string>()
  vi.spyOn(localStorage, 'getItem').mockImplementation(
    (key) => storage.get(key) ?? null
  )
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    storage.set(key, value)
  })
  await i18n.changeLanguage('en')
  useProgressionStore.getState().resetProgression()
  useAchievementStore.getState().resetAchievements()
})

afterEach(() => {
  cleanup()
  useAchievementStore.getState().resetAchievements()
  vi.restoreAllMocks()
})

it('keeps only regular-run feats in the Challenge category', () => {
  expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(31)
  expect(getAchievementsByCategory('challenge').map((def) => def.id)).toEqual([
    'deck_minimalist',
    'deck_maximalist',
    'purist',
  ])
  for (const id of deferredIds) {
    expect(useAchievementStore.getState().achievements[id]).toBeUndefined()
  }
})

it.each([2, 3])(
  'preserves version %i historical records without counting or announcing them',
  async (version) => {
    const { container } = render(
      <MemoryRouter initialEntries={['/en/achievements']}>
        <AchievementsScreen />
        <AchievementToast />
      </MemoryRouter>
    )
    localStorage.setItem(
      'tensho-achievements',
      JSON.stringify({
        version,
        state: {
          achievements: historical,
          stats: { challengeRunsCompleted: 7 },
        },
      })
    )
    await act(async () => useAchievementStore.persist.rehydrate())
    expect(useAchievementStore.getState().getUnlockedCount()).toBe(0)
    expect(useAchievementStore.getState().getUnseenUnlocks()).toEqual([])
    expect(screen.getByText('0 / 31')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /^Challenge/ }))
    expect(container.querySelectorAll('[data-achievement-card]')).toHaveLength(
      3
    )
    for (const id of deferredIds) {
      expect(
        container.querySelector(`[data-achievement-card="${id}"]`)
      ).toBeNull()
      expect(useAchievementStore.getState().achievements[id]).toEqual(
        historical[id]
      )
    }
    expect(container.querySelector('[data-achievement-toast]')).toBeNull()

    // A normal award still counts, celebrates and persists the old records.
    act(() => useAchievementStore.getState().unlockAchievement('first_steps'))
    expect(screen.getByText('1 / 31')).toBeVisible()
    expect(useAchievementStore.getState().getUnlockedCount()).toBe(1)
    expect(useAchievementStore.getState().getUnseenUnlocks()).toEqual([
      'first_steps',
    ])
    expect(container.querySelector('[data-achievement-toast]')).toHaveAttribute(
      'data-achievement-toast',
      'first_steps'
    )
    const saved = JSON.parse(localStorage.getItem('tensho-achievements')!)
    for (const id of deferredIds) {
      expect(saved.state.achievements[id]).toEqual(historical[id])
    }
    expect(saved.state.stats.challengeRunsCompleted).toBe(7)
  }
)

it.each(deferredIds)(
  'cannot newly unlock or progress a saved deferred %s',
  (id) => {
    const oldRecord = { id, unlocked: false, progress: 3, seen: true }
    useAchievementStore.setState((state) => ({
      achievements: { ...state.achievements, [id]: oldRecord },
    }))
    const store = useAchievementStore.getState()
    store.setStat('challengeRunsCompleted', 99)
    store.checkAchievements()
    store.unlockAchievement(id)
    store.updateProgress(id, 99)
    expect(useAchievementStore.getState().achievements[id]).toEqual(oldRecord)
  }
)
