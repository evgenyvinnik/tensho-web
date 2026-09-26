import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { Tile, TileSuit } from '../core/Tile'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})
function definition(id: string) {
  const decree = ALL_DECREES.find((d) => d.id === id)
  if (!decree) throw Error(`Missing Decree ${id}`)
  return decree
}
function fixture(...owned: string[]) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem(10)
  owned.forEach((id) => state.decreeSystem.acquireDecree(definition(id)))
  state.handTiles = [4, 5, 6].map(
    (rank) => new Tile(TileSuit.Souzu, rank, `copy-${rank}`)
  )
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const ids = state.handTiles.map((tile) => tile.id)
  const disable = (...ids: string[]) => {
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds: ids,
    })
  }
  const pay = () => {
    const preview = game.previewScore(ids)!
    expect(game.previewScore(ids)).toEqual(preview)
    const before = state.score
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.score - before).toBe(preview.finalScore)
    return preview
  }
  return { game, state, ids, disable, pay }
}

it.each(['mandate', 'debuffed'] as const)(
  'Blueprint never skips its %s neighbor in main scoring',
  (kind) => {
    const { state, disable, pay } = fixture(
      'decree-blueprint',
      'decree-half-suited',
      'decree-gentle-breeze'
    )
    if (kind === 'mandate') disable('decree-half-suited')
    else state.decreeSystem.getOwnedDecrees()[1].isDebuffed = true
    expect(pay().equation).toEqual({
      points: 45,
      multiplier: 3,
      adjustment: 0,
      total: 135,
    })
  }
)

it('Brainstorm uses the physical leftmost slot even when that slot is suppressed', () => {
  const { disable, pay } = fixture(
    'decree-half-suited',
    'decree-gentle-breeze',
    'decree-brainstorm'
  )
  disable('decree-half-suited')
  expect(pay().equation).toEqual({
    points: 45,
    multiplier: 3,
    adjustment: 0,
    total: 135,
  })
})

it('a leftmost Brainstorm cannot substitute the Decree to its right', () => {
  expect(
    fixture('decree-brainstorm', 'decree-half-suited').pay().finalScore
  ).toBe(65)
})

it('copy suppression preserves the copier’s own Foil rather than duplicating the source edition', () => {
  const { state, disable, pay } = fixture(
    'decree-blueprint',
    'decree-half-suited',
    'decree-gentle-breeze'
  )
  state.decreeSystem.applyEdition('decree-blueprint', 'Foil')
  state.decreeSystem.applyEdition('decree-half-suited', 'Foil')
  disable('decree-half-suited')
  expect(pay().equation).toEqual({
    points: 95,
    multiplier: 3,
    adjustment: 0,
    total: 285,
  })
})

it.each([
  [['decree-blueprint', 'decree-half-suited', 'decree-gentle-breeze'], 255],
  [['decree-half-suited', 'decree-blueprint'], 65],
  [['decree-blueprint', 'decree-blueprint', 'decree-half-suited'], 85],
] as [string[], number][])(
  'preserves ordinary physical copy positions: %j',
  (ids, total) => {
    expect(fixture(...ids).pay().finalScore).toBe(total)
  }
)

it.each([
  ['decree-wide-grip', 'getHandSizeBonus', 2],
  ['decree-second-chance', 'getAdditionalDiscards', 2],
  ['decree-time-lord', 'getAdditionalDraws', 2],
  ['decree-ancient-scroll', 'getHandSizeBonus', -4],
  ['decree-sacrifice', 'getAdditionalDiscards', -2],
] as const)(
  'copies the entire resource effect, including costs: %s',
  (id, getter, expected) => {
    const { state } = fixture('decree-blueprint', id)
    expect(state.decreeSystem[getter]()).toBe(expected)
    state.decreeSystem.getOwnedDecrees()[1].isDebuffed = true
    expect(state.decreeSystem[getter]()).toBe(0)
  }
)

it('Clone Army grants each copied resource once, without recursion', () => {
  const { state } = fixture(
    'decree-wide-grip',
    'decree-second-chance',
    'decree-time-lord',
    'decree-clone-army'
  )
  expect(state.decreeSystem.getHandSizeBonus()).toBe(2)
  expect(state.decreeSystem.getAdditionalDiscards()).toBe(2)
  expect(state.decreeSystem.getAdditionalDraws()).toBe(2)
})

it.each([
  ['extended_hand_grant', 14, 3, 10],
  ['decree-wide-grip', 16, 3, 4],
  ['decree-second-chance', 14, 5, 4],
  ['decree-time-lord', 14, 3, 6],
  ['decree-ancient-scroll', 10, 3, 4],
  ['decree-sacrifice', 14, 1, 4],
] as const)(
  'applies copied %s resources through actual round exit/draw',
  (id, tiles, discards, hands) => {
    const { game, state } = fixture('decree-blueprint', id)
    state.phase = 'shop'
    state.lastCompletedRoundType = 'Small'
    expect(game.shop.open()).toBe(true)
    game.exitShop()
    expect(state.phase).toBe('gameplay')
    expect(state.handTiles).toHaveLength(tiles)
    expect(state.discardsRemaining).toBe(discards)
    expect(state.handsRemaining).toBe(hands)
  }
)

it('Extended Hand Grant adds three plays, not rack tiles or redraw actions', () => {
  const { game, state } = fixture('extended_hand_grant')
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Small'
  expect(game.shop.open()).toBe(true)
  game.exitShop()
  expect(state.handsRemaining).toBe(7)
  expect(state.handTiles).toHaveLength(14)
  expect(state.redrawsRemaining).toBe(3)
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
    }).success
  ).toBe(true)
  expect(state.handsRemaining).toBe(6)
  expect(state.handTiles).toHaveLength(14)
  expect(state.redrawsRemaining).toBe(3)
})
