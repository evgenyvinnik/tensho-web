import { describe, expect, it } from 'vitest'
import { mandateConsequence } from './mandateConsequence'
import { ALL_MANDATES } from '../config/mandateDefinitions'
import { BOSS_MANDATES, SHOWDOWN_MANDATES } from '../systems/RoundManager'
import { getItemArt, getSeasonArt, type ItemArtKind } from '../utils/itemArt'
import { scoreSignificance } from '../components/effects/DoomFire'
import manifest from '../config/itemArtManifest.json'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { CELESTIAL_ORBS } from '../systems/CelestialOrbSystem'
import { FATE_SEALS } from '../systems/FateSealSystem'
import { VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import { ALL_OMENS } from '../config/omenDefinitions'
import { SUPPORTED_LANGUAGES } from '../i18n'

const locales = import.meta.glob<{ default: Record<string, unknown> }>(
  '../i18n/locales/*.json',
  { eager: true }
)
const locale = (lang: string) =>
  locales[`../i18n/locales/${lang}.json`].default as {
    mandateConsequence: Record<string, string>
  }

describe('Mandate consequences', () => {
  it.each(SUPPORTED_LANGUAGES)(
    'gives every Boss Mandate a short consequence in %s',
    (lang) => {
      const copy = locale(lang).mandateConsequence
      for (const mandate of [
        ...ALL_MANDATES,
        ...BOSS_MANDATES,
        ...SHOWDOWN_MANDATES,
      ]) {
        const { key } = mandateConsequence(
          mandate.effect as Parameters<typeof mandateConsequence>[0]
        )
        expect(copy[key], `${lang}: ${mandate.id}`).toBeTruthy()
      }
    }
  )

  it('passes the Mandate’s own numbers and target', () => {
    expect(
      mandateConsequence({ type: 'hand_size_reduction', value: 2 })
    ).toEqual({
      key: 'hand_size_reduction',
      values: { count: 2, value: 2 },
    })
    expect(
      mandateConsequence({ type: 'debuff_suit', target: 'pinzu' }).values
    ).toMatchObject({ count: 1, targetKey: 'tiles.pinzu' })
  })
})

describe('item art', () => {
  const ids: Record<ItemArtKind, string[]> = {
    decrees: ALL_DECREES.map((d) => d.id),
    orbs: Object.keys(CELESTIAL_ORBS),
    seals: Object.keys(FATE_SEALS),
    scripts: Object.keys(VOID_SCRIPTS),
    charters: ALL_CHARTERS.map((c) => c.id),
    mandates: ALL_MANDATES.map((m) => m.id),
    omens: ALL_OMENS.map((o) => o.id),
    yakuUpgrades: ['Pairs', 'Pinfu'],
    tileMarks: ['gold', 'glass'],
    packs: ['Arcana', 'Celestial', 'Decree', 'unknown'],
  }

  it.each(Object.keys(ids) as ItemArtKind[])(
    'resolves an image for every %s item, never an emoji',
    (kind) => {
      for (const id of ids[kind]) {
        const art = getItemArt(kind, id)
        expect(art.src, `${kind}/${id}`).toMatch(/\.(webp|png|svg)$/)
      }
    }
  )

  it('marks shared family art as not the item’s own', () => {
    expect(getItemArt('omens', 'fortune_omen').hasOwnArt).toBe(true)
    expect(getItemArt('omens', 'not_an_omen').hasOwnArt).toBe(false)
    expect(getItemArt('orbs', 'pluto_orb').hasOwnArt).toBe(true)
    expect(getItemArt('orbs', 'not_an_orb').hasOwnArt).toBe(false)
    expect(getItemArt('charters', 'observatory').hasOwnArt).toBe(true)
    expect(getItemArt('charters', 'not_a_charter').hasOwnArt).toBe(false)
    expect(getItemArt('packs', 'Decree').hasOwnArt).toBe(true)
  })

  it('lists only real catalog ids in the art manifest', () => {
    for (const [kind, listed] of Object.entries(manifest)) {
      if (kind.startsWith('_')) continue
      for (const id of listed as string[])
        expect(ids[kind as ItemArtKind], `${kind}/${id}`).toContain(id)
    }
  })

  it('has art for every Season', () => {
    for (const season of ['Spring', 'Summer', 'Autumn', 'Winter'])
      expect(getSeasonArt(season)).toMatch(/\.webp$/)
  })
})

describe('score significance', () => {
  it.each([
    [0, 1000, 0],
    [100, 0, 0],
    [200, 1000, 0],
    [250, 1000, 0.15],
    [1000, 1000, 0.6],
    [3000, 1000, 1],
    [9000, 1000, 1],
  ])('rates %i against a %i target as %f', (score, target, expected) => {
    expect(scoreSignificance(score, target)).toBeCloseTo(expected)
  })

  it('grows with the share of the target', () => {
    const values = [300, 500, 800, 1200, 2000].map((score) =>
      scoreSignificance(score, 1000)
    )
    expect([...values].sort((a, b) => a - b)).toEqual(values)
  })
})
