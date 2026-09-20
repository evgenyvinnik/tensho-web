import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../i18n'
import { forecastHeading } from './forecastGuidance'

afterEach(async () => {
  await i18n.changeLanguage('en')
})

it.each(SUPPORTED_LANGUAGES)(
  'keeps %s headings localized and prioritizes the actual selection',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const base = {
      activeTileCount: 0,
      previewTileCount: 14,
      stagedTileCount: 0,
      isCompleteHand: false,
      matchedPatternLabel: null,
      coachPrompt: 'coach prompt',
    }
    expect(forecastHeading(i18n.t, base)).toBe('coach prompt')
    expect(forecastHeading(i18n.t, { ...base, coachPrompt: null })).toBe(
      i18n.t('gameplay.chooseTacticalGroup')
    )
    const selection = forecastHeading(i18n.t, {
      ...base,
      activeTileCount: 4,
      previewTileCount: 4,
    })
    expect(selection).toBe(
      i18n.t('gameplay.forecast.selectionCount', { count: 4 })
    )
    expect(selection).not.toMatch(/gameplay\.|\{\{/)
    expect(
      forecastHeading(i18n.t, {
        ...base,
        activeTileCount: 3,
        matchedPatternLabel: i18n.t('melds.sequence'),
      })
    ).toBe(i18n.t('melds.sequence'))
    expect(forecastHeading(i18n.t, { ...base, isCompleteHand: true })).toBe(
      i18n.t('gameplay.forecast.completeDeclaration', { count: 14 })
    )
    expect(
      forecastHeading(i18n.t, {
        ...base,
        isCompleteHand: true,
        stagedTileCount: 14,
        activeTileCount: 14,
      })
    ).toBe(i18n.t('gameplay.forecast.stagedDeclaration', { count: 14 }))
  }
)
