import { describe, expect, it } from 'vitest'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { feltPalette, mixHex } from './feltPalette'

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

describe('feltPalette', () => {
  it('mixes toward a target colour in plain hex', () => {
    expect(mixHex('#204060', '#000000', 0)).toBe('#204060')
    expect(mixHex('#204060', '#000000', 1)).toBe('#000000')
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('gives every table its own cloth', () => {
    const felts = TABLE_STYLE_DEFINITIONS.map((style) => style.feltColor)
    expect(new Set(felts).size).toBe(felts.length)
  })

  it.each(TABLE_STYLE_DEFINITIONS.map((style) => [style.id, style.feltColor]))(
    'keeps light game text readable on the %s panels',
    (_id, felt) => {
      const palette = feltPalette(felt)
      // Beige text (#F5F0E1) against the darkest and the raised panel shade.
      const text = luminance('#f5f0e1')
      for (const panel of [palette.surface, palette.surfaceRaised]) {
        const contrast = (text + 0.05) / (luminance(panel) + 0.05)
        expect(contrast).toBeGreaterThanOrEqual(7)
      }
    }
  )
})
