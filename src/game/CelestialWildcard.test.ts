import { afterEach, expect, it } from 'vitest'
import { Hand } from '../core/Hand'
import { Tile, TileSuit, FlowerType } from '../core/Tile'
import { EditionType, EnhancementType, SealType } from '../core/TileModifier'
import { validateHand, findOneAwayCompletion } from '../rules/HandValidator'
import {
  CELESTIAL_WILDCARD,
  SHANTEN_CLEMENCY,
  ALL_DECREES,
} from '../systems/DecreeSystem'
import {
  CelestialOrbSystem,
  getCelestialOrbByYaku,
} from '../systems/CelestialOrbSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { parseClassicRunSnapshot } from './validateClassicRun'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const numbered = (suit: TileSuit, ranks: number[], prefix: string) =>
  ranks.map((rank, i) => new Tile(suit, rank, `${prefix}-${i}`))
const ordinary = () => [
  new Tile(TileSuit.Manzu, 5, 'wild', true)
    .withEdition(EditionType.Foil)
    .withEnhancement(EnhancementType.Bonus)
    .withSeal(SealType.Red),
  ...numbered(
    TileSuit.Pinzu,
    [2, 3, 4, 3, 4, 5, 6, 7, 8, 6, 6, 6, 5],
    'circles'
  ),
]
const pairs = () => [
  ...numbered(TileSuit.Manzu, [1, 1, 4, 4, 7, 7], 'characters'),
  ...numbered(TileSuit.Pinzu, [2, 2, 5, 5], 'circles'),
  ...numbered(TileSuit.Souzu, [8, 8], 'bamboo'),
  new Tile(TileSuit.Wind, 1, 'east'),
  new Tile(TileSuit.Dragon, 1, 'wild'),
]
const orphans = () => [
  ...numbered(TileSuit.Manzu, [1, 9, 5], 'characters'),
  ...numbered(TileSuit.Pinzu, [1, 9], 'circles'),
  ...numbered(TileSuit.Souzu, [1, 9], 'bamboo'),
  ...numbered(TileSuit.Wind, [1, 2, 3, 4], 'winds'),
  ...numbered(TileSuit.Dragon, [1, 2, 2], 'dragons'),
]

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture(tiles: Tile[]) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  for (const type of [FlowerType.Plum, FlowerType.Orchid])
    state.flowerSystem.addFlower(
      new Tile(TileSuit.Flower, type, `flower-${type}`)
    )
  expect(game.addDecree(CELESTIAL_WILDCARD)).toBe(true)
  state.handTiles = tiles
  state.wall = numbered(
    TileSuit.Souzu,
    Array.from({ length: 60 }, (_, i) => (i % 9) + 1),
    'wall'
  )
  state.drawIndex = 0
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state, ids: tiles.map((t) => t.id) }
}

it.each([
  ['ordinary', ordinary, 'chinitsu'],
  ['seven pairs', pairs, 'seven_pairs'],
  ['thirteen orphans', orphans, 'kokushi'],
] as const)(
  'uses the same impersonated identity for %s validation, preview, payout and restored play',
  (_name, makeTiles, yaku) => {
    const tiles = makeTiles(),
      original = json(tiles)
    expect(validateHand(new Hand(tiles)).isComplete).toBe(false)
    const validation = validateHand(new Hand(tiles), undefined, {
      wildcardCount: 1,
    })
    expect(validation.isComplete).toBe(true)
    expect(validation.effectiveTiles).toHaveLength(14)
    const effective = validation.effectiveTiles!
    const changed = effective.filter(
      (tile) => tile.typeKey !== tiles.find((t) => t.id === tile.id)!.typeKey
    )
    expect(changed).toHaveLength(1)
    expect(new Set(effective.map((t) => t.id))).toEqual(
      new Set(tiles.map((t) => t.id))
    )
    for (const tile of effective) {
      const physical = tiles.find((t) => t.id === tile.id)!
      expect(tile.modifiers).toEqual(physical.modifiers)
      expect(tile.isRed).toBe(physical.isRed)
    }
    expect(json(tiles)).toEqual(original)
    const { game, state, ids } = fixture(tiles)
    const before = json(game.captureRun())
    const preview = game.previewScore(ids)!
    const interpretation = game.inspectCompleteHand(ids)!
    expect(interpretation.naturalComplete).toBe(false)
    expect(interpretation.substitutions).toHaveLength(1)
    expect(interpretation.substitutions[0].effective).toEqual(changed[0])
    expect(interpretation.completionTile).toBeUndefined()
    expect(interpretation.usedShantenClemency).toBe(false)
    expect(preview.detectedYaku.map((y) => y.definition.id)).toContain(yaku)
    expect(game.captureRun()).toEqual(before)
    // Compare against the same physically complete deal to catch split tile/meld contexts.
    state.handTiles = tiles.map(
      (tile) => effective.find((t) => t.id === tile.id)!
    )
    expect(game.previewScore(ids)).toEqual(preview)
    game.restoreRun(parseClassicRunSnapshot(before))
    expect(game.previewScore(ids)).toEqual(preview)
    const score = game.getState().score
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(game.getState().score - score).toBe(preview.finalScore)
    const played = game.captureRun()
    expect(played.state.discards.filter((t) => ids.includes(t.id))).toEqual(
      original
    )
    expect(played.state.wallTemplate).toEqual(before.state.wallTemplate)
    game.restoreRun(parseClassicRunSnapshot(json(played)))
    expect(game.captureRun()).toEqual(played)
  }
)

