/**
 * Owned tiles and the items that change them for the rest of a run. Negative
 * tiles (and their Decree slots) are gone; what the run owns is the wall
 * template, and Fate Seals, Scripts, packs and breaking Editions change it
 * for good.
 */

import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { Tile, TileSuit } from '../core/Tile'
import {
  EnhancementType,
  LUCKY_MULTIPLIERS,
  LUCKY_POINTS,
} from '../core/TileModifier'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  vi.restoreAllMocks()
})

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  const owned = new Tile(TileSuit.Manzu, 4, 'owned-gold').withEnhancement(
    EnhancementType.Gold
  )
  expect(game.addTileToWall(owned)).toBe(true)
  return { game, state, owned }
}

function useSeal(game: GameOrchestrator, id: string, targets: string[]) {
  const seal = FateSealSystem.createFateSealInstance(FATE_SEALS[id])
  expect(game.addFateSeal(seal)).toBe(true)
  expect(
    game.processAction({ type: 'useSeal', sealId: seal.instanceId, targets })
      .success
  ).toBe(true)
}

it('copies an Edition permanently with Transmutation, then keeps it across a reshuffle', () => {
  const { game, state, owned } = fixture()
  const target = state.handTiles[0]
  state.handTiles[1] = owned
  useSeal(game, 'seal_of_transmutation', [target.id, owned.id])
  expect(state.wallTemplate.find((t) => t.id === target.id)).toMatchObject({
    suit: TileSuit.Manzu,
    rank: 4,
    modifiers: { enhancement: EnhancementType.Gold },
  })
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Small'
  expect(game.shop.open()).toBe(true)
  game.exitShop()
  expect(state.phase).toBe('gameplay')
  for (const id of [target.id, owned.id])
    expect(state.wall.find((t) => t.id === id)?.enhancement).toBe(
      EnhancementType.Gold
    )
})

it('Release permanently destroys an owned tile, without restoring it on reload', () => {
  const { game, state, owned } = fixture()
  state.handTiles[0] = owned
  useSeal(game, 'seal_of_release', [owned.id])
  expect(state.wallTemplate.some((t) => t.id === owned.id)).toBe(false)
  game.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
  expect(game.getState().wallTemplate.some((t) => t.id === owned.id)).toBe(
    false
  )
})

it('grants an actual Tile Pack reward once across a reload', () => {
  const { game, state } = fixture()
  state.phase = 'shop'
  state.gold = 100
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.packOfferings[0]
  const pack = game.shop.packOfferings.find((p) => p.pack.id === offer.item.id)!
  const tile = new Tile(TileSuit.Pinzu, 3, 'pack-gold').withEnhancement(
    EnhancementType.Gold
  )
  pack.contents = [
    {
      id: tile.id,
      type: 'Tile',
      name: 'Gold tile',
      description: '',
      rarity: 'uncommon',
      data: tile,
    },
  ]
  pack.maxSelections = 1
  expect(game.shop.purchase(offer.id).success).toBe(true)
  const paid = state.gold
  game.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
  expect(game.shop.confirmPack([0]).success).toBe(true)
  const granted = game.getState().wallTemplate.filter((t) => t.id === tile.id)
  expect(granted).toHaveLength(1)
  expect(granted[0].modifiers).toEqual({ enhancement: EnhancementType.Gold })
  expect(game.getState().gold).toBe(paid)
  expect(game.shop.confirmPack([0]).success).toBe(false)
  expect(
    game.getState().wallTemplate.filter((t) => t.id === tile.id)
  ).toHaveLength(1)
})

it('Script of Aura replaces an owned tile’s Edition, and a new Lucky tile gets its round roll', () => {
  const { game, state, owned } = fixture()
  state.handTiles[0] = owned
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_aura
  )
  expect(game.addVoidScript(script)).toBe(true)
  // Aura's last random Edition is Lucky (it never gives Stone).
  const real = runRandom.next.bind(runRandom)
  vi.spyOn(runRandom, 'next').mockImplementation((stream) =>
    stream === 'consumables' ? 0.999 : real(stream)
  )
  expect(state.luckyRolls?.[owned.id]).toBeUndefined()
  expect(
    game.processAction({
      type: 'useScript',
      scriptId: script.instanceId,
      targets: [owned.id],
    }).success
  ).toBe(true)
  for (const tiles of [state.handTiles, state.wallTemplate])
    expect(tiles.find((t) => t.id === owned.id)?.modifiers).toEqual({
      enhancement: EnhancementType.Lucky,
    })
  const roll = state.luckyRolls?.[owned.id]
  expect(LUCKY_MULTIPLIERS).toContain(roll?.multiplier)
  expect(LUCKY_POINTS).toContain(roll?.points)
})

it('a shattered Glass tile leaves the owned wall after paying the play, and stays gone after a save', () => {
  const { game, state, owned } = fixture()
  const glass = owned.withEnhancement(EnhancementType.Glass)
  state.handTiles = [glass, new Tile(TileSuit.Manzu, 4, 'glass-pair')]
  state.wallTemplate = [
    glass,
    state.handTiles[1],
    ...state.wallTemplate.filter((t) => t.id !== owned.id),
  ]
  state.targetScore = 100000
  state.roundManager.getCurrentRound()!.scoreTarget = 100000
  // Every break roll hits; the made Fate Seal waits for its wall tiles.
  vi.spyOn(FateSealSystem, 'getRandomFateSeal').mockReturnValue(
    FATE_SEALS.seal_of_glass
  )
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.map((t) => t.id),
    }).success
  ).toBe(true)
  expect(state.score).toBeGreaterThan(0)
  expect(state.fateSeals.map((seal) => seal.id)).toEqual(['seal_of_glass'])
  expect(state.wallTemplate.some((t) => t.id === owned.id)).toBe(false)
  expect(state.wallTemplate.some((t) => t.id === 'glass-pair')).toBe(true)
  game.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
  expect(game.getState().wallTemplate.some((t) => t.id === owned.id)).toBe(
    false
  )
})

it.each([
  'seal_of_the_sage',
  'seal_of_the_empress',
  'seal_of_strength',
  'seal_of_unity',
])(
  '%s changes owned tiles for later rounds and survives a validated save',
  (id) => {
    const { game, state } = fixture()
    const tiles = [
      new Tile(TileSuit.Souzu, 3, 'permanent-a'),
      new Tile(TileSuit.Pinzu, 4, 'permanent-b'),
    ]
    state.handTiles = tiles
    state.wallTemplate = [...tiles, ...state.wallTemplate]
    useSeal(
      game,
      id,
      tiles.map((t) => t.id)
    )
    const changed = state.wallTemplate.filter((t) =>
      t.id.startsWith('permanent-')
    )
    expect(changed).not.toEqual(tiles)
    game.restoreRun(parseClassicRunSnapshot(json(game.captureRun())))
    const restored = game.getState() as OrchestratorState
    expect(
      restored.wallTemplate.filter((t) => t.id.startsWith('permanent-'))
    ).toEqual(changed)
    restored.phase = 'shop'
    restored.lastCompletedRoundType = 'Small'
    expect(game.shop.open()).toBe(true)
    game.exitShop()
    expect(
      restored.wall
        .filter((t) => t.id.startsWith('permanent-'))
        .sort(Tile.compare)
    ).toEqual([...changed].sort(Tile.compare))
    game.startNewRun(7)
    expect(
      game.getState().wallTemplate.some((t) => t.id.startsWith('permanent-'))
    ).toBe(false)
  }
)
