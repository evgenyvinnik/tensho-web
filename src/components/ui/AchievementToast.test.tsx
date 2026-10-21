import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AchievementToast } from './AchievementToast'
import {
  ACHIEVEMENT_DEFINITIONS,
  useAchievementStore,
} from '../../stores/achievementStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { useSettingsStore } from '../../stores/settingsStore'
import i18n from '../../i18n'

beforeEach(() => {
  vi.useFakeTimers()
  useProgressionStore.setState({ fullUnlockEnabled: false })
  useAchievementStore.getState().resetAchievements()
  useSettingsStore.setState({ reducedMotion: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it('celebrates each new unlock with its own image and localized copy, in order', () => {
  const { container } = render(<AchievementToast />)
  act(() => {
    useAchievementStore.getState().unlockAchievement('first_steps')
    useAchievementStore.getState().unlockAchievement('victory')
    useAchievementStore.getState().unlockAchievement('first_steps')
  })
  expect(screen.getByText('Achievement unlocked')).toBeVisible()
  expect(screen.getByRole('heading', { name: 'First Steps' })).toBeVisible()
  expect(
    container.querySelector('[data-achievement-toast] img')
  ).toHaveAttribute(
    'src',
    '/assets/illustrations/generated/achievements/first_steps.webp'
  )
  expect(screen.queryByText('Victory')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(useAchievementStore.getState().achievements.first_steps.seen).toBe(
    true
  )
  expect(screen.getByRole('heading', { name: 'Victory' })).toBeVisible()
  act(() => vi.advanceTimersByTime(8000))
  expect(container.querySelector('[data-achievement-toast]')).toBeNull()
  expect(useAchievementStore.getState().achievements.victory.seen).toBe(true)
})

it('does not replay saved achievement history when mounted again', () => {
  useAchievementStore.getState().unlockAchievement('victory')
  const { container } = render(<AchievementToast />)
  expect(container.querySelector('[data-achievement-toast]')).toBeNull()
})

it('pauses dismissal for hover and keyboard focus, without stealing focus', () => {
  const { container } = render(
    <>
      <button>Play</button>
      <AchievementToast />
    </>
  )
  screen.getByRole('button', { name: 'Play' }).focus()
  act(() => useAchievementStore.getState().unlockAchievement('victory'))
  expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus()
  const toast = container.querySelector('[data-achievement-toast]')!
  fireEvent.mouseEnter(toast)
  act(() => vi.advanceTimersByTime(16000))
  expect(toast).toBeInTheDocument()
  fireEvent.mouseLeave(toast)
  fireEvent.focus(screen.getByRole('button', { name: 'Close' }))
  act(() => vi.advanceTimersByTime(16000))
  expect(toast).toBeInTheDocument()
  fireEvent.blur(screen.getByRole('button', { name: 'Close' }))
  act(() => vi.advanceTimersByTime(8000))
  expect(toast).not.toBeInTheDocument()
})

it('clears queued celebrations on progress reset and suppresses full-unlock mode', () => {
  const { container } = render(<AchievementToast />)
  act(() => useAchievementStore.getState().unlockAchievement('victory'))
  act(() => useAchievementStore.getState().resetAchievements())
  expect(container.querySelector('[data-achievement-toast]')).toBeNull()
  act(() => useProgressionStore.setState({ fullUnlockEnabled: true }))
  act(() => useAchievementStore.getState().unlockAchievement('victory'))
  expect(container.querySelector('[data-achievement-toast]')).toBeNull()
})

it('honors reduced motion without hiding the achievement', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const { container } = render(<AchievementToast />)
  act(() => useAchievementStore.getState().unlockAchievement('victory'))
  expect(container.querySelector('[data-achievement-toast]')).toHaveAttribute(
    'data-reduced-motion',
    'true'
  )
})

it.each(ACHIEVEMENT_DEFINITIONS)(
  'has readable fallback copy for $id',
  (definition) => {
    expect(i18n.exists(definition.nameKey)).toBe(true)
    expect(i18n.exists(definition.descriptionKey)).toBe(true)
  }
)
