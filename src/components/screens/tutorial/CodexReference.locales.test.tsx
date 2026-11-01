import { cleanup, render } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../../../router/routeManifest'
import en from '../../../i18n/locales/en.json'
import { useTutorialSteps } from './useTutorialSteps'
import { CodexCategoryHero } from './TutorialComponents'

afterEach(cleanup)

function CompleteCodex() {
  return useTutorialSteps().map((step) => (
    <section key={step.id}>
      <h2>{step.title}</h2>
      {step.content}
    </section>
  ))
}

it.each(SUPPORTED_LANGUAGES)(
  'renders the complete Codex without English fallback in %s',
  async (language) => {
    const { default: copy } = await import(
      `../../../i18n/locales/${language}.json`
    )
    for (const namespace of ['codexReference', 'codexUpgrades'] as const) {
      const english: Record<string, string> = en[namespace]
      expect(Object.keys(copy[namespace]).sort(), namespace).toEqual(
        Object.keys(english).sort()
      )
      for (const [key, reference] of Object.entries(english)) {
        const translated = copy[namespace][key]
        expect(typeof translated, key).toBe('string')
        expect(translated.trim(), key).not.toBe('')
        for (const pattern of [/{{\w+}}/g, /<\/?\w+>/g])
          expect((translated.match(pattern) ?? []).sort(), key).toEqual(
            (reference.match(pattern) ?? []).sort()
          )
        // Proper nouns and brief labels can legitimately be shared; explanations
        // must actually be authored in the selected language.
        if (language !== 'en' && reference.length > 60)
          expect(translated, key).not.toBe(reference)
      }
    }
    const instance = createInstance()
    await instance.init({
      lng: language,
      fallbackLng: false,
      resources: { [language]: { translation: copy } },
      interpolation: { escapeValue: false },
    })
    const { container, getAllByRole, getByRole } = render(
      <I18nextProvider i18n={instance}>
        <CodexCategoryHero
          category="Scoring"
          title={copy.codexReference.titleYakuIntro}
        />
        <CompleteCodex />
      </I18nextProvider>
    )
    expect(getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(40)
    expect(container.textContent).not.toMatch(
      /(?:codexReference|codexUpgrades|codexFlora|codexEconomy|upgradeFamilies|patterns|tutorial|flora\.details)\.|{{|<\/?(?:strong|melds|pair|tiles)>/
    )
    expect(container.querySelectorAll('img').length).toBeGreaterThan(30)
    expect(
      getByRole('img', {
        name: `${copy.codex.scoring}: ${copy.codexReference.titleYakuIntro}`,
      })
    ).toHaveAttribute('data-codex-category-image')
  }
)
