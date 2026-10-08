import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { STARTER_DECREES } from '../systems/DecreeSystem'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { DragonType, TileSuit, WindType } from '../core/Tile'
import {
  getCodexCategoryIllustration,
  getDecreeIllustration,
  getFateSealIllustration,
  getDecreeScrollIllustration,
  getTableStyleIllustration,
  getMandateIllustration,
  illustrationAssets,
  getTileImagePath,
} from './assets'
import { SHOWDOWN_MANDATE_DEFINITIONS as SHOWDOWN_MANDATES } from '../config/mandateDefinitions'

// These PNGs were visually inspected: asset 1 is red 中, 2 is green 發,
// and 3 is the blank blue-framed White Dragon. Engine ranks are not file order.
it.each([
  [
    DragonType.White,
    3,
    '73bffaba5777ee4fc77352626fe99c340c30f6fcfd1022eafdfecb443c6ab06a',
  ],
  [
    DragonType.Green,
    2,
    'a876cb4468278e3c59a6e4860332d4dc826c5038a686397dbec8ae18b52cbedb',
  ],
  [
    DragonType.Red,
    1,
    'e3d3aeee8bea2875dca8c48540f631daea6a63e9b5f996f3feff7e196fc54200',
  ],
] as const)(
  'maps Dragon rank %s to the reviewed face %s',
  (rank, file, hash) => {
    const path = getTileImagePath(TileSuit.Dragon, rank)
    expect(path).toMatch(new RegExp(`Dragons \\(${file}\\)\\.png$`))
    expect(
      createHash('sha256')
        .update(readFileSync(`public${path}`))
        .digest('hex')
    ).toBe(hash)
  }
)

it.each([WindType.East, WindType.South, WindType.West, WindType.North])(
  'preserves reviewed Wind order for rank %s',
  (rank) => {
    expect(getTileImagePath(TileSuit.Wind, rank)).toContain(
      `Winds (${rank}).png`
    )
  }
)

it('ships a compact transparent Transmutation seal with safe generic fallbacks', () => {
  const webp = readFileSync(
    `public${getFateSealIllustration('seal_of_transmutation')}`
  )
  expect(webp.subarray(0, 4).toString()).toBe('RIFF')
  expect(webp.subarray(12, 16).toString()).toBe('VP8X')
  expect(webp[20] & 0x10).toBe(0x10)
  expect(webp.readUIntLE(24, 3) + 1).toBe(512)
  expect(webp.readUIntLE(27, 3) + 1).toBe(512)
  expect(webp.length).toBeLessThan(100_000)
  for (const id of [undefined, 'missing', '__proto__', 'seal_of_unity'])
    expect(getFateSealIllustration(id)).toBe(
      illustrationAssets.consumables.fateSeal
    )
})

it.each([
  'swiftHandCharter',
  'fullPaletteCharter',
  'yakuLedger',
  'springBlossom',
  'autumnMaple',
  'winterPine',
  'summerFan',
] as const)('ships a compact transparent %s portrait', (key) => {
  const webp = readFileSync(`public${illustrationAssets[key]}`)
  expect(webp.subarray(0, 4).toString()).toBe('RIFF')
  expect(webp.subarray(12, 16).toString()).toBe('VP8X')
  expect(webp[20] & 0x10).toBe(0x10)
  expect(webp.readUIntLE(24, 3) + 1).toBe(512)
  expect(webp.readUIntLE(27, 3) + 1).toBe(512)
  expect(webp.length).toBeLessThan(100_000)
})

it.each(SHOWDOWN_MANDATES)(
  'ships a distinct compact transparent portrait for $id',
  ({ id }) => {
    const path = getMandateIllustration(id)!
    expect(path).toMatch(/\/illustrations\/.+\.webp$/)
    const webp = readFileSync(`public${path}`)
    expect(webp.subarray(0, 4).toString()).toBe('RIFF')
    expect(webp.subarray(12, 16).toString()).toBe('VP8X')
    expect(webp[20] & 0x10).toBe(0x10)
    expect(webp.readUIntLE(24, 3) + 1).toBe(512)
    expect(webp.readUIntLE(27, 3) + 1).toBe(512)
    expect(webp.length).toBeLessThan(100_000)
  }
)

it('uses unique Showdown assets and never substitutes an unrelated or inherited-key portrait', () => {
  expect(
    new Set(
      SHOWDOWN_MANDATES.map(({ id }) =>
        createHash('sha256')
          .update(readFileSync(`public${getMandateIllustration(id)}`))
          .digest('hex')
      )
    ).size
  ).toBe(5)
  for (const id of [
    undefined,
    '',
    'the_hook',
    'missing',
    'toString',
    '__proto__',
  ])
    expect(getMandateIllustration(id)).toBeUndefined()
})

it('ships a compact transparent Cerulean Bell illustration', () => {
  const webp = readFileSync(`public${illustrationAssets.ceruleanBell}`)
  expect(webp.subarray(0, 4).toString()).toBe('RIFF')
  expect(webp.subarray(12, 16).toString()).toBe('VP8X')
  expect(webp[20] & 0x10).toBe(0x10)
  expect(webp.readUIntLE(24, 3) + 1).toBe(512)
  expect(webp.readUIntLE(27, 3) + 1).toBe(512)
  expect(webp.length).toBeLessThan(100_000)
})

it('ships a compact wide result illustration', () => {
  const webp = readFileSync(`public${illustrationAssets.journeyResult}`)
  expect(webp.subarray(0, 4).toString()).toBe('RIFF')
  expect(webp.subarray(8, 12).toString()).toBe('WEBP')
  expect(webp.subarray(12, 16).toString()).toBe('VP8 ')
  expect(webp.readUInt16LE(26) & 0x3fff).toBe(1200)
  expect(webp.readUInt16LE(28) & 0x3fff).toBe(400)
  expect(webp.length).toBeLessThan(150_000)
})

it('ships the generated guidebook with an alpha-capable PNG in the project', () => {
  expect(illustrationAssets.beginnerGuidebook).toBe(
    '/assets/illustrations/beginner-guidebook.png'
  )
  const png = readFileSync(`public${illustrationAssets.beginnerGuidebook}`)
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(png[25]).toBe(6)
})

describe('Decree scroll illustrations', () => {
  it.each([
    ...STARTER_DECREES,
    { id: 'celestial_wildcard' },
    { id: 'shanten_clemency' },
    { id: 'decree-half-suited' },
    { id: 'decree-phoenix' },
    { id: 'decree-polished-stone' },
    { id: 'decree-blueprint' },
  ])('ships a compact transparent portrait for $id', ({ id }) => {
    const path = getDecreeIllustration(id)!
    expect(path).toMatch(/\/decrees\/.+\.webp$/)
    const webp = readFileSync(`public${path}`)
    expect(webp.subarray(0, 4).toString()).toBe('RIFF')
    expect(webp.subarray(8, 12).toString()).toBe('WEBP')
    expect(webp.subarray(12, 16).toString()).toBe('VP8X')
    expect(webp[20] & 0x10).toBe(0x10) // Extended WebP alpha flag.
    expect(webp.readUIntLE(24, 3) + 1).toBe(512)
    expect(webp.readUIntLE(27, 3) + 1).toBe(512)
    expect(webp.length).toBeLessThan(120_000)
  })
  it('gives all five starters distinct generated artwork', () => {
    const hashes = STARTER_DECREES.map(({ id }) =>
      createHash('sha256')
        .update(readFileSync(`public${getDecreeIllustration(id)}`))
        .digest('hex')
    )
    expect(new Set(hashes).size).toBe(STARTER_DECREES.length)
  })
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
