import { afterEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { THE_EYE } from '../config/mandateDefinitions'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})
function fixture(orbs: string[] = [], observatory = true) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.faceDownTileIds.clear()
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  game.setCharterUnlockResolver(() => true)
  game.setConsumableUnlockResolver(() => true)
  state.charterSystem.purchaseCharter('star_chart')
  state.charterSystem.purchaseCharter('crystal_lens')
  if (observatory) state.charterSystem.purchaseCharter('observatory')
  for (const id of orbs)
    expect(
      game.addCelestialOrb(
        CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS[id])
      )
    ).toBe(true)
  state.handTiles = [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (r, i) => new Tile(TileSuit.Manzu, r, `straight-${i}`)
    ),
    ...[5, 5, 5].map((r, i) => new Tile(TileSuit.Souzu, r, `triplet-${i}`)),
    ...[6, 6].map((r, i) => new Tile(TileSuit.Pinzu, r, `pair-${i}`)),
  ]
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.deadWall = []
  state.drawIndex = 0
  state.wallTemplate = [...state.handTiles, ...state.wall]
  const ids = state.handTiles.map((t) => t.id)
  return { game, state, ids }
}
it.each([
  [['mercury_orb'], 1],
  [['saturn_orb'], 1.5],
  [['saturn_orb', 'saturn_orb', 'mercury_orb'], 2.25],
  [['black_hole_orb'], 1.5],
] as const)('only rewards matching held Orbs: %j', (orbs, factor) => {
  const base = fixture([], false)
  const { game, ids } = fixture([...orbs])
  const before = game.captureRun()
  const forecast = game.previewScore(ids)!
  expect(forecast.detectedYaku.map((y) => y.definition.id)).toContain('ittsu')
  expect(forecast.finalScore).toBe(
    Math.floor(base.game.previewScore(base.ids)!.finalScore * factor)
  )
  expect(game.captureRun()).toEqual(before)
  expect(game.previewScore(ids)).toEqual(forecast)
  game.restoreRun(parseClassicRunSnapshot(JSON.parse(JSON.stringify(before))))
  expect(game.previewScore(ids)).toEqual(forecast)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score).toBe(forecast.finalScore)
  expect(game.getCelestialOrbs()).toHaveLength(orbs.length)
})
it('rewards a tactical play only through its own pattern family; Black Hole matches any', () => {
  const plain = fixture([], false)
  const sequence = (f: ReturnType<typeof fixture>) =>
    f.game.previewScore(f.ids.slice(0, 3))!.finalScore
  // A Sequence levels the Pinfu family: Saturn (Ittsu) is unrelated.
  expect(sequence(fixture(['saturn_orb']))).toBe(sequence(plain))
  expect(sequence(fixture(['venus_orb']))).toBeGreaterThan(sequence(plain))
  expect(sequence(fixture(['black_hole_orb']))).toBeGreaterThan(
    sequence(plain)
  )
})

it('pays no Orb bonus on a Boss-blocked hand, including Black Hole', () => {
  const { game, state, ids } = fixture(['saturn_orb', 'black_hole_orb'])
  state.mandateEffectSystem.activateMandate(THE_EYE, state.handTiles, [])
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    playedPatternIds: ['mahjong'],
  })
  const blocked = game.previewScore(ids)!
  expect(blocked.blockedByMandate).toBe(true)
  expect(blocked.detectedYaku).toEqual([])
  expect(blocked.finalScore).toBe(0)
})
it('consuming a matching Orb removes its held bonus but preserves the earned family upgrade', () => {
  const { game, ids } = fixture(['saturn_orb'])
  const ordinary = fixture(['saturn_orb'], false)
  for (const target of [game, ordinary.game]) {
    expect(
      target.processAction({
        type: 'useOrb',
        orbId: target.getCelestialOrbs()[0].instanceId,
      }).success
    ).toBe(true)
    expect(target.getState().celestialOrbSystem.getYakuLevel('Ittsu')).toBe(2)
    expect(target.getCelestialOrbs()).toHaveLength(0)
  }
  expect(game.previewScore(ids)!.finalScore).toBe(
    ordinary.game.previewScore(ordinary.ids)!.finalScore
  )
})
it('Frostbite does not halve a Charter bonus and lack of Observatory gives no held bonus', () => {
  const base = fixture([], false)
  const held = fixture(['saturn_orb'], false)
  expect(held.game.previewScore(held.ids)!.finalScore).toBe(
    base.game.previewScore(base.ids)!.finalScore
  )
  for (const target of [base.state, held.state])
    target.seasonSystem.forceSetSeason('Winter', true)
  held.state.charterSystem.purchaseCharter('observatory')
  expect(held.game.previewScore(held.ids)!.finalScore).toBe(
    Math.floor(base.game.previewScore(base.ids)!.finalScore * 1.5)
  )
})
