/**
 * A Stone has no rank or suit, so no Decree or Flower that reads a tile's face
 * can see it: it neither meets nor breaks a suit gate and never counts as a
 * terminal, 1-tile or Honor. It is still a tile played, so effects that count
 * or position tiles still include it.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { DragonType, FlowerType, Tile, TileSuit, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { Meld, MeldType } from '../core/Meld'
import { LIBRARY_DECREES } from '../config/decreeLibrary'
import { planPlumRecursion } from '../game/plumRecursion'
import {
  GameOrchestrator,
  type OrchestratorState,
} from '../game/GameOrchestrator'
import { eventBus } from '../game/EventBus'
import { runRandom } from '../game/RunRandom'
import { useOmenStore } from '../stores/omenStore'
import {
  ALL_DECREES,
  DecreeSystem,
  PURE_SUIT_ASCETICISM,
  TERMINAL_DEVOTION,
} from './DecreeSystem'
import { FlowerSystem } from './FlowerSystem'
import { countScoringHonors } from './flowerMutationScoring'
import type { Decree, GateCondition, ScalingSource } from './types'

const stone = (tile: Tile) => tile.withEnhancement(EnhancementType.Stone)
const manzu = (rank: number, id: string) => new Tile(TileSuit.Manzu, rank, id)
const pinzu = (rank: number, id: string) => new Tile(TileSuit.Pinzu, rank, id)

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

function contextFor(tiles: Tile[], melds: Meld[] = []) {
  return {
    hand: {
      melds,
      pair: null,
      waitType: 'tanki',
      winningTile: null,
      isConcealed: true,
    },
    tiles,
    melds,
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
      tilesRedrawn: 0,
      isCompleted: false,
      isWon: false,
    },
    yakuMultipliers: new Map(),
    detectedYakuIds: new Set<string>(),
    isConcealed: true,
    winningTile: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

function apply(decree: Decree, tiles: Tile[]) {
  const system = new DecreeSystem(10)
  system.acquireDecree(decree)
  const context = contextFor(tiles)
  context.decrees = system.getOwnedDecrees()
  const out = system.applyDecreeEffects(context, breakdown())
  return { additive: out.additiveBonus, mult: out.decreeMultiplier }
}

function libraryDecree(
  key: 'requires' | 'scaleBy',
  value: GateCondition | ScalingSource
): Decree {
  const found = LIBRARY_DECREES.find((d) =>
    [d.effect, ...(d.extraEffects ?? [])].some(
      (e) =>
        (e.type === 'additive_score' || e.type === 'multiplicative_score') &&
        e[key] === value
    )
  )
  if (!found) throw new Error(`no decree with ${key} ${value}`)
  return found
}

function catalogDecree(id: string): Decree {
  const found = ALL_DECREES.find((d) => d.id === id)
  if (!found) throw new Error(`missing catalog Decree ${id}`)
  return found
}

describe('Decree gates read only faces', () => {
  it('a Stone Manzu does not make a play all Manzu', () => {
    const decree = libraryDecree('requires', 'all_manzu')
    const stones = apply(decree, [stone(manzu(1, 'a')), stone(manzu(2, 'b'))])
    expect(stones.mult).toBe(1)
  })

  it('a Stone of another suit does not break all Manzu', () => {
    const decree = libraryDecree('requires', 'all_manzu')
    const rider = apply(decree, [
      manzu(2, 'a'),
      manzu(3, 'b'),
      stone(pinzu(7, 'c')),
    ])
    expect(rider.mult).toBeGreaterThan(1)
  })

  it('a Stone Simple does not break no Simples', () => {
    const decree = libraryDecree('requires', 'no_simples')
    expect(apply(decree, [manzu(1, 'a'), stone(manzu(5, 'b'))]).mult).toBe(
      apply(decree, [manzu(1, 'a')]).mult
    )
    expect(apply(decree, [manzu(1, 'a')]).mult).toBeGreaterThan(1)
  })

  it('a Stone Dragon is no Honor', () => {
    const honors = [
      Tile.createWind(WindType.East, 'w1'),
      Tile.createWind(WindType.South, 'w2'),
    ]
    const stoneDragon = stone(Tile.createDragon(DragonType.Red, 'd1'))
    expect(countScoringHonors(contextFor([...honors, stoneDragon]))).toBe(2)

    const decree = libraryDecree('requires', 'three_plus_honors')
    expect(apply(decree, [...honors, stoneDragon]).mult).toBe(1)
  })
})

describe('Decree face counts skip Stones', () => {
  it('a Stone terminal is not counted per Terminal tile', () => {
    const decree = libraryDecree('scaleBy', 'terminal_tiles')
    expect(apply(decree, [stone(manzu(1, 'a'))]).additive).toBe(0)
    expect(apply(decree, [manzu(1, 'a'), stone(manzu(9, 'b'))]).additive).toBe(
      apply(decree, [manzu(1, 'a')]).additive
    )
  })

  it('a Stone 1 is not counted per 1-tile', () => {
    const decree = libraryDecree('scaleBy', 'rank_one_tiles')
    expect(apply(decree, [stone(manzu(1, 'a'))]).additive).toBe(0)
    expect(apply(decree, [manzu(1, 'a')]).additive).toBeGreaterThan(0)
  })

  it('Terminal Devotion grows only for faced terminals', () => {
    const { mult } = apply(TERMINAL_DEVOTION, [
      manzu(1, 'a'),
      stone(manzu(9, 'b')),
    ])
    expect(mult).toBeCloseTo(1.05)
  })

  it('a Stone joins no dominant suit', () => {
    const { mult } = apply(PURE_SUIT_ASCETICISM, [
      manzu(2, 'a'),
      manzu(3, 'b'),
      stone(manzu(4, 'c')),
      stone(manzu(5, 'd')),
    ])
    expect(mult).toBeCloseTo(1.1 ** 2)
  })

  it('a Stone left in the rack holds no suit for Treasure Hunter', () => {
    const system = new DecreeSystem(10)
    system.acquireDecree(catalogDecree('decree-treasure-hunter'))
    const plain = system.calculateRoundEndGold(undefined, [
      manzu(1, 'a'),
      pinzu(1, 'b'),
    ])
    const withStone = system.calculateRoundEndGold(undefined, [
      manzu(1, 'a'),
      stone(pinzu(1, 'b')),
    ])
    expect(withStone).toBe(plain - 1)
  })
})

describe('tile counts still include Stones', () => {
  const tiles = [
    stone(Tile.createDragon(DragonType.Red, 'd1')),
    Tile.createDragon(DragonType.Green, 'd2'),
    manzu(5, 'm5'),
  ]

  it('a kind-of-tile retrigger skips a Stone, an every-tile one does not', () => {
    const dragons = new DecreeSystem(10)
    dragons.acquireDecree(catalogDecree('decree-dragon-echo'))
    const dragonExtra = dragons.calculateRetriggers(tiles)
    expect(dragonExtra.has('d1')).toBe(false)
    expect(dragonExtra.get('d2')).toBe(1)

    const every = new DecreeSystem(10)
    every.acquireDecree(catalogDecree('decree-triple-echo'))
    expect(every.calculateRetriggers(tiles).get('d1')).toBe(1)
  })

  it('a tile-count condition counts a Stone as a tile played', () => {
    const crowd: Decree = {
      id: 'test-crowd',
      name: 'Crowd',
      description: '+30 points if 3+ tiles are played',
      category: 'Scaling',
      rarity: 'RegionalMandate',
      cost: 1,
      effect: {
        type: 'conditional',
        trigger: 'OnScored',
        description: '+30 if 3+ tiles',
        condition: {
          type: 'tile_count',
          target: 'tiles',
          operator: 'gte',
          value: 3,
        },
        effect: {
          type: 'additive_score',
          trigger: 'OnScored',
          description: '+30',
          basePoints: 30,
        },
      },
    }
    expect(apply(crowd, tiles).additive).toBe(30)
    expect(apply(crowd, tiles.slice(1)).additive).toBe(0)
  })
})

describe('Flowers read only faces', () => {
  const bamboo = () => {
    const flowers = new FlowerSystem()
    flowers.addFlower(Tile.createFlower(FlowerType.Bamboo, 'f4'))
    return flowers
  }

  it('Bamboo pays per faced terminal only', () => {
    const flowers = bamboo()
    expect(
      flowers.calculateFlowerBonus(
        contextFor([manzu(1, 'a'), stone(manzu(9, 'b'))])
      )
    ).toBe(flowers.calculateFlowerBonus(contextFor([manzu(1, 'a')])))
  })

  it('Bamboo with Summer needs four faced terminals', () => {
    const terminals = [manzu(1, 'a'), manzu(9, 'b'), pinzu(1, 'c')]
    const flowers = bamboo()
    expect(
      flowers.getSeasonInteraction(
        'Summer',
        contextFor([...terminals, stone(pinzu(9, 'd'))])
      ).hasInteraction
    ).toBe(false)
    expect(
      flowers.getSeasonInteraction(
        'Summer',
        contextFor([...terminals, pinzu(9, 'd')])
      ).hasInteraction
    ).toBe(true)
  })

  it('Plum never recovers a Stone from the river', () => {
    const played = [manzu(1, 'a'), manzu(2, 'b'), manzu(3, 'c')]
    const group = new Meld(MeldType.Sequence, played)
    expect(
      planPlumRecursion([group], played, [stone(manzu(2, 'river'))])
    ).toEqual([])
    expect(planPlumRecursion([group], played, [manzu(2, 'river')])).toEqual([
      'river',
    ])
  })
})

describe('the scoring pipeline shows Decrees no Stone face', () => {
  afterEach(() => {
    eventBus.clear()
    runRandom.reset()
    useOmenStore.getState().clearForNewRun()
  })

  function score(tiles: Tile[], decree?: Decree): number {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    state.decreeSystem = new DecreeSystem()
    if (decree) state.decreeSystem.acquireDecree(decree)
    state.flowerSystem.clear()
    state.seasonSystem.clear()
    state.mandateEffectSystem.deactivateMandate()
    Object.assign(state, {
      handTiles: tiles,
      targetScore: 1e9,
      selectedTileIds: new Set(),
      faceDownTileIds: new Set(),
    })
    state.roundManager.getCurrentRound()!.scoreTarget = 1e9
    return game.previewScore(tiles.map((tile) => tile.id))!.finalScore
  }

  it('a Stone Manzu play is not all Manzu; a Stone Pinzu rider does not break it', () => {
    const allManzu = libraryDecree('requires', 'all_manzu')

    const stones = [stone(manzu(1, 'a')), stone(manzu(2, 'b'))]
    expect(score(stones, allManzu)).toBe(score(stones))

    const pair = [manzu(2, 'a'), manzu(2, 'b'), stone(pinzu(7, 'c'))]
    expect(score(pair, allManzu)).toBeGreaterThan(score(pair))
  })
})
