/**
 * A tile holds one modifier: a Mark, a Seal or an Edition. Laying a new one
 * replaces whatever the tile carried.
 */

import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import {
  DEFAULT_MODIFIERS,
  EditionType,
  EnhancementType,
  SealType,
} from '../core/TileModifier'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import { VoidScriptSystem, VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { replacesTileModifier } from '../gameplay/consumableTargeting'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

const plain = () => new Tile(TileSuit.Manzu, 3, 'target')
const only = (modifiers: Partial<typeof DEFAULT_MODIFIERS>) => ({
  ...DEFAULT_MODIFIERS,
  ...modifiers,
})

it('replaces a Mark, Seal or Edition instead of stacking it', () => {
  const lucky = plain().withEnhancement(EnhancementType.Lucky)
  expect(lucky.withEnhancement(EnhancementType.Stone).modifiers).toEqual(
    only({ enhancement: EnhancementType.Stone })
  )
  const sealed = lucky.withSeal(SealType.Red)
  expect(sealed.modifiers).toEqual(only({ seal: SealType.Red }))
  expect(sealed.isLucky).toBe(false)
  expect(sealed.withEdition(EditionType.Foil).modifiers).toEqual(
    only({ edition: EditionType.Foil })
  )
})

it('clearing a slot the tile does not use keeps its modifier', () => {
  const sealed = plain().withSeal(SealType.Purple)
  expect(sealed.withEnhancement(EnhancementType.None).seal).toBe(
    SealType.Purple
  )
  expect(sealed.withSeal(SealType.None).hasModifiers).toBe(false)
})

it('keeps one modifier from a save made before the rule, rarest first', () => {
  const stacked = (modifiers: typeof DEFAULT_MODIFIERS) =>
    new Tile(TileSuit.Pinzu, 5, 'saved', false, modifiers).modifiers
  expect(
    stacked({
      enhancement: EnhancementType.Lucky,
      seal: SealType.Red,
      edition: EditionType.Negative,
    })
  ).toEqual(only({ edition: EditionType.Negative }))
  expect(
    stacked({
      enhancement: EnhancementType.Stone,
      seal: SealType.Gold,
      edition: EditionType.Base,
    })
  ).toEqual(only({ enhancement: EnhancementType.Stone }))
})

function withTarget(tile: Tile) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.handTiles = [tile]
  state.wallTemplate = [tile]
  return game
}

it('a Fate Seal swaps a Lucky tile to Stone, not Lucky and Stone', () => {
  const game = withTarget(plain().withEnhancement(EnhancementType.Lucky))
  const seal = FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_stone)
  expect(game.addFateSeal(seal)).toBe(true)
  expect(replacesTileModifier(seal.effect, game.getState().handTiles[0])).toBe(
    true
  )

  const result = game.processAction({
    type: 'useSeal',
    sealId: seal.instanceId,
    targets: ['target'],
  })
  expect(result.success).toBe(true)
  const [hand] = game.getState().handTiles
  expect(hand.modifiers).toEqual(only({ enhancement: EnhancementType.Stone }))
  expect(game.getState().wallTemplate[0].modifiers).toEqual(hand.modifiers)
})

it('a Void Script Seal lifts a Stone Mark off the tile', () => {
  const game = withTarget(plain().withEnhancement(EnhancementType.Stone))
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_the_gold_seal
  )
  expect(game.addVoidScript(script)).toBe(true)

  const result = game.processAction({
    type: 'useScript',
    scriptId: script.instanceId,
    targets: ['target'],
  })
  expect(result.success).toBe(true)
  const [hand] = game.getState().handTiles
  expect(hand.modifiers).toEqual(only({ seal: SealType.Gold }))
  expect(hand.isStone).toBe(false)
})

it('only warns when the item would change what the tile carries', () => {
  const lucky = FATE_SEALS.seal_of_the_alchemist.effect
  expect(replacesTileModifier(lucky, plain())).toBe(false)
  expect(
    replacesTileModifier(lucky, plain().withEnhancement(EnhancementType.Lucky))
  ).toBe(false)
  expect(replacesTileModifier(lucky, plain().withSeal(SealType.Blue))).toBe(
    true
  )
  const aura = VOID_SCRIPTS.script_of_aura.effect
  expect(
    replacesTileModifier(aura, plain().withEdition(EditionType.Foil))
  ).toBe(true)
  // Changing a suit leaves the modifier alone.
  expect(
    replacesTileModifier(
      FATE_SEALS.seal_of_manzu.effect,
      plain().withSeal(SealType.Red)
    )
  ).toBe(false)
})
