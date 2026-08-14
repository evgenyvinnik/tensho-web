import { describe, expect, it } from 'vitest'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import {
  getCodexCategoryIllustration,
  getDecreeScrollIllustration,
  getTableStyleIllustration,
  illustrationAssets,
} from './assets'

describe('Decree scroll illustrations', () => {
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
