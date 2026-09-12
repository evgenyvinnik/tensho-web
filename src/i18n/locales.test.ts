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
import {
  ARCHIVE_CATEGORIES,
  LEGACY_WALL_DEFINITIONS,
  TILE_MARK_DEFINITIONS,
  SEAL_DEFINITIONS_ARCHIVE,
  EDITION_DEFINITIONS_ARCHIVE,
  PACK_VARIANT_DEFINITIONS,
} from '../config/archiveDefinitions'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'

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

it('localizes the reset scope and storage failure outcomes in every language', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const settings = locale.settings as Record<string, string>
    for (const key of ['resetProgressScope', 'resetFailed', 'resetPartial']) {
      expect(settings[key], `${lang}: ${key}`).toBeTypeOf('string')
      expect(settings[key].trim().length).toBeGreaterThan(0)
    }
  }
})

it('localizes shop settlement, capacity feedback and pack selection controls in every language', () => {
  for (const [language, locale] of Object.entries(LOCALES)) {
    const shop = locale.shop as Record<string, string>
    for (const key of [
      'inventoryFull',
      'packInventoryFull',
      'purchaseFailed',
      'packSelected',
      'packChoices',
      'confirmSelection',
      'selectItems',
      'skipRewards',
    ]) {
      expect(shop[key], `${language}: shop.${key}`).toBeTypeOf('string')
      expect(shop[key].length).toBeGreaterThan(0)
    }
    for (const key of ['packSelected', 'packChoices']) {
      expect(shop[key]).toContain('{{count}}')
      expect(shop[key]).toContain('{{max}}')
    }
  }
})

it('localizes the complete payout receipt and preserves every interpolation token', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const shop = locale.shop as typeof en.shop
    expect(Object.keys(shop.payout).sort(), lang).toEqual(
      Object.keys(en.shop.payout).sort()
    )
    for (const key of Object.keys(
      en.shop.payout
    ) as (keyof typeof en.shop.payout)[]) {
      expect(shop.payout[key].trim().length, `${lang}: ${key}`).toBeGreaterThan(
        0
      )
      expect(
        shop.payout[key].match(/\{\{\w+\}\}/g)?.sort(),
        `${lang}: ${key}`
      ).toEqual(en.shop.payout[key].match(/\{\{\w+\}\}/g)?.sort())
    }
    for (const round of ['small', 'large', 'boss'])
      expect(
        (locale.rounds as Record<string, string>)[round].trim().length,
        lang
      ).toBeGreaterThan(0)
  }
})

it('localizes every shop navigation and Charter presentation label with matching tokens', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const shop = locale.shop as typeof en.shop
    expect(Object.keys(shop.ui).sort(), lang).toEqual(
      Object.keys(en.shop.ui).sort()
    )
    for (const key of Object.keys(en.shop.ui) as (keyof typeof en.shop.ui)[]) {
      expect(shop.ui[key].trim().length, `${lang}: ${key}`).toBeGreaterThan(0)
      expect(
        shop.ui[key].match(/\{\{\w+\}\}/g)?.sort(),
        `${lang}: ${key}`
      ).toEqual(en.shop.ui[key].match(/\{\{\w+\}\}/g)?.sort())
    }
    for (const key of ['upgraded', 'buy', 'reroll', 'rerollCost']) {
      expect(
        (shop as Record<string, unknown>)[key],
        `${lang}: ${key}`
      ).toBeTypeOf('string')
    }
  }
})

it('provides Purple Seal names and current trigger descriptions in every locale', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const archive = locale.archiveSeals as {
      items: { purple: { name: string; description: string } }
    }
    expect(archive.items.purple.name.trim().length, lang).toBeGreaterThan(0)
    expect(
      archive.items.purple.description.trim().length,
      lang
    ).toBeGreaterThan(0)
  }
  expect(en.archiveSeals.items.purple.description).toContain(
    'discarded or redrawn'
  )
})

it('provides the complete consumable picker language contract in every locale', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const labels = locale.consumableUse as Record<string, string>
    expect(Object.keys(labels).sort(), lang).toEqual(
      Object.keys(en.consumableUse).sort()
    )
    for (const value of Object.values(labels))
      expect(value.trim().length, lang).toBeGreaterThan(0)
    expect(labels.count).toContain('{{selected}}')
    expect(labels.count).toContain('{{required}}')
    expect(labels.available).toContain('{{name}}')
    expect(labels.available).toContain('{{count}}')
    expect(labels.copyResult).toContain('{{name}}')
    expect(labels.errorNoPrevious).toContain('{{seals}}')
    expect(labels.errorNoPrevious).toContain('{{orbs}}')
    for (const script of getAllVoidScripts()) {
      expect(
        labels[`penalty_${script.penalty.type}`],
        `${lang}: ${script.id} penalty`
      ).toBeTypeOf('string')
    }
  }
})

it('localizes Unity and every Wind in its conversion legend in all locales', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const seals = locale.seals as typeof en.seals
    const labels = locale.consumableUse as Record<string, string>
    const tiles = locale.tiles as Record<string, string>
    expect(seals.items.seal_of_unity.name.trim().length, lang).toBeGreaterThan(
      0
    )
    expect(
      seals.items.seal_of_unity.description.trim().length,
      lang
    ).toBeGreaterThan(0)
    expect(labels.unityMapping.trim().length, lang).toBeGreaterThan(0)
    for (const wind of ['east', 'south', 'west', 'north'] as const)
      expect(tiles[wind].trim().length, lang).toBeGreaterThan(0)
  }
})

