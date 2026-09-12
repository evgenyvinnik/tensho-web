import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  chooseClassicResourceAction,
  type ResourcePolicyContext,
} from '../../scripts/lib/classic-resource-policy'
import { Tile, TileSuit } from '../core/Tile'
import { type CoachAdvice, buildCoachAdvice } from './beginnerCoach'
import { GameOrchestrator } from '../game/GameOrchestrator'
import { eventBus } from '../game/EventBus'
import { runRandom } from '../game/RunRandom'

const tiles = (ranks: number[], suit = TileSuit.Souzu) =>
  ranks.map((rank, i) => new Tile(suit, rank, `${suit}-${i}`))

function context(
  overrides: Partial<ResourcePolicyContext> = {}
): ResourcePolicyContext {
  const visibleTiles = tiles([1, 2, 3, 6, 8, 9])
  const advice: CoachAdvice = {
    best: {
      tileIds: visibleTiles.slice(0, 3).map((t) => t.id),
      score: 50,
      pattern: null,
      structurePoints: 30,
    },
    shape: null,
    requiredPerHand: 100,
    keepsPace: false,
    structureGivenUp: 0,
  }
  return {
    visibleTiles,
    handTileCount: visibleTiles.length,
    lockedTileIds: [],
    requiredPlaySize: null,
    advice,
    remainingToTarget: 300,
    chaseCompleteHands: false,
    canPerform: () => true,
    ...overrides,
  }
}

function oneAwayContext() {
  // Four runs and one singleton waiting for its mate, plus an unrelated Dragon.
  const visibleTiles = [
    ...tiles([1, 2, 3, 4, 5, 6]),
    ...tiles([1, 2, 3], TileSuit.Manzu),
    ...tiles([7, 8, 9], TileSuit.Pinzu),
    new Tile(TileSuit.Wind, 1, 'wind'),
    new Tile(TileSuit.Dragon, 2, 'spare'),
  ]
  return context({ visibleTiles, handTileCount: 14, chaseCompleteHands: true })
}

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  eventBus.disableHistory()
})

