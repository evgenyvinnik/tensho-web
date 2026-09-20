import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit, FlowerType, SeasonType } from '../core/Tile'
import { FlowerSystem } from '../systems/FlowerSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import type { SeasonVariant } from '../systems/types'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function stack(...entries: (SeasonVariant | [SeasonVariant, true])[]) {
  const seasons = new SeasonSystem()
  const seasonStack = entries.map((entry, index) => {
    const single = new SeasonSystem()
    single.forceSetSeason(
      typeof entry === 'string' ? entry : entry[0],
      typeof entry !== 'string'
    )
    return { ...single.getActiveSeason()!, id: `season-${index}` }
  })
  return SeasonSystem.fromState({
    ...seasons.toState(),
    seasonStack,
    activeSeason: seasonStack.at(-1) ?? null,
  })
}

function flowers(...types: FlowerType[]) {
  const system = new FlowerSystem()
  for (const type of types)
    system.addFlower(new Tile(TileSuit.Flower, type, `flower-${type}`))
  return system
}

describe('Chrysanthemum shields concealed plays from normal Winter', () => {
  it.each([true, false])(
    'applies the documented exception only when concealed=%s',
    (isConcealed) => {
      const seasons = stack('Winter', 'Summer', 'Winter', 'Autumn')
      const context = {
        isConcealed,
        flowers: flowers(FlowerType.Chrysanthemum).getCollection(),
      }
      const before = JSON.stringify(seasons.toState())
      const result = seasons.applySeasonModifiers(context)
      expect(result.scoreMultiplier).toBeCloseTo(
        isConcealed ? 1.3 : 1.3 * 0.75 ** 2
      )
      expect(result.yakuBonus).toBeCloseTo(0.2)
      expect(seasons.calculateScoreModifier()).toBeCloseTo(1.3 * 0.75 ** 2)
      expect(JSON.stringify(seasons.toState())).toBe(before)
    }
  )

  it.each([
    { label: 'no Flowers', types: [] },
    {
      label: 'all other Flowers',
      types: [FlowerType.Plum, FlowerType.Orchid, FlowerType.Bamboo],
    },
  ])('does not grant the exception to $label', ({ types }) => {
    const seasons = stack('Winter')
    const context = {
      isConcealed: true,
      flowers: flowers(...types).getCollection(),
    }
    expect(seasons.applySeasonModifiers(context).scoreMultiplier).toBe(0.75)
  })

  it('honors effective Drought suppression and preserves corrupted effects when protected', () => {
    const seasons = stack(
      'Winter',
      ['Summer', true],
      ['Winter', true],
      ['Autumn', true]
    )
    seasons.onDiscard()
    seasons.onDiscard()
    const context = {
      isConcealed: true,
      flowers: flowers(FlowerType.Chrysanthemum).getCollection(),
    }
    expect(seasons.applySeasonModifiers(context)).toMatchObject({
      scoreMultiplier: 0.75,
      flowersSuppressed: true,
      decreeModifier: 0.5,
      decayPenalty: 20,
    })
    expect(
      seasons.applySeasonModifiers(context, { flowersSuppressed: false })
    ).toMatchObject({
      scoreMultiplier: 1,
      flowersSuppressed: false,
      decreeModifier: 0.5,
      decayPenalty: 20,
    })
  })

  it('does not multiply protection with duplicate Flowers or retain it after removing the Flower', () => {
    const seasons = stack('Winter', 'Winter')
    const collection = flowers(
      FlowerType.Chrysanthemum,
      FlowerType.Chrysanthemum
    )
    expect(
      seasons.applySeasonModifiers({
        isConcealed: true,
        flowers: collection.getCollection(),
      }).scoreMultiplier
    ).toBe(1)
    collection.clear()
    expect(
      seasons.applySeasonModifiers({
        isConcealed: true,
        flowers: collection.getCollection(),
      }).scoreMultiplier
    ).toBe(0.75 ** 2)
    seasons.clear()
    expect(
      seasons.applySeasonModifiers({
        isConcealed: true,
        flowers: collection.getCollection(),
      }).scoreMultiplier
    ).toBe(1)
  })
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(1)
  const state = game.getState() as OrchestratorState
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((decree) => state.decreeSystem.removeDecree(decree.id))
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.handTiles = [
    ...[4, 5, 6].map((rank) => new Tile(TileSuit.Souzu, rank, `play-${rank}`)),
    ...Array.from(
      { length: 11 },
      (_, index) => new Tile(TileSuit.Pinzu, (index % 9) + 1, `hand-${index}`)
    ),
  ]
  state.wall = Array.from(
    { length: 40 },
    (_, index) => new Tile(TileSuit.Manzu, (index % 9) + 1, `wall-${index}`)
  )
  state.deadWall = [new Tile(TileSuit.Pinzu, 9, 'replacement')]
  state.summerReserve = []
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state }
}

const playIds = ['play-4', 'play-5', 'play-6']

