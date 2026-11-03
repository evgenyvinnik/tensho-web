/**
 * Decrees reward simple plays: pairs, sequences, Quads, Straights and the
 * like, never a complete hand or its Yaku. Each case reads a real play through
 * the scorer's parser, so the groups a gate sees are the groups a play scores.
 */

import { describe, expect, it } from 'vitest'
import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { parsePlay, toPartialParsedHand } from '../rules/PartialHandParser'
import { ALL_DECREES, DecreeSystem } from './DecreeSystem'
import type { ScoringContext } from './types'

const SUIT = { m: TileSuit.Manzu, p: TileSuit.Pinzu, s: TileSuit.Souzu }
let counter = 0

/** `'5m'` is a 5 of Characters, `'6s*'` a Wild 6 of Bamboo, `'E'` East, `'R'` Red Dragon. */
function tile(spec: string): Tile {
  const id = `${spec}-${counter++}`
  if (spec === 'E') return Tile.createWind(WindType.East, id)
  if (spec === 'S') return Tile.createWind(WindType.South, id)
  if (spec === 'R') return Tile.createDragon(DragonType.Red, id)
  const plain = new Tile(
    SUIT[spec[1] as keyof typeof SUIT],
    Number(spec[0]),
    id
  )
  return spec.endsWith('*')
    ? plain.withEnhancement(EnhancementType.Wild)
    : plain
}

function play(
  specs: string,
  extra: Partial<ScoringContext> = {}
): ScoringContext {
  const tiles = specs.split(' ').map(tile)
  const parse = parsePlay(tiles)
  return {
    hand: toPartialParsedHand(parse, tiles),
    tiles,
    melds: parse.melds,
    decrees: [],
    flowers: { flowers: [], activeBonuses: [], totalEffectiveness: 1 },
    season: {
      activeSeason: null,
      seasonStack: [],
      isCorruptedRound: false,
      effectMultiplier: 1,
    },
    round: {
      actNumber: 1,
      roundNumber: 1,
      roundType: 'Small',
      scoreTarget: 300,
      currentScore: 0,
      handsPlayed: 1,
      maxHands: 4,
      discardsRemaining: 0,
      maxDiscards: 0,
      isCompleted: false,
      isWon: false,
    },
    yakuMultipliers: new Map(),
    isConcealed: true,
    winningTile: tiles[tiles.length - 1],
    ...extra,
  } as ScoringContext
}

/** What one Decree adds: its ×Mult and its flat Points/Mult. */
function pays(id: string, context: ScoringContext) {
  const decree = ALL_DECREES.find((d) => d.id === id)
  if (!decree) throw new Error(`missing ${id}`)
  const system = new DecreeSystem(10)
  system.acquireDecree(decree)
  context.decrees = system.getOwnedDecrees()
  const out = system.applyDecreeEffects(context, {
    basePoints: 100,
    tilePoints: 100,
    structurePoints: 0,
    additiveBonus: 0,
    yakuMultiplier: 1,
    decreeMultiplier: 1,
    flowerMultiplier: 1,
    seasonMultiplier: 1,
    finalScore: 100,
    bonusGold: 0,
  } as never)
  return { mult: out.decreeMultiplier, additive: out.additiveBonus }
}

const fires = (id: string, specs: string, extra?: Partial<ScoringContext>) => {
  const { mult, additive } = pays(id, play(specs, extra))
  return mult !== 1 || additive !== 0
}

