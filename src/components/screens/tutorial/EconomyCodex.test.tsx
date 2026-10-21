import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../../i18n'
import en from '../../../i18n/locales/en.json'
import { EconomyCodex, ECONOMY_CODEX_SECTIONS } from './EconomyCodex'
import { useTutorialSteps } from './useTutorialSteps'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it.each(SUPPORTED_LANGUAGES)(
  'explains current economy rules without fallback in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const key of Object.keys(en.codexEconomy)) {
      const value = i18n.getResource(
        language,
        'translation',
        `codexEconomy.${key}`
      )
      expect(typeof value, key).toBe('string')
      if (language !== 'en')
        expect(value, key).not.toBe(
          en.codexEconomy[key as keyof typeof en.codexEconomy]
        )
    }
    function Probe() {
      const steps = useTutorialSteps()
      return (
        <>
          {ECONOMY_CODEX_SECTIONS.map(([id, key, section]) => {
            const step = steps.find((entry) => entry.id === id)!
            expect(i18n.getResource(language, 'translation', key)).toBeTruthy()
            expect(step.title).toBe(i18n.t(key))
            expect(step.content).toEqual(<EconomyCodex section={section} />)
            return <section key={id}>{step.content}</section>
          })}
        </>
      )
    }
    const { container } = render(<Probe />)
    for (const key of Object.keys(en.codexEconomy))
      expect(container).toHaveTextContent(i18n.t(`codexEconomy.${key}`))
    for (const key of [
      'shop.kinds.sealHelp',
      'shop.kinds.orbHelp',
      'shop.kinds.charterHelp',
      'results.defeatIncome',
      'charters.items.money_tree.description',
    ]) {
      expect(i18n.getResource(language, 'translation', key)).toBeTruthy()
      expect(container).toHaveTextContent(i18n.t(key))
    }
    expect(container.querySelectorAll('img')).toHaveLength(5)
    expect(container.textContent).not.toMatch(
      /codexEconomy\.|Typical Cost|Base payout scales with score|max \+5/
    )
  }
)

it('does not leave the old universal half-price promise in Decree slot guidance', () => {
  function Probe() {
    return useTutorialSteps().find((step) => step.id === 'decree-slots')!
      .content
  }
  const { container } = render(<Probe />)
  expect(container).toHaveTextContent(en.codexEconomy.sale)
  expect(container).not.toHaveTextContent('half the purchase price')
})
