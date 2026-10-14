import { readdirSync, readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import {
  generatedArtPaths,
  getGeneratedArt,
  getControlArt,
} from './generatedArt'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { ALL_MANDATES } from '../config/mandateDefinitions'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import { getAllFateSeals } from '../systems/FateSealSystem'
import { getAllCelestialOrbs } from '../systems/CelestialOrbSystem'
import { ACHIEVEMENT_DEFINITIONS } from '../stores/achievementStore'
import {
  getDecreeIllustration,
  getFateSealIllustration,
  getMandateIllustration,
  illustrationAssets,
} from './assets'

const manifest = JSON.parse(
  readFileSync('docs/generated-art-manifest.json', 'utf8')
) as {
  assets: Array<{
    category: string
    id: string
    path: string
    deliverySha256: string
    bytes: number
  }>
}

it('keeps every generated runtime image decodable, bounded and linked to its original hash', () => {
  expect(manifest.assets).toHaveLength(373)
  expect(
    new Set(manifest.assets.map(({ category, id }) => `${category}:${id}`)).size
  ).toBe(373)
  for (const item of manifest.assets) {
    const bytes = readFileSync(`public/${item.path}`)
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      item.deliverySha256
    )
    expect(bytes.length).toBe(item.bytes)
    expect(bytes.length).toBeLessThan(120_000)
    if (item.category === 'controls') {
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(bytes.readUInt32BE(16)).toBeLessThanOrEqual(128)
      expect(bytes.readUInt32BE(20)).toBeLessThanOrEqual(128)
    } else {
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
      expect(bytes[20] & 0x10).toBe(0x10)
    }
  }
  for (const group of Object.values(generatedArtPaths)) {
    for (const path of Object.values(group))
      expect(statSync(`public/${path}`).size).toBeGreaterThan(0)
  }
})

it('uses all 39 generated controls and never accepts prototype keys', () => {
  expect(Object.keys(generatedArtPaths.controls)).toHaveLength(39)
  expect(getControlArt('lock')).toMatch(/\/controls\/lock\.png$/)
  for (const category of Object.keys(generatedArtPaths) as Array<
    keyof typeof generatedArtPaths
  >) {
    for (const key of [undefined, 'missing', 'toString', '__proto__'])
      expect(getGeneratedArt(category, key)).toBeUndefined()
  }
})

it('covers active catalog identities while retaining existing artwork', () => {
  for (const item of ALL_DECREES.filter(
    (item) => item.id !== 'decree-riichi-devotee'
  ))
    expect(getDecreeIllustration(item.id), item.id).toBeDefined()
  for (const item of ALL_MANDATES)
    expect(getMandateIllustration(item.id), item.id).toBeDefined()
  for (const item of getAllFateSeals())
    expect(getFateSealIllustration(item.id), item.id).not.toBe(
      illustrationAssets.consumables.fateSeal
    )
  for (const item of getAllCelestialOrbs())
    expect(getGeneratedArt('orbs', item.id), item.id).toBeDefined()
  const existingCharters = [
    'swift_hand',
    'full_palette',
    'star_chart',
    'observatory',
    'abundant_stock',
    'money_tree',
    'plentiful_stock',
  ]
  for (const item of ALL_CHARTERS.filter(
    (item) => !existingCharters.includes(item.id)
  ))
    expect(getGeneratedArt('charters', item.id), item.id).toBeDefined()
  for (const item of ACHIEVEMENT_DEFINITIONS)
    expect(getGeneratedArt('achievements', item.icon), item.id).toBeDefined()
  expect(generatedArtPaths.decrees).not.toHaveProperty('decree-riichi-devotee')
  expect(generatedArtPaths.orbs).toHaveProperty('pluto_orb')
})

describe('zero-emoji application source', () => {
  const emoji = /\p{Extended_Pictographic}|[\uFE0F\u20E3]/u
  const files = readdirSync('src', {
    recursive: true,
    encoding: 'utf8',
  }).filter(
    (name) => /\.(tsx?|json|css)$/.test(name) && !name.includes('.test.')
  )
  it('has no emoji in source, translations, or escaped string literals', () => {
    const failures: string[] = []
    for (const file of files) {
      const source = readFileSync(`src/${file}`, 'utf8')
      if (emoji.test(source)) failures.push(file)
      if (file.endsWith('.json')) {
        const check = (value: unknown): void => {
          if (typeof value === 'string' && emoji.test(value))
            failures.push(file)
          else if (value && typeof value === 'object')
            Object.values(value).forEach(check)
        }
        check(JSON.parse(source))
      }
      if (/\.tsx?$/.test(file)) {
        const tree = ts.createSourceFile(
          file,
          source,
          ts.ScriptTarget.Latest,
          true
        )
        const visit = (node: ts.Node) => {
          if (
            (ts.isStringLiteral(node) ||
              ts.isNoSubstitutionTemplateLiteral(node)) &&
            emoji.test(node.text)
          )
            failures.push(file)
          ts.forEachChild(node, visit)
        }
        visit(tree)
      }
    }
    expect(failures).toEqual([])
  })
})
