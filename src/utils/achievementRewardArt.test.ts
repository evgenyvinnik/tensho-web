import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { ACHIEVEMENT_REWARD_DECREES } from '../config/achievementRewardDecrees'
import { getDecreeIllustration, getTableStyleIllustration } from './assets'

const manifest = JSON.parse(
  readFileSync('docs/achievement-reward-art-manifest.json', 'utf8')
) as {
  assets: { id: string; path: string; transparent: boolean; prompt: string }[]
}

it('ships distinct generated art for all eleven real achievement rewards', () => {
  expect(manifest.assets.map((asset) => asset.id).sort()).toEqual(
    [
      ...ACHIEVEMENT_REWARD_DECREES.map((item) => item.id),
      'crimson_wall',
      'obsidian_wall',
    ].sort()
  )
  expect(new Set(manifest.assets.map((asset) => asset.path)).size).toBe(11)
  let totalBytes = 0
  for (const asset of manifest.assets) {
    const bytes = readFileSync(`public/${asset.path}`)
    totalBytes += bytes.length
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(asset.prompt).toContain('Subject:')
    if (asset.transparent) {
      expect(getDecreeIllustration(asset.id)).toBe(`/${asset.path}`)
      expect(bytes.subarray(12, 16).toString()).toBe('VP8X')
      expect(bytes[20] & 0x10).toBe(0x10)
      expect(bytes.readUIntLE(24, 3) + 1).toBe(384)
      expect(bytes.readUIntLE(27, 3) + 1).toBe(384)
      expect(bytes.length).toBeLessThan(80_000)
    } else {
      expect(getTableStyleIllustration(asset.id)).toBe(`/${asset.path}`)
      expect(bytes.length).toBeLessThan(250_000)
    }
  }
  expect(totalBytes).toBeLessThan(850_000)
})
