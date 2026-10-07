import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { Hand } from '../core/Hand'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { parsePartialHand } from '../rules/PartialHandParser'
import { validateHand } from '../rules/HandValidator'
import { findCompleteHandSubset } from '../rules/CompleteHandSubset'
import { getTilePoints } from '../rules/ScoringEngine'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { CERULEAN_BELL } from '../config/mandateDefinitions'
import { buildCoachAdvice } from '../gameplay/beginnerCoach'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})
const ranks = (suit: TileSuit, ns: number[]) =>
  ns.map((n, i) => new Tile(suit, n, `${suit}-${i}`))
const rest = () => [
  ...ranks(TileSuit.Pinzu, [2, 3, 4]),
  ...ranks(TileSuit.Souzu, [6, 7, 8]),
  ...ranks(TileSuit.Wind, [1, 1]),
]
function setup(tiles: Tile[], flower: FlowerType, mutation: string) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.flowerSystem.clear()
  state.flowerSystem.addFlower(Tile.createFlower(flower, 'flower'))
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.handTiles = tiles
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.discards = []
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const awaken = () => state.flowerSystem.unlockMutation(mutation)
  return { game, state, awaken, ids: tiles.map((t) => t.id) }
}
function pay(game: GameOrchestrator, ids: string[]) {
  const before = game.captureRun(),
    preview = game.previewScore(ids)!
  expect(preview).not.toBeNull()
  expect(game.captureRun()).toEqual(before)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score - before.state.score).toBe(preview.finalScore)
  expect(game.getState().handsRemaining).toBe(before.state.handsRemaining - 1)
  return preview
}

it('Plum pays two overlapping sequences from five unique tiles and never repeats tile chips', () => {
  const { game, state, awaken, ids } = setup(
    ranks(TileSuit.Manzu, [1, 2, 3, 4, 5]),
    FlowerType.Plum,
    'plum_overlap'
  )
  const ordinary = game.previewScore(ids)!
  awaken()
  const parsed = parsePartialHand(state.handTiles, game.getPartialHandRules())
  expect(parsed.groups).toHaveLength(2)
  expect(parsed.structurePoints).toBe(60)
  expect(
    new Set(parsed.groups.flatMap((m) => m.tiles.map((t) => t.id))).size
  ).toBe(5)
  const paid = pay(game, ids)
  expect(paid.structurePoints).toBe(60)
  expect(paid.flowerSequences?.overlapping).toHaveLength(2)
  expect(paid.flowerSequences?.anchored).toEqual([])
  expect(paid.skippedSequences).toEqual([])
  // Two former loose tiles now score fully, but the shared tile only once.
  expect(paid.tilePoints).toBe(
    state.discards.reduce((sum, tile) => sum + getTilePoints(tile), 0)
  )
  expect(paid.tilePoints).toBeGreaterThan(ordinary.tilePoints)
  expect(state.discards.map((t) => t.id)).toEqual(ids)
})

it('Plum declares a thirteen-tile complete hand and finds it in an enlarged rack', () => {
  const tiles = [...ranks(TileSuit.Manzu, [1, 2, 3, 4, 5]), ...rest()]
  const { game, state, awaken, ids } = setup(
    tiles,
    FlowerType.Plum,
    'plum_overlap'
  )
  expect(game.isCompleteHand(ids)).toBe(false)
  awaken()
  expect(game.isCompleteHand(ids)).toBe(true)
  state.handTiles.push(new Tile(TileSuit.Dragon, 3, 'spare'))
  expect(new Set(game.findCompleteHandSelection())).toEqual(new Set(ids))
  const parsed = validateHand(
    new Hand(tiles.filter((tile) => ids.includes(tile.id))),
    undefined,
    game.getPartialHandRules()
  )
  expect(parsed.parsedHands[0].melds).toHaveLength(4)
  expect(parsed.errors).toEqual([])
  expect(game.previewScore(ids)!.structure.kind).toBe('complete')
  pay(game, ids)
  expect(state.handTiles.some((t) => t.id === 'spare')).toBe(true)
  expect(state.discards).toHaveLength(13)
})

