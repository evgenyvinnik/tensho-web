import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SOUND_EFFECT_CREDITS } from './creditsDefinitions'

const sources = resolve('scripts/sfx-sources')
const locales = resolve('src/i18n/locales')
const read = (language: string) =>
  JSON.parse(readFileSync(resolve(locales, `${language}.json`), 'utf8'))

describe('audio credits', () => {
  it('credits every recording folder the sound build reads', () => {
    const folders = readdirSync(sources).filter((name) =>
      statSync(resolve(sources, name)).isDirectory()
    )
    expect(SOUND_EFFECT_CREDITS.map((c) => c.source).sort()).toEqual(
      folders.sort()
    )
  })

  it('matches the provenance record in SOURCES.md', () => {
    const record = readFileSync(resolve(sources, 'SOURCES.md'), 'utf8')
    for (const credit of SOUND_EFFECT_CREDITS) {
      expect(record, credit.id).toContain(credit.url)
      expect(record, credit.id).toContain(credit.license.url)
    }
  })

  it('marks changes wherever the licence asks for attribution', () => {
    for (const credit of SOUND_EFFECT_CREDITS)
      if (credit.license.name.includes('BY'))
        expect(credit.modified, credit.id).toBe(true)
  })

  it('translates the Credits panel in all thirteen languages', () => {
    const languages = readdirSync(locales)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.slice(0, -5))
    expect(languages).toHaveLength(13)
    const english = read('en').settings.credits
    const keys = [
      'title',
      'soundEffects',
      'modified',
      'original',
      ...new Set(SOUND_EFFECT_CREDITS.map((c) => c.role)),
    ]
    for (const language of languages) {
      const credits = read(language).settings.credits
      for (const key of keys) {
        expect(credits[key]?.trim(), `${language}.${key}`).toBeTruthy()
        if (language !== 'en')
          expect(credits[key], `${language}.${key}`).not.toBe(english[key])
      }
      expect(credits.original, language).toContain('Tensho')
    }
  })
})
