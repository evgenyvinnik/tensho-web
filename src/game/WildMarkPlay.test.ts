import { expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { DecreeSystem } from '../systems/DecreeSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'

/** A rack of 4·5 Dots and a Wild 6 of Bamboo, with no items in play. */
function fixture(wild: boolean) {
  const game = new GameOrchestrator()
  game.startNewRun(11)
  const state = game.getState() as OrchestratorState
  const six = new Tile(TileSuit.Souzu, 6, 'six-bamboo')
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 4, 'four-dots'),
    new Tile(TileSuit.Pinzu, 5, 'five-dots'),
    wild ? six.withEnhancement(EnhancementType.Wild) : six,
    new Tile(TileSuit.Manzu, 9, 'nine-characters'),
  ]
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  return game
}

const play = ['four-dots', 'five-dots', 'six-bamboo']

it('scores 4·5 Dots and a Wild 6 of Bamboo as a Sequence', () => {
  const preview = fixture(true).previewScore(play)!
  expect(preview.pattern.id).toBe('sequence')
  expect(preview.structurePoints).toBe(30)
  expect(preview.structure.looseTiles).toBe(0)
})

it('scores the same tiles as loose without the Wild Mark', () => {
  const preview = fixture(false).previewScore(play)!
  expect(preview.pattern.id).toBe('loose')
  expect(preview.structurePoints).toBe(0)
})
