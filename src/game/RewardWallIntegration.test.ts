import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { useOmenStore } from '../stores/omenStore'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import { eventBus } from './EventBus'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { resetMetaProgressionRunContext } from './MetaProgressionBridge'
import { runRandom } from './RunRandom'
import { resolveTableRules } from './tableStyleRules'
import { parseClassicRunSnapshot } from './validateClassicRun'

const rewards = [
  {
    id: 'crimson_wall',
    suit: TileSuit.Dragon,
    mark: EnhancementType.Mult,
    count: 12,
    chips: 0,
    mult: 4,
  },
  {
    id: 'obsidian_wall',
    suit: TileSuit.Wind,
    mark: EnhancementType.Bonus,
    count: 16,
    chips: 30,
    mult: 0,
  },
] as const

function start(table: string, seed = 7) {
  const game = new GameOrchestrator()
  game.startNewRun(seed, 1, table)
  return game
}

function json<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function resume(game: GameOrchestrator) {
  // Exercise the durable JSON boundary and validator, not a shared live object.
  const saved = parseClassicRunSnapshot(json(game.captureRun()))
  const restored = new GameOrchestrator()
  restored.restoreRun(saved)
  expect(json(restored.captureRun())).toEqual(saved)
  return restored
}

function scoringFixture(game: GameOrchestrator, tiles: Tile[]) {
  const state = game.getState() as OrchestratorState
  // Isolate the starting Marks from seeded Decrees/Flowers/Seasons. Scoring
  // itself still uses the real forecast and paid action paths.
  for (const decree of state.decreeSystem.getOwnedDecrees()) {
    state.decreeSystem.removeDecree(decree.id)
  }
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.handTiles = [...tiles]
  state.faceDownTileIds.clear()
  state.targetScore = 1e12
  state.roundManager.getCurrentRound()!.scoreTarget = 1e12
}

function forecastAndCommit(game: GameOrchestrator, tiles: Tile[]) {
  scoringFixture(game, tiles)
  const ids = tiles.map((tile) => tile.id)
  const before = game.getState().score
  const forecast = game.previewScore(ids)!
  expect(forecast).not.toBeNull()
  expect(game.getState().score).toBe(before)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score - before).toBe(forecast.finalScore)
  expect(game.getState().handsPlayedThisRun).toBe(1)
  return forecast
}

function enterShop(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  // Lower only the target; completing the round and entering/exiting its
  // reward shop go through public engine methods.
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((tile) => tile.id),
    }).success
  ).toBe(true)
  expect(game.getState().phase).toBe('shop')
  expect(game.shop.open()).toBe(true)
}

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  resetMetaProgressionRunContext()
  useOmenStore.getState().clearForNewRun()
})

