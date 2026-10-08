import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const sources: string[] = JSON.parse(
  readFileSync('scripts/illustration-sources.json', 'utf8')
)

it('keeps an explicit, unique migration inventory', () => {
  expect(sources).toHaveLength(51)
  expect(new Set(sources).size).toBe(sources.length)
  expect(sources.every((s) => /^[\w/-]+\.png$/.test(s))).toBe(true)
})

it.each(sources)(
  'retains the source and a bounded, aspect-preserving delivery copy for %s',
  (source) => {
    const png = readFileSync(`public/assets/illustrations/${source}`)
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    const sizes = source.startsWith('site/') ? [768, 1536] : [512]
    for (const size of sizes) {
      const path = source.replace(
        '.png',
        sizes.length > 1 ? `-${size}.webp` : '.webp'
      )
      const webp = readFileSync(`public/assets/illustrations/${path}`)
      expect(webp.toString('ascii', 0, 4)).toBe('RIFF')
      expect(webp.toString('ascii', 8, 12)).toBe('WEBP')
      const extended = webp.toString('ascii', 12, 16) === 'VP8X'
      const w = extended
        ? webp.readUIntLE(24, 3) + 1
        : webp.readUInt16LE(26) & 0x3fff
      const h = extended
        ? webp.readUIntLE(27, 3) + 1
        : webp.readUInt16LE(28) & 0x3fff
      const scale = Math.min(1, size / Math.max(width, height))
      expect([w, h]).toEqual([
        Math.round(width * scale),
        Math.round(height * scale),
      ])
      if (!source.startsWith('site/')) {
        expect(extended).toBe(true)
        expect(webp[20] & 0x10).toBe(0x10)
      }
      expect(webp.length).toBeLessThan(size === 512 ? 120_000 : 350_000)
      expect(webp.length).toBeLessThan(png.length / 4)
    }
  }
)
