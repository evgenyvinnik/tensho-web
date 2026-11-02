/**
 * Which upgrade families a play scores: one pattern family for an ordinary
 * play, plus the tile families its tiles show. Every play is read by the real
 * parser and classifier, as the orchestrator reads it.
 */

import { describe, expect, it } from 'vitest'
import { DragonType, Tile, TileSuit, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { parsePlay } from '../rules/PartialHandParser'
import { classifyPlay } from '../rules/PlayPattern'
import {
  CelestialOrbSystem,
  handOrbCategories,
  playOrbCategories,
  type YakuCategory,
} from './CelestialOrbSystem'

const SUIT = { m: TileSuit.Manzu, p: TileSuit.Pinzu, s: TileSuit.Souzu }
const WIND = { E: WindType.East, S: WindType.South }
const DRAGON = { R: DragonType.Red, G: DragonType.Green }
let counter = 0

/**
 * `'234m 55p'` reads as tiles; `E`/`S` are Winds, `R`/`G` Dragons. A trailing
 * `*` makes a run's last tile Wild, a trailing `#` makes it a Stone.
 */
function tilesOf(spec: string) {
  return spec.split(' ').flatMap((part) => {
    const mark = part.endsWith('*')
      ? EnhancementType.Wild
      : part.endsWith('#')
        ? EnhancementType.Stone
        : null
    const body = mark ? part.slice(0, -1) : part
    const suit = SUIT[body.at(-1) as keyof typeof SUIT]
    const made = suit
      ? [...body.slice(0, -1)].map(
          (rank) => new Tile(suit, Number(rank), `t${counter++}`)
        )
      : [...body].map((face) =>
          face in WIND
            ? Tile.createWind(WIND[face as keyof typeof WIND], `t${counter++}`)
            : Tile.createDragon(
                DRAGON[face as keyof typeof DRAGON],
                `t${counter++}`
              )
        )
    if (mark) made[made.length - 1] = made.at(-1)!.withEnhancement(mark)
    return made
  })
}

function play(spec: string) {
  const tiles = tilesOf(spec)
  const parse = parsePlay(tiles)
  return playOrbCategories(classifyPlay(parse.groups).id, parse.groups, tiles)
}

const families = (spec: string, expected: YakuCategory[]) =>
  expect(play(spec).sort()).toEqual([...expected].sort())

describe('pattern families: one per play', () => {
  it.each([
    ['55m', 'Pairs'],
    ['33m 77m', 'Pairs'],
    ['22s 66s 88s', 'ThreePairs'],
    ['345p', 'Sequence'],
    ['234s 99s', 'SequencePair'],
    ['123m 789m', 'TwoSequences'],
    ['777p', 'Triplets'],
    ['111m 999m', 'Triplets'],
    ['111m 345m', 'Triplets'],
    ['888s 22s', 'FullHouse'],
    ['3456s', 'Straights'],
    ['234567m', 'Straights'],
    ['1234m 99m', 'Straights'],
    ['5555p', 'Quads'],
    ['9999m 11m', 'Quads'],
  ] as const)('%s scores %s and nothing else', (spec, family) => {
    families(spec, [family])
  })

  it('a combined pattern does not also score its parts', () => {
    expect(play('234s 99s')).not.toContain('Pairs')
    expect(play('234s 99s')).not.toContain('Sequence')
    expect(play('888s 22s')).not.toContain('Triplets')
    expect(play('22s 66s 88s')).not.toContain('Pairs')
  })

  it('a play of only loose tiles has no pattern family', () => {
    families('1m 5m 9m', ['Loose', 'Loose', 'Loose'])
  })
})

describe('tile families stack on the pattern', () => {
  it('Winds and Dragons count grouped or loose', () => {
    families('EEE 55m', ['FullHouse', 'Winds'])
    families('345m E', ['Sequence', 'Winds', 'Loose'])
    families('RRR', ['Triplets', 'Dragons'])
    families('77m R E', ['Pairs', 'Dragons', 'Winds', 'Loose', 'Loose'])
  })

  it('Mixed Suits needs numbered tiles from two or more suits', () => {
    families('234m 678p', ['TwoSequences', 'MixedSuits'])
    families('55m 55p 55s', ['ThreePairs', 'MixedSuits'])
    families('123m 789m', ['TwoSequences'])
    families('55m RR', ['Pairs', 'Dragons'])
  })

  it('a Wild tile counts as every suit; a Stone shows no suit', () => {
    families('123m 78m 9p*', ['TwoSequences'])
    families('33s 77s 5p#', ['Pairs'])
  })

  it('Loose Tiles pays once per loose tile, never for a Stone', () => {
    families('345m 9m 1m', ['Sequence', 'Loose', 'Loose'])
    families('345m 9p', ['Sequence', 'MixedSuits', 'Loose'])
    families('55m 9m#', ['Pairs'])
  })
})

describe('complete hands', () => {
  it('score only the tile families their tiles show', () => {
    expect(handOrbCategories(tilesOf('123m 456p 789s EEE 55m')).sort()).toEqual(
      ['MixedSuits', 'Winds'].sort()
    )
    expect(handOrbCategories(tilesOf('123m 456m 789m 111m 55m'))).toEqual([])
  })
})

describe('saved levels from before the family rework', () => {
  it('move to the family their Orb raises now', () => {
    const system = CelestialOrbSystem.fromState({
      orbLevels: [
        ['Pinfu', 4],
        ['Tanyao', 2],
        ['Yakuhai', 3],
        ['Riichi', 2],
        ['Kokushi', 5],
      ],
      yakuTriggerCounts: [['Pinfu', 7]],
      activeOrbs: [],
    })
    expect(system.getYakuLevel('Sequence')).toBe(4)
    expect(system.getYakuLevel('TwoSequences')).toBe(2)
    expect(system.getYakuLevel('Dragons')).toBe(3)
    expect(system.getYakuLevel('Pairs')).toBe(2)
    expect(system.getYakuLevel('Winds')).toBe(5)
    expect(system.getYakuLevel('Quads')).toBe(1)
    expect(system.getYakuTriggerCount('Sequence')).toBe(7)
    expect([...system.getAllYakuLevels().keys()]).toHaveLength(13)
  })
})
