import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import manifest from '../../docs/script-alpha-repair-manifest.json'
import { getVoidScriptIllustration } from './assets'

it('covers all 21 repaired Script portraits without changing their runtime identities', () => {
  expect(manifest.assets).toHaveLength(21)
  expect(new Set(manifest.assets.map((asset) => asset.id)).size).toBe(21)
})

it.each(manifest.assets)(
  'ships compact alpha-preserving art for $id',
  (asset) => {
    expect(`public${getVoidScriptIllustration(asset.id)}`).toBe(asset.path)
    const bytes = readFileSync(asset.path)
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(bytes.subarray(12, 16).toString()).toBe('VP8X')
    expect(bytes[20] & 0x10).toBe(0x10)
    expect(bytes.readUIntLE(24, 3) + 1).toBe(256)
    expect(bytes.readUIntLE(27, 3) + 1).toBe(256)
    expect(bytes.length).toBeLessThan(32_000)
  }
)
