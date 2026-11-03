/**
 * Decrees that reward rounds lasting several Turns: each pays nothing, or
 * little, on a round's first play and grows with the plays that follow.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { parsePlay, toPartialParsedHand } from '../rules/PartialHandParser'
import { ALL_DECREES, DecreeSystem } from './DecreeSystem'
import type { ScoringContext } from './types'
import {
  GameOrchestrator,
  type OrchestratorState,
} from '../game/GameOrchestrator'
import { eventBus } from '../game/EventBus'
import { runRandom } from '../game/RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

const SUIT = { m: TileSuit.Manzu, p: TileSuit.Pinzu, s: TileSuit.Souzu }
let counter = 0
const tile = (spec: string) =>
  new Tile(
    SUIT[spec[1] as keyof typeof SUIT],
    Number(spec[0]),
    `${spec}-${counter++}`
  )

/** A Pair of 5s, read as the scorer reads it, in a round with this history. */
function context(round: {
  handsPlayed?: number
  patterns?: string[]
  groups?: number
  turnsRemaining?: number
  tilesRedrawn?: number
}): ScoringContext {
  const tiles = ['5m', '5m'].map(tile)
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
      handsPlayed: round.handsPlayed ?? 0,
      maxHands: 6,
      discardsRemaining: 0,
      maxDiscards: 0,
      tilesRedrawn: round.tilesRedrawn ?? 0,
      isCompleted: false,
      isWon: false,
    },
    yakuMultipliers: new Map(),
    isConcealed: true,
    winningTile: tiles[1],
    playPatternId: 'pair',
    patternsPlayedThisRound: new Set(round.patterns ?? []),
    groupsPlayedThisRound: round.groups ?? 0,
    turnsRemaining: round.turnsRemaining ?? 6,
  } as ScoringContext
}

