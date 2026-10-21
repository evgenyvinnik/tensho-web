import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../../i18n'
import { useAchievementStore } from '../../stores/achievementStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { AchievementsScreen } from './AchievementsScreen'
import { useArchiveStore } from '../../stores/archiveStore'
import { ALL_DECREES } from '../../systems/DecreeSystem'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useProgressionStore.getState().resetProgression()
  useAchievementStore.getState().resetAchievements()
  useArchiveStore.getState().resetArchive()
})

it('shows catalog-based Gold Decree mastery and updates when a sticker is earned', () => {
  const ids = [...new Set(ALL_DECREES.map((d) => d.id))]
  render(
    <MemoryRouter initialEntries={['/en/achievements']}>
      <AchievementsScreen />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: /^Mastery/ }))
  const name = i18n.t('achievements.archiveCompletePlusPlus.name')
  const meter = screen.getByRole('progressbar', { name })
  expect(meter).toHaveAttribute('aria-valuenow', '0')
  expect(meter).toHaveAttribute('aria-valuemax', String(ids.length))
  act(() =>
    useArchiveStore.getState().recordStakeVictory([`decrees:${ids[0]}`], 8)
  )
  expect(meter).toHaveAttribute('aria-valuenow', '1')
  act(() => {
    useArchiveStore.getState().recordStakeVictory(
      ids.map((id) => `decrees:${id}`),
      8
    )
    useAchievementStore.getState().checkAchievements()
  })
  expect(
    screen.queryByRole('progressbar', { name })
  ).not.toBeInTheDocument()
})
afterEach(cleanup)

it('shows real Glass, level, Silence, Wind and Charter progress and reacts to an earned award', () => {
  const store = useAchievementStore.getState()
  store.setStat('maxGlassTilesBrokenInHand', 1)
  store.setStat('highestYakuLevel', 9)
  store.setStat('roundsWonWithoutHonorDiscards', 2)
  store.setStat('maxChartersPurchasedByAct5', 3)
  store.setStat('maxWindYakuInRun', 8)
  const { container } = render(
    <MemoryRouter initialEntries={['/en/achievements']}>
      <AchievementsScreen />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: /^Skill/ }))
  for (const [name, current, target] of [
    ['Shattered', 1, 2],
    ['Retrograde', 9, 10],
    ['Master of Silence', 2, 3],
    ['Charter Collector', 3, 5],
    ['Keeper of Winds', 8, 10],
  ] as const) {
    const meter = screen.getByRole('progressbar', { name })
    expect(meter).toHaveAttribute('aria-valuenow', String(current))
    expect(meter).toHaveAttribute('aria-valuemax', String(target))
    expect(screen.getByText(`${current} / ${target}`)).toBeVisible()
  }
  act(() => {
    store.setStat('maxGlassTilesBrokenInHand', 2)
    store.checkAchievements()
  })
  expect(
    container.querySelector('[data-achievement-card="shattered"]')
  ).toHaveAttribute('data-unlocked', 'true')
  expect(
    screen.queryByRole('progressbar', { name: 'Shattered' })
  ).not.toBeInTheDocument()
})
