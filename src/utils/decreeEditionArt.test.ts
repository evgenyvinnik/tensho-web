import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { ALL_DECREES } from '../systems/DecreeSystem'
import type { DecreeEdition } from '../systems/types'
import { getDecreeEditionArt } from './decreeEditionArt'

const editions: DecreeEdition[] = [
  'Foil',
  'Holographic',
  'Polychrome',
  'Negative',
]

it('ships four distinct, transparent portraits for every active decree', () => {
  const catalog = ALL_DECREES
  const manifest = JSON.parse(
    readFileSync('docs/decree-edition-art-manifest.json', 'utf8')
  ) as {
    assets: Array<{
      id: string
      edition: DecreeEdition
      path: string
      bytes: number
      sha256: string
    }>
  }
  const records = new Map(
    manifest.assets.map((asset) => [`${asset.id}/${asset.edition}`, asset])
  )
  const hashes = new Set<string>()
  expect(manifest.assets).toHaveLength(catalog.length * editions.length)
  expect(records.size).toBe(manifest.assets.length)
  for (const { id } of catalog) {
    for (const edition of editions) {
      const key = `${id}/${edition}`
      const path = getDecreeEditionArt(id, edition)
      expect(path, key).toBeDefined()
      const record = records.get(key)!
      expect(record, key).toBeDefined()
      expect(`public${path}`, key).toBe(record.path)
      const bytes = readFileSync(record.path)
      expect(bytes.subarray(8, 16).toString(), key).toBe('WEBPVP8X')
      expect(bytes[20] & 0x10, key).toBe(0x10)
      expect(bytes.readUIntLE(24, 3) + 1, key).toBe(256)
      expect(bytes.readUIntLE(27, 3) + 1, key).toBe(256)
      expect(bytes.length, key).toBe(record.bytes)
      expect(bytes.length, key).toBeLessThan(80_000)
      const hash = createHash('sha256').update(bytes).digest('hex')
      expect(hash, key).toBe(record.sha256)
      expect(hashes.has(hash), `Repeated artwork: ${key}`).toBe(false)
      hashes.add(hash)
    }
  }
})

it('leaves base and unknown identities on their ordinary portraits', () => {
  expect(getDecreeEditionArt('river_tax')).toBeUndefined()
  for (const id of [undefined, 'missing', '__proto__'])
    expect(getDecreeEditionArt(id, 'Foil')).toBeUndefined()
})
