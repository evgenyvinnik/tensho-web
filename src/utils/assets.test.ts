import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import {
  getCodexCategoryIllustration,
  getDecreeIllustration,
  getDecreeScrollIllustration,
  getTableStyleIllustration,
  illustrationAssets,
} from './assets'

it('ships the generated guidebook with an alpha-capable PNG in the project', () => {
  expect(illustrationAssets.beginnerGuidebook).toBe(
    '/assets/illustrations/beginner-guidebook.png'
  )
  const png = readFileSync(`public${illustrationAssets.beginnerGuidebook}`)
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(png[25]).toBe(6)
})

describe('Decree scroll illustrations', () => {
  it('ships bespoke Wealth Engine art without mistaking inherited names for images', () => {
    const path = getDecreeIllustration('decree-wealth-engine')!
    const png = readFileSync(`public${path}`)
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(png[25]).toBe(6)
    expect(getDecreeIllustration('unknown')).toBeUndefined()
    expect(getDecreeIllustration('toString')).toBeUndefined()
  })
  it('maps Decree rarities to illustrated scrolls', () => {
    expect(getDecreeScrollIllustration('LocalEdict')).toMatch(
      /decrees\/local-edict\.png$/
    )
    expect(getDecreeScrollIllustration('HeavenlyOrdinance')).toMatch(
      /decrees\/heavenly-ordinance\.png$/
    )
  })
})

describe('table style illustrations', () => {
  it('provides unique artwork for every playable table style', () => {
    const artwork = TABLE_STYLE_DEFINITIONS.map((style) =>
      getTableStyleIllustration(style.id)
    )

    expect(new Set(artwork).size).toBe(TABLE_STYLE_DEFINITIONS.length)
    artwork.forEach((path) => {
      expect(path).toMatch(/\/assets\/illustrations\/tables\/.+\.webp$/)
    })
  })

  it('falls back to Green Felt for unknown table IDs', () => {
    expect(getTableStyleIllustration('missing_table')).toBe(
      illustrationAssets.tables.green_felt
    )
  })
})

describe('codex category illustrations', () => {
  it('provides artwork for every Codex category', () => {
    const categories = [
      'Introduction',
      'Tiles',
      'Hand Building',
      'How to Play',
      'Scoring',
      'Progression',
      'Decrees',
      'Flora',
      'Economy',
      'Strategy',
      'Ready!',
    ]

    categories.forEach((category) => {
      expect(getCodexCategoryIllustration(category)).toMatch(
        /\/(?:illustrations|backgrounds)\/.+\.webp$/
      )
    })
  })

  it('falls back to the Codex archive for unknown categories', () => {
    expect(getCodexCategoryIllustration('Unknown')).toBe(
      illustrationAssets.codex.archive
    )
  })
})
