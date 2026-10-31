/**
 * A Stone has no rank or suit, so nothing that reads a tile's face sees it:
 * suit and tile-kind Boss Mandates do not debuff it, The Veil does not hide it
 * as an Honor, it neither makes nor breaks the All Simples Orb family, and a
 * red 5 under a Stone Mark is no red five.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { DragonType, Tile, TileSuit, WindType } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { Meld, MeldType } from '../core/Meld'
import {
  THE_HEAD,
  THE_MARK,
  THE_PLANT,
  THE_WINDOW,
} from '../config/mandateDefinitions'
import { DebuffSystem, KnownDebuffSource } from '../game/DebuffSystem'
import {
  GameOrchestrator,
  type OrchestratorState,
} from '../game/GameOrchestrator'
import { eventBus } from '../game/EventBus'
import { runRandom } from '../game/RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { playOrbCategories } from './CelestialOrbSystem'
import { FATE_SEALS, FateSealSystem } from './FateSealSystem'
import { MandateEffectSystem, isFaceDebuffTarget } from './MandateEffectSystem'
import {
  RedFiveSystem,
  calculateRedFiveBonus,
  isRedFive,
} from './RedFiveSystem'

const stone = (tile: Tile) => tile.withEnhancement(EnhancementType.Stone)
const manzu = (rank: number, id: string, red = false) =>
  new Tile(TileSuit.Manzu, rank, id, red)
const pinzu = (rank: number, id: string) => new Tile(TileSuit.Pinzu, rank, id)
const dragon = (id: string) => new Tile(TileSuit.Dragon, DragonType.Red, id)
const wind = (id: string) => new Tile(TileSuit.Wind, WindType.East, id)

function activate(
  mandate: typeof THE_WINDOW,
  tiles: Tile[]
): { mandates: MandateEffectSystem; debuffs: DebuffSystem } {
  const debuffs = new DebuffSystem()
  const mandates = new MandateEffectSystem()
  mandates.setDebuffSystem(debuffs)
  mandates.activateMandate(mandate, tiles, [])
  return { mandates, debuffs }
}

describe('suit and tile-kind Mandates read no Stone face', () => {
  it.each([
    ['debuff_suit', 'manzu', manzu(1, 'a')],
    ['debuff_tile_type', 'terminal', manzu(9, 'a')],
    ['debuff_tile_type', 'simple', pinzu(5, 'a')],
    ['debuff_tile_type', 'honor', wind('a')],
    ['debuff_tile_type', 'wind', wind('a')],
    ['debuff_tile_type', 'dragon', dragon('a')],
  ])('%s %s hits the bare tile but not its Stone', (type, target, tile) => {
    expect(isFaceDebuffTarget({ type, target }, tile)).toBe(true)
    expect(isFaceDebuffTarget({ type, target }, stone(tile))).toBe(false)
  })

  it('The Window debuffs Manzu but not a Stone Manzu', () => {
    const tiles = [stone(manzu(1, 'stone')), manzu(2, 'plain'), pinzu(2, 'p')]
    const { debuffs } = activate(THE_WINDOW, tiles)

    expect([...debuffs.getDebuffedTileIds()]).toEqual(['plain'])
  })

  it.each([THE_HEAD, THE_PLANT])(
    '$name debuffs a Dragon but not a Stone Dragon',
    (mandate) => {
      const tiles = [stone(dragon('stone')), dragon('plain')]
      const { debuffs } = activate(mandate, tiles)

      expect([...debuffs.getDebuffedTileIds()]).toEqual(['plain'])
    }
  )

  it('The Veil hides an Honor face-down, but a Stone Honor stays face-up', () => {
    const { mandates } = activate(THE_MARK, [])

    expect(mandates.shouldTileBeFaceDown(dragon('plain'))).toBe(true)
    expect(mandates.shouldTileBeFaceDown(stone(dragon('stone')))).toBe(false)
  })

  it('season and restriction debuffs skip Stones too', () => {
    const debuffs = new DebuffSystem()
    debuffs.applyDrought([stone(pinzu(5, 'stone simple')), pinzu(5, 'simple')])
    debuffs.applyFrost([stone(wind('stone honor')), wind('honor')])
    debuffs.applyMandateRestriction(
      [stone(manzu(3, 'stone manzu')), manzu(3, 'manzu')],
      TileSuit.Manzu
    )

    expect([...debuffs.getDebuffedTileIds()].sort()).toEqual([
      'honor',
      'manzu',
      'simple',
    ])
  })
})

describe('a tile that changes face mid-round is re-read by the Mandate', () => {
  it('lifts the debuff from a tile turned to Stone and debuffs one uncovered', () => {
    const covered = manzu(1, 'covered')
    const uncovered = stone(manzu(2, 'uncovered'))
    const { mandates, debuffs } = activate(THE_WINDOW, [covered, uncovered])
    expect(debuffs.isTileDebuffed('covered')).toBe(true)
    expect(debuffs.isTileDebuffed('uncovered')).toBe(false)

    mandates.refreshFaceDebuffs([
      stone(covered),
      uncovered.withEnhancement(EnhancementType.Bonus),
    ])

    expect(debuffs.isTileDebuffed('covered')).toBe(false)
    expect(debuffs.isTileDebuffed('uncovered')).toBe(true)
  })

  it('leaves a debuff from another source in place', () => {
    const tile = manzu(1, 'blighted')
    const { mandates, debuffs } = activate(THE_WINDOW, [])
    debuffs.applyBlight([tile.id])

    mandates.refreshFaceDebuffs([stone(tile)])

    expect(debuffs.isTileDebuffed(tile.id)).toBe(true)
    expect(debuffs.getDebuffSource('tile', tile.id)).toEqual({
      type: 'season',
      seasonId: KnownDebuffSource.BLIGHT,
    })
  })

  it('does nothing outside a face-reading Mandate', () => {
    const tile = manzu(1, 'a')
    const { mandates, debuffs } = activate(THE_MARK, [])

    mandates.refreshFaceDebuffs([tile])

    expect(debuffs.isTileDebuffed(tile.id)).toBe(false)
  })
})

describe('the run applies Boss Mandates by what a tile shows', () => {
  afterEach(() => {
    eventBus.clear()
    runRandom.reset()
    useOmenStore.getState().clearForNewRun()
  })

  function bossRound(mandate: typeof THE_WINDOW) {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    state.roundManager.getCurrentRound()!.bossMandate = mandate
    return { game, state }
  }

  const applyMandateDebuffs = (game: GameOrchestrator) =>
    (game as unknown as { applyMandateDebuffs(): void }).applyMandateDebuffs()

  it.each([
    { mandate: THE_WINDOW, suit: TileSuit.Manzu, rank: 4 },
    { mandate: THE_HEAD, suit: TileSuit.Dragon, rank: DragonType.Red },
    { mandate: THE_PLANT, suit: TileSuit.Dragon, rank: DragonType.Red },
  ])(
    '$mandate.name at round start skips Stones in the wall',
    ({ mandate, suit, rank }) => {
      const { game, state } = bossRound(mandate)
      const [first, second] = state.wall
      const plain = new Tile(suit, rank, first.id)
      const covered = stone(new Tile(suit, rank, second.id))
      state.wall = [plain, covered, ...state.wall.slice(2)]

      applyMandateDebuffs(game)

      expect(state.debuffSystem.isTileDebuffed(plain.id)).toBe(true)
      expect(state.debuffSystem.isTileDebuffed(covered.id)).toBe(false)
    }
  )

  it('a Seal of Stone used in a Window round lifts the Manzu debuff', () => {
    const { game, state } = bossRound(THE_WINDOW)
    const target = manzu(1, state.handTiles[0].id)
    for (const key of ['handTiles', 'wallTemplate', 'wall'] as const)
      state[key] = state[key].map((tile) =>
        tile.id === target.id ? target : tile
      )
    state.mandateEffectSystem.activateMandate(THE_WINDOW, state.handTiles, [])
    expect(state.debuffSystem.isTileDebuffed(target.id)).toBe(true)

    const seal = FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_stone)
    expect(game.addFateSeal(seal)).toBe(true)
    expect(
      game.processAction({
        type: 'useSeal',
        sealId: seal.instanceId,
        targets: [target.id],
      }).success
    ).toBe(true)

    expect(
      game.getHandTiles().find((tile) => tile.id === target.id)?.isStone
    ).toBe(true)
    expect(state.debuffSystem.isTileDebuffed(target.id)).toBe(false)
  })
})

describe('the All Simples Orb family reads no Stone rank', () => {
  const pair = [pinzu(3, 'a'), pinzu(3, 'b')]
  const groups = [new Meld(MeldType.Pair, pair)]

  it('a Stone terminal riding a simple pair keeps All Simples', () => {
    expect(
      playOrbCategories('pair', groups, [...pair, stone(manzu(1, 'c'))])
    ).toContain('Tanyao')
  })

  it('a bare terminal rider still breaks it', () => {
    expect(
      playOrbCategories('pair', groups, [...pair, manzu(1, 'c')])
    ).not.toContain('Tanyao')
  })

  it('Stones alone make no group, so no All Simples', () => {
    const stones = [stone(pinzu(3, 'a')), stone(pinzu(3, 'b'))]
    expect(playOrbCategories('pair', [], stones)).not.toContain('Tanyao')
  })
})

describe('a red 5 under a Stone Mark is no red five', () => {
  const enabled = { enabled: true, chipBonus: 50, suits: [TileSuit.Manzu] }

  it('pays only the Stone, not the red-five bonus', () => {
    const red = manzu(5, 'red', true)
    const covered = stone(manzu(5, 'covered', true))
    const system = new RedFiveSystem(enabled)

    expect(isRedFive(red)).toBe(true)
    expect(isRedFive(covered)).toBe(false)
    expect(system.getTileBonus(covered)).toBe(0)
    expect(calculateRedFiveBonus([red, covered], enabled)).toBe(50)
  })
})