describe.each(rewards)(
  '$id real run integration',
  ({ id, suit, mark, count, chips, mult }) => {
    it('constructs and deals the marked wall with four base Decree slots', () => {
      let markedTilesDealt = 0
      for (const seed of [7, 19, 413]) {
        const game = start(id, seed)
        const state = game.getState()
        expect(state.phase).toBe('gameplay')
        expect(state.tableStyleId).toBe(id)
        expect(state.tableModifiers).toEqual(resolveTableRules(id).modifiers)
        expect(Object.isFrozen(state.tableModifiers)).toBe(true)
        expect(state.decreeSystem.getMaxSlots()).toBe(
          4 + state.flowerSystem.getBonusDecreeSlots()
        )
        expect(state.wallTemplate).toHaveLength(144)
        expect(new Set(state.wallTemplate.map((tile) => tile.id)).size).toBe(
          144
        )
        expect(
          state.wallTemplate.filter((tile) => tile.enhancement === mark)
        ).toHaveLength(count)
        for (const tiles of [
          state.wallTemplate,
          state.wall,
          state.deadWall,
          state.summerReserve,
          state.handTiles,
        ]) {
          for (const tile of tiles) {
            expect(tile.enhancement).toBe(
              tile.suit === suit ? mark : EnhancementType.None
            )
          }
        }
        const springs = state.seasonSystem
          .getSeasonStack()
          .filter((season) => season.type === 'Spring' && !season.isCorrupted)
        expect(game.getHandTiles()).toHaveLength(14 + springs.length * 2)
        markedTilesDealt += game
          .getHandTiles()
          .filter((tile) => tile.suit === suit).length
      }
      // Keep the deal assertion non-vacuous, without requiring every seed to
      // deal an honor of this suit.
      expect(markedTilesDealt).toBeGreaterThan(0)
    })

    it('forecasts and commits exactly the existing Mark bonus versus the same neutral hand', () => {
      const rewardGame = start(id)
      const tiles = rewardGame
        .getState()
        .wallTemplate.filter((tile) => tile.suit === suit && tile.rank === 1)
        .slice(0, 3)
      expect(tiles).toHaveLength(3)
      const rewarded = forecastAndCommit(rewardGame, tiles)
      const neutral = forecastAndCommit(
        start('green_felt'),
        tiles.map((tile) => tile.withoutModifiers())
      )
      expect(rewarded.basePoints).toBe(neutral.basePoints)
      expect(rewarded.dragonMult).toBe(neutral.dragonMult)
      expect(rewarded.yakuMultiplier).toBe(neutral.yakuMultiplier)
      expect(rewarded.modifierMult - neutral.modifierMult).toBe(3 * mult)
      expect(rewarded.modifierChips - neutral.modifierChips).toBe(3 * chips)
      expect(rewarded.finalScore).toBeGreaterThan(neutral.finalScore)

      // Moving exactly the same marked tiles to Green Felt must score equally:
      // the benefit belongs to the tiles, not an ongoing table scoring boost.
      const neutralWithMarks = forecastAndCommit(start('green_felt'), tiles)
      expect(neutralWithMarks.finalScore).toBe(rewarded.finalScore)
      expect(neutralWithMarks.modifierMult).toBe(rewarded.modifierMult)
      expect(neutralWithMarks.modifierChips).toBe(rewarded.modifierChips)
    })

    it('round-trips the selected table, marked wall and dealt rack through a validated save', () => {
      const game = start(id)
      const before = game.getState()
      const restored = resume(game)
      const state = restored.getState()
      expect(state.tableStyleId).toBe(id)
      expect(state.tableModifiers).toEqual(resolveTableRules(id).modifiers)
      expect(Object.isFrozen(state.tableModifiers)).toBe(true)
      for (const key of [
        'wallTemplate',
        'wall',
        'deadWall',
        'summerReserve',
        'handTiles',
      ] as const) {
        expect(state[key]).toEqual(before[key])
        expect(state[key].every((tile) => tile instanceof Tile)).toBe(true)
      }
      expect(
        state.wallTemplate.filter((tile) => tile.enhancement === mark)
      ).toHaveLength(count)
      expect(state.decreeSystem.getMaxSlots()).toBe(
        before.decreeSystem.getMaxSlots()
      )
      const ids = restored
        .getHandTiles()
        .slice(0, 2)
        .map((tile) => tile.id)
      const forecast = restored.previewScore(ids)!
      const oldScore = state.score
      expect(
        restored.processAction({ type: 'play', tileIds: ids }).success
      ).toBe(true)
      expect(restored.getState().score - oldScore).toBe(forecast.finalScore)
    })

    it('retains a deliberate Fate Seal replacement and unmarked acquired honor through resume and the next deal', () => {
      const game = start(id)
      enterShop(game)
      const target = game
        .getSealableWallTiles()
        .find((tile) => tile.suit === suit)!
      expect(target.enhancement).toBe(mark)
      const seal = FateSealSystem.createFateSealInstance(
        FATE_SEALS.seal_of_fortitude
      )
      expect(game.applyFateSeal(seal, 'pack_open', [target.id])).toBe(true)
      expect(
        game.getState().wallTemplate.find((tile) => tile.id === target.id)
          ?.enhancement
      ).toBe(EnhancementType.Steel)

      const acquired = new Tile(suit, 1, `reward-wall-acquired-${id}`)
      expect(game.addTileToWall(acquired)).toBe(true)
      expect(acquired.enhancement).toBe(EnhancementType.None)
      const template = json(game.getState().wallTemplate)
      const restored = resume(game)
      const completedRound = restored.getState().currentRound
      restored.exitShop()
      const state = restored.getState()
      expect(state.phase).toBe('gameplay')
      expect(state.currentRound).toBe(completedRound + 1)
      expect(state.tableStyleId).toBe(id)
      expect(json(state.wallTemplate)).toEqual(template)
      expect(state.wallTemplate).toHaveLength(145)
      expect(
        state.wallTemplate.filter((tile) => tile.enhancement === mark)
      ).toHaveLength(count - 1)

      // Both edited/acquired honors must participate in the next shuffled wall,
      // not merely survive in a template that was ignored by the dealer.
      const shuffled = [
        ...state.wall,
        ...state.deadWall,
        ...state.summerReserve,
      ]
      expect(shuffled.find((tile) => tile.id === target.id)?.enhancement).toBe(
        EnhancementType.Steel
      )
      expect(
        shuffled.find((tile) => tile.id === acquired.id)?.enhancement
      ).toBe(EnhancementType.None)
      for (const tile of state.handTiles) {
        const permanent = state.wallTemplate.find(
          (entry) => entry.id === tile.id
        )!
        expect(tile.modifiers).toEqual(permanent.modifiers)
      }
      // A second save must not reconstitute the table's original enhancements.
      expect(json(resume(restored).getState().wallTemplate)).toEqual(template)
    })
  }
)
