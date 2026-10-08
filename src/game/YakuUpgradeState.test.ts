import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import {
  CelestialOrbSystem,
  getCelestialOrbByYaku,
} from '../systems/CelestialOrbSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

it('includes every actual Black Hole upgrade without treating it as an extra scoring family', () => {
  const game = new GameOrchestrator()
  game.setConsumableUnlockResolver(() => true) // These cases exercise already-earned Orbs.
  game.startNewRun(7)
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    getCelestialOrbByYaku('All')!
  )
  expect(game.addCelestialOrb(orb)).toBe(true)
  expect(
    game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
  ).toBe(true)
  const upgrades = game.getYakuUpgradeState()
  expect(upgrades).toHaveLength(12)
  expect(
    upgrades.every(
      (row) =>
        row.level === 2 &&
        row.chips > 0 &&
        row.mult > 0 &&
        row.timesScored === 0
    )
  ).toBe(true)
  expect(upgrades.some((row) => row.yaku === 'All')).toBe(false)
})

it('reports only actual upgrades, never held Orbs or free baseline bonuses', () => {
  const game = new GameOrchestrator()
  game.setConsumableUnlockResolver(() => true)
  game.startNewRun(7)
  expect(game.getYakuUpgradeState()).toEqual([])
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    getCelestialOrbByYaku('SevenPairs')!
  )
  expect(game.addCelestialOrb(orb)).toBe(true)
  expect(game.getYakuUpgradeState()).toEqual([])
  expect(
    game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
  ).toBe(true)
  expect(game.getYakuUpgradeState()).toEqual([
    { yaku: 'SevenPairs', level: 2, chips: 35, mult: 3, timesScored: 0 },
  ])
  const snapshot = game.captureRun()
  const result = game.getYakuUpgradeState()
  result[0].level = 99
  result.pop()
  expect(game.captureRun()).toEqual(snapshot)
  expect(game.getYakuUpgradeState()[0].level).toBe(2)
})

it('tracks real matching scores, preserves forecasts/saves, and resets with the run', () => {
  const game = new GameOrchestrator()
  game.setConsumableUnlockResolver(() => true)
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    getCelestialOrbByYaku('SevenPairs')!
  )
  expect(game.addCelestialOrb(orb)).toBe(true)
  expect(
    game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
  ).toBe(true)
  state.handTiles = [1, 1, 4, 4, 7, 7]
    .map((rank, i) => new Tile(TileSuit.Manzu, rank, `m-${i}`))
    .concat(
      [2, 2, 5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `p-${i}`))
    )
    .concat([8, 8].map((rank, i) => new Tile(TileSuit.Souzu, rank, `s-${i}`)))
    .concat([1, 1].map((rank, i) => new Tile(TileSuit.Wind, rank, `w-${i}`)))
  state.faceDownTileIds.clear()
  state.selectedTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const ids = state.handTiles.map((t) => t.id)
  const before = game.captureRun()
  const forecast = game.previewScore(ids)!
  expect(game.getYakuUpgradeState()[0].timesScored).toBe(0)
  expect(game.captureRun()).toEqual(before)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score).toBe(forecast.finalScore)
  expect(game.getYakuUpgradeState()[0]).toMatchObject({
    level: 2,
    timesScored: 1,
  })
  const snapshot = parseClassicRunSnapshot(
    JSON.parse(JSON.stringify(game.captureRun()))
  )
  const restored = new GameOrchestrator()
  restored.restoreRun(snapshot)
  expect(restored.getYakuUpgradeState()).toEqual(game.getYakuUpgradeState())
  expect(restored.captureRun()).toEqual(snapshot)
  restored.startNewRun(8)
  expect(restored.getYakuUpgradeState()).toEqual([])
})
