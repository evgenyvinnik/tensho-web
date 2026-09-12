import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType, SealType } from '../core/TileModifier'
import { runRandom } from './RunRandom'
import { Meld } from '../core/Meld'

afterEach(() => vi.restoreAllMocks())

describe('Unity creates valid physical Honor tiles', () => {
  it('can turn three different ranks into an actual scoring Wind triplet', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    const ids = state.handTiles.slice(0, 3).map((tile) => tile.id)
    for (const [i, rank] of [1, 5, 9].entries())
      state.handTiles[i] = new Tile(TileSuit.Souzu, rank, ids[i], rank === 5)
    const seal = FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_unity)
    game.addFateSeal(seal)
    expect(
      game.processAction({
        type: 'useSeal',
        sealId: seal.instanceId,
        targets: ids,
      }).success
    ).toBe(true)
    expect(
      Meld.canFormTriplet(
        game.getHandTiles().filter((tile) => ids.includes(tile.id))
      )
    ).toBe(true)
    expect(game.previewScore(ids)?.finalScore).toBeGreaterThan(0)
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
  })

  it('does not inspect a concealed Unity target until use; successful use reveals only that target', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    const source = new Tile(TileSuit.Manzu, 9, state.handTiles[0].id)
    state.faceDownTileIds.add(source.id)
    const otherId = state.handTiles[1].id
    state.faceDownTileIds.add(otherId)
    state.handTiles[0] = new Proxy(source, {
      get(target, key, receiver) {
        if (['suit', 'rank', 'isSuited', 'isRed'].includes(String(key)))
          throw Error('Concealed identity inspected')
        return Reflect.get(target, key, receiver)
      },
    })
    const seal = FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_unity)
    game.addFateSeal(seal)
    const action = {
      type: 'useSeal' as const,
      sealId: seal.instanceId,
      targets: [source.id],
    }
    expect(game.canPerformAction(action)).toBe(true)
    state.handTiles[0] = source
    expect(game.processAction(action).success).toBe(true)
    expect(state.handTiles.find((t) => t.id === source.id)).toMatchObject({
      suit: TileSuit.Wind,
      rank: 1,
    })
    expect([...state.faceDownTileIds]).toEqual([otherId])
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])(
    'converts suited rank %i to its cyclic Wind identity everywhere in the run',
    (rank) => {
      const game = new GameOrchestrator()
      game.startNewRun(7)
      const state = game.getState() as OrchestratorState
      const id = state.handTiles[0].id
      const source = new Tile(TileSuit.Manzu, rank, id, rank === 5)
        .withEnhancement(EnhancementType.Bonus)
        .withSeal(SealType.Red)
      state.handTiles[0] = source
      state.wallTemplate = state.wallTemplate.map((t) =>
        t.id === id ? source : t
      )
      state.wall = state.wall.map((t) => (t.id === id ? source : t))
      const seal = FateSealSystem.createFateSealInstance(
        FATE_SEALS.seal_of_unity
      )
      expect(game.addFateSeal(seal)).toBe(true)
      const action = {
        type: 'useSeal' as const,
        sealId: seal.instanceId,
        targets: [id],
      }
      const random = vi.spyOn(runRandom, 'next')
      expect(game.canPerformAction(action)).toBe(true)
      expect(game.processAction(action).success).toBe(true)
      const expectedRank = ((rank - 1) % 4) + 1
      for (const tiles of [state.handTiles, state.wallTemplate, state.wall]) {
        const tile = tiles.find((t) => t.id === id)
        expect(tile).toMatchObject({
          id,
          suit: TileSuit.Wind,
          rank: expectedRank,
          isRed: false,
        })
        expect(tile?.modifiers).toEqual(source.modifiers)
      }
      expect(game.getFateSeals()).toHaveLength(0)
      expect(random).not.toHaveBeenCalled()
    }
  )
})
