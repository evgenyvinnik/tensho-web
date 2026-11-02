/**
 * A tile holds one Edition. Laying a new one replaces whatever the tile
 * carried.
 */

import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import {
  DEFAULT_MODIFIERS,
  EnhancementType,
  type TileModifiers,
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

it('replaces an Edition instead of stacking it', () => {
  const lucky = plain().withEnhancement(EnhancementType.Lucky)
  const stone = lucky.withEnhancement(EnhancementType.Stone)
  expect(stone.modifiers).toEqual(only({ enhancement: EnhancementType.Stone }))
  expect(stone.isLucky).toBe(false)
  const gold = stone.withEnhancement(EnhancementType.Gold)
  expect(gold.modifiers).toEqual(only({ enhancement: EnhancementType.Gold }))
  expect(gold.isStone).toBe(false)
})

it('clearing the Edition leaves a plain tile; an empty change keeps it', () => {
  const gold = plain().withEnhancement(EnhancementType.Gold)
  expect(gold.withModifiers({}).enhancement).toBe(EnhancementType.Gold)
  expect(gold.withEnhancement(EnhancementType.None).hasModifiers).toBe(false)
  expect(gold.withEnhancement(EnhancementType.None).modifiers).toEqual(
    DEFAULT_MODIFIERS
  )
})

it('keeps only the Edition from a tile saved with a Stamp or tile Edition', () => {
  const saved = (modifiers: Record<string, string>) =>
    new Tile(
      TileSuit.Pinzu,
      5,
      'saved',
      false,
      modifiers as unknown as TileModifiers
    ).modifiers
  expect(
    saved({
      enhancement: EnhancementType.Lucky,
      seal: 'red',
      edition: 'negative',
    })
  ).toEqual(only({ enhancement: EnhancementType.Lucky }))
  expect(saved({ seal: 'gold', edition: 'base' })).toEqual(DEFAULT_MODIFIERS)
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

it('a Void Script Edition lifts a Stone Edition off the tile', () => {
  const game = withTarget(plain().withEnhancement(EnhancementType.Stone))
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_the_gold_seal
  )
  expect(game.addVoidScript(script)).toBe(true)
  expect(
    replacesTileModifier(script.effect, game.getState().handTiles[0])
  ).toBe(true)

  const result = game.processAction({
    type: 'useScript',
    scriptId: script.instanceId,
    targets: ['target'],
  })
  expect(result.success).toBe(true)
  const [hand] = game.getState().handTiles
  expect(hand.modifiers).toEqual(only({ enhancement: EnhancementType.Gold }))
  expect(hand.isStone).toBe(false)
  expect(game.getState().wallTemplate[0].modifiers).toEqual(hand.modifiers)
})

it('only warns when the item would change what the tile carries', () => {
  const lucky = FATE_SEALS.seal_of_the_alchemist.effect
  expect(replacesTileModifier(lucky, plain())).toBe(false)
  expect(
    replacesTileModifier(lucky, plain().withEnhancement(EnhancementType.Lucky))
  ).toBe(false)
  expect(
    replacesTileModifier(lucky, plain().withEnhancement(EnhancementType.Steel))
  ).toBe(true)
  // A random Edition may replace any the tile carries.
  const aura = VOID_SCRIPTS.script_of_aura.effect
  expect(replacesTileModifier(aura, plain())).toBe(false)
  expect(
    replacesTileModifier(aura, plain().withEnhancement(EnhancementType.Bonus))
  ).toBe(true)
  // Changing a suit leaves the Edition alone.
  expect(
    replacesTileModifier(
      FATE_SEALS.seal_of_manzu.effect,
      plain().withEnhancement(EnhancementType.Gold)
    )
  ).toBe(false)
})
