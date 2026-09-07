/**
 * A run should follow from its seed.
 *
 * The implementation-status document has "migrate the remaining gameplay
 * randomness to the run seed" as outstanding work: a hundred-odd
 * `Math.random()` calls decided run outcomes, so two runs of the same seed
 * diverged as soon as anything rolled. These tests pin the property the
 * migration is for, at the level a player would notice it.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { runRandom } from './RunRandom'

afterEach(() => runRandom.reset())

/** What a run looks like from the outside, after the same opening moves. */
function fingerprint(seed: number): unknown {
  const orchestrator = new GameOrchestrator()
  orchestrator.startNewRun(seed, 1)

  const opening = orchestrator.getState()
  const dealt = opening.handTiles.map((tile) => tile.typeKey)
  const starters = opening.decreeSystem
    .getOwnedDecrees()
    .map((decree) => decree.id)

  // Play a few hands so wall draws, modifiers and effects all get a turn.
  const scores: number[] = []
  for (let hand = 0; hand < 3; hand += 1) {
    const state = orchestrator.getState()
    if (state.phase !== 'gameplay') break
    const tileIds = state.handTiles.slice(0, 3).map((tile) => tile.id)
    const result = orchestrator.processAction({ type: 'play', tileIds })
    if (!result.success) break
    scores.push(orchestrator.getState().score)
  }

  const final = orchestrator.getState()
  return {
    dealt,
    starters,
    scores,
    hand: final.handTiles.map((tile) => tile.typeKey),
    gold: final.gold,
    drawIndex: final.drawIndex,
  }
}

describe('a run follows from its seed', () => {
  it('deals and plays identically for the same seed', () => {
    expect(fingerprint(4242)).toEqual(fingerprint(4242))
  })

  it('differs for a different seed', () => {
    expect(fingerprint(4242)).not.toEqual(fingerprint(4243))
  })

  it('is unaffected by draws taken before the run started', () => {
    // A menu screen rolling for decoration must not shift the run that follows.
    const clean = fingerprint(77)
    runRandom.reset()
    for (let i = 0; i < 50; i += 1) runRandom.next('shop')
    expect(fingerprint(77)).toEqual(clean)
  })

  it('gives every stream the same sequence regardless of the others', () => {
    // Adding a draw in one system must not change another system's outcomes,
    // or a seed would stop meaning anything between builds.
    runRandom.start(1234)
    const modifiers = [runRandom.next('modifiers'), runRandom.next('modifiers')]

    runRandom.start(1234)
    for (let i = 0; i < 20; i += 1) runRandom.next('shop')
    for (let i = 0; i < 20; i += 1) runRandom.next('packs')

    expect([runRandom.next('modifiers'), runRandom.next('modifiers')]).toEqual(
      modifiers
    )
  })
})
