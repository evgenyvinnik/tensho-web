import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType, SealType, EditionType } from '../core/TileModifier'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import { VoidScriptSystem, VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { runRandom } from './RunRandom'
import { eventBus } from './EventBus'

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
})

function fixture(suit = TileSuit.Manzu, rank = 5, red = true) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  const source = new Tile(suit, rank, state.handTiles[0].id, red)
    .withEnhancement(EnhancementType.Bonus)
    .withSeal(SealType.Red)
    .withEdition(EditionType.Foil)
  for (const key of ['handTiles', 'wallTemplate', 'wall'] as const)
    state[key] = state[key].map((tile) =>
      tile.id === source.id ? source : tile
    )
  return { game, state, source }
}

function strengthen(game: GameOrchestrator, ids: string[]) {
  const seal = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_strength
  )
  expect(game.addFateSeal(seal)).toBe(true)
  return game.processAction({
    type: 'useSeal',
    sealId: seal.instanceId,
    targets: ids,
  })
}

describe('physical rank changes preserve valid red-five identity', () => {
  it.each([TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu])(
    'Strength changes a red five of %s into an ordinary six, retaining all modifiers',
    (suit) => {
      const { game, state, source } = fixture(suit)
      const random = vi.spyOn(runRandom, 'next')
      expect(strengthen(game, [source.id]).success).toBe(true)
      for (const tiles of [state.handTiles, state.wallTemplate, state.wall])
        expect(tiles.find((tile) => tile.id === source.id)).toMatchObject({
          id: source.id,
          suit,
          rank: 6,
          isRed: false,
          modifiers: source.modifiers,
        })
      expect(game.getFateSeals()).toHaveLength(0)
      expect(random).not.toHaveBeenCalled()
      expect(source.rank).toBe(5)
      expect(source.isRed).toBe(true)
    }
  )

  it('Strength does not manufacture a red five when increasing a normal four', () => {
    const { game, source } = fixture(TileSuit.Manzu, 4, false)
    expect(strengthen(game, [source.id]).success).toBe(true)
    expect(game.getHandTiles().find((t) => t.id === source.id)).toMatchObject({
      rank: 5,
      isRed: false,
    })
  })

  it('a mixed valid/max-rank selection changes only the eligible tile', () => {
    const { game, state, source } = fixture()
    const nine = new Tile(TileSuit.Souzu, 9, state.handTiles[1].id)
    state.handTiles[1] = nine
    expect(strengthen(game, [nine.id, source.id]).success).toBe(true)
    expect(game.getHandTiles().find((t) => t.id === nine.id)).toBe(nine)
    expect(game.getHandTiles().find((t) => t.id === source.id)).toMatchObject({
      rank: 6,
      isRed: false,
    })
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])(
    'Ouija settles random rank %i with valid red status and its once-only hand-size penalty',
    (rank) => {
      const { game, state, source } = fixture()
      const plain = new Tile(TileSuit.Pinzu, 4, state.handTiles[1].id)
      const honor = Tile.createWind(1, state.handTiles[2].id)
      state.handTiles[1] = plain
      state.handTiles[2] = honor
      const script = VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_the_ouija
      )
      expect(game.addVoidScript(script)).toBe(true)
      // Ouija draws its rank, then its penalty randomly trims the sorted hand.
      // Keep the inspected fixtures and trim the last tile instead.
      const random = vi
        .spyOn(runRandom, 'next')
        .mockImplementation((stream) =>
          stream === 'consumables' ? (rank - 0.5) / 9 : 0.999
        )
      const action = {
        type: 'useScript' as const,
        scriptId: script.instanceId,
        targets: [],
      }
      expect(game.canPerformAction(action)).toBe(true)
      expect(random).not.toHaveBeenCalled()
      expect(game.processAction(action).success).toBe(true)
      for (const tiles of [state.handTiles, state.wallTemplate, state.wall])
        expect(tiles.find((t) => t.id === source.id)).toMatchObject({
          rank,
          isRed: rank === 5,
          modifiers: source.modifiers,
          id: source.id,
        })
      expect(game.getHandTiles().find((t) => t.id === plain.id)).toMatchObject({
        rank,
        isRed: false,
      })
      expect(game.getHandTiles().find((t) => t.id === honor.id)).toBe(honor)
      expect(random.mock.calls).toEqual([['consumables'], ['decrees']])
      expect(state.handTiles).toHaveLength(13)
      expect(state.voidScriptSystem.getHandSizePenalty()).toBe(1)
      expect(game.getVoidScripts()).toHaveLength(0)
      expect(game.processAction(action).success).toBe(false)
      expect(state.voidScriptSystem.getHandSizePenalty()).toBe(1)
    }
  )
})