it.each([
  ['false_eye_mandate', false, false],
  ['false_eye_mandate', true, false],
  ['false_eye_mandate', false, true],
  ['celestial_wildcard', false, false],
  ['shanten_clemency', false, false],
] as const)(
  'Plum composes with %s, Winter=%s, Bamboo=%s and preserves its interpretation on reload',
  (decree, winter, bamboo) => {
    const head = ranks(
      TileSuit.Manzu,
      bamboo ? [1, 5, 6, 7, 8] : winter ? [1, 2, 4, 5, 6] : [1, 2, 3, 4, 5]
    )
    let tiles = [...head, ...rest()]
    if (decree === 'false_eye_mandate') tiles = tiles.slice(0, -2)
    if (decree === 'shanten_clemency') tiles = tiles.slice(0, -1)
    if (decree === 'celestial_wildcard')
      tiles[1] = new Tile(TileSuit.Dragon, 3, tiles[1].id)
    const { game, state, awaken, ids } = setup(
      tiles,
      FlowerType.Plum,
      'plum_overlap'
    )
    awaken()
    state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === decree)!)
    if (winter) state.seasonSystem.forceSetSeason('Winter')
    if (bamboo) {
      state.flowerSystem.addFlower(
        Tile.createFlower(FlowerType.Bamboo, 'bamboo')
      )
      state.flowerSystem.unlockMutation('bamboo_wild_anchor')
    }
    expect(game.isCompleteHand(ids)).toBe(true)
    state.handTiles.push(new Tile(TileSuit.Dragon, 2, 'spare'))
    const found = game.findCompleteHandSelection()!
    expect(found).not.toBeNull()
    expect(game.validatePlaySelection(found).isValid).toBe(true)
    const interpretation = game.inspectCompleteHand(ids)
    expect(interpretation?.usedShantenClemency).toBe(
      decree === 'shanten_clemency'
    )
    const saved = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    game.restoreRun(saved)
    expect(game.captureRun()).toEqual(saved)
    expect(game.inspectCompleteHand(ids)).toEqual(interpretation)
    pay(game, ids)
    expect(game.getState().discards.map((t) => t.id)).toEqual(ids)
  }
)

it('Plum selection and coach include the forced physical copy, but never reveal hidden required faces', () => {
  const tiles = [...ranks(TileSuit.Manzu, [1, 2, 3, 4, 5]), ...rest()]
  const { game, state, awaken } = setup(tiles, FlowerType.Plum, 'plum_overlap')
  awaken()
  const forced = new Tile(TileSuit.Manzu, 1, 'forced-copy')
  state.handTiles.push(forced)
  state.mandateEffectSystem.activateMandate(CERULEAN_BELL, [], [])
  state.mandateEffectSystem.onDraw([forced], forced)
  const found = game.findCompleteHandSelection()!
  expect(found).toHaveLength(13)
  expect(found).toContain(forced.id)
  expect(game.validatePlaySelection(found).isValid).toBe(true)
  const before = game.captureRun()
  const coach = () =>
    buildCoachAdvice({
      tiles: state.handTiles,
      requiredTileIds: [forced.id],
      concealedIds: state.faceDownTileIds,
      partialRules: game.getPartialHandRules(),
      completeHandTileIds: game.findCompleteHandSelection(),
      scoreSelection: (ids) =>
        game.validatePlaySelection(ids).isValid
          ? (game.previewScore(ids)?.finalScore ?? null)
          : null,
      remainingToTarget: 1e9,
      handsRemaining: 4,
    })
  expect(coach()!.best.tileIds).toContain(forced.id)
  expect(game.captureRun()).toEqual(before)
  state.faceDownTileIds.add(forced.id)
  expect(game.findCompleteHandSelection()).toBeNull()
  expect(coach()).toBeNull()
})

