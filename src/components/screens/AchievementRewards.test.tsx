import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import i18n, { changeLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES } from '../../config/decreeDefinitions'
import { ALL_CHARTERS } from '../../config/charterDefinitions'
import { TABLE_STYLE_DEFINITIONS } from '../../config/tableStyleDefinitions'
import { ALL_UNLOCKS } from '../../config/unlockDefinitions'
import {
  ACHIEVEMENT_DEFINITIONS,
  useAchievementStore,
} from '../../stores/achievementStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { AchievementsScreen } from './AchievementsScreen'

const rewards = ACHIEVEMENT_DEFINITIONS.filter(
  (definition) => definition.reward
)

beforeEach(() => {
  useProgressionStore.getState().resetProgression()
  useAchievementStore.getState().resetAchievements()
})
afterEach(async () => {
  cleanup()
  await changeLanguage('en')
})

it.each(rewards)(
  '$id references real, gated content rather than display-only copy',
  ({ reward }) => {
    const { category, itemId } = reward!
    const catalog =
      category === 'decrees'
        ? ALL_DECREES
        : category === 'tableStyles'
          ? TABLE_STYLE_DEFINITIONS
          : ALL_CHARTERS
    expect(catalog.find((item) => item.id === itemId)).toBeDefined()
    const unlock = ALL_UNLOCKS.find((item) => item.unlocksId === itemId)
    expect(unlock?.category).toBe(
      category === 'decrees'
        ? 'decree'
        : category === 'tableStyles'
          ? 'table_style'
          : 'charter'
    )
    expect(unlock?.conditions.length).toBeGreaterThan(0)
    expect(useProgressionStore.getState().isItemUnlocked(itemId)).toBe(false)
  }
)

it.each(SUPPORTED_LANGUAGES)(
  'renders all catalog-linked reward names in %s without English fallback',
  async (locale) => {
    await changeLanguage(locale)
    const { container } = render(
      <MemoryRouter initialEntries={['/en/achievements']}>
        <AchievementsScreen />
      </MemoryRouter>
    )
    expect(rewards).toHaveLength(14)
    for (const { id, category, reward } of rewards) {
      fireEvent.click(
        screen.getByRole('button', {
          name: (name) =>
            name.startsWith(i18n.t(`achievements.categories.${category}`)),
        })
      )
      const key = `${reward!.category}.items.${reward!.itemId}.name`
      const ownTranslation = i18n.getResource(locale, 'translation', key)
      expect(typeof ownTranslation, key).toBe('string')
      expect(ownTranslation.trim(), key).not.toBe('')
      expect(
        container.querySelector(
          `[data-achievement-card="${id}"] [data-achievement-reward]`
        )
      ).toHaveTextContent(
        `${i18n.t('achievements.unlocks')}: ${ownTranslation}`
      )
    }
  }
)
