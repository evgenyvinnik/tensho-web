import { describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { createSeededRandom, runRandom } from './RunRandom'
import { flowerWeightedWall, resolveTableRules } from './tableStyleRules'
import { Tile, TileSuit, FlowerType, SeasonType } from '../core/Tile'
import { RoundManager } from '../systems/RoundManager'
import { SeasonSystem } from '../systems/SeasonSystem'
import { TeaHouseSystem } from '../systems/TeaHouseSystem'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'

function start(style: string) {
  const game = new GameOrchestrator()
  game.startNewRun(7, 1, style)
  return game
}

function scoringFixture(style: string, tiles: Tile[]) {
  const game = start(style)
  const state = game.getState() as OrchestratorState
  for (const decree of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(decree.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.handTiles = tiles
  state.faceDownTileIds.clear()
  state.targetScore = 1e12
  state.roundManager.getCurrentRound()!.scoreTarget = 1e12
  return game
}

function sequence() {
  return [3, 4, 5].map((rank) => new Tile(TileSuit.Souzu, rank, `test-${rank}`))
}

describe('authoritative table styles', () => {
  it.each(TABLE_STYLE_DEFINITIONS.map((table) => table.id))(
    'captures %s and its modifiers in the run',
    (id) => {
      const state = start(id).getState()
      expect(state.tableStyleId).toBe(id)
      expect(state.tableModifiers).toEqual(resolveTableRules(id).modifiers)
      expect(Object.isFrozen(state.tableModifiers)).toBe(true)
      expect(state.handTiles).toHaveLength(14)
    }
  )

  it('normalizes an unknown legacy ID instead of recording a table that was not applied', () => {
    expect(start('not-a-table').getState().tableStyleId).toBe('green_felt')
  })

  it.each([
    ['green_felt', 5],
    ['red_lacquer', 6],
    ['night_market', 4],
  ] as const)('%s applies its base slot allowance', (id, slots) => {
    const state = start(id).getState()
    expect(state.decreeSystem.getMaxSlots()).toBe(
      slots + state.flowerSystem.getBonusDecreeSlots()
    )
  })

  it('Imperial Gold grants a third, seeded Regional Mandate without replacing the starters', () => {
    const base = start('green_felt').getState().decreeSystem.getOwnedDecrees()
    const royal = start('imperial_gold')
      .getState()
      .decreeSystem.getOwnedDecrees()
    expect(royal).toHaveLength(base.length + 1)
    expect(royal.slice(0, base.length).map((decree) => decree.id)).toEqual(
      base.map((decree) => decree.id)
    )
    expect(royal.at(-1)?.rarity).toBe('RegionalMandate')
    expect(
      start('imperial_gold')
        .getState()
        .decreeSystem.getOwnedDecrees()
        .map((decree) => decree.id)
    ).toEqual(royal.map((decree) => decree.id))
  })

  it('Temple Stone excludes Flowers, retains Seasons and rejects Flower pack additions', () => {
    const game = start('temple_stone')
    const state = game.getState()
    expect(state.wallTemplate.filter((tile) => tile.isFlower)).toHaveLength(0)
    expect(state.wallTemplate.filter((tile) => tile.isSeason)).toHaveLength(4)
    expect(state.wallTemplate).toHaveLength(140)
    expect(state.flowerSystem.getFlowerCount()).toBe(0)
    expect(
      game.addTileToWall(Tile.createFlower(FlowerType.Plum, 'pack-flower'))
    ).toBe(false)
    expect(game.addTileToWall(new Tile(TileSuit.Manzu, 1, 'pack-tile'))).toBe(
      true
    )
  })

  it('Temple Stone boosts the base by 50% and preview equals committed score', () => {
    const tiles = sequence()
    const normal = scoringFixture('green_felt', tiles)
    const temple = scoringFixture('temple_stone', tiles)
    const ids = tiles.map((tile) => tile.id)
    const baseline = normal.previewScore(ids)!
    const forecast = temple.previewScore(ids)!
    expect(forecast.basePoints).toBe(baseline.basePoints * 1.5)
    expect(forecast.finalScore).toBe(Math.floor(baseline.finalScore * 1.5))
    const result = temple.processAction({ type: 'play', tileIds: ids })
    expect(result.success).toBe(true)
    expect(temple.getState().score).toBe(forecast.finalScore)
  })

  it('Dragon’s Den adds +1 to a Yakuman multiplier, but not ordinary tactical plays', () => {
    const tiles = [
      ...[TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu].flatMap((suit) =>
        [1, 9].map((rank) => new Tile(suit, rank, `${suit}-${rank}`))
      ),
      ...[1, 2, 3, 4].map(
        (rank) => new Tile(TileSuit.Wind, rank, `wind-${rank}`)
      ),
      ...[1, 2, 3].map(
        (rank) => new Tile(TileSuit.Dragon, rank, `dragon-${rank}`)
      ),
      new Tile(TileSuit.Manzu, 1, 'orphan-pair'),
    ]
    const base = scoringFixture('green_felt', tiles).previewScore(
      tiles.map((tile) => tile.id)
    )!
    const den = scoringFixture('dragons_den', tiles)
    const forecast = den.previewScore(tiles.map((tile) => tile.id))!
    expect(base.detectedYaku.some((yaku) => yaku.definition.tier === 4)).toBe(
      true
    )
    expect(forecast.yakuMultiplier).toBe(base.yakuMultiplier + 1)
    expect(
      den.processAction({ type: 'play', tileIds: tiles.map((tile) => tile.id) })
        .success
    ).toBe(true)
    expect(den.getState().score).toBe(forecast.finalScore)
    const ordinary = sequence()
    const ids = ordinary.map((tile) => tile.id)
    expect(
      scoringFixture('dragons_den', ordinary).previewScore(ids)?.finalScore
    ).toBe(scoringFixture('green_felt', ordinary).previewScore(ids)?.finalScore)
  })

  it('Night Market discounts actual shop offerings on every visit without compounding', () => {
    const game = start('night_market')
    ;(game.getState() as OrchestratorState).phase = 'shop'
    const modifiers = game.prepareShopVisit()
    expect(modifiers.discountPercentage).toBeCloseTo(20)
    const plain = new TeaHouseSystem(1, createSeededRandom(12)).generateShop(
      [],
      true
    )
    const discounted = new TeaHouseSystem(
      1,
      createSeededRandom(12)
    ).generateShop([], true, modifiers)
    const originals = [
      ...plain.itemOfferings,
      ...plain.packOfferings,
      plain.charterOffering!,
    ]
    const actual = [
      ...discounted.itemOfferings,
      ...discounted.packOfferings,
      discounted.charterOffering!,
    ]
    for (let i = 0; i < actual.length; i++) {
      expect(actual[i].finalCost).toBe(
        Math.max(0, Math.floor(originals[i].finalCost * 0.8))
      )
    }
    expect(game.prepareShopVisit().discountPercentage).toBeCloseTo(20)
  })

  it('Bamboo weights Flower draws without changing the physical collection', () => {
    const flower = Tile.createFlower(FlowerType.Plum, 'flower')
    const ordinary = new Tile(TileSuit.Souzu, 1, 'ordinary')
    expect(flowerWeightedWall([ordinary, flower], 1, () => 0.46)[0]).toBe(
      ordinary
    )
    expect(flowerWeightedWall([ordinary, flower], 1.25, () => 0.46)[0]).toBe(
      flower
    )
    const game = start('bamboo_mat')
    const state = game.getState()
    expect(state.wallTemplate).toHaveLength(144)
    expect(state.wallTemplate.filter((tile) => tile.isFlower)).toHaveLength(4)
    expect(new Set(state.wallTemplate.map((tile) => tile.id)).size).toBe(144)
    expect(
      start('bamboo_mat')
        .getState()
        .wall.map((tile) => tile.id)
    ).toEqual(state.wall.map((tile) => tile.id))
  })

  it('Ghost Parlor enables Act I corruption at the normal minimum probability', () => {
    const roll = vi.spyOn(runRandom, 'next').mockReturnValue(0.19)
    try {
      const ghost = start('ghost_parlor').getState().seasonSystem
      const normal = start('green_felt').getState().seasonSystem
      ghost.clear()
      normal.clear()
      const season = Tile.createSeason(SeasonType.Spring, 'spring')
      expect(normal.addSeason(season)?.isCorrupted).toBe(false)
      expect(ghost.addSeason(season)?.isCorrupted).toBe(true)
      const restored = SeasonSystem.fromState(ghost.toState())
      restored.clear()
      expect(restored.addSeason(season)?.isCorrupted).toBe(true)
      roll.mockReturnValue(0.21)
      ghost.clear()
      expect(ghost.addSeason(season)?.isCorrupted).toBe(false)
    } finally {
      roll.mockRestore()
    }
  })

  it('Dragon targets stay authoritative through Acts, rerolls, saves, and Endless', () => {
    for (const act of [1, 3, 8, 9]) {
      const normal = new RoundManager(4, 7)
      const den = new RoundManager(4, 7, 1.25)
      const baseline = normal.startAct(act)
      const modified = den.startAct(act)
      for (let i = 0; i < 3; i++) {
        expect(modified.rounds[i].scoreTarget).toBeCloseTo(
          baseline.rounds[i].scoreTarget * 1.25,
          -1
        )
      }
      normal.rerollBossMandate()
      den.rerollBossMandate()
      expect(den.getCurrentAct()!.rounds[2].scoreTarget).toBeCloseTo(
        normal.getCurrentAct()!.rounds[2].scoreTarget * 1.25,
        -1
      )
      const restored = RoundManager.fromState(den.toState())
      expect(
        restored.startAct(act + 1).rounds.map((round) => round.scoreTarget)
      ).toEqual(den.startAct(act + 1).rounds.map((round) => round.scoreTarget))
    }
    const state = start('dragons_den').getState()
    expect(state.targetScore).toBe(
      state.roundManager.getCurrentRound()!.scoreTarget
    )
    expect(state.targetScore).toBe(
      start('green_felt').getState().targetScore * 1.25
    )
  })

  it('resets table effects when a new run chooses a different table', () => {
    const game = start('temple_stone')
    game.startNewRun(7, 1, 'green_felt')
    expect(game.getState().tableModifiers.baseScoreMultiplier).toBe(1)
    expect(
      game.getState().wallTemplate.filter((tile) => tile.isFlower)
    ).toHaveLength(4)
  })
})