describe('read-only Classic resource policy', () => {
  it('takes a known clear instead of chasing more points', () => {
    const c = oneAwayContext()
    c.remainingToTarget = 40
    const check = vi.fn(c.canPerform)
    expect(chooseClassicResourceAction({ ...c, canPerform: check })).toBeNull()
    expect(check).not.toHaveBeenCalled()
  })

  it('preserves the current scoring tiles and exchanges at most three spares when behind pace', () => {
    const c = context()
    const result = chooseClassicResourceAction(c)!
    expect(result.reason).toBe('behind-pace')
    expect(result.action.type).toBe('redraw')
    if (result.action.type !== 'redraw') throw new Error('Expected a redraw')
    expect(result.action.tileIds).toHaveLength(3)
    expect(
      result.action.tileIds.every((id) => !c.advice!.best.tileIds.includes(id))
    ).toBe(true)
    expect(new Set(result.action.tileIds).size).toBe(3)
  })

  it('falls back through smaller legal redraw sizes before discarding', () => {
    const result = chooseClassicResourceAction(
      context({
        canPerform: (action) =>
          action.type === 'redraw' && action.tileIds.length <= 2,
      })
    )!
    expect(result.action).toMatchObject({
      type: 'redraw',
      tileIds: expect.any(Array),
    })
    if (result.action.type === 'redraw')
      expect(result.action.tileIds).toHaveLength(2)
  })

  it('uses a real discard when redraws are unavailable', () => {
    expect(
      chooseClassicResourceAction(
        context({ canPerform: (action) => action.type === 'discard' })
      )?.action.type
    ).toBe('discard')
  })

  it('does not spend resources when the immediate play keeps pace', () => {
    const c = context()
    c.advice!.keepsPace = true
    expect(chooseClassicResourceAction(c)).toBeNull()
  })

  it('preserves forced tiles and stops when every resource action is illegal', () => {
    const c = context()
    const ids = c.visibleTiles.map((t) => t.id)
    const check = vi.fn(() => false)
    expect(
      chooseClassicResourceAction({
        ...c,
        lockedTileIds: ids,
        canPerform: check,
      })
    ).toBeNull()
    expect(check).not.toHaveBeenCalled()
    expect(chooseClassicResourceAction({ ...c, canPerform: check })).toBeNull()
  })

  it('does not inspect or optimize a rack without visible score advice', () => {
    const c = context({ advice: null })
    const check = vi.fn(() => true)
    expect(chooseClassicResourceAction({ ...c, canPerform: check })).toBeNull()
    expect(check).not.toHaveBeenCalled()
  })

  it('can spend one exchange to preserve an exact one-away standard hand', () => {
    const result = chooseClassicResourceAction(oneAwayContext())!
    expect(result.reason).toBe('one-away')
    // Either singleton can become the pair; no future draw is inspected.
    expect(result.action.type).toBe('discard')
    expect(result.completion).toBeDefined()
  })

  it('does not chase a full hand through hidden information or a five-tile mandate', () => {
    const c = oneAwayContext()
    c.advice!.keepsPace = true
    expect(
      chooseClassicResourceAction({
        ...c,
        visibleTiles: c.visibleTiles.slice(0, 13),
      })
    ).toBeNull()
    expect(
      chooseClassicResourceAction({ ...c, requiredPlaySize: 5 })
    ).toBeNull()
  })

  it('does not use random streams, mutate state, or emit events while deciding', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState()
    const before = JSON.stringify(state)
    const random = vi.spyOn(runRandom, 'next')
    eventBus.enableHistory()
    const c = context({
      visibleTiles: state.handTiles.filter(
        (t) => !state.faceDownTileIds.has(t.id)
      ),
      handTileCount: state.handTiles.length,
      lockedTileIds: state.mandateEffectSystem.getLockedTileIds(),
      canPerform: (action) => game.canPerformAction(action),
    })
    expect(chooseClassicResourceAction(c)).toEqual(
      chooseClassicResourceAction(c)
    )
    expect(JSON.stringify(state)).toBe(before)
    expect(eventBus.getHistory()).toEqual([])
    expect(random).not.toHaveBeenCalled()
  })

  it('terminates finite resource decisions and leaves a real legal play', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    let exchanges = 0
    let discards = 0
    for (let turn = 0; turn < 20; turn++) {
      const state = game.getState()
      const advice = buildCoachAdvice({
        tiles: state.handTiles,
        concealedIds: state.faceDownTileIds,
        requiredTileIds: state.mandateEffectSystem.getLockedTileIds(),
        handsRemaining: state.handsRemaining,
        remainingToTarget: 1e9,
        scoreSelection: (ids) => game.previewScore(ids)?.finalScore ?? null,
      })
      const result = chooseClassicResourceAction({
        visibleTiles: state.handTiles.filter(
          (t) => !state.faceDownTileIds.has(t.id)
        ),
        handTileCount: state.handTiles.length,
        advice,
        remainingToTarget: 1e9,
        chaseCompleteHands: false,
        lockedTileIds: state.mandateEffectSystem.getLockedTileIds(),
        requiredPlaySize: null,
        canPerform: (action) => game.canPerformAction(action),
      })
      if (!result) {
        expect(exchanges).toBe(3)
        expect(discards).toBe(3)
        expect(advice).not.toBeNull()
        expect(
          game.processAction({ type: 'play', tileIds: advice!.best.tileIds })
            .success
        ).toBe(true)
        return
      }
      expect(game.processAction(result.action).success).toBe(true)
      if (result.action.type === 'redraw') exchanges++
      else discards++
    }
    throw new Error(
      'Resource policy did not stop after exhausting its allowances'
    )
  })
})
