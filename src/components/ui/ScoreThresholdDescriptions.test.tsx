import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { useItemText } from '../../i18n/useItemText'
import { ALL_DECREES } from '../../systems/DecreeSystem'
function Descriptions() {
  const text = useItemText()
  return (
    <>
      {['supernova', 'perfectionist'].map((id) => (
        <p key={id}>
          {text.description(
            'decrees',
            ALL_DECREES.find((d) => d.id === `decree-${id}`)!
          )}
        </p>
      ))}
    </>
  )
}
afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'uses authored threshold rules rather than stale catalog text in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    render(<Descriptions />)
    for (const id of ['supernova', 'perfectionist']) {
      expect(
        i18n.getResource(language, 'translation', `scoreThresholds.${id}`)
      ).toBeTruthy()
      expect(screen.getByText(i18n.t(`scoreThresholds.${id}`))).toBeVisible()
    }
  }
)
