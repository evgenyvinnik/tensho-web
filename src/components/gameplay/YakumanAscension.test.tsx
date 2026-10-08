import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { PlayArea } from './PlayArea'
import { CHINITSU } from '../../rules/YakuDetector'
import { useSettingsStore } from '../../stores/settingsStore'
import { YAKUMAN_SUCCESSION } from '../../systems/DecreeSystem'
import { useItemText } from '../../i18n/useItemText'

afterEach(async () => {
  cleanup()
  useSettingsStore.setState({ reducedMotion: false })
  await i18n.changeLanguage('en')
})
function Rule() {
  const text = useItemText()
  return (
    <p data-succession-rule>
      {text.description('decrees', YAKUMAN_SUCCESSION)}
    </p>
  )
}
it.each(SUPPORTED_LANGUAGES)(
  'has authored local rule and optional ascension feedback (%s)',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    useSettingsStore.setState({ reducedMotion: true })
    const props = {
      selectedTileCount: 14,
      stagedTileCount: 14,
      handTileCount: 14,
      yakuReveals: [],
      onYakuComplete: () => {},
      scorePreview: {
        points: 100,
        mult: 4,
        total: 400,
        yaku: [
          { ...CHINITSU, tier: 4 as const, multiplier: 4, ascended: true },
        ],
      },
    }
    const { container, rerender } = render(
      <>
        <Rule />
        <PlayArea {...props} />
      </>
    )
    expect(
      i18n.getResource(
        language,
        'translation',
        'decrees.items.yakuman_succession.description'
      )
    ).toBeTruthy()
    expect(container.querySelector('[data-succession-rule]')).toHaveTextContent(
      '×4'
    )
    expect(
      container.querySelector('[data-yaku-ascended="chinitsu"]')
    ).toHaveTextContent(i18n.t('gameplay.yakumanAscended'))
    rerender(<PlayArea {...props} scorePreviewHidden />)
    expect(container.querySelector('[data-yaku-ascended]')).toBeNull()
  }
)
