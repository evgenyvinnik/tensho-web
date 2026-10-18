import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { SeasonSystem } from '../systems/SeasonSystem'
import { illustrationAssets } from './assets'
import { getItemArt, getSeasonArt } from './itemArt'

describe('Season and upgrade artwork', () => {
  it.each(['Spring', 'Summer', 'Autumn', 'Winter'] as const)(
    'distinguishes healthy and corrupted %s without losing identity',
    (type) => {
      const seasons = new SeasonSystem()
      seasons.forceSetSeason(type, true)
      const season = seasons.getSeasonStack()[0]
      const art = getSeasonArt(season)
      expect(art).toContain(
        `/seasons/${season.corruptedType!.toLowerCase()}.webp`
      )
      expect(getSeasonArt({ ...season, isCorrupted: false })).toBe(
        getSeasonArt(type)
      )
      expect(getSeasonArt({ ...season, corruptedType: undefined })).toBe(
        getSeasonArt(type)
      )
      const bytes = readFileSync(`public${art}`)
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
      expect(bytes.subarray(12, 16).toString()).toBe('VP8X')
      expect(bytes[20] & 0x10).toBe(0x10)
      expect(bytes.readUIntLE(24, 3) + 1).toBe(256)
      expect(bytes.readUIntLE(27, 3) + 1).toBe(256)
      expect(bytes.length).toBeLessThan(80_000)
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

  it('ships three different compact ending scenes', () => {
    const paths = [
      illustrationAssets.victoryResult,
      illustrationAssets.defeatResult,
      illustrationAssets.journeyResult,
    ]
    const hashes = paths.map((path) => {
      const bytes = readFileSync(`public${path}`)
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
      expect(bytes.readUInt16LE(26) & 0x3fff).toBe(1200)
      expect(bytes.readUInt16LE(28) & 0x3fff).toBe(400)
      expect(bytes.length).toBeLessThan(150_000)
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
