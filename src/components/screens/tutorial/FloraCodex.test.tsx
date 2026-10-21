import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../../i18n'
import { FloraCodex, FLORA_CODEX_SECTIONS } from './FloraCodex'
import { useTutorialSteps } from './useTutorialSteps'
import { useCodexContent } from '../../ui/codex/useCodexContent'
import en from '../../../i18n/locales/en.json'
import { FLOWER_BASE_EFFECTS } from '../../../systems/FlowerSystem'
import { CORRUPTED_TO_BASE_SEASON } from '../../../systems/SeasonSystem'
import { getFlowerArt, getSeasonArt } from '../../../utils/itemArt'
import { illustrationAssets } from '../../../utils/assets'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it('uses the actual base bonuses and all three collection thresholds', () => {
  const { container } = render(<FloraCodex section="flowers" />)
  for (const [flower, effect] of Object.entries(FLOWER_BASE_EFFECTS)) {
    const card = container.querySelector(`[data-codex-flora-card="${flower}"]`)!
    expect(card).toHaveTextContent(
      i18n.t('flora.details.flower' + flower, {
        percent: effect.percentagePerMatch,
      })
    )
    expect(card.querySelector('img')).toHaveAttribute(
      'src',
      getFlowerArt(flower as keyof typeof FLOWER_BASE_EFFECTS)
    )
  }
  for (const key of ['setTwo', 'setThree', 'setFour'])
    expect(container).toHaveTextContent(i18n.t('flora.details.' + key))
})

it('explains rebloom and shows all four distinct awakened portraits', () => {
  const { container } = render(<FloraCodex section="awakening" />)
  expect(container).toHaveTextContent(en.codexFlora.awakeningLifecycle)
  expect(container).toHaveTextContent('×1.2')
  expect(container).toHaveTextContent('×1.4')
  for (const [flower, art] of Object.entries(
    illustrationAssets.awakenedFlowers
  ))
    expect(
      container.querySelector(
        `[data-codex-flora-card="awakened-${flower}"] img`
      )
    ).toHaveAttribute('src', art)
})

it('uses live normal/corrupted Season rules, not outdated draw or multiplier summaries', () => {
  const { container } = render(
    <>
      <FloraCodex section="seasons" />
      <FloraCodex section="corruption" />
    </>
  )
  expect(container).toHaveTextContent(en.codexFlora.distinction)
  for (const key of [
    'spring',
    'summer',
    'autumn',
    'winter',
    'drought',
    'monsoon',
    'frostbite',
    'decay',
  ])
    expect(container).toHaveTextContent(i18n.t('flora.details.' + key))
  for (const [corrupted, base] of Object.entries(CORRUPTED_TO_BASE_SEASON))
    expect(
      container.querySelector(`[data-codex-flora-card="${corrupted}"] img`)
    ).toHaveAttribute(
      'src',
      getSeasonArt({
        type: base,
        isCorrupted: true,
        corruptedType: corrupted as keyof typeof CORRUPTED_TO_BASE_SEASON,
      })
    )
})

it('keeps interaction recipes optional and catalyst payment explicit', () => {
  const { container } = render(
    <>
      <FloraCodex section="interactions" />
      <FloraCodex section="catalysts" />
    </>
  )
  const recipes = container.querySelectorAll('details[data-codex-combo]')
  expect(recipes).toHaveLength(4)
  for (const recipe of recipes) expect(recipe).not.toHaveAttribute('open')
  expect(container).toHaveTextContent(en.codexFlora.catalystsCost)
  expect(container).toHaveTextContent(en.shop.catalyst.warning)
  expect(
    container.querySelectorAll('[data-codex-flora="catalysts"] img')
  ).toHaveLength(4)
})

it('shares the same six Flora sections in the routed and modal Codex', () => {
  function Probe() {
    const steps = useTutorialSteps()
    const modal = useCodexContent()
    expect(modal[0].id).toBe('overview')
    for (const [id] of FLORA_CODEX_SECTIONS) {
      expect(steps.find((step) => step.id === id)?.content).toEqual(
        modal
          .find((category) => category.id === 'flora')
          ?.sections.find((section) => section.id === id)?.content
      )
    }
    return null
  }
  render(<Probe />)
})

it.each(SUPPORTED_LANGUAGES)(
  'provides authored Codex rules and readable live-item text in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const [, key] of FLORA_CODEX_SECTIONS) {
      expect(i18n.getResource(language, 'translation', key), key).toBeTruthy()
    }
    for (const [key, reference] of Object.entries(en.codexFlora)) {
      const translated = i18n.getResource(
        language,
        'translation',
        'codexFlora.' + key
      )
      expect(translated, key).toBeTruthy()
      if (language !== 'en') expect(translated, key).not.toBe(reference)
      expect(translated?.match(/{{\w+}}/g) ?? [], key).toEqual(
        reference.match(/{{\w+}}/g) ?? []
      )
    }
    const { container } = render(
      <>
        {FLORA_CODEX_SECTIONS.map(([id, , section]) => (
          <FloraCodex key={id} section={section} />
        ))}
      </>
    )
    expect(container.textContent).not.toMatch(
      /codexFlora\.|flora\.details\.|decrees\.items\.|{{/
    )
    expect(container.querySelectorAll('img')).toHaveLength(28)
  }
)
