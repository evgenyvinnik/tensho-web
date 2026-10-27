import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { cleanup, render } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../../router/routeManifest'
import { TeachingIllustration } from './TeachingIllustration'
import { teachingIllustrations } from '../../utils/teachingArt'
import { DecreeBuildGuide } from '../shop/DecreeBuildGuide'
import manifest from '../../../docs/teaching-art-manifest.json'

afterEach(cleanup)

it.each(SUPPORTED_LANGUAGES)(
  'labels all teaching art without fallback in %s',
  async (language) => {
    const { default: copy } = await import(
      `../../i18n/locales/${language}.json`
    )
    const instance = createInstance()
    await instance.init({
      lng: language,
      fallbackLng: false,
      resources: { [language]: { translation: copy } },
      interpolation: { escapeValue: false },
    })
    const { container } = render(
      <I18nextProvider i18n={instance}>
        <DecreeBuildGuide />
        <TeachingIllustration kind="awakening" />
        <TeachingIllustration kind="journey" />
      </I18nextProvider>
    )
    const expected = {
      synergy: [
        `+${copy.guide.points}`,
        `+${copy.guide.mult}`,
        `×${copy.guide.mult}`,
      ],
      awakening: [
        copy.teachingArt.ordinaryFlower,
        copy.flora.mutations.awakened,
      ],
      journey: [copy.results.victory, copy.teachingArt.optionalEndless],
    }
    for (const kind of Object.keys(teachingIllustrations) as Array<
      keyof typeof teachingIllustrations
    >) {
      const figure = container.querySelector(`[data-teaching-art="${kind}"]`)!
      const image = figure.querySelector('img')!
      expect(image).toHaveAttribute('src', teachingIllustrations[kind])
      expect(image).toHaveAttribute('alt', '')
      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image).toHaveAttribute('width', '960')
      expect(image).toHaveAttribute('height', '320')
      expect(
        Array.from(figure.querySelectorAll('figcaption span')).map(
          (node) => node.textContent
        )
      ).toEqual(expected[kind])
    }
    expect(
      container.querySelector('[data-decree-build-guide]')
    ).not.toHaveAttribute('open')
    expect(container).toHaveTextContent(copy.runJourney.guideExample)
    expect(container.textContent).not.toMatch(
      /teachingArt\.|guide\.(points|mult)|{{/
    )
  }
)

it('ships three bounded, hash-verified WebP assets and records every generation prompt', () => {
  expect(manifest.assets).toHaveLength(3)
  let total = 0
  for (const asset of manifest.assets) {
    const bytes = readFileSync(asset.path)
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(bytes.length).toBe(asset.bytes)
    expect(bytes.length).toBeLessThan(120_000)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      asset.runtimeSha256
    )
    expect(asset.prompt).toContain('Use case:')
    expect(
      Object.values(teachingIllustrations).some((path) =>
        asset.path.endsWith(path)
      )
    ).toBe(true)
    total += bytes.length
  }
  expect(total).toBeLessThan(250_000)
})
