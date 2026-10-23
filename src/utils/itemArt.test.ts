import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { SeasonSystem } from '../systems/SeasonSystem'
import { FLOWER_MUTATIONS } from '../systems/FlowerSystem'
import { CELESTIAL_ORBS } from '../systems/CelestialOrbSystem'
import type { FlowerVariant, StickerType } from '../systems/types'
import { flowerIllustrations, illustrationAssets } from './assets'
import {
  getFlowerArt,
  getItemArt,
  getSeasonArt,
  getStickerArt,
} from './itemArt'

/** A transparent square WebP of the given edge, small enough for the cache. */
function expectTransparentSquare(path: string, edge: number, maxBytes: number) {
  const bytes = readFileSync(`public${path}`)
  expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
  expect(bytes.subarray(12, 16).toString()).toBe('VP8X')
  expect(bytes[20] & 0x10).toBe(0x10)
  expect(bytes.readUIntLE(24, 3) + 1).toBe(edge)
  expect(bytes.readUIntLE(27, 3) + 1).toBe(edge)
  expect(bytes.length).toBeLessThan(maxBytes)
}

describe('Season, Flower, sticker and result artwork', () => {
  it.each(['Spring', 'Summer', 'Autumn', 'Winter'] as const)(
    'distinguishes healthy and corrupted %s without losing identity',
    (type) => {
      const seasons = new SeasonSystem()
      seasons.forceSetSeason(type, true)
      const season = seasons.getSeasonStack()[0]
      const art = getSeasonArt(season)
      expect(art).toContain(
        `/states/seasons/${season.corruptedType!.toLowerCase()}.webp`
      )
      expect(getSeasonArt({ ...season, isCorrupted: false })).toBe(
        getSeasonArt(type)
      )
      expect(getSeasonArt({ ...season, corruptedType: undefined })).toBe(
        getSeasonArt(type)
      )
      expectTransparentSquare(art, 224, 40_000)
    }
  )

  it.each(['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo'] as const)(
    'shows awakened %s only while its own mutation is unlocked',
    (type: FlowerVariant) => {
      const base = flowerIllustrations[type]
      const mutation = FLOWER_MUTATIONS[type]
      expect(getFlowerArt(type)).toBe(base)
      expect(getFlowerArt({ type })).toBe(base)
      expect(
        getFlowerArt({ type, mutation: { ...mutation, isUnlocked: false } })
      ).toBe(base)
      const awakened = getFlowerArt({
        type,
        mutation: { ...mutation, isUnlocked: true },
      })
      expect(awakened).toBe(illustrationAssets.awakenedFlowers[type])
      expect(awakened).toContain(
        `/states/flowers/${type.toLowerCase()}-awakened.webp`
      )
      expectTransparentSquare(awakened, 224, 40_000)
    }
  )

  it.each(['Eternal', 'Perishable', 'Rental'] as const)(
    'ships a tiny transparent %s sticker emblem',
    (type: StickerType) => {
      const art = getStickerArt(type)
      expect(art).toContain(`/states/badges/${type.toLowerCase()}.webp`)
      expectTransparentSquare(art, 64, 5_000)
    }
  )

  it('uses a dedicated Pairs badge, not Pluto or Seven Pairs', () => {
    const pair = getItemArt('yakuUpgrades', 'Pairs')
    expect(pair).toEqual({
      src: illustrationAssets.pairsUpgrade,
      hasOwnArt: true,
    })
    expect(pair.src).not.toBe(getItemArt('orbs', 'pluto_orb').src)
    expect(pair.src).not.toBe(getItemArt('yakuUpgrades', 'SevenPairs').src)
    expect(readFileSync(`public${pair.src}`).length).toBeLessThan(30_000)
  })

  it('ships a unique transparent illustration for all 12 earned upgrade families', () => {
    const families = Object.values(CELESTIAL_ORBS)
      .map((orb) => orb.effect.targetYaku)
      .filter((family) => family !== 'All')
    expect(families).toHaveLength(12)
    const sources = new Set<string>()
    const hashes = new Set<string>()
    for (const family of families) {
      const art = getItemArt('yakuUpgrades', family)
      expect(art.hasOwnArt, family).toBe(true)
      expect(art.src, family).not.toBe(illustrationAssets.yakuLedger)
      expectTransparentSquare(art.src, family === 'Pairs' ? 256 : 128, 30_000)
      sources.add(art.src)
      hashes.add(
        createHash('sha256')
          .update(readFileSync(`public${art.src}`))
          .digest('hex')
      )
    }
    expect(sources.size).toBe(12)
    expect(hashes.size).toBe(12)
  })

  it('ships three different compact ending scenes', () => {
    const { victory, defeat, endlessCompletion } = illustrationAssets.results
    const hashes = [victory, defeat, endlessCompletion].map((path) => {
      const bytes = readFileSync(`public${path}`)
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
      expect(bytes.subarray(12, 16).toString()).toBe('VP8 ')
      expect(bytes.readUInt16LE(26) & 0x3fff).toBe(960)
      expect(bytes.readUInt16LE(28) & 0x3fff).toBe(320)
      expect(bytes.length).toBeLessThan(100_000)
      return createHash('sha256').update(bytes).digest('hex')
    })
    expect(new Set(hashes).size).toBe(3)
  })

  it.each(['missing', '__proto__', 'constructor'])(
    'safely falls back for %s',
    (type) => {
      expect(getSeasonArt(type)).toBe(illustrationAssets.codex.flora)
    }
  )
})