it('the tactical coach prices a five-tile Plum bridge instead of overlooking it behind valuable spare tiles', () => {
  const tiles = [
    ...ranks(TileSuit.Manzu, [2, 3, 4, 5, 6]),
    ...ranks(TileSuit.Dragon, [1, 2, 3]),
  ]
  const { game, state, awaken } = setup(tiles, FlowerType.Plum, 'plum_overlap')
  awaken()
  const priced: string[][] = []
  const advice = buildCoachAdvice({
    tiles: state.handTiles,
    partialRules: game.getPartialHandRules(),
    completeHandTileIds: null,
    scoreSelection: (ids) => {
      priced.push(ids)
      return game.previewScore(ids)?.finalScore ?? null
    },
    remainingToTarget: 1e9,
    handsRemaining: 4,
  })!
  const bridge = tiles.slice(0, 5).map((tile) => tile.id)
  expect(
    priced.some(
      (ids) => ids.length === 5 && bridge.every((id) => ids.includes(id))
    )
  ).toBe(true)
  expect(new Set(advice.best.tileIds)).toEqual(new Set(bridge))
  expect(advice.best.structurePoints).toBe(60)
  expect(advice.best.pattern).toBeNull() // Two sequences, not one ordinary named group.
})

it('Plum cannot share two tiles, use the same sequence twice, or share with a pair', () => {
  for (const ns of [
    [1, 2, 3],
    [1, 2, 3, 4],
    [1, 1, 2, 3],
  ]) {
    const tiles = ranks(TileSuit.Manzu, ns)
    expect(
      parsePartialHand(tiles, { allowSequenceOverlap: true }).groups.filter(
        (g) => g.type === 'sequence'
      )
    ).toHaveLength(1)
  }
  const twoBridges = [
    ...ranks(TileSuit.Manzu, [1, 2, 3, 4, 5]),
    ...ranks(TileSuit.Pinzu, [1, 2, 3, 4, 5]),
    ...ranks(TileSuit.Wind, [1, 1]),
  ]
  expect(
    validateHand(new Hand(twoBridges), undefined, {
      allowSequenceOverlap: true,
    }).isComplete
  ).toBe(false)
})

it.each([
  [1, 5, 6],
  [4, 5, 9],
  [1, 2, 9],
])('Bamboo anchors %s without changing physical faces', (...ns) => {
  const { game, state, awaken, ids } = setup(
    ranks(TileSuit.Manzu, ns),
    FlowerType.Bamboo,
    'bamboo_wild_anchor'
  )
  expect(game.previewScore(ids)!.structurePoints).toBe(0)
  awaken()
  const before = state.handTiles.map((t) => t.typeKey)
  const paid = pay(game, ids)
  expect(paid.structurePoints).toBe(30)
  expect(paid.flowerSequences?.anchored).toHaveLength(1)
  expect(paid.flowerSequences?.overlapping).toEqual([])
  expect(paid.skippedSequences).toEqual([])
  expect(state.discards.map((t) => t.typeKey)).toEqual(before)
})

it('Bamboo does not accept two nonadjacent companions, wrap ranks or create Honor sequences', () => {
  for (const ns of [
    [1, 4, 6],
    [2, 6, 9],
    [1, 5, 9],
  ]) {
    expect(
      parsePartialHand(ranks(TileSuit.Manzu, ns), { allowTerminalAnchor: true })
        .structurePoints
    ).toBe(0)
  }
  expect(
    parsePartialHand(ranks(TileSuit.Wind, [1, 2, 3]), {
      allowTerminalAnchor: true,
    }).structurePoints
  ).toBe(0)
})

