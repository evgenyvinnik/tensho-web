import { describe, expect, it } from 'vitest'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { getTableStyleIllustration, illustrationAssets } from './assets'

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
