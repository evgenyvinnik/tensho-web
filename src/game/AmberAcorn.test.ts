import { afterEach, describe, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { Tile, TileSuit } from '../core/Tile'
import {
  AMBER_ACORN,
  CRIMSON_HEART,
  type MandateDefinition,
} from '../config/mandateDefinitions'
import { ALL_DECREES } from '../systems/DecreeSystem'
import {
  MandateEffectSystem,
  amberAcornHiddenCount,
} from '../systems/MandateEffectSystem'
import { decreeKey } from '../systems/decreeIdentity'
import { advanceRound, clearRound } from '../test/roundHelpers'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

const decree = (id: string) => {
  const found = ALL_DECREES.find((d) => d.id === id)
  if (!found) throw new Error(`Unknown Decree ${id}`)
  return found
}

/** A run with no Decrees, Flowers or Seasons, and nothing scored yet. */
function freshRun(seed = 7) {
  const game = new GameOrchestrator()
  game.startNewRun(seed)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  for (const owned of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decreeKey(owned))
  const add = (id: string) => state.decreeSystem.acquireDecree(decree(id))!
  return { game, state, add }
}

/** Advance to this Act's Boss round with the given Mandate in force. */
function enterBoss(game: GameOrchestrator, mandate: MandateDefinition) {
  advanceRound(game)
  return enterBossFromLarge(game, mandate)
}

function enterBossFromLarge(
  game: GameOrchestrator,
  mandate: MandateDefinition
) {
  const act = game.getState().roundManager.getCurrentAct()!
  act.rounds[2].bossMandate = {
    id: mandate.id,
    name: mandate.name,
    japaneseName: mandate.japaneseName,
    description: mandate.description,
    effect: mandate.effect,
    minAct: mandate.minAct,
  }
  advanceRound(game)
  expect(game.getState().currentRound).toBe(3)
  return game.getState() as OrchestratorState
}

const FIVE = [
  'decree-half-suited',
  'decree-yaku-amplifier',
  'decree-wide-grip',
  'decree-time-lord',
  'decree-second-chance',
]

describe('Amber Acorn', () => {
  it('hides half the Decrees, rounded up', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(amberAcornHiddenCount)).toEqual([
      0, 1, 1, 2, 2, 3, 3,
    ])
  })

  it('hides and disables a seeded random half of the Decrees', () => {
    const hiddenSets = [1, 2].map(() => {
      const { game, add } = freshRun(12345)
      FIVE.forEach(add)
      const state = enterBoss(game, AMBER_ACORN)
      const mandate = state.mandateEffectSystem
      const owned = state.decreeSystem.getOwnedDecrees()
      const hidden = mandate.getHiddenDecreeIds()

      expect(hidden).toHaveLength(3)
      expect(new Set(hidden).size).toBe(3)
      for (const id of hidden) expect(owned.map(decreeKey)).toContain(id)
      // Every hidden Decree is disabled; every face-up one still works.
      expect(new Set(mandate.getDisabledDecreeIds())).toEqual(new Set(hidden))
      for (const d of owned)
        expect(mandate.isDecreeDisabled(d)).toBe(hidden.includes(decreeKey(d)))
      return hidden
    })
    expect(hiddenSets[0]).toEqual(hiddenSets[1])
  })

  it('does not hide a Decree acquired after the round began', () => {
    const { game, add } = freshRun()
    add('decree-half-suited')
    const state = enterBoss(game, AMBER_ACORN)
    const late = add('decree-yaku-amplifier')
    expect(state.mandateEffectSystem.getHiddenDecreeIds()).toHaveLength(1)
    expect(state.mandateEffectSystem.isDecreeDisabled(late)).toBe(false)
  })

  it('stops a hidden Decree from scoring until the Mandate ends', () => {
    const { game, state, add } = freshRun()
    state.handTiles = [4, 5, 6].map(
      (n) => new Tile(TileSuit.Souzu, n, `play-${n}`)
    )
    const ids = state.handTiles.map((tile) => tile.id)
    const base = game.previewScore(ids)!
    // +20 Points each, no conditions.
    add('decree-half-suited')
    add('decree-half-suited')
    const both = game.previewScore(ids)!
    expect(both.finalScore).toBeGreaterThan(base.finalScore)

    state.mandateEffectSystem.activateMandate(
      AMBER_ACORN,
      state.handTiles,
      state.decreeSystem.getOwnedDecrees()
    )
    const [hidden] = state.mandateEffectSystem.getHiddenDecreeIds()
    // One copy is face-down and silent; the face-up copy still scores.
    const half = game.previewScore(ids)!
    expect(state.mandateEffectSystem.getHiddenDecreeIds()).toEqual([hidden])
    expect(half.finalScore).toBeGreaterThan(base.finalScore)
    expect(half.finalScore).toBeLessThan(both.finalScore)

    state.mandateEffectSystem.deactivateMandate()
    expect(game.previewScore(ids)!.finalScore).toBe(both.finalScore)
  })

  it('takes away a hidden Decree’s Turns and rack size for the round', () => {
    const turns = freshRun()
    turns.add('extended_hand_grant')
    const turnsState = enterBoss(turns.game, AMBER_ACORN)
    const hiddenTurns = turnsState.handsRemaining
    turnsState.mandateEffectSystem.releaseDecreeSuppression()
    ;(
      turns.game as unknown as { initializeRoundResources(): void }
    ).initializeRoundResources()
    expect(turnsState.handsRemaining - hiddenTurns).toBe(3)

    const rack = freshRun()
    rack.add('decree-wide-grip')
    const rackState = enterBoss(rack.game, AMBER_ACORN)
    const limit = () =>
      (
        rack.game as unknown as { getHandSizeLimit(): number }
      ).getHandSizeLimit()
    const hiddenLimit = limit()
    rackState.mandateEffectSystem.releaseDecreeSuppression()
    expect(limit() - hiddenLimit).toBe(1)
  })

  it('leaves Crimson Heart’s per-hand pick out of round resources', () => {
    const { game, add } = freshRun()
    add('extended_hand_grant')
    advanceRound(game)
    const largeRoundTurns = game.getState().handsRemaining
    const state = enterBossFromLarge(game, CRIMSON_HEART)
    expect(state.mandateEffectSystem.getDisabledDecreeIds()).toHaveLength(1)
    expect(state.mandateEffectSystem.getHiddenDecreeIds()).toEqual([])
    expect(state.handsRemaining).toBe(largeRoundTurns)
  })

  it('restores every hidden Decree once the round is won', () => {
    const { game, add } = freshRun()
    FIVE.forEach(add)
    const state = enterBoss(game, AMBER_ACORN)
    expect(state.mandateEffectSystem.getHiddenDecreeIds()).toHaveLength(3)

    clearRound(game)
    expect(state.phase).toBe('shop')
    expect(state.mandateEffectSystem.getHiddenDecreeIds()).toEqual([])
    expect(state.mandateEffectSystem.getDisabledDecreeIds()).toEqual([])
  })

  it('keeps the hidden half through save and restore', () => {
    const system = new MandateEffectSystem()
    system.setSeed(99)
    const { state, add } = freshRun()
    FIVE.forEach(add)
    system.activateMandate(
      AMBER_ACORN,
      [],
      state.decreeSystem.getOwnedDecrees()
    )
    const restored = MandateEffectSystem.fromJSON(
      JSON.parse(JSON.stringify(system.toJSON()))
    )
    expect(restored.getHiddenDecreeIds()).toEqual(system.getHiddenDecreeIds())
    expect(restored.getDisabledDecreeIds()).toEqual(
      system.getDisabledDecreeIds()
    )
  })
})
