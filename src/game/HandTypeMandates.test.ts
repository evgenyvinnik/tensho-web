/**
 * The Bosses that read a play's hand type: The Flint halves it, The Eye lets
 * each type score once, The Arm lowers its Orb family a level, and The Ox
 * names the run's most-played type.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import {
  THE_ARM,
  THE_EYE,
  THE_FLINT,
  THE_OX,
  type MandateDefinition,
} from '../config/mandateDefinitions'
import { CelestialOrbSystem } from '../systems/CelestialOrbSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { mandateConsequence } from '../gameplay/mandateConsequence'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { advanceToRound } from '../test/roundHelpers'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

// Two pairs of Circles 9s (Pairs only), a pair of 5s (Pairs and All
// Simples) and a 3-4-5 Sequence of Bamboo.
const RACK: [TileSuit, number, string][] = [
  [TileSuit.Pinzu, 9, 'nine-0'],
  [TileSuit.Pinzu, 9, 'nine-1'],
  [TileSuit.Manzu, 9, 'nine-2'],
  [TileSuit.Manzu, 9, 'nine-3'],
  [TileSuit.Pinzu, 5, 'five-0'],
  [TileSuit.Pinzu, 5, 'five-1'],
  [TileSuit.Souzu, 3, 'seq-0'],
  [TileSuit.Souzu, 4, 'seq-1'],
  [TileSuit.Souzu, 5, 'seq-2'],
]

function quiet(state: OrchestratorState): void {
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.faceDownTileIds.clear()
  state.targetScore = state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.handTiles = RACK.map(([suit, rank, id]) => new Tile(suit, rank, id))
}

/** A run in its first Boss round, under `mandate`, holding `RACK`. */
function boss(
  mandate: MandateDefinition,
  beforeBoss: (game: GameOrchestrator) => void = () => {}
) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  const { id, name, japaneseName, description, effect, minAct } = mandate
  state.roundManager.getCurrentAct()!.rounds[2].bossMandate = {
    id,
    name,
    japaneseName,
    description,
    effect,
    minAct,
  }
  beforeBoss(game)
  advanceToRound(game, 'Boss')
  quiet(state)
  const play = (tileIds: string[]) => {
    const result = game.processAction({ type: 'play', tileIds })
    expect(result.success).toBe(true)
    return result
  }
  return { game, state, play }
}

const scoreOf = (game: GameOrchestrator, ids: string[]) =>
  game.previewScore(ids)!.finalScore

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

describe('The Flint', () => {
  it('halves a play once: points stay whole, the final score is halved', () => {
    const ids = ['five-0', 'five-1', 'seq-0', 'seq-1', 'seq-2']
    const { game, state, play } = boss(THE_FLINT)
    const flint = game.previewScore(ids)!
    play(ids)
    expect(state.score).toBe(flint.finalScore)

    const { game: plainGame, state: plainState } = boss(THE_FLINT)
    plainState.roundManager.getCurrentRound()!.bossMandate = undefined
    plainState.mandateEffectSystem.deactivateMandate()
    const plain = plainGame.previewScore(ids)!
    expect(flint.equation.points).toBe(plain.equation.points)
    expect(flint.finalScore).toBe(Math.floor(plain.finalScore / 2))
  })
})

describe('The Eye', () => {
  it('lets each hand type score once; previews never spend it', () => {
    const { game, state, play } = boss(THE_EYE)
    const first = scoreOf(game, ['nine-0', 'nine-1'])
    expect(first).toBeGreaterThan(0)
    // Previewing is free, however often.
    expect(scoreOf(game, ['nine-2', 'nine-3'])).toBe(first)
    expect(game.previewScore(['nine-0', 'nine-1'])!.blockedByMandate).toBe(
      undefined
    )

    play(['nine-0', 'nine-1'])
    expect(state.score).toBe(first)

    const repeat = game.previewScore(['nine-2', 'nine-3'])!
    expect(repeat.blockedByMandate).toBe(true)
    expect(repeat.finalScore).toBe(0)
    play(['nine-2', 'nine-3'])
    expect(state.score).toBe(first)

    // A different hand type still scores, and only once.
    const sequence = scoreOf(game, ['seq-0', 'seq-1', 'seq-2'])
    expect(sequence).toBeGreaterThan(0)
    play(['seq-0', 'seq-1', 'seq-2'])
    expect(state.score).toBe(first + sequence)
  })

  it('remembers played hand types across a save, and forgets them next round', () => {
    const { game, play } = boss(THE_EYE)
    play(['nine-0', 'nine-1'])
    const saved = parseClassicRunSnapshot(json(game.captureRun()))
    expect(saved.state.mandateEffectSystem.playedPatternIds).toEqual(['pair'])
    game.restoreRun(saved)
    expect(game.previewScore(['nine-2', 'nine-3'])!.blockedByMandate).toBe(true)

    const system = new MandateEffectSystem()
    system.activateMandate(THE_EYE, [], [])
    expect(system.allowsPlayPattern('pair')).toBe(true)
    expect(system.allowsPlayPattern('pair')).toBe(false)
    system.deactivateMandate()
    system.activateMandate(THE_EYE, [], [])
    expect(system.allowsPlayPattern('pair')).toBe(true)
  })
})

