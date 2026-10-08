import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { useItemText } from '../../i18n/useItemText'
import { ALL_DECREES } from '../../systems/DecreeSystem'
import { FlowerSystem } from '../../systems/FlowerSystem'
import { SeasonSystem } from '../../systems/SeasonSystem'
import { useSettingsStore } from '../../stores/settingsStore'
import { FloraTrackCompact } from './FloraTrackCompact'

afterEach(async () => {
  cleanup()
  useSettingsStore.setState({ reducedMotion: false })
  await i18n.changeLanguage('en')
})
function TreasureRule() {
  const text = useItemText()
  return (
    <p data-treasure-rule>
      {text.description(
        'decrees',
        ALL_DECREES.find((d) => d.id === 'decree-treasure-hunter')!
      )}
    </p>
  )
}
it.each(SUPPORTED_LANGUAGES)(
  'shows the resolved Frostbite and Treasure rules in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    useSettingsStore.setState({ reducedMotion: true })
    const season = new SeasonSystem()
    season.forceSetSeason('Winter', true)
    const { container } = render(
      <>
        <TreasureRule />
        <FloraTrackCompact
          flora={{
            flowers: new FlowerSystem().getCollection(),
            seasons: season.getSeasonStack(),
            flowersSuppressed: false,
            flowersProtected: false,
            decayPenalty: 0,
            bambooSummerProtection: false,
          }}
        />
      </>
    )
    const translated = i18n.getResource(
      language,
      'translation',
      'decrees.items.decree-treasure-hunter.description'
    )
    expect(translated).toBeTruthy()
    expect(container.querySelector('[data-treasure-rule]')).toHaveTextContent(
      translated
    )
    fireEvent.click(screen.getByTestId('flora-details-trigger'))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      i18n.getResource(language, 'translation', 'flora.details.frostbite')
    )
    expect(screen.queryByText(i18n.t('flora.details.partial'))).toBeNull()
  }
)
