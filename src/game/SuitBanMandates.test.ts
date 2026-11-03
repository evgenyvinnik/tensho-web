/**
 * The Club, The Goad and The Window bar one suit from every play. The barred
 * tiles cannot reach a play (not even a complete Mahjong hand), but they can
 * still be redrawn, and a round left with nothing playable or redrawable ends
 * instead of waiting for a move the player cannot make.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import {
  THE_CLUB,
  THE_GOAD,
  THE_WINDOW,
  type MandateDefinition,
} from '../config/mandateDefinitions'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

const tile = (suit: TileSuit, rank: number, id: string) =>
  new Tile(suit, rank, id)

/** A fresh round under `mandate` with exactly `hand` in the rack. */
function fixture(
  mandate: MandateDefinition,
  hand: Tile[],
  wall: Tile[] = Array.from({ length: 40 }, (_, i) =>
    tile(TileSuit.Wind, (i % 4) + 1, `wall-${i}`)
  )
) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.faceDownTileIds.clear()
  state.targetScore = state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.handTiles = hand
  state.wall = wall
  state.drawIndex = 0
  state.deadWall = []
  state.summerReserve = []
  state.wallTemplate = [...hand, ...wall]
  state.mandateEffectSystem.activateMandate(mandate, state.handTiles, [])
  return { game, state }
}

const SUITS = [
  { mandate: THE_CLUB, banned: TileSuit.Souzu, free: TileSuit.Pinzu },
  { mandate: THE_GOAD, banned: TileSuit.Pinzu, free: TileSuit.Manzu },
  { mandate: THE_WINDOW, banned: TileSuit.Manzu, free: TileSuit.Souzu },
]

describe.each(SUITS)('$mandate.name', ({ mandate, banned, free }) => {
  const rack = () => [
    tile(banned, 5, 'banned-0'),
    tile(banned, 5, 'banned-1'),
    tile(free, 5, 'free-0'),
    tile(free, 5, 'free-1'),
  ]

  it('refuses any play holding its suit, and allows the same shape in another', () => {
    const { game, state } = fixture(mandate, rack())

    for (const ids of [
      ['banned-0', 'banned-1'],
      ['banned-0', 'free-0'],
    ]) {
      expect(game.canPerformAction({ type: 'play', tileIds: ids })).toBe(false)
      expect(game.previewScore(ids)).toBeNull()
      expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
        false
      )
    }
    expect(state.score).toBe(0)

    expect(
      game.canPerformAction({ type: 'play', tileIds: ['free-0', 'free-1'] })
    ).toBe(true)
    expect(
      game.processAction({ type: 'play', tileIds: ['free-0', 'free-1'] })
        .success
    ).toBe(true)
    expect(state.score).toBeGreaterThan(0)
  })

  it('lists its suit as barred and still lets those tiles be redrawn', () => {
    const { game } = fixture(mandate, rack())

    expect(game.getBannedTileIds().sort()).toEqual(['banned-0', 'banned-1'])
    expect(
      game.processAction({ type: 'redraw', tileIds: ['banned-0', 'banned-1'] })
        .success
    ).toBe(true)
    expect(game.getHandTiles().map((t) => t.id)).not.toContain('banned-0')
  })

  it('bars no Stone, which has no suit', () => {
    const covered = tile(banned, 5, 'covered').withEnhancement(
      EnhancementType.Stone
    )
    const { game } = fixture(mandate, [covered, ...rack()])

    expect(game.getBannedTileIds()).not.toContain('covered')
    expect(
      game.canPerformAction({ type: 'play', tileIds: ['covered', 'free-0'] })
    ).toBe(true)
  })
})

describe('The Goad in a real Boss round', () => {
  it('bars the Circles in the rack and debuffs nothing', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const state = game.getState() as OrchestratorState
    state.roundManager.getCurrentRound()!.bossMandate = THE_GOAD
    ;(game as unknown as { applyMandateDebuffs(): void }).applyMandateDebuffs()

    expect(state.debuffSystem.getDebuffedTileIds().size).toBe(0)
    expect(game.getBannedTileIds().sort()).toEqual(
      state.handTiles
        .filter((t) => t.suit === TileSuit.Pinzu && !t.isStone)
        .map((t) => t.id)
        .sort()
    )
  })
})

describe('a complete hand is no way around the ban', () => {
  // 234m 456m 678p 345s 66s
  const MAHJONG = (
    [
      [TileSuit.Manzu, 2],
      [TileSuit.Manzu, 3],
      [TileSuit.Manzu, 4],
      [TileSuit.Manzu, 4],
      [TileSuit.Manzu, 5],
      [TileSuit.Manzu, 6],
      [TileSuit.Pinzu, 6],
      [TileSuit.Pinzu, 7],
      [TileSuit.Pinzu, 8],
      [TileSuit.Souzu, 3],
      [TileSuit.Souzu, 4],
      [TileSuit.Souzu, 5],
      [TileSuit.Souzu, 6],
      [TileSuit.Souzu, 6],
    ] satisfies [TileSuit, number][]
  ).map(([suit, rank], i) => tile(suit, rank, `mj-${i}`))

  it('is neither playable nor offered while it holds Circles', () => {
    const { game } = fixture(THE_GOAD, MAHJONG)
    const ids = MAHJONG.map((t) => t.id)

    expect(game.isCompleteHand(ids)).toBe(true)
    expect(game.canPerformAction({ type: 'play', tileIds: ids })).toBe(false)
    expect(game.findCompleteHandSelection()).toBeNull()
  })

  it('is played as usual under a Boss that bars another suit', () => {
    const { game } = fixture(THE_CLUB, MAHJONG.slice(0, 9))
    expect(
      game.canPerformAction({
        type: 'play',
        tileIds: ['mj-0', 'mj-1', 'mj-2'],
      })
    ).toBe(true)
  })
})

describe('a rack with nothing playable', () => {
  const circlesWall = () =>
    Array.from({ length: 40 }, (_, i) =>
      tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
    )
  const rack = () => [
    tile(TileSuit.Souzu, 2, 'free-0'),
    tile(TileSuit.Souzu, 2, 'free-1'),
    ...Array.from({ length: 6 }, (_, i) =>
      tile(TileSuit.Pinzu, i + 1, `banned-${i}`)
    ),
  ]

  it('keeps the round going while a REDRAW is still possible', () => {
    const { game, state } = fixture(THE_GOAD, rack(), circlesWall())
    state.redrawsRemaining = 0
    state.handsRemaining = 3

    expect(
      game.processAction({ type: 'play', tileIds: ['free-0', 'free-1'] })
        .success
    ).toBe(true)
    expect(game.getHandTiles().every((t) => t.suit === TileSuit.Pinzu)).toBe(
      true
    )
    expect(state.phase).toBe('gameplay')
    expect(
      game.canPerformAction({
        type: 'redraw',
        tileIds: [game.getHandTiles()[0].id],
      })
    ).toBe(true)
  })

  it('ends the round when the last Turn has no tile it may play', () => {
    const { game, state } = fixture(THE_GOAD, rack(), circlesWall())
    state.redrawsRemaining = 0
    state.handsRemaining = 2

    expect(
      game.processAction({ type: 'play', tileIds: ['free-0', 'free-1'] })
        .success
    ).toBe(true)
    expect(state.phase).toBe('gameOver')
  })
})
