/**
 * Integration tests for partial-play scoring.
 *
 * Almost every Tensho play is a partial selection rather than a complete
 * winning hand. These tests pin the two properties that makes the roguelike
 * layer work at all: partial plays run the full scoring pipeline, and the
 * pre-play preview matches what the play actually pays.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { ALL_DECREES, RULE_DECREES } from '../systems/DecreeSystem'
import { LIBRARY_DECREES, UNSUPPORTED_DECREE_IDS } from '../config/decreeLibrary'
import { ALL_DECREES as AUTHORED_DECREES } from '../config/decreeDefinitions'
import type { Decree } from '../systems/types'
import type { ScoreAddedEffect } from './ActionProcessor'

function scoreOf(effects: { type: string }[]): number {
  const effect = effects.find((e) => e.type === 'score_added') as
    | ScoreAddedEffect
    | undefined
  return effect?.score ?? 0
}

function findDecree(id: string): Decree {
  const decree = ALL_DECREES.find((d) => d.id === id)
  if (!decree) throw new Error(`decree ${id} not in pool`)
  return decree
}

describe('partial play scoring', () => {
  let orchestrator: GameOrchestrator

  beforeEach(() => {
    orchestrator = new GameOrchestrator()
    orchestrator.startNewRun(12345, 1)
  })

  it('awards structure points for groups inside a partial selection', () => {
    const state = orchestrator.getState()

    // Find any two tiles of the same kind: that pair is worth structure points.
    const byKind = new Map<string, string[]>()
    for (const tile of state.handTiles) {
      const key = `${tile.suit}-${tile.rank}`
      byKind.set(key, [...(byKind.get(key) ?? []), tile.id])
    }
    const pair = [...byKind.values()].find((ids) => ids.length >= 2)
    if (!pair) return // seed produced no pair; nothing to assert

    const result = orchestrator.processAction({ type: 'play', tileIds: pair.slice(0, 2) })

    expect(result.success).toBe(true)
    const breakdown = (
      result.effects.find((e) => e.type === 'score_added') as ScoreAddedEffect
    ).breakdown
    expect(breakdown.structurePoints).toBe(10)
  })

  it('applies Decree multipliers to a partial play', () => {
    const baseline = new GameOrchestrator()
    baseline.startNewRun(12345, 1)
    const tileIds = baseline.getState().handTiles.slice(0, 4).map((t) => t.id)
    const baseScore = scoreOf(
      baseline.processAction({ type: 'play', tileIds }).effects
    )

    // An unconditional "x Mult" Decree must move the score on any hand. Gated
    // and per-unit Decrees are excluded here: they are meant to pay nothing
    // when their requirement is unmet, and are covered by their own tests.
    const multDecree = LIBRARY_DECREES.find(
      (d) =>
        d.effect.type === 'multiplicative_score' &&
        d.effect.multiplier >= 2 &&
        !d.effect.requires &&
        !d.effect.scaleBy &&
        !d.effect.perTileCondition
    )
    expect(multDecree).toBeDefined()

    const boosted = new GameOrchestrator()
    boosted.startNewRun(12345, 1)
    expect(boosted.addDecree(multDecree!)).toBe(true)
    const boostedTileIds = boosted.getState().handTiles.slice(0, 4).map((t) => t.id)
    const boostedScore = scoreOf(
      boosted.processAction({ type: 'play', tileIds: boostedTileIds }).effects
    )

    expect(baseScore).toBeGreaterThan(0)
    expect(boostedScore).toBeGreaterThan(baseScore)
  })

  it('awards no yaku for an incomplete selection', () => {
    const tileIds = orchestrator.getState().handTiles.slice(0, 3).map((t) => t.id)
    const result = orchestrator.processAction({ type: 'play', tileIds })

    const breakdown = (
      result.effects.find((e) => e.type === 'score_added') as ScoreAddedEffect
    ).breakdown
    expect(breakdown.detectedYaku).toHaveLength(0)
  })

  it('previews the score a partial play will actually pay', () => {
    const tileIds = orchestrator.getState().handTiles.slice(0, 5).map((t) => t.id)

    const preview = orchestrator.previewScore(tileIds)
    expect(preview).not.toBeNull()

    const before = orchestrator.getState().score
    orchestrator.processAction({ type: 'play', tileIds })
    const gained = orchestrator.getState().score - before

    expect(gained).toBe(preview!.finalScore)
  })

  it('leaves the run untouched when previewing', () => {
    const before = orchestrator.getState()
    const snapshot = {
      score: before.score,
      gold: before.gold,
      hands: before.handsRemaining,
      handSize: before.handTiles.length,
    }

    const tileIds = before.handTiles.map((t) => t.id)
    orchestrator.previewScore(tileIds)
    orchestrator.previewScore(tileIds)

    const after = orchestrator.getState()
    expect(after.score).toBe(snapshot.score)
    expect(after.gold).toBe(snapshot.gold)
    expect(after.handsRemaining).toBe(snapshot.hands)
    expect(after.handTiles).toHaveLength(snapshot.handSize)
  })

  it('returns no preview for a selection too small to play', () => {
    const tileIds = orchestrator.getState().handTiles.slice(0, 1).map((t) => t.id)
    expect(orchestrator.previewScore(tileIds)).toBeNull()
  })

  it('rejects an oversized incomplete play without consuming the hand', () => {
    const before = orchestrator.getState()
    const tileIds = before.handTiles.slice(0, 6).map((tile) => tile.id)
    const handsBefore = before.handsRemaining
    const scoreBefore = before.score

    expect(orchestrator.previewScore(tileIds)).toBeNull()
    const result = orchestrator.processAction({ type: 'play', tileIds })

    expect(result.success).toBe(false)
    expect(result.errors?.[0]).toContain('limited to 5 tiles')
    expect(orchestrator.getState().handsRemaining).toBe(handsBefore)
    expect(orchestrator.getState().score).toBe(scoreBefore)
  })
})

describe('authored Decree library', () => {
  it('publishes the authored Decrees into the live pool', () => {
    // The pool used to be the 14 hand-written rule Decrees only, leaving the
    // authored library unreachable and the run without a scaling engine.
    expect(ALL_DECREES.length).toBeGreaterThan(RULE_DECREES.length)
    expect(LIBRARY_DECREES.length).toBeGreaterThan(100)
  })

  it('gives every pool Decree a unique id', () => {
    const ids = ALL_DECREES.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('carries multi-part Decrees as extra effects', () => {
    const multiPart = LIBRARY_DECREES.filter((d) => (d.extraEffects?.length ?? 0) > 0)
    expect(multiPart.length).toBeGreaterThan(0)
  })

  it('reports hand-size Decrees to the orchestrator', () => {
    const match = LIBRARY_DECREES.flatMap((decree) => {
      const effect = decree.effect
      if (effect.type !== 'rule_modification' || effect.ruleId !== 'hand_size') return []
      const delta = effect.modification.delta
      return typeof delta === 'number' && delta > 0 ? [{ decree, delta }] : []
    })[0]
    expect(match).toBeDefined()

    const orchestrator = new GameOrchestrator()
    orchestrator.startNewRun(777, 1)
    expect(orchestrator.getState().decreeSystem.getHandSizeBonus()).toBe(0)

    orchestrator.addDecree(match.decree)

    expect(orchestrator.getState().decreeSystem.getHandSizeBonus()).toBe(match.delta)
  })

  it('publishes every authored Decree, withholding none', () => {
    expect(UNSUPPORTED_DECREE_IDS).toEqual([])
    expect(LIBRARY_DECREES).toHaveLength(AUTHORED_DECREES.length)
  })

  it('still exposes the hand-written rule Decrees', () => {
    expect(findDecree('shanten_clemency')).toBeDefined()
    expect(findDecree('honor_transmutation')).toBeDefined()
  })
})