/** The item libraries that carry per-item translations, with their real ids. */
it('localizes victory, defeat, and Endless result controls without fallback', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    const results = locale.results as Record<string, string>
    for (const key of [
      'endlessComplete',
      'victorySubtitle',
      'endlessSubtitle',
      'defeatSubtitle',
      'showdownCleared',
      'continueEndless',
    ]) {
      expect(results[key], `${lang}: results.${key}`).toBeTypeOf('string')
      expect(
        results[key]?.trim().length,
        `${lang}: results.${key}`
      ).toBeGreaterThan(0)
    }
  }
})

const LIBRARIES: Record<string, string[]> = {
  decrees: ALL_DECREES.map((d) => d.id),
  charters: ALL_CHARTERS.map((c) => c.id),
  omens: ALL_OMENS.map((o) => o.id),
  mandates: ALL_MANDATES.map((m) => m.id),
  seals: getAllFateSeals().map((s) => s.id),
  orbs: getAllCelestialOrbs().map((o) => o.id),
  scripts: getAllVoidScripts().map((s) => s.id),
  archiveCategories: Object.values(ARCHIVE_CATEGORIES).map((c) => c.id),
  // Historical records retain their old names; playable tables use tableStyles.
  walls: LEGACY_WALL_DEFINITIONS.map((w) => w.id),
  tileMarks: TILE_MARK_DEFINITIONS.map((m) => m.id),
  archiveSeals: SEAL_DEFINITIONS_ARCHIVE.map((s) => s.id),
  editions: EDITION_DEFINITIONS_ARCHIVE.map((e) => e.id),
  packs: PACK_VARIANT_DEFINITIONS.map((p) => p.id),
  tableStyles: TABLE_STYLE_DEFINITIONS.map((t) => t.id),
}

function itemsOf(locale: Locale, kind: string): Record<string, unknown> {
  const group = locale[kind] as { items?: Record<string, unknown> } | undefined
  return group?.items ?? {}
}

describe('locale item translations', () => {
  it('localizes each playable table rule and unlock condition in every language', () => {
    for (const [lang, locale] of Object.entries(LOCALES)) {
      const tables = itemsOf(locale, 'tableStyles')
      for (const table of TABLE_STYLE_DEFINITIONS) {
        const entry = tables[table.id] as Record<string, unknown>
        for (const field of ['name', 'description', 'theme', 'unlock']) {
          expect(entry?.[field], `${lang}:${table.id}.${field}`).toBeTypeOf(
            'string'
          )
        }
        expect(
          Object.keys(entry.modifiers as object),
          `${lang}:${table.id}.modifiers`
        ).toEqual(table.startingModifiers.map((_, i) => String(i)))
      }
    }
  })
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
      for (const [name, value] of Object.entries(
        entries as Record<string, unknown>
      )) {
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
        for (const [k, v] of Object.entries(node))
          walk(v, path ? `${path}.${k}` : k)
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

// =============================================================================
// FULL-COVERAGE NAMESPACES
// =============================================================================

/**
 * Namespaces where English falling back is a bug rather than a stopgap.
 *
 * Most of the interface tolerates a missing key: i18next quietly shows English.
 * For a screen that was translated in full, that silence is what lets coverage
 * rot, so these namespaces are held to exact parity with English.
 */
const FULLY_TRANSLATED_PATHS = ['tableLoop', 'gameplay.coach', 'flora']

function readPath(locale: Locale, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      locale
    )
}

function leafKeys(node: unknown, prefix = ''): string[] {
  if (node === null || typeof node !== 'object') return [prefix]
  return Object.entries(node).flatMap(([key, value]) =>
    leafKeys(value, prefix ? `${prefix}.${key}` : key)
  )
}

describe('fully translated namespaces', () => {
  it.each(FULLY_TRANSLATED_PATHS)(
    'gives every language the same %s keys as English',
    (path) => {
      const expected = leafKeys(readPath(en, path)).sort()
      expect(expected.length).toBeGreaterThan(0)

      const problems: string[] = []
      for (const [lang, locale] of Object.entries(LOCALES)) {
        if (lang === 'en') continue
        const actual = leafKeys(readPath(locale, path) ?? {}).sort()
        const missing = expected.filter((key) => !actual.includes(key))
        const stale = actual.filter((key) => !expected.includes(key))
        if (missing.length)
          problems.push(`${lang} missing ${missing.join(', ')}`)
        if (stale.length) problems.push(`${lang} stale ${stale.join(', ')}`)
      }
      expect(problems).toEqual([])
    }
  )

  it('never leaves a translation identical to the English string', () => {
    // A handful of names are the same word in several languages; the check is
    // for whole namespaces copied over untranslated, so it allows a few.
    const copied: string[] = []
    for (const path of FULLY_TRANSLATED_PATHS) {
      const source = readPath(en, path)
      for (const [lang, locale] of Object.entries(LOCALES)) {
        if (lang === 'en') continue
        const target = readPath(locale, path)
        const keys = leafKeys(source)
        const same = keys.filter((key) => {
          const a = readPath(source as Locale, key)
          const b = readPath((target ?? {}) as Locale, key)
          return typeof a === 'string' && a === b && a.length > 12
        })
        if (same.length > keys.length / 4) {
          copied.push(`${lang}.${path} (${same.length}/${keys.length})`)
        }
      }
    }
    expect(copied).toEqual([])
  })
})