describe('The Arm', () => {
  const withLevels = (
    state: OrchestratorState,
    levels: [Parameters<CelestialOrbSystem['getYakuLevel']>[0], number][]
  ) => {
    state.celestialOrbSystem = CelestialOrbSystem.fromState({
      ...state.celestialOrbSystem.toState(),
      orbLevels: levels,
    })
  }

  it('scores a play one family level lower and spends that level', () => {
    const { game, state, play } = boss(THE_ARM)
    const ids = ['nine-0', 'nine-1']
    withLevels(state, [['Pairs', 2]])
    state.mandateEffectSystem.deactivateMandate()
    const atLevelTwo = scoreOf(game, ids)

    withLevels(state, [['Pairs', 3]])
    state.mandateEffectSystem.activateMandate(THE_ARM, state.handTiles, [])
    const forecast = scoreOf(game, ids)
    expect(forecast).toBe(atLevelTwo)
    expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(3)

    play(ids)
    expect(state.score).toBe(forecast)
    expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(2)
    play(['nine-2', 'nine-3'])
    expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(1)
  })

  it('lowers every family the play levels, never below level 1', () => {
    const { state, play } = boss(THE_ARM)
    withLevels(state, [
      ['Pairs', 1],
      ['Tanyao', 4],
      ['Pinfu', 5],
    ])
    // A pair of 5s levels Pairs and All Simples, not Sequences.
    play(['five-0', 'five-1'])
    expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(1)
    expect(state.celestialOrbSystem.getYakuLevel('Tanyao')).toBe(3)
    expect(state.celestialOrbSystem.getYakuLevel('Pinfu')).toBe(5)
  })
})

describe('The Ox', () => {
  it('names the run’s most-played hand type and takes all gold for it', () => {
    const { game, state, play } = boss(THE_OX, (early) => {
      const earlyState = early.getState() as OrchestratorState
      quiet(earlyState)
      for (const ids of [
        ['nine-0', 'nine-1'],
        ['nine-2', 'nine-3'],
        ['seq-0', 'seq-1', 'seq-2'],
      ])
        expect(
          early.processAction({ type: 'play', tileIds: ids }).success
        ).toBe(true)
      expect(Object.fromEntries(earlyState.patternPlayCounts)).toEqual({
        pair: 2,
        sequence: 1,
      })
    })
    expect(state.mandateEffectSystem.getLockedPattern()).toBe('pair')
    expect(mandateConsequence(THE_OX.effect, 'pair')).toEqual({
      key: 'most_played_pattern_named',
      values: { patternKey: 'patterns.pair.name' },
    })

    state.gold = 20
    play(['seq-0', 'seq-1', 'seq-2'])
    state.handTiles.push(
      ...[6, 7, 8].map((rank) => new Tile(TileSuit.Souzu, rank, `run-${rank}`))
    )
    play(['run-6', 'run-7', 'run-8'])
    expect(state.gold).toBe(20)
    // Sequences now outnumber pairs, but the round's named type stays.
    expect(state.patternPlayCounts.get('sequence')).toBe(3)
    expect(state.mandateEffectSystem.getLockedPattern()).toBe('pair')
    play(['nine-0', 'nine-1'])
    expect(state.gold).toBe(0)
    expect(state.patternPlayCounts.get('pair')).toBe(3)

    const saved = parseClassicRunSnapshot(json(game.captureRun()))
    game.restoreRun(saved)
    expect(game.getState().patternPlayCounts.get('sequence')).toBe(3)
    expect(game.getState().mandateEffectSystem.getLockedPattern()).toBe('pair')
  })

  it('breaks a tie by catalog order and names nothing before any play', () => {
    const system = new MandateEffectSystem()
    system.activateMandate(
      THE_OX,
      [],
      [],
      new Map([
        ['sequence', 2],
        ['pair', 2],
      ])
    )
    expect(system.getLockedPattern()).toBe('pair')
    expect(system.zeroesGoldFor('pair')).toBe(true)
    expect(system.zeroesGoldFor('sequence')).toBe(false)

    system.activateMandate(THE_OX, [], [])
    expect(system.getLockedPattern()).toBeNull()
    expect(system.zeroesGoldFor('pair')).toBe(false)
    expect(mandateConsequence(THE_OX.effect, null).key).toBe(
      'most_played_pattern_zeroes_gold'
    )
  })
})

it('reads a run saved under the Yaku-based Eye and Ox', () => {
  const { game } = boss(THE_EYE)
  const old = json(game.captureRun()) as unknown as {
    state: Record<string, unknown> & {
      mandateEffectSystem: Record<string, unknown>
    }
  }
  delete old.state.mandateEffectSystem.playedPatternIds
  old.state.mandateEffectSystem.scoredYakuIds = ['tanyao']
  delete old.state.patternPlayCounts
  old.state.yakuPlayCounts = [['tanyao', 3]]

  const upgraded = parseClassicRunSnapshot(old)
  expect(upgraded.state.mandateEffectSystem.playedPatternIds).toEqual([])
  expect(upgraded.state.patternPlayCounts).toEqual([])
  expect(upgraded.state).not.toHaveProperty('yakuPlayCounts')
})
