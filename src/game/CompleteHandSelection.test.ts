import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { Hand } from '../core/Hand'
import { validateHand } from '../rules/HandValidator'
import { findCompleteHandSubset } from '../rules/CompleteHandSubset'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { CERULEAN_BELL } from '../config/mandateDefinitions'
import { BOSS_MANDATES } from '../systems/RoundManager'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { buildCoachAdvice } from '../gameplay/beginnerCoach'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const ranks = (suit: TileSuit, values: number[]) =>
  values.map((n, i) => new Tile(suit, n, `${suit}-${i}`))
const standard = () => [
  ...ranks(TileSuit.Manzu, [1, 2, 3, 4, 5, 6]),
  ...ranks(TileSuit.Pinzu, [2, 3, 4]),
  ...ranks(TileSuit.Souzu, [6, 7, 8]),
  ...ranks(TileSuit.Wind, [1, 1]),
]
const pairs = () => [
  ...ranks(TileSuit.Manzu, [1, 1, 4, 4, 7, 7]),
  ...ranks(TileSuit.Pinzu, [2, 2, 5, 5]),
  ...ranks(TileSuit.Souzu, [8, 8]),
  ...ranks(TileSuit.Wind, [1, 1]),
]
const orphans = () => [
  ...ranks(TileSuit.Manzu, [1, 9]),
  ...ranks(TileSuit.Pinzu, [1, 9]),
  ...ranks(TileSuit.Souzu, [1, 9]),
  ...ranks(TileSuit.Wind, [1, 2, 3, 4]),
  ...ranks(TileSuit.Dragon, [1, 2, 3, 3]),
]
const spares = () => [
  new Tile(TileSuit.Dragon, 2, 'spare-a'),
  new Tile(TileSuit.Dragon, 1, 'spare-b'),
]

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function setup(tiles: Tile[], decrees: string[] = []) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState()
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  for (const type of [
    FlowerType.Plum,
    FlowerType.Orchid,
    FlowerType.Bamboo,
    FlowerType.Chrysanthemum,
  ])
    state.flowerSystem.addFlower(
      new Tile(TileSuit.Flower, type, `flower-${type}`)
    )
  for (const id of decrees)
    expect(game.addDecree(ALL_DECREES.find((d) => d.id === id)!)).toBe(true)
  Object.assign(state, {
    handTiles: tiles,
    targetScore: 1e9,
    selectedTileIds: new Set(),
    faceDownTileIds: new Set(),
  })
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return game
}

it.each([
  ['standard', standard],
  ['pairs', pairs],
  ['orphans', orphans],
] as const)(
  'finds and pays a %s subset without consuming spare tiles or mutating a preview',
  (_, make) => {
    const tiles = [...spares(), ...make()]
    const game = setup(tiles)
    expect(game.isCompleteHand(tiles.map((t) => t.id))).toBe(false)
    const before = json(game.captureRun())
    const found = game.findCompleteHandSelection()!
    expect(found).toHaveLength(14)
    expect(game.isCompleteHand(found)).toBe(true)
    expect(game.findCompleteHandSelection()).toEqual(found)
    const score = game.previewScore(found)!.finalScore
    expect(game.captureRun()).toEqual(before)
    game.restoreRun(parseClassicRunSnapshot(before))
    expect(game.findCompleteHandSelection()).toEqual(found)
    expect(game.processAction({ type: 'play', tileIds: found }).success).toBe(
      true
    )
    expect(game.getState().score).toBe(score)
    expect(game.getState().handsRemaining).toBe(before.state.handsRemaining - 1)
    for (const spare of tiles.filter((t) => !found.includes(t.id)))
      expect(game.getHandTiles()).toContainEqual(spare)
  }
)

it('shows the coach the complete subset instead of only tactical plays', () => {
  const tiles = [...spares(), ...pairs()],
    game = setup(tiles)
  const before = json(game.captureRun())
  const advice = buildCoachAdvice({
    tiles,
    scoreSelection: (ids) => game.previewScore(ids)?.finalScore ?? null,
    remainingToTarget: 1e9,
    handsRemaining: 4,
  })!
  expect(advice.best.tileIds).toHaveLength(14)
  expect(game.isCompleteHand(advice.best.tileIds)).toBe(true)
  expect(game.captureRun()).toEqual(before)
})

