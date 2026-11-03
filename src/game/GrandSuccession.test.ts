import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import { DecreeSystem, YAKUMAN_SUCCESSION } from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

/** A rack of a four-tile Straight plus spares, with the given Flowers held. */
function fixture(flowers: number) {
  const game = new GameOrchestrator()
  game.startNewRun(7, 1)
  const state = game.getState() as OrchestratorState
  state.flowerSystem = new FlowerSystem()
  state.decreeSystem = new DecreeSystem(6)
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  for (let i = 1; i <= flowers; i++)
    state.flowerSystem.addFlower(Tile.createFlower(i, `flower-${i}`))
  state.handTiles = [3, 4, 5, 6, 1, 9].map(
    (rank, i) => new Tile(TileSuit.Pinzu, rank, `play-${i}`)
  )
  const straight = state.handTiles.slice(0, 4).map((tile) => tile.id)
  const run = state.handTiles.slice(0, 3).map((tile) => tile.id)
  return { game, state, straight, run }
}

const scoreOf = (game: GameOrchestrator, ids: string[]) =>
  game.previewScore(ids)!.equation.multiplier

it('is offered only once two Flowers are held', () => {
  expect(DecreeSystem.getShopCandidates([], undefined, 1)).not.toContain(
    YAKUMAN_SUCCESSION
  )
  expect(DecreeSystem.getShopCandidates([], undefined, 2)).toContain(
    YAKUMAN_SUCCESSION
  )
})

it('gives ×4 to a Straight while two Flowers are held', () => {
  const plain = fixture(2)
  const base = scoreOf(plain.game, plain.straight)
  const blessed = fixture(2)
  blessed.state.decreeSystem.acquireDecree(YAKUMAN_SUCCESSION)
  expect(scoreOf(blessed.game, blessed.straight)).toBeCloseTo(base * 4)
  // A plain sequence is no Straight.
  expect(scoreOf(blessed.game, blessed.run)).toBeCloseTo(
    scoreOf(plain.game, plain.run)
  )
})

it('stays silent with fewer than two Flowers', () => {
  const plain = fixture(1)
  const base = scoreOf(plain.game, plain.straight)
  const lone = fixture(1)
  lone.state.decreeSystem.acquireDecree(YAKUMAN_SUCCESSION)
  expect(scoreOf(lone.game, lone.straight)).toBeCloseTo(base)
})
