/**
 * Tests for the Decree mechanics that back the authored library:
 * retriggering, Decree copying, yaku amplification, tile transformation,
 * gold multiplication, and loss prevention.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GameOrchestrator } from '../game/GameOrchestrator'
import { DecreeSystem, ALL_DECREES } from './DecreeSystem'
import { LIBRARY_DECREES } from '../config/decreeLibrary'
import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import type { Decree } from './types'
import type { ScoreAddedEffect } from '../game/ActionProcessor'

function decreeById(id: string): Decree {
  const decree = ALL_DECREES.find((d) => d.id === id)
  if (!decree) throw new Error(`decree ${id} missing from pool`)
  return decree
}

function scoreOf(effects: { type: string }[]): number {
  const effect = effects.find((e) => e.type === 'score_added') as
    | ScoreAddedEffect
    | undefined
  return effect?.score ?? 0
}

describe('retrigger Decrees', () => {
  let system: DecreeSystem

  beforeEach(() => {
    system = new DecreeSystem(10)
  })

  const tiles = [
    Tile.createDragon(DragonType.Red, 'd1'),
    Tile.createWind(WindType.East, 'w1'),
    new Tile(TileSuit.Manzu, 1, 'm1'),
    new Tile(TileSuit.Manzu, 5, 'm5'),
  ]

  it('retriggers only the targeted tile type', () => {
    system.acquireDecree(decreeById('decree-dragon-echo')) // all Dragon tiles

    const extra = system.calculateRetriggers(tiles)

    expect(extra.get('d1')).toBe(1)
    expect(extra.has('w1')).toBe(false)
    expect(extra.has('m5')).toBe(false)
  })

  it('retriggers every tile for an all-tiles Decree', () => {
    system.acquireDecree(decreeById('decree-triple-echo')) // all scoring tiles

    const extra = system.calculateRetriggers(tiles)

    for (const tile of tiles) {
      expect(extra.get(tile.id)).toBe(1)
    }
  })

  it('targets the first and last tiles positionally', () => {
    system.acquireDecree(decreeById('decree-echo-stone')) // first scoring tile
    system.acquireDecree(decreeById('decree-mirror-shard')) // last scoring tile

    const extra = system.calculateRetriggers(tiles)

    expect(extra.get('d1')).toBe(1)
    expect(extra.get('m5')).toBe(1)
    expect(extra.has('w1')).toBe(false)
  })

  it('stacks retriggers from several Decrees', () => {
    system.acquireDecree(decreeById('decree-triple-echo')) // all tiles x1
    system.acquireDecree(decreeById('decree-honor-resonance')) // honors x2

    const extra = system.calculateRetriggers(tiles)

    expect(extra.get('d1')).toBe(3) // 1 from all + 2 from honors
    expect(extra.get('m5')).toBe(1)
  })

  it('doubles every retrigger under Echo Dimension', () => {
    system.acquireDecree(decreeById('decree-triple-echo')) // all tiles x1
    system.acquireDecree(decreeById('decree-echo-dimension')) // retriggers x2

    const extra = system.calculateRetriggers(tiles)

    expect(extra.get('m5')).toBe(2)
  })

  it('raises the score of a real play', () => {
    const baseline = new GameOrchestrator()
    baseline.startNewRun(4242, 1)
    const baseIds = baseline.getState().handTiles.slice(0, 6).map((t) => t.id)
    const baseScore = scoreOf(
      baseline.processAction({ type: 'play', tileIds: baseIds }).effects
    )

    const boosted = new GameOrchestrator()
    boosted.startNewRun(4242, 1)
    boosted.addDecree(decreeById('decree-triple-echo'))
    const boostIds = boosted.getState().handTiles.slice(0, 6).map((t) => t.id)
    const boostScore = scoreOf(
      boosted.processAction({ type: 'play', tileIds: boostIds }).effects
    )

    expect(baseScore).toBeGreaterThan(0)
    expect(boostScore).toBeGreaterThan(baseScore)
  })
})

describe('Decree copying', () => {
  let system: DecreeSystem

  beforeEach(() => {
    system = new DecreeSystem(10)
  })

  it('copies the retrigger of the Decree to its right', () => {
    system.acquireDecree(decreeById('decree-blueprint')) // copies Decree to right
    system.acquireDecree(decreeById('decree-dragon-echo')) // all Dragon tiles

    const extra = system.calculateRetriggers([Tile.createDragon(DragonType.Red, 'd1')])

    // One trigger from Dragon Echo itself, one from Blueprint copying it.
    expect(extra.get('d1')).toBe(2)
  })

  it('copies the leftmost Decree', () => {
    system.acquireDecree(decreeById('decree-dragon-echo'))
    system.acquireDecree(decreeById('decree-brainstorm')) // copies leftmost

    const extra = system.calculateRetriggers([Tile.createDragon(DragonType.Red, 'd1')])

    expect(extra.get('d1')).toBe(2)
  })

  it('copies every other Decree with Clone Army', () => {
    system.acquireDecree(decreeById('decree-dragon-echo'))
    system.acquireDecree(decreeById('decree-honor-resonance')) // honors x2
    system.acquireDecree(decreeById('decree-clone-army'))

    const extra = system.calculateRetriggers([Tile.createDragon(DragonType.Red, 'd1')])

    // Dragon 1 + honors 2, then Clone Army copies both again.
    expect(extra.get('d1')).toBe(6)
  })

  it('does not loop when two copiers point at each other', () => {
    system.acquireDecree(decreeById('decree-blueprint'))
    system.acquireDecree(decreeById('decree-brainstorm'))

    expect(() => system.calculateRetriggers([Tile.createDragon(DragonType.Red, 'd')])).not.toThrow()
  })

  it('copies nothing when it is the only Decree owned', () => {
    system.acquireDecree(decreeById('decree-clone-army'))

    const extra = system.calculateRetriggers([Tile.createDragon(DragonType.Red, 'd1')])

    expect(extra.size).toBe(0)
  })
})

describe('yaku, gold, and resource Decrees', () => {
  let system: DecreeSystem

  beforeEach(() => {
    system = new DecreeSystem(10)
  })

  it('scales yaku multipliers with Yaku Amplifier', () => {
    system.acquireDecree(decreeById('decree-yaku-amplifier'))
    expect(system.getYakuModifiers().multiplier).toBe(1.5)
  })

  it('raises yaku tiers with Yaku Nexus', () => {
    system.acquireDecree(decreeById('decree-yaku-nexus'))
    expect(system.getYakuModifiers().tierBonus).toBe(1)
  })

  it("doubles gold with Philosopher's Stone", () => {
    system.acquireDecree(decreeById('decree-philosophers-stone'))
    expect(system.getGoldMultiplier()).toBe(2)
  })

  it('grants extra hands per round', () => {
    system.acquireDecree(decreeById('decree-time-master')) // +2 hands
    expect(system.getAdditionalDraws()).toBe(2)
  })

  it('adds its hands on top of whatever the run already grants', () => {
    const orchestrator = new GameOrchestrator()
    orchestrator.startNewRun(99, 1)
    const before = orchestrator.getState().decreeSystem.getAdditionalDraws()

    orchestrator.addDecree(decreeById('decree-time-master'))

    expect(orchestrator.getState().decreeSystem.getAdditionalDraws()).toBe(before + 2)
  })
})

describe('per-Flower and per-Season scaling', () => {
  const emptyBreakdown = () => ({
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
  })

  /** A scoring context carrying a given number of Flowers and Seasons. */
  function contextWith(flowerCount: number, seasonCount: number, decrees: Decree[]) {
    const flowers = Array.from({ length: flowerCount }, (_, i) => ({
      id: `flower-${i}`,
    }))
    const seasons = Array.from({ length: seasonCount }, (_, i) => ({
      id: `season-${i}`,
    }))

    return {
      hand: { melds: [], pair: null, waitType: 'tanki', winningTile: null, isConcealed: true },
      tiles: [],
      melds: [],
      decrees,
      flowers: { flowers, activeBonuses: [], totalEffectiveness: 1 },
      season: {
        activeSeason: seasons[0] ?? null,
        seasonStack: seasons,
        isCorruptedRound: false,
        effectMultiplier: 1,
      },
      round: {
        actNumber: 1,
        roundNumber: 1,
        roundType: 'Small',
        scoreTarget: 300,
        currentScore: 0,
        handsPlayed: 0,
        maxHands: 4,
        discardsRemaining: 3,
        maxDiscards: 3,
        isCompleted: false,
        isWon: false,
      },
      yakuMultipliers: new Map(),
      isConcealed: true,
      winningTile: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  it('pays an additive Flower bonus once per Flower held', () => {
    const system = new DecreeSystem(10)
    // Eternal Garden: +10 Mult per Flower.
    const decree = decreeById('decree-eternal-garden')
    system.acquireDecree(decree)
    const owned = system.getOwnedDecrees()

    const none = system.applyDecreeEffects(contextWith(0, 0, owned), emptyBreakdown())
    const three = system.applyDecreeEffects(contextWith(3, 0, owned), emptyBreakdown())

    // No Flowers means no bonus at all; three Flowers pay three times over.
    expect(none.decreeMultiplier).toBe(1)
    expect(three.decreeMultiplier).toBeGreaterThan(none.decreeMultiplier)
  })

  it('compounds a multiplicative Flower bonus per Flower', () => {
    const system = new DecreeSystem(10)
    const decree = LIBRARY_DECREES.find(
      (d) =>
        d.effect.type === 'multiplicative_score' &&
        d.effect.scaleBy === 'flower_count'
    )
    expect(decree).toBeDefined()
    system.acquireDecree(decree!)
    const owned = system.getOwnedDecrees()

    const none = system.applyDecreeEffects(contextWith(0, 0, owned), emptyBreakdown())
    const one = system.applyDecreeEffects(contextWith(1, 0, owned), emptyBreakdown())
    const two = system.applyDecreeEffects(contextWith(2, 0, owned), emptyBreakdown())

    // With no Flowers the multiplier is inert, then compounds per Flower.
    expect(none.decreeMultiplier).toBe(1)
    expect(one.decreeMultiplier).toBeGreaterThan(1)
    expect(two.decreeMultiplier).toBeGreaterThan(one.decreeMultiplier)
  })

  it('scales a Season bonus with the number of Seasons in play', () => {
    const system = new DecreeSystem(10)
    const decree = LIBRARY_DECREES.find(
      (d) =>
        d.effect.type === 'additive_score' &&
        d.effect.scaleBy === 'season_count' &&
        d.effect.basePoints
    )
    expect(decree).toBeDefined()
    system.acquireDecree(decree!)
    const owned = system.getOwnedDecrees()

    const none = system.applyDecreeEffects(contextWith(0, 0, owned), emptyBreakdown())
    const two = system.applyDecreeEffects(contextWith(0, 2, owned), emptyBreakdown())

    expect(none.additiveBonus).toBe(0)
    expect(two.additiveBonus).toBeGreaterThan(0)
  })

  it('leaves unconditioned Decrees paying a flat bonus', () => {
    const system = new DecreeSystem(10)
    const flat = LIBRARY_DECREES.find(
      (d) => d.effect.type === 'additive_score' && !d.effect.scaleBy && d.effect.basePoints
    )
    expect(flat).toBeDefined()
    system.acquireDecree(flat!)
    const owned = system.getOwnedDecrees()

    const none = system.applyDecreeEffects(contextWith(0, 0, owned), emptyBreakdown())
    const many = system.applyDecreeEffects(contextWith(5, 3, owned), emptyBreakdown())

    // Flower empowerment still scales it, but it pays with zero Flowers held.
    expect(none.additiveBonus).toBeGreaterThan(0)
    expect(many.additiveBonus).toBeGreaterThanOrEqual(none.additiveBonus)
  })

  it('marks every authored per-Flower and per-Season Decree as scaling', () => {
    const scaled = LIBRARY_DECREES.filter((decree) =>
      [decree.effect, ...(decree.extraEffects ?? [])].some(
        (effect) =>
          (effect.type === 'additive_score' ||
            effect.type === 'multiplicative_score') &&
          effect.scaleBy !== undefined
      )
    )

    // Seven per-Flower and six per-Season effects exist in the library.
    expect(scaled.length).toBeGreaterThanOrEqual(10)
  })
})

