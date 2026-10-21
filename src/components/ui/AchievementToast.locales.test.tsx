import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { changeLanguage, type SupportedLanguage } from '../../i18n'
import { useAchievementStore } from '../../stores/achievementStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { AchievementToast } from './AchievementToast'

beforeEach(() => {
  useProgressionStore.setState({ fullUnlockEnabled: false })
  useAchievementStore.getState().resetAchievements()
})
afterEach(async () => {
  cleanup()
  await changeLanguage('en')
})

const names: [SupportedLanguage, string][] = [
  ['en', 'First Steps'],
  ['es', 'Primeros pasos'],
  ['fr', 'Premiers pas'],
  ['it', 'Primi passi'],
  ['ru', 'Первые шаги'],
  ['ja', '最初の一歩'],
  ['ko', '첫걸음'],
  ['zh-Hans', '初出茅庐'],
  ['zh-Hant', '初出茅廬'],
  ['id', 'Langkah Pertama'],
  ['th', 'ก้าวแรก'],
  ['tl', 'Mga Unang Hakbang'],
  ['tr', 'İlk Adımlar'],
]

it.each(names)(
  'renders a newly earned achievement in %s',
  async (language, name) => {
    await changeLanguage(language)
    render(<AchievementToast />)
    act(() => useAchievementStore.getState().unlockAchievement('first_steps'))
    expect(screen.getByRole('heading', { name })).toBeVisible()
  }
)
