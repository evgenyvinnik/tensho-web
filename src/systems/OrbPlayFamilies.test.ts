/**
 * Which upgrade families an ordinary (tactical) play scores. Every play is
 * read by the real parser and classifier, as the orchestrator reads it.
 */

import { describe, expect, it } from 'vitest'
import { DragonType, Tile, TileSuit, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { parsePlay } from '../rules/PartialHandParser'
import { classifyPlay } from '../rules/PlayPattern'
import { playOrbCategories, type YakuCategory } from './CelestialOrbSystem'

const SUIT = { m: TileSuit.Manzu, p: TileSuit.Pinzu, s: TileSuit.Souzu }
const WIND = { E: WindType.East, S: WindType.South }
const DRAGON = { R: DragonType.Red, G: DragonType.Green }
let counter = 0

/**
 * `'234m 55p'` reads as tiles; `E`/`S` are Winds, `R`/`G` Dragons. A trailing
 * `*` makes a run's last tile Wild, a trailing `#` makes it a Stone.
 */
function play(spec: string) {
  const tiles = spec.split(' ').flatMap((part) => {
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
  const parse = parsePlay(tiles)
  return playOrbCategories(classifyPlay(parse.groups).id, parse.groups, tiles)
}

const families = (spec: string, expected: YakuCategory[]) =>
  expect(play(spec).sort()).toEqual([...expected].sort())

describe('Full Flush on a tactical play', () => {
  it('two groups of one suit', () => {
    families('123m 789m', ['Pinfu', 'Chinitsu'])
    families('555p 345p', ['Toitoi', 'Tanyao', 'Chinitsu'])
    families('33s 77s', ['Pairs', 'Tanyao', 'Chinitsu'])
  })

  it('needs two groups: one long Straight is not a flush', () => {
    families('234567m', ['Ittsu', 'Tanyao'])
    families('345m', ['Pinfu', 'Tanyao'])
  })

  it('a second suit or any Honor breaks it', () => {
    families('123m 789p', ['Pinfu'])
    families('33m 77m E', ['Pairs'])
  })

  it('a Wild tile counts as the suit; a Stone is ignored', () => {
    families('123m 78m 9p*', ['Pinfu', 'Chinitsu'])
    families('33s 77s 5p#', ['Pairs', 'Tanyao', 'Chinitsu'])
  })
})

describe('Half Flush on a tactical play', () => {
  it('one suit plus a group of Winds or Dragons', () => {
    families('345m RR', ['Pinfu', 'Yakuhai', 'Honitsu'])
    families('EEE 55m', ['Toitoi', 'Yakuhai', 'Honitsu'])
  })

  it('needs a numbered group in one suit', () => {
    families('EEE RR', ['Toitoi', 'Yakuhai'])
    families('RRR EE 5m', ['Toitoi', 'Yakuhai'])
    families('345m 5p RR', ['Pinfu', 'Yakuhai'])
  })

  it('a loose Honor is not enough', () => {
    families('33m 77m E', ['Pairs'])
  })
})

describe('Mixed Triple on a tactical play', () => {
  it('groups of the same numbers in different suits', () => {
    families('234m 234p', ['Pinfu', 'Tanyao', 'Sanshoku'])
    families('777m 777s', ['Toitoi', 'Tanyao', 'Sanshoku'])
    families('55s 555p', ['Toitoi', 'Tanyao', 'Sanshoku'])
    families('55m 55p 55s', ['Pairs', 'Tanyao', 'Sanshoku'])
    families('99m 99p', ['Pairs', 'Sanshoku'])
  })

  it('needs the same numbers in different suits', () => {
    families('234m 345p', ['Pinfu', 'Tanyao'])
    families('555m 345p', ['Toitoi', 'Tanyao'])
    families('55m 66p', ['Pairs', 'Tanyao'])
  })

  it('Honors have no numbers to match', () => {
    families('EE SS', ['Pairs', 'Yakuhai'])
  })
})
