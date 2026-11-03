import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { SHANTEN_CLEMENCY } from '../systems/DecreeSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  // A pair of 5s and a loose 9: the 9 normally scores half its 10 Points.
  state.handTiles = [
    new Tile(TileSuit.Manzu, 5, 'a'),
    new Tile(TileSuit.Manzu, 5, 'b'),
    new Tile(TileSuit.Pinzu, 9, 'loose'),
  ]
  return { game, state, ids: ['a', 'b', 'loose'] }
}

it('Loose Tile Clemency lets loose tiles score their full Points', () => {
  const plain = fixture()
  const before = plain.game.previewScore(plain.ids)!
  const mercy = fixture()
  expect(mercy.game.addDecree(SHANTEN_CLEMENCY)).toBe(true)
  const after = mercy.game.previewScore(mercy.ids)!
  expect(after.tilePoints - before.tilePoints).toBe(5)
  expect(after.pattern.id).toBe(before.pattern.id)
})