describe('Winter interaction through authoritative scoring', () => {
  it.each(['pair', 'complete hand'])(
    'protects a concealed %s without removing other Flower or Summer bonuses',
    (shape) => {
      const { game, state } = fixture()
      state.flowerSystem = flowers(
        FlowerType.Plum,
        FlowerType.Orchid,
        FlowerType.Chrysanthemum,
        FlowerType.Bamboo
      )
      state.handTiles = [
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
          (rank, index) => new Tile(TileSuit.Souzu, rank, `suit-${index}`)
        ),
        ...[6, 6, 6].map(
          (rank, index) => new Tile(TileSuit.Manzu, rank, `triplet-${index}`)
        ),
        ...[5, 5].map(
          (rank, index) => new Tile(TileSuit.Pinzu, rank, `pair-${index}`)
        ),
      ]
      const ids = (
        shape === 'pair' ? state.handTiles.slice(-2) : state.handTiles
      ).map((tile) => tile.id)
      state.seasonSystem = stack('Summer')
      const neutral = game.previewScore(ids)!.finalScore
      state.seasonSystem = stack('Winter', 'Summer', 'Winter')
      expect(game.previewScore(ids)!.finalScore).toBe(neutral)
      expect(state.flowerSystem.getCollection().totalEffectiveness).toBe(2)
      const before = state.score
      expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
        true
      )
      expect(state.score - before).toBe(neutral)
    }
  )

  it('collects Chrysanthemum through a real redraw and previews/pays the Winter-free score', () => {
    const { game, state } = fixture()
    state.seasonSystem = stack('Winter', 'Winter')
    state.wall.unshift(
      new Tile(TileSuit.Flower, FlowerType.Chrysanthemum, 'drawn-chrysanthemum')
    )
    expect(
      game.processAction({ type: 'redraw', tileIds: ['hand-0'] }).success
    ).toBe(true)
    expect(state.flowerSystem.hasFlowerType('Chrysanthemum')).toBe(true)
    const before = JSON.stringify({
      season: state.seasonSystem.toState(),
      flowers: state.flowerSystem.getCollection(),
      wall: state.wall,
      dead: state.deadWall,
      draw: state.drawIndex,
      score: state.score,
    })
    const protectedScore = game.previewScore(playIds)!.finalScore
    expect(game.previewScore(playIds)!.finalScore).toBe(protectedScore)
    expect(
      JSON.stringify({
        season: state.seasonSystem.toState(),
        flowers: state.flowerSystem.getCollection(),
        wall: state.wall,
        dead: state.deadWall,
        draw: state.drawIndex,
        score: state.score,
      })
    ).toBe(before)
    const winter = state.seasonSystem
    state.seasonSystem = stack()
    const neutralScore = game.previewScore(playIds)!.finalScore
    state.seasonSystem = winter
    expect(protectedScore).toBe(neutralScore)
    const score = state.score
    const hands = state.handsRemaining
    expect(game.processAction({ type: 'play', tileIds: playIds }).success).toBe(
      true
    )
    expect(state.score - score).toBe(neutralScore)
    expect(state.handsRemaining).toBe(hands - 1)
    expect(state.seasonSystem.getSeasonStack()).toHaveLength(2)
  })

  it('uses the same Drought and active-Decree protection decision as the Flora inspector', () => {
    const { game, state } = fixture()
    state.flowerSystem = flowers(
      FlowerType.Plum,
      FlowerType.Orchid,
      FlowerType.Chrysanthemum
    )
    const protector = ALL_DECREES.find(
      (decree) => decree.id === 'decree-eternal-garden'
    )!
    expect(state.decreeSystem.canAcquireDecree(protector, 3)).toBe(true)
    expect(state.decreeSystem.acquireDecree(protector)).not.toBeNull()
    state.seasonSystem = stack(['Summer', true])
    const neutral = game.previewScore(playIds)!.finalScore
    state.seasonSystem = stack(['Summer', true], 'Winter', 'Winter')
    expect(game.getFloraState()).toMatchObject({
      flowersSuppressed: false,
      flowersProtected: true,
    })
    expect(game.previewScore(playIds)!.finalScore).toBe(neutral)
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds: [protector.id],
    })
    expect(game.getFloraState()).toMatchObject({
      flowersSuppressed: true,
      flowersProtected: false,
    })
    const suppressed = game.previewScore(playIds)!.finalScore
    state.flowerSystem.clear()
    expect(game.previewScore(playIds)!.finalScore).toBe(suppressed)
    const before = state.score
    expect(game.processAction({ type: 'play', tileIds: playIds }).success).toBe(
      true
    )
    expect(state.score - before).toBe(suppressed)
  })

  it('retains the Flower but clears the Winter stack at a real round boundary', () => {
    const { game, state } = fixture()
    state.flowerSystem = flowers(FlowerType.Chrysanthemum)
    state.seasonSystem.addSeason(Tile.createSeason(SeasonType.Winter, 'winter'))
    const protectedScore = game.previewScore(playIds)!.finalScore
    state.seasonSystem.clear()
    expect(game.previewScore(playIds)!.finalScore).toBe(protectedScore)
    state.seasonSystem.addSeason(
      Tile.createSeason(SeasonType.Winter, 'winter-again')
    )
    expect(game.processAction({ type: 'skip' }).success).toBe(true)
    expect(state.seasonSystem.getSeasonStack()).toHaveLength(0)
    expect(state.flowerSystem.hasFlowerType('Chrysanthemum')).toBe(true)
  })
})