it('Bamboo supports complete-hand validation and subset selection, while ordinary Yaku still read real ranks', () => {
  const tiles = [...ranks(TileSuit.Manzu, [1, 5, 6, 7, 8, 9]), ...rest()]
  const { game, awaken, ids } = setup(
    tiles,
    FlowerType.Bamboo,
    'bamboo_wild_anchor'
  )
  expect(game.isCompleteHand(ids)).toBe(false)
  awaken()
  const candidate = findCompleteHandSubset(
    [...tiles, new Tile(TileSuit.Dragon, 3, 'spare')],
    (ids) => game.isCompleteHand(ids),
    [],
    game.getPartialHandRules()
  )
  expect(new Set(candidate)).toEqual(new Set(ids))
  const preview = pay(game, ids)
  expect(preview.detectedYaku.map((y) => y.definition.id)).not.toContain(
    'pinfu'
  )
  expect(preview.detectedYaku.map((y) => y.definition.id)).not.toContain(
    'ittsu'
  )
})

it.each([FlowerType.Plum, FlowerType.Bamboo])(
  'Drought suppresses structural mutation %s and clearing it restores the saved permission',
  (type) => {
    const isPlum = type === FlowerType.Plum
    const { game, state, awaken, ids } = setup(
      ranks(TileSuit.Manzu, isPlum ? [1, 2, 3, 4, 5] : [1, 5, 6]),
      type,
      isPlum ? 'plum_overlap' : 'bamboo_wild_anchor'
    )
    awaken()
    const mutated = game.previewScore(ids)!
    state.seasonSystem.forceSetSeason('Summer', true)
    expect(game.previewScore(ids)!.structurePoints).toBeLessThan(
      mutated.structurePoints
    )
    const save = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    game.restoreRun(save)
    expect(game.captureRun()).toEqual(save)
    game.getState().seasonSystem.clear()
    expect(game.previewScore(ids)!.structurePoints).toBe(
      mutated.structurePoints
    )
    pay(game, ids)
  }
)

it('Orchid doubles Dragons in Honor counts and Honor gates, not physical scoring or retrigger targets', () => {
  const { game, state, awaken, ids } = setup(
    ranks(TileSuit.Dragon, [1, 1]),
    FlowerType.Orchid,
    'orchid_double_dragons'
  )
  const acquire = (id: string) =>
    state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === id)!)!
  acquire('moonlit_seal')
  acquire('decree-honor-guard')
  acquire('decree-honor-resonance')
  const ordinary = game.previewScore(ids)!
  awaken()
  const preview = game.previewScore(ids)!
  expect(preview.tilePoints).toBe(ordinary.tilePoints)
  expect(preview.structurePoints).toBe(ordinary.structurePoints)
  expect(preview.equation!.multiplier).toBeCloseTo(1.2 * 1.44 * 1.5)
  pay(game, ids)
  expect(state.discards).toHaveLength(2)
})

it('Orchid leaves Wind counts ordinary and does not invent Dragon groups', () => {
  const { game, awaken, ids } = setup(
    ranks(TileSuit.Wind, [1, 1]),
    FlowerType.Orchid,
    'orchid_double_dragons'
  )
  const before = game.previewScore(ids)!
  awaken()
  expect(game.previewScore(ids)).toEqual(before)
  expect(game.isCompleteHand(ids)).toBe(false)
})

it.each([false, true])(
  'Chrysanthemum replaces its linear bonus with concealed exponential scaling (allFlowers=%s)',
  (allFlowers) => {
    const tiles = [...ranks(TileSuit.Manzu, [1, 2, 3, 4, 5, 6]), ...rest()]
    const { game, state, awaken, ids } = setup(
      tiles,
      FlowerType.Chrysanthemum,
      'chrysanthemum_exponential'
    )
    if (allFlowers)
      for (const type of [
        FlowerType.Plum,
        FlowerType.Orchid,
        FlowerType.Bamboo,
      ])
        state.flowerSystem.addFlower(Tile.createFlower(type, `flower-${type}`))
    const ordinary = game.previewScore(ids)!
    awaken()
    const mutated = game.previewScore(ids)!
    const effectiveness = allFlowers ? 2 : 1
    expect(
      mutated.equation!.multiplier / ordinary.equation!.multiplier
    ).toBeCloseTo(
      (1 + 0.2 * effectiveness) ** 4 * (allFlowers ? 1.7 / 2.1 : 1 / 1.2),
      5
    )
    pay(game, ids)
  }
)