function pays(id: string, ctx: ScoringContext) {
  const decree = ALL_DECREES.find((d) => d.id === id)
  if (!decree) throw new Error(`missing ${id}`)
  const system = new DecreeSystem(10)
  system.acquireDecree(decree)
  ctx.decrees = system.getOwnedDecrees()
  const out = system.applyDecreeEffects(ctx, {
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

describe('multi-Turn Decrees', () => {
  it('Mirror Lake doubles a pattern repeated this round, never a loose play', () => {
    expect(pays('decree-mirror-lake', context({})).mult).toBe(1)
    expect(
      pays(
        'decree-mirror-lake',
        context({ handsPlayed: 1, patterns: ['pair'] })
      ).mult
    ).toBe(2)
    expect(
      pays(
        'decree-mirror-lake',
        context({ handsPlayed: 1, patterns: ['sequence'] })
      ).mult
    ).toBe(1)
    const loose = context({ handsPlayed: 1, patterns: ['loose'] })
    loose.playPatternId = 'loose'
    expect(pays('decree-mirror-lake', loose).mult).toBe(1)
  })

  it('Wheel of Nine turns on the third and sixth plays', () => {
    const wheel = (handsPlayed: number) =>
      pays('decree-wheel-of-nine', context({ handsPlayed })).mult
    expect([0, 1, 2, 3, 4, 5].map(wheel)).toEqual([1, 1, 3, 1, 1, 3])
  })

  it('Sleeved Tile adds +2 Mult per tile redrawn this round', () => {
    expect(pays('decree-sleeved-tile', context({})).additive).toBe(0)
    const sleeved = pays('decree-sleeved-tile', context({ tilesRedrawn: 4 }))
    expect(sleeved.additive + sleeved.mult).toBeGreaterThan(1)
  })

  it('Three Roads compounds per different earlier pattern, not loose plays', () => {
    expect(pays('decree-three-roads', context({})).mult).toBe(1)
    expect(
      pays(
        'decree-three-roads',
        context({ handsPlayed: 3, patterns: ['pair', 'sequence', 'loose'] })
      ).mult
    ).toBeCloseTo(1.5 ** 2)
  })

  it('Open Palm halves only the first play of a round', () => {
    expect(pays('decree-open-palm', context({})).mult).toBe(0.5)
    expect(pays('decree-open-palm', context({ handsPlayed: 1 })).mult).toBe(1)
  })

  it('Shared Corner adds per group played earlier this round', () => {
    expect(pays('decree-shared-corner', context({})).additive).toBe(0)
    const later = pays('decree-shared-corner', context({ groups: 3 }))
    const once = pays('decree-shared-corner', context({ groups: 1 }))
    expect(later.additive + later.mult).toBeGreaterThan(
      once.additive + once.mult
    )
  })

  it('The Last Word pays ×4 only on the last Turn', () => {
    expect(pays('decree-last-word', context({ turnsRemaining: 2 })).mult).toBe(
      1
    )
    expect(pays('decree-last-word', context({ turnsRemaining: 1 })).mult).toBe(
      4
    )
  })
})

describe('the round history they read', () => {
  function fixture() {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    for (const decree of state.decreeSystem.getOwnedDecrees())
      state.decreeSystem.removeDecree(decree.id)
    state.flowerSystem.clear()
    state.seasonSystem.clear()
    state.mandateEffectSystem.deactivateMandate()
    state.targetScore = 1e9
    state.roundManager.getCurrentRound()!.scoreTarget = 1e9
    state.handTiles = ['5m', '5m', '2p', '3p', '4p', '9s', '9s', '1m'].map(
      (spec, i) =>
        new Tile(SUIT[spec[1] as keyof typeof SUIT], Number(spec[0]), `t${i}`)
    )
    state.wall = Array.from(
      { length: 40 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
    )
    state.drawIndex = 0
    return { game, state }
  }

  it('counts groups played this round, saves them, and restarts each round', () => {
    const { game, state } = fixture()
    const add = (id: string) =>
      state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === id)!)
    add('decree-shared-corner')
    const first = game.previewScore(['t0', 't1'])!.equation.multiplier
    expect(
      game.processAction({ type: 'play', tileIds: ['t0', 't1'] }).success
    ).toBe(true)
    expect(state.groupsPlayedThisRound).toBe(1)
    // A Sequence and a Pair: two more groups.
    expect(
      game.processAction({
        type: 'play',
        tileIds: ['t2', 't3', 't4', 't5', 't6'],
      }).success
    ).toBe(true)
    expect(state.groupsPlayedThisRound).toBe(3)
    const saved = JSON.parse(JSON.stringify(game.captureRun()))
    expect(saved.state.groupsPlayedThisRound).toBe(3)
    expect(first).toBeGreaterThan(0)
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    const pair = state.handTiles.slice(0, 2).map((t) => t.id)
    game.processAction({ type: 'play', tileIds: pair })
    expect(state.phase).toBe('shop')
    game.exitShop()
    expect(state.groupsPlayedThisRound).toBe(0)
  })

  it('The Last Word reads the Turns left before the play spends one', () => {
    const { game, state } = fixture()
    state.decreeSystem.acquireDecree(
      ALL_DECREES.find((d) => d.id === 'decree-last-word')!
    )
    const ratio = () => {
      const s = game.previewScore(['t0', 't1'])!
      return (
        s.equation.multiplier /
        (s.yakuMultiplier + s.pattern.mult + s.dragonMult)
      )
    }
    state.handsRemaining = 2
    expect(ratio()).toBe(1)
    state.handsRemaining = 1
    expect(ratio()).toBe(4)
  })

  it('Open Palm grants two free redraws a round', () => {
    const plain = fixture()
    const palm = fixture()
    palm.state.decreeSystem.acquireDecree(
      ALL_DECREES.find((d) => d.id === 'decree-open-palm')!
    )
    for (const f of [plain, palm]) {
      f.state.targetScore = 1
      f.state.roundManager.getCurrentRound()!.scoreTarget = 1
      f.game.processAction({ type: 'play', tileIds: ['t0', 't1'] })
      f.game.exitShop()
    }
    expect(palm.state.redrawsRemaining - plain.state.redrawsRemaining).toBe(2)
  })
})
