/**
 * Tests for the Decree mechanics that back the authored library:
 * retriggering, Decree copying, yaku amplification, tile transformation,
 * gold multiplication, and loss prevention.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GameOrchestrator } from '../game/GameOrchestrator'
import { DecreeSystem, ALL_DECREES } from './DecreeSystem'
import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
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