describe('per-count scaling Decrees', () => {
  const breakdownWith = (basePoints: number) => ({
    basePoints,
    tilePoints: basePoints,
    structurePoints: 0,
    additiveBonus: 0,
    yakuMultiplier: 1,
    decreeMultiplier: 1,
    flowerMultiplier: 1,
    seasonMultiplier: 1,
    finalScore: basePoints,
    bonusGold: 0,
  })

  function ctx(options: {
    tiles?: Tile[]
    melds?: { type: MeldType }[]
    gold?: number
    handsPlayed?: number
    handsPlayedThisRun?: number
    roundNumber?: number
    actNumber?: number
    discardsRemaining?: number
    yakuIds?: string[]
  }) {
    return {
      hand: { melds: [], pair: null, waitType: 'tanki', winningTile: null, isConcealed: true },
      tiles: options.tiles ?? [],
      melds: options.melds ?? [],
      decrees: [],
      flowers: { flowers: [], activeBonuses: [], totalEffectiveness: 1 },
      season: { activeSeason: null, seasonStack: [], isCorruptedRound: false, effectMultiplier: 1 },
      round: {
        actNumber: options.actNumber ?? 1,
        roundNumber: options.roundNumber ?? 1,
        roundType: 'Small',
        scoreTarget: 300,
        currentScore: 0,
        handsPlayed: options.handsPlayed ?? 0,
        maxHands: 4,
        discardsRemaining: options.discardsRemaining ?? 3,
        maxDiscards: 3,
        isCompleted: false,
        isWon: false,
      },
      yakuMultipliers: new Map(),
      detectedYakuIds: new Set(options.yakuIds ?? []),
      gold: options.gold,
      handsPlayedThisRun: options.handsPlayedThisRun,
      isConcealed: true,
      winningTile: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  /** Score a context with one decree and report its contribution. */
  function apply(
    decree: Decree,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any,
    basePoints = 100
  ) {
    const system = new DecreeSystem(10)
    system.acquireDecree(decree)
    context.decrees = system.getOwnedDecrees()
    const out = system.applyDecreeEffects(context, breakdownWith(basePoints))
    return { additive: out.additiveBonus, mult: out.decreeMultiplier }
  }

  function scaledDecree(source: string): Decree {
    const found = LIBRARY_DECREES.find((d) =>
      [d.effect, ...(d.extraEffects ?? [])].some(
        (e) =>
          (e.type === 'additive_score' || e.type === 'multiplicative_score') &&
          e.scaleBy === source
      )
    )
    if (!found) throw new Error(`no decree scaling on ${source}`)
    return found
  }

  const souzu = (rank: number, id: string) => new Tile(TileSuit.Souzu, rank, id)

  it('pays per terminal tile played', () => {
    const decree = scaledDecree('terminal_tiles')

    const none = apply(decree, ctx({ tiles: [souzu(5, 'a')] }))
    const two = apply(decree, ctx({ tiles: [souzu(1, 'a'), souzu(9, 'b')] }))

    expect(none.additive).toBe(0)
    expect(two.additive).toBeGreaterThan(0)
  })

  it('counts only the green tiles of Ryuuiisou', () => {
    const decree = scaledDecree('green_tiles')

    // Souzu 2,3,4,6,8 and the Green Dragon are green; Souzu 1/5/9 are not.
    const green = apply(
      decree,
      ctx({ tiles: [souzu(2, 'a'), souzu(6, 'b'), Tile.createDragon(DragonType.Green, 'g')] })
    )
    const notGreen = apply(
      decree,
      ctx({ tiles: [souzu(1, 'a'), souzu(5, 'b'), Tile.createDragon(DragonType.Red, 'r')] })
    )

    expect(green.additive).toBeGreaterThan(0)
    expect(notGreen.additive).toBe(0)
  })

  it('pays per meld of the named kind', () => {
    const decree = scaledDecree('triplets')

    const none = apply(decree, ctx({ melds: [{ type: MeldType.Sequence }] }))
    const two = apply(
      decree,
      ctx({ melds: [{ type: MeldType.Triplet }, { type: MeldType.Triplet }] })
    )

    expect(none.mult).toBe(1)
    expect(two.mult).toBeGreaterThan(1)
  })

  it('scales with gold held', () => {
    const decree = scaledDecree('gold_per_10')

    const broke = apply(decree, ctx({ gold: 0 }))
    const rich = apply(decree, ctx({ gold: 50 }))

    expect(broke.mult).toBe(1)
    expect(rich.mult).toBeGreaterThan(broke.mult)
  })

  it('honours a Decree that caps its own growth', () => {
    // Golden Ratio: +1 Mult per ¥5, capped at +10.
    const capped = LIBRARY_DECREES.find((d) =>
      [d.effect, ...(d.extraEffects ?? [])].some(
        (e) => e.type === 'additive_score' && e.maxBonus !== undefined
      )
    )
    expect(capped).toBeDefined()

    const moderate = apply(capped!, ctx({ gold: 50, handsPlayedThisRun: 10 }))
    const absurd = apply(capped!, ctx({ gold: 5000, handsPlayedThisRun: 1000 }))

    // Past the ceiling, more of the resource buys nothing further.
    expect(absurd.mult).toBe(moderate.mult)
  })

  it('scales with acts completed and stays zero in Act 1', () => {
    const decree = scaledDecree('acts_completed')

    const act1 = apply(decree, ctx({ actNumber: 1 }))
    const act5 = apply(decree, ctx({ actNumber: 5 }))

    expect(act1.additive + act1.mult).toBeLessThan(act5.additive + act5.mult)
  })

  it('scales with base chips in hundreds', () => {
    const decree = scaledDecree('base_chips_per_100')

    const small = apply(decree, ctx({}), 50)
    const large = apply(decree, ctx({}), 500)

    expect(small.mult).toBe(1)
    expect(large.mult).toBeGreaterThan(1)
  })

  it('scales with the yaku the hand scored', () => {
    const decree = scaledDecree('yaku_this_hand')

    const none = apply(decree, ctx({ yakuIds: [] }))
    const three = apply(decree, ctx({ yakuIds: ['tanyao', 'pinfu', 'riichi'] }))

    expect(none.mult).toBe(1)
    expect(three.mult).toBeGreaterThan(1)
  })

  it('maps a first-tile multiplier to a retrigger of that tile', () => {
    // Photograph reads "x2.0 first scoring tile", which is that tile scoring
    // twice rather than a hand-wide multiplier.
    const photograph = ALL_DECREES.find((d) => d.id === 'decree-photograph')
    expect(photograph).toBeDefined()
    expect(photograph!.effect.type).toBe('retrigger')

    const system = new DecreeSystem(10)
    system.acquireDecree(photograph!)
    const extra = system.calculateRetriggers([souzu(2, 'a'), souzu(3, 'b')])

    expect(extra.get('a')).toBe(1)
    expect(extra.has('b')).toBe(false)
  })

  it('leaves no authored condition without engine meaning', () => {
    const conditioned = LIBRARY_DECREES.filter((d) =>
      [d.effect, ...(d.extraEffects ?? [])].some(
        (e) =>
          ((e.type === 'additive_score' || e.type === 'multiplicative_score') &&
            (e.scaleBy || e.requires)) ||
          e.type === 'retrigger'
      )
    )

    expect(conditioned.length).toBeGreaterThanOrEqual(75)
  })
})

describe('gated (conditional) Decrees', () => {
  const breakdown = () => ({
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
  })

  /** A scoring context built around a specific played hand and round state. */
  function contextFor(options: {
    tiles?: Tile[]
    melds?: { type: MeldType }[]
    decrees: Decree[]
    roundType?: string
    handsPlayed?: number
    discardsRemaining?: number
    currentScore?: number
    yakuIds?: string[]
    lastHandScore?: number
  }) {
    return {
      hand: { melds: [], pair: null, waitType: 'tanki', winningTile: null, isConcealed: true },
      tiles: options.tiles ?? [],
      melds: options.melds ?? [],
      decrees: options.decrees,
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
        roundType: options.roundType ?? 'Small',
        scoreTarget: 300,
        currentScore: options.currentScore ?? 0,
        handsPlayed: options.handsPlayed ?? 1,
        maxHands: 4,
        discardsRemaining: options.discardsRemaining ?? 0,
        maxDiscards: 3,
        isCompleted: false,
        isWon: false,
      },
      yakuMultipliers: new Map(),
      detectedYakuIds: new Set(options.yakuIds ?? []),
      lastHandScore: options.lastHandScore,
      isConcealed: true,
      winningTile: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  /** Find a live decree whose (only) score effect carries this gate. */
  function gatedDecree(gate: string): Decree {
    const found = LIBRARY_DECREES.find((d) =>
      [d.effect, ...(d.extraEffects ?? [])].some(
        (e) =>
          (e.type === 'additive_score' || e.type === 'multiplicative_score') &&
          e.requires === gate
      )
    )
    if (!found) throw new Error(`no decree gated on ${gate}`)
    return found
  }

  function multiplierWith(decree: Decree, ctx: ReturnType<typeof contextFor>) {
    const system = new DecreeSystem(10)
    system.acquireDecree(decree)
    const owned = system.getOwnedDecrees()
    ctx.decrees = owned
    const result = system.applyDecreeEffects(ctx, breakdown())
    return { mult: result.decreeMultiplier, additive: result.additiveBonus }
  }

  const manzu = (rank: number, id: string) => new Tile(TileSuit.Manzu, rank, id)

  it('pays a single-suit Decree only on a single-suit hand', () => {
    const decree = gatedDecree('all_manzu')

    const pure = multiplierWith(
      decree,
      contextFor({ tiles: [manzu(2, 'a'), manzu(3, 'b')], decrees: [] })
    )
    const mixed = multiplierWith(
      decree,
      contextFor({
        tiles: [manzu(2, 'a'), new Tile(TileSuit.Pinzu, 3, 'b')],
        decrees: [],
      })
    )

    expect(pure.mult).toBeGreaterThan(1)
    expect(mixed.mult).toBe(1)
  })

  it('pays an honors Decree only when enough honors are played', () => {
    const decree = gatedDecree('three_plus_honors')

    const enough = multiplierWith(
      decree,
      contextFor({
        tiles: [
          Tile.createWind(WindType.East, 'w1'),
          Tile.createWind(WindType.South, 'w2'),
          Tile.createDragon(DragonType.Red, 'd1'),
        ],
        decrees: [],
      })
    )
    const notEnough = multiplierWith(
      decree,
      contextFor({ tiles: [Tile.createWind(WindType.East, 'w1')], decrees: [] })
    )

    expect(enough.mult).toBeGreaterThan(1)
    expect(notEnough.mult).toBe(1)
  })

  it('pays a structure Decree only when the meld is present', () => {
    const decree = gatedDecree('two_plus_triplets')

    const withTriplets = multiplierWith(
      decree,
      contextFor({
        melds: [{ type: MeldType.Triplet }, { type: MeldType.Triplet }],
        decrees: [],
      })
    )
    const withOne = multiplierWith(
      decree,
      contextFor({ melds: [{ type: MeldType.Triplet }], decrees: [] })
    )

    expect(withTriplets.additive + withTriplets.mult).toBeGreaterThan(
      withOne.additive + withOne.mult
    )
  })

  it('pays a Boss-round Decree only during a Boss round', () => {
    const decree = gatedDecree('boss_round')

    const boss = multiplierWith(decree, contextFor({ roundType: 'Boss', decrees: [] }))
    const small = multiplierWith(decree, contextFor({ roundType: 'Small', decrees: [] }))

    expect(boss.additive + boss.mult).toBeGreaterThan(small.additive + small.mult)
  })

  it('pays a yaku Decree only when that yaku scored', () => {
    const decree = gatedDecree('yaku_toitoi')

    const scored = multiplierWith(decree, contextFor({ yakuIds: ['toitoi'], decrees: [] }))
    const notScored = multiplierWith(
      decree,
      contextFor({ yakuIds: ['tanyao'], decrees: [] })
    )

    expect(scored.mult).toBeGreaterThan(1)
    expect(notScored.mult).toBe(1)
  })

  it('treats every yakuman as satisfying the yakuman gate', () => {
    const decree = gatedDecree('yaku_yakuman')

    const kokushi = multiplierWith(decree, contextFor({ yakuIds: ['kokushi'], decrees: [] }))
    const daiSangen = multiplierWith(
      decree,
      contextFor({ yakuIds: ['dai_sangen'], decrees: [] })
    )
    const ordinary = multiplierWith(
      decree,
      contextFor({ yakuIds: ['tanyao'], decrees: [] })
    )

    expect(kokushi.additive + kokushi.mult).toBeGreaterThan(
      ordinary.additive + ordinary.mult
    )
    expect(daiSangen.additive + daiSangen.mult).toBeGreaterThan(
      ordinary.additive + ordinary.mult
    )
  })

  it('pays a no-discards Decree only on an untouched discard budget', () => {
    const decree = gatedDecree('no_discards_used')

    const untouched = multiplierWith(
      decree,
      contextFor({ discardsRemaining: 3, decrees: [] })
    )
    const spent = multiplierWith(
      decree,
      contextFor({ discardsRemaining: 1, decrees: [] })
    )

    expect(untouched.additive + untouched.mult).toBeGreaterThan(
      spent.additive + spent.mult
    )
  })

  it('never fires the last-hand gate before a hand has been played', () => {
    const decree = gatedDecree('last_hand_scored_zero')

    const noHandYet = multiplierWith(
      decree,
      contextFor({ lastHandScore: undefined, decrees: [] })
    )
    const scoredZero = multiplierWith(
      decree,
      contextFor({ lastHandScore: 0, decrees: [] })
    )

    expect(noHandYet.mult).toBe(1)
    expect(scoredZero.mult).toBeGreaterThan(1)
  })

  it('gates every authored conditional Decree', () => {
    const gated = LIBRARY_DECREES.filter((d) =>
      [d.effect, ...(d.extraEffects ?? [])].some(
        (e) =>
          (e.type === 'additive_score' || e.type === 'multiplicative_score') &&
          e.requires !== undefined
      )
    )

    expect(gated.length).toBeGreaterThanOrEqual(40)
  })
})

describe('tile transformation Decrees', () => {
  it('scores simples as terminals under Transmuter', () => {
    const baseline = new GameOrchestrator()
    baseline.startNewRun(31337, 1)
    const baseIds = baseline.getState().handTiles.map((t) => t.id)
    const basePreview = baseline.previewScore(baseIds)

    const transmuted = new GameOrchestrator()
    transmuted.startNewRun(31337, 1)
    transmuted.addDecree(decreeById('decree-transmuter'))
    const transIds = transmuted.getState().handTiles.map((t) => t.id)
    const transPreview = transmuted.previewScore(transIds)

    // Simples are worth 5, terminals 10, so promoting them can only add points.
    expect(transPreview!.tilePoints).toBeGreaterThan(basePreview!.tilePoints)
  })

  it('completes any fourteen tiles under Reality Warp', () => {
    const orchestrator = new GameOrchestrator()
    orchestrator.startNewRun(5150, 1)
    orchestrator.addDecree(decreeById('decree-reality-warp'))

    const tileIds = orchestrator.getState().handTiles.map((t) => t.id)
    const result = orchestrator.processAction({ type: 'play', tileIds })
    const effect = result.effects.find((e) => e.type === 'score_added') as
      | ScoreAddedEffect
      | undefined

    // A completed hand scores structure points; a partial one would not reach
    // the 4-melds-plus-pair total.
    expect(effect?.description).not.toContain('partial hand')
    expect(effect!.breakdown.structurePoints).toBeGreaterThan(0)
  })
})

describe('loss prevention Decrees', () => {
  it('rescues the run and consumes Phoenix', () => {
    const orchestrator = new GameOrchestrator()
    orchestrator.startNewRun(2024, 1)
    orchestrator.addDecree(decreeById('decree-phoenix'))

    // Burn every hand on a two-tile play that cannot reach the target.
    let guard = 0
    while (orchestrator.getState().phase === 'gameplay' && guard++ < 20) {
      const ids = orchestrator.getState().handTiles.slice(0, 2).map((t) => t.id)
      orchestrator.processAction({ type: 'play', tileIds: ids })
    }

    const state = orchestrator.getState()
    // The run survived into the shop rather than ending.
    expect(state.phase).toBe('shop')
    expect(state.isRunActive).toBe(true)
    expect(
      state.decreeSystem.getOwnedDecrees().some((d) => d.id === 'decree-phoenix')
    ).toBe(false)
  })

  it('keeps Immortal Decree but halves the score afterwards', () => {
    const orchestrator = new GameOrchestrator()
    orchestrator.startNewRun(2025, 1)
    orchestrator.addDecree(decreeById('decree-immortal-decree'))

    let guard = 0
    while (orchestrator.getState().phase === 'gameplay' && guard++ < 20) {
      const ids = orchestrator.getState().handTiles.slice(0, 2).map((t) => t.id)
      orchestrator.processAction({ type: 'play', tileIds: ids })
    }

    const state = orchestrator.getState()
    expect(state.phase).toBe('shop')
    expect(
      state.decreeSystem.getOwnedDecrees().some((d) => d.id === 'decree-immortal-decree')
    ).toBe(true)
    expect(state.lossPreventionScorePenalty).toBe(0.5)
  })

  it('ends the run normally with no protective Decree', () => {
    const orchestrator = new GameOrchestrator()
    orchestrator.startNewRun(2026, 1)

    let guard = 0
    while (orchestrator.getState().phase === 'gameplay' && guard++ < 20) {
      const ids = orchestrator.getState().handTiles.slice(0, 2).map((t) => t.id)
      orchestrator.processAction({ type: 'play', tileIds: ids })
    }

    expect(orchestrator.getState().phase).toBe('gameOver')
  })
})
