/**
 * Locale integrity tests.
 *
 * These guard the two failure modes that are invisible at runtime, because
 * i18next falls back to English rather than erroring:
 *
 *  - a translation keyed to an item id that no longer exists (dead weight that
 *    silently never resolves), and
 *  - an item library shipping without an English entry, which leaves every
 *    language showing whatever the config happens to hold.
 */

import { describe, it, expect } from 'vitest'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import idID from './locales/id.json'
// `it` would shadow Vitest's test function, so locale imports are suffixed.
import itIT from './locales/it.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import ru from './locales/ru.json'
import th from './locales/th.json'
import tl from './locales/tl.json'
import tr from './locales/tr.json'
import zhHans from './locales/zh-Hans.json'
import zhHant from './locales/zh-Hant.json'

import { ALL_DECREES } from '../systems/DecreeSystem'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import { ALL_OMENS } from '../config/omenDefinitions'
import { ALL_MANDATES } from '../config/mandateDefinitions'
import { getAllFateSeals } from '../systems/FateSealSystem'
import { getAllCelestialOrbs } from '../systems/CelestialOrbSystem'
import { getAllVoidScripts } from '../systems/VoidScriptSystem'

type Locale = Record<string, unknown>

const LOCALES: Record<string, Locale> = {
  en,
  es,
  fr,
  id: idID,
  it: itIT,
  ja,
  ko,
  ru,
  th,
  tl,
  tr,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
}

/** The item libraries that carry per-item translations, with their real ids. */
const LIBRARIES: Record<string, string[]> = {
  decrees: ALL_DECREES.map((d) => d.id),
  charters: ALL_CHARTERS.map((c) => c.id),
  omens: ALL_OMENS.map((o) => o.id),
  mandates: ALL_MANDATES.map((m) => m.id),
  seals: getAllFateSeals().map((s) => s.id),
  orbs: getAllCelestialOrbs().map((o) => o.id),
  scripts: getAllVoidScripts().map((s) => s.id),
}

function itemsOf(locale: Locale, kind: string): Record<string, unknown> {
  const group = locale[kind] as { items?: Record<string, unknown> } | undefined
  return group?.items ?? {}
}

describe('locale item translations', () => {
  it('gives en an entry for every item the game can show', () => {
    const missing: string[] = []

    for (const [kind, realIds] of Object.entries(LIBRARIES)) {
      const translated = new Set(Object.keys(itemsOf(en, kind)))
      for (const itemId of realIds) {
        if (!translated.has(itemId)) missing.push(`${kind}.${itemId}`)
      }
    }

    expect(missing).toEqual([])
  })

  it('carries no translation for an item that does not exist', () => {
    const stale: string[] = []

    for (const [lang, locale] of Object.entries(LOCALES)) {
      for (const [kind, realIds] of Object.entries(LIBRARIES)) {
        const known = new Set(realIds)
        for (const itemId of Object.keys(itemsOf(locale, kind))) {
          if (!known.has(itemId)) stale.push(`${lang}:${kind}.${itemId}`)
        }
      }
    }

    expect(stale).toEqual([])
  })

  it('gives every item entry both a name and a description', () => {
    const incomplete: string[] = []

    for (const [lang, locale] of Object.entries(LOCALES)) {
      for (const kind of Object.keys(LIBRARIES)) {
        for (const [itemId, value] of Object.entries(itemsOf(locale, kind))) {
          const entry = value as { name?: unknown; description?: unknown }
          if (
            typeof entry?.name !== 'string' ||
            typeof entry?.description !== 'string'
          ) {
            incomplete.push(`${lang}:${kind}.${itemId}`)
          }
        }
      }
    }

    expect(incomplete).toEqual([])
  })
})

/**
 * Tutorial copy goes through <Trans>, where each element in a sentence is
 * addressed by index (`<0>`, `<3>`). A translation that drops or renumbers a
 * tag silently loses the highlighted words - the sentence renders with gaps
 * rather than throwing - so the tag set is compared against English here.
 */
describe('tutorial <Trans> markup', () => {
  const tagsOf = (value: string): string =>
    (value.match(/<\/?\d+\/?>/g) ?? []).sort().join('')

  const tutorialKeys = (locale: Locale): Record<string, string> => {
    const group = (locale.tutorial ?? {}) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [step, entries] of Object.entries(group)) {
      if (typeof entries !== 'object' || entries === null) continue
      for (const [name, value] of Object.entries(entries as Record<string, unknown>)) {
        if (typeof value === 'string' && /^(p|li|note)\d+$/.test(name)) {
          out[`${step}.${name}`] = value
        }
      }
    }
    return out
  }

  it('gives English a source string for every Trans block', () => {
    expect(Object.keys(tutorialKeys(en)).length).toBeGreaterThanOrEqual(126)
  })

  it('keeps every translation on the same tag indices as English', () => {
    const source = tutorialKeys(en)
    const mismatched: string[] = []

    for (const [lang, locale] of Object.entries(LOCALES)) {
      if (lang === 'en') continue
      for (const [key, value] of Object.entries(tutorialKeys(locale))) {
        const expected = source[key]
        if (expected === undefined) {
          mismatched.push(`${lang}:${key} (no English source)`)
        } else if (tagsOf(value) !== tagsOf(expected)) {
          mismatched.push(`${lang}:${key}`)
        }
      }
    }

    expect(mismatched).toEqual([])
  })
})

/**
 * Translations are written per language, and a stray word from the wrong
 * language is invisible in review - it renders as ordinary text. These checks
 * catch the two ways that happens: a character from a script the language
 * never uses, and an untranslated English word left behind mid-sentence.
 */
describe('translation script purity', () => {
  const CYRILLIC = /[\u0400-\u04FF]/
  const CJK = /[\u3040-\u30FF\u4E00-\u9FFF]/
  // Lowercase runs only: an uppercase UI label such as PLAY is a deliberate
  // reference to a button, while "competing" left mid-sentence is a mistake.
  const STRAY_ENGLISH = /\b[a-z]{3,}\b/
  // {{count}} and friends are interpolation slots, not prose.
  const withoutPlaceholders = (value: string): string =>
    value.replace(/\{\{[^}]*\}\}/g, '')

  const stringsOf = (locale: Locale): Array<[string, string]> => {
    const out: Array<[string, string]> = []
    const walk = (node: unknown, path: string) => {
      if (typeof node === 'string') out.push([path, node])
      else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k)
      }
    }
    walk(locale, '')
    return out
  }

  it('never leaks Cyrillic into a language that does not use it', () => {
    const leaks: string[] = []
    for (const [lang, locale] of Object.entries(LOCALES)) {
      if (lang === 'ru') continue
      for (const [key, value] of stringsOf(locale)) {
        if (CYRILLIC.test(value)) leaks.push(`${lang}:${key}`)
      }
    }
    expect(leaks).toEqual([])
  })

  it('never leaves an English word inside CJK copy', () => {
    const leaks: string[] = []
    for (const lang of ['ja', 'ko', 'zh-Hans', 'zh-Hant']) {
      for (const [key, value] of stringsOf(LOCALES[lang])) {
        if (!CJK.test(value)) continue
        if (STRAY_ENGLISH.test(withoutPlaceholders(value))) {
          leaks.push(`${lang}:${key}`)
        }
      }
    }
    expect(leaks).toEqual([])
  })
})