it('keeps a naturally complete special hand unchanged even when Wildcard is owned', () => {
  const tiles = pairs()
  tiles[13] = new Tile(TileSuit.Wind, 1, 'wild')
  const natural = validateHand(new Hand(tiles))
  const enhanced = validateHand(new Hand(tiles), undefined, {
    wildcardCount: 1,
  })
  expect(enhanced).toEqual(natural)
  expect(enhanced.isSevenPairs).toBe(true)
  const { game, ids } = fixture(tiles)
  expect(game.inspectCompleteHand(ids)).toMatchObject({
    naturalComplete: true,
    substitutions: [],
  })
})

it('removes the declaration when the Decree is inactive and does not invent two wildcards', () => {
  const { game, state, ids } = fixture(orphans())
  expect(game.isCompleteHand(ids)).toBe(true)
  state.decreeSystem.removeDecree(CELESTIAL_WILDCARD.id)
  const before = json(game.captureRun())
  expect(game.validatePlaySelection(ids).isValid).toBe(false)
  expect(game.previewScore(ids)).toBeNull()
  expect(game.inspectCompleteHand(ids)).toBeNull()
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(false)
  expect(game.captureRun()).toEqual(before)
  const twoMissing = orphans()
  twoMissing[3] = new Tile(TileSuit.Pinzu, 5, twoMissing[3].id)
  expect(
    validateHand(new Hand(twoMissing), undefined, { wildcardCount: 1 })
      .isComplete
  ).toBe(false)
})

it('carries the same identities through Wildcard plus Shanten Clemency completion', () => {
  const tiles = pairs().slice(0, 13)
  tiles[0] = new Tile(TileSuit.Manzu, 3, tiles[0].id)
  const completion = findOneAwayCompletion(tiles, [], { wildcardCount: 1 })
  expect(completion).not.toBeNull()
  expect(completion!.effectiveTiles).toHaveLength(14)
  const { game, ids } = fixture(tiles)
  expect(game.addDecree(SHANTEN_CLEMENCY)).toBe(true)
  const beforeInspection = json(game.captureRun())
  const interpretation = game.inspectCompleteHand(ids)!
  expect(interpretation.usedShantenClemency).toBe(true)
  expect(interpretation.completionTile).toBeDefined()
  expect(interpretation.substitutions).toHaveLength(1)
  expect(game.captureRun()).toEqual(beforeInspection)
  const preview = game.previewScore(ids)!
  expect(preview.detectedYaku.map((y) => y.definition.id)).toContain(
    'seven_pairs'
  )
  const before = game.getState().score
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score - before).toBe(preview.finalScore)
})

it('preserves Reality Warp precedence when both wild rules are owned', () => {
  const { game, state, ids } = fixture(ordinary())
  expect(
    game.addDecree(ALL_DECREES.find((d) => d.id === 'decree-reality-warp')!)
  ).toBe(true)
  const together = game.previewScore(ids)
  expect(game.inspectCompleteHand(ids)).toMatchObject({
    allWild: true,
    substitutions: [],
  })
  state.decreeSystem.removeDecree(CELESTIAL_WILDCARD.id)
  expect(game.previewScore(ids)).toEqual(together)
})

it('never discloses hidden tile interpretations, unknown tiles or duplicate selections', () => {
  const { game, state, ids } = fixture(ordinary())
  state.faceDownTileIds.add(ids[0])
  const before = json(game.captureRun())
  expect(game.inspectCompleteHand(ids)).toBeNull()
  expect(game.inspectCompleteHand([...ids, 'missing'])).toBeNull()
  expect(game.inspectCompleteHand([...ids, ids[0]])).toBeNull()
  expect(game.captureRun()).toEqual(before)
  state.faceDownTileIds.clear()
  expect(game.inspectCompleteHand(ids)).not.toBeNull()
})

it.each([
  ['SevenPairs', pairs],
  ['Kokushi', orphans],
  [
    'Ittsu',
    () => [
      ...numbered(TileSuit.Souzu, [1, 2, 3, 4, 5, 6, 7, 8, 9], 'straight'),
      ...numbered(TileSuit.Manzu, [6, 6, 6], 'triplet'),
      ...numbered(TileSuit.Pinzu, [5, 5], 'pair'),
    ],
  ],
] as const)(
  'applies a used %s Orb and records the actual special hand for Star Chart',
  (category, makeTiles) => {
    const { game, state, ids } = fixture(makeTiles())
    game.setConsumableUnlockResolver(() => true) // Already-earned Orb effect.
    const base = game.previewScore(ids)!
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      getCelestialOrbByYaku(category)!
    )
    expect(game.addCelestialOrb(orb)).toBe(true)
    expect(
      game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
    ).toBe(true)
    const before = json(game.captureRun())
    const boosted = game.previewScore(ids)!
    expect(boosted.finalScore).toBeGreaterThan(base.finalScore)
    expect(game.captureRun()).toEqual(before)
    expect(
      state.celestialOrbSystem
        .toState()
        .yakuTriggerCounts.every(([, count]) => count === 0)
    ).toBe(true)
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.celestialOrbSystem.toState().yakuTriggerCounts).toContainEqual(
      [category, 1]
    )
    expect(state.celestialOrbSystem.getOrbForMostPlayedYaku()?.id).toBe(orb.id)
  }
)