describe('simple-hand Decrees', () => {
  it('Simples Tactician wants only 2–8 tiles', () => {
    expect(fires('decree-tanyao-tactician', '3m 4m 5m')).toBe(true)
    expect(fires('decree-tanyao-tactician', '1m 2m 3m')).toBe(false)
    // Simples Dispensation lets 1s and 9s count, never Winds or Dragons.
    const dispensed = { terminalsCountAsSimples: true }
    expect(fires('decree-tanyao-tactician', '1m 2m 3m', dispensed)).toBe(true)
    expect(fires('decree-tanyao-tactician', '2m 2m E', dispensed)).toBe(false)
  })

  it('Sequence Purist wants two sequences', () => {
    expect(fires('decree-pinfu-purist', '2m 3m 4m 6p 7p 8p')).toBe(true)
    expect(fires('decree-pinfu-purist', '2m 3m 4m 6p 6p')).toBe(false)
  })

  it('Value Zealot wants a Dragon or East group, not a lone one', () => {
    expect(fires('decree-yakuhai-zealot', 'R R')).toBe(true)
    expect(fires('decree-yakuhai-zealot', 'E E E')).toBe(true)
    expect(fires('decree-yakuhai-zealot', 'S S')).toBe(false)
    expect(fires('decree-yakuhai-zealot', 'R 5m 5m')).toBe(false)
  })

  it('Triplet Titan wants a Full House', () => {
    expect(fires('decree-toitoi-titan', '5m 5m 5m 9p 9p')).toBe(true)
    expect(fires('decree-toitoi-titan', '5m 5m 5m')).toBe(false)
  })

  it('Ninefold Initiate wants 1-2-3, 4-5-6 or 7-8-9, even inside a Straight', () => {
    expect(fires('decree-ittsu-initiate', '4s 5s 6s')).toBe(true)
    expect(fires('decree-ittsu-initiate', '6s 7s 8s 9s')).toBe(true)
    expect(fires('decree-ittsu-initiate', '3s 4s 5s')).toBe(false)
  })

  it('Flush Champion wants five tiles of one numbered suit; a Wild fits', () => {
    expect(fires('decree-chinitsu-champion', '1p 1p 4p 5p 6p')).toBe(true)
    expect(fires('decree-chinitsu-champion', '1p 1p 4p 5p 6s*')).toBe(true)
    expect(fires('decree-chinitsu-champion', '1p 1p 4p 5p')).toBe(false)
    expect(fires('decree-chinitsu-champion', '1p 1p 4p 5p 6s')).toBe(false)
  })

  it('Quad Herald wants four or more of a kind', () => {
    expect(fires('decree-honitsu-herald', '7m 7m 7m 7m')).toBe(true)
    expect(fires('decree-honitsu-herald', '7m 7m 7m')).toBe(false)
  })

  it('Twin Sequence Sage wants the same run in two suits', () => {
    expect(fires('decree-sanshoku-sage', '3m 4m 5m 3p 4p 5p')).toBe(true)
    expect(fires('decree-sanshoku-sage', '3m 4m 5m 4p 5p 6p')).toBe(false)
  })

  it('Outside Champion wants two groups, each with a 1, 9 or Honor', () => {
    expect(fires('decree-chanta-champion', '1m 2m 3m 9p 9p')).toBe(true)
    expect(fires('decree-chanta-champion', '1m 2m 3m 5p 5p')).toBe(false)
    expect(fires('decree-chanta-champion', '1m 2m 3m')).toBe(false)
  })

  it('Straight Arrow wants a Straight', () => {
    expect(fires('decree-straight-arrow', '3p 4p 5p 6p')).toBe(true)
    expect(fires('decree-straight-arrow', '3p 4p 5p')).toBe(false)
  })

  it('Pair Amplifier compounds per pair; False Eye adds one', () => {
    expect(pays('decree-yaku-amplifier', play('2m 2m 5p 5p 9s 9s')).mult).toBe(
      8
    )
    expect(pays('decree-yaku-amplifier', play('2m 3m 4m')).mult).toBe(1)
    expect(
      pays('decree-yaku-amplifier', play('2m 3m 4m', { phantomPairs: 1 })).mult
    ).toBe(2)
  })

  it('Grand Seeker wants five of a kind or a six-tile Straight', () => {
    expect(fires('decree-yakuman-seeker', '4s 5s 6s 7s 8s 9s')).toBe(true)
    expect(fires('decree-yakuman-seeker', '5m 5m 5m 5m 5p*')).toBe(true)
    expect(fires('decree-yakuman-seeker', '5m 5m 5m 5m')).toBe(false)
  })

  it('Chain Reaction and Group Nexus compound per group', () => {
    const twoGroups = '2m 3m 4m 9p 9p'
    expect(pays('decree-chain-reaction', play(twoGroups)).mult).toBeCloseTo(
      2.25
    )
    expect(pays('decree-yaku-nexus', play(twoGroups)).mult).toBeCloseTo(6.25)
  })

  it('Sixfold Blessing wants six tiles, every one grouped', () => {
    expect(fires('decree-yakuman-blessing', '2m 3m 4m 6p 6p 6p')).toBe(true)
    expect(fires('decree-yakuman-blessing', '2m 3m 4m 6p 6p 9s')).toBe(false)
  })

  it('Grand Succession wants two held Flowers and a Quad or Straight', () => {
    const flowers = {
      flowers: [{ type: 'Plum' }, { type: 'Orchid' }],
      activeBonuses: [],
      totalEffectiveness: 1,
    } as unknown as ScoringContext['flowers']
    expect(fires('yakuman_succession', '3p 4p 5p 6p', { flowers })).toBe(true)
    expect(fires('yakuman_succession', '3p 4p 5p 6p')).toBe(false)
    expect(fires('yakuman_succession', '3p 4p 5p', { flowers })).toBe(false)
  })

  it('no Decree pays on Yaku or needs a complete hand', () => {
    const yakuDecrees = ALL_DECREES.filter((decree) =>
      [decree.effect, ...(decree.extraEffects ?? [])].some(
        (effect) =>
          effect.type === 'yaku_modifier' ||
          (effect.type === 'rule_modification' &&
            ['all_wild', 'meld_as_pair', 'shanten_clemency'].includes(
              effect.ruleId
            ))
      )
    )
    expect(yakuDecrees.map((decree) => decree.id)).toEqual([])
  })
})