it.each([
  [
    'broken_stair_edict',
    () => {
      const t = standard()
      t[2] = new Tile(TileSuit.Manzu, 4, t[2].id)
      return t
    },
  ],
  [
    'celestial_wildcard',
    () => {
      const t = pairs()
      t[0] = new Tile(TileSuit.Souzu, 3, t[0].id)
      return t
    },
  ],
  ['shanten_clemency', () => standard().slice(0, -1)],
  ['false_eye_mandate', () => standard().slice(0, -2)],
  [
    'honor_transmutation',
    () => [
      ...ranks(TileSuit.Manzu, [2, 3, 4, 3, 4, 5, 6, 7, 8, 6, 6, 6, 1]),
      new Tile(TileSuit.Wind, 1, 'honor'),
    ],
  ],
  [
    'decree-harmonizer',
    () => {
      const t = standard()
      t[1] = new Tile(TileSuit.Pinzu, 2, t[1].id)
      return t
    },
  ],
  [
    'decree-reality-warp',
    () => ranks(TileSuit.Manzu, [1, 4, 7, 1, 4, 7, 1, 4, 7, 2, 5, 8, 2, 5]),
  ],
] as const)(
  'finds a %s assisted subset and retains the same interpretation on resume',
  (id, make) => {
    const tiles = [...spares(), ...make()],
      game = setup(tiles, [id])
    const before = json(game.captureRun())
    const found = game.findCompleteHandSelection()!
    expect(found).not.toBeNull()
    expect(found.length).toBeLessThan(tiles.length)
    expect(game.isCompleteHand(found)).toBe(true)
    expect(game.validatePlaySelection(found).isValid).toBe(true)
    expect(game.inspectCompleteHand(found)).not.toBeNull()
    expect(game.captureRun()).toEqual(before)
    game.restoreRun(parseClassicRunSnapshot(before))
    expect(game.findCompleteHandSelection()).toEqual(found)
  }
)

it('includes the forced physical copy rather than an interchangeable unlocked copy', () => {
  const tiles = [...standard(), new Tile(TileSuit.Wind, 1, 'forced-east')],
    game = setup(tiles)
  const mandate = game.getState().mandateEffectSystem
  mandate.activateMandate(CERULEAN_BELL, [], [])
  mandate.onDraw([tiles[14]], tiles[14])
  const found = game.findCompleteHandSelection()!
  expect(found).toHaveLength(14)
  expect(found).toContain('forced-east')
  expect(game.validatePlaySelection(found).isValid).toBe(true)
})

it('does not reveal a hidden necessary face or ignore a hidden forced tile', () => {
  const tiles = [...spares(), ...standard()],
    game = setup(tiles)
  game.getState().faceDownTileIds.add('manzu-0')
  expect(game.findCompleteHandSelection()).toBeNull()
  game.getState().faceDownTileIds.clear()
  game.getState().faceDownTileIds.add('spare-a')
  expect(game.findCompleteHandSelection()).toHaveLength(14)
  game.getState().mandateEffectSystem.activateMandate(CERULEAN_BELL, [], [])
  game.getState().mandateEffectSystem.onDraw([tiles[0]], tiles[0])
  expect(game.findCompleteHandSelection()).toBeNull()
})

it('does not offer a declaration when the Boss demands exactly five tiles', () => {
  const game = setup([...spares(), ...standard()])
  game.getState().roundManager.getCurrentRound()!.bossMandate =
    BOSS_MANDATES.find((m) => m.id === 'the_psychic')!
  expect(game.findCompleteHandSelection()).toBeNull()
})

it('searches a large rack by shapes rather than restricting the feature to two spare tiles', () => {
  const tiles = [
    ...ranks(TileSuit.Dragon, [1, 2, 3]),
    ...ranks(TileSuit.Wind, [2, 3, 4]),
    ...standard().map((t) => new Tile(t.suit, t.rank, `complete-${t.id}`)),
  ]
  const game = setup(tiles)
  expect(game.findCompleteHandSelection()).toHaveLength(14)
})

it('agrees with exhaustive physical-subset validation on deterministic sixteen-tile samples', () => {
  for (let seed = 1; seed <= 16; seed++) {
    const game = new GameOrchestrator()
    game.startNewRun(seed)
    const tiles = game.getHandTiles().concat(spares())
    let expected = false
    for (let a = 0; a < tiles.length; a++)
      for (let b = a + 1; b < tiles.length; b++) {
        const subset = tiles.filter((_, i) => i !== a && i !== b)
        if (validateHand(new Hand(subset)).isComplete) expected = true
      }
    const found = findCompleteHandSubset(
      tiles,
      (ids) =>
        validateHand(new Hand(tiles.filter((t) => ids.includes(t.id))))
          .isComplete
    )
    expect(Boolean(found), `seed ${seed}`).toBe(expected)
  }
})
