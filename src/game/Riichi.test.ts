import { afterEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { ALL_DECREES } from '../systems/DecreeSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import { THE_EYE, THE_MOUTH } from '../config/mandateDefinitions'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { BOSS_MANDATES } from '../systems/RoundManager'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  vi.restoreAllMocks()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.faceDownTileIds.clear()
  state.gold = 8
  state.targetScore = state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  state.handTiles = [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (r, i) => new Tile(TileSuit.Manzu, r, `m-${i}`)
    ),
    ...[5, 5, 5].map((r, i) => new Tile(TileSuit.Souzu, r, `s-${i}`)),
    new Tile(TileSuit.Dragon, 1, 'spare-0'),
    new Tile(TileSuit.Dragon, 3, 'spare-1'),
  ]
  state.wall = [
    new Tile(TileSuit.Pinzu, 6, 'pair-0'),
    new Tile(TileSuit.Pinzu, 6, 'pair-1'),
    ...Array.from(
      { length: 40 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
    ),
  ]
  state.drawIndex = 0
  state.deadWall = []
  state.summerReserve = []
  state.wallTemplate = [...state.handTiles, ...state.wall]
  const declare = () => game.processAction({ type: 'declareRiichi' })
  const complete = () => {
    expect(
      game.processAction({ type: 'redraw', tileIds: ['spare-0', 'spare-1'] })
        .success
    ).toBe(true)
    return game.getHandTiles().map((t) => t.id)
  }
  return { game, state, declare, complete }
}

it('declares once for 1 Gold, completes through real redraws, and pays the exact preview once', () => {
  const { game, state, declare, complete } = fixture()
  const before = game.captureRun(),
    random = vi.spyOn(runRandom, 'next')
  expect(game.getRiichiState()).toEqual({
    status: 'available',
    reason: null,
    cost: 1,
  })
  expect(game.canPerformAction({ type: 'declareRiichi' })).toBe(true)
  expect(game.getAvailableActions()).toContain('declareRiichi')
  expect(game.captureRun()).toEqual(before)
  expect(random).not.toHaveBeenCalled()
  expect(declare().success).toBe(true)
  expect(state.gold).toBe(7)
  expect(state.riichiStatus).toBe('active')
  const active = game.captureRun()
  expect(declare().success).toBe(false)
  const tactical = state.handTiles.slice(0, 3).map((t) => t.id)
  expect(game.previewScore(tactical)).toBeNull()
  expect(game.processAction({ type: 'play', tileIds: tactical }).success).toBe(
    false
  )
  expect(game.captureRun()).toEqual(active)
  expect(game.getHandBuildingAdvice().kind).toBe('redraw')
  const ids = complete(),
    forecast = game.previewScore(ids)!
  expect(forecast.detectedYaku.map((y) => y.definition.id)).toContain('riichi')
  const ready = game.captureRun()
  expect(game.previewScore(ids)).toEqual(forecast)
  expect(game.captureRun()).toEqual(ready)
  game.restoreRun(parseClassicRunSnapshot(JSON.parse(JSON.stringify(ready))))
  expect(game.previewScore(ids)).toEqual(forecast)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score).toBe(forecast.finalScore)
  expect(game.getState().riichiStatus).toBe('spent')
  expect(declare().success).toBe(false)
  expect(game.processAction({ type: 'abandonRiichi' }).success).toBe(false)
  expect(
    game.canPerformAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 3)
        .map((t) => t.id),
    })
  ).toBe(true)
})

it('abandonment is explicit, nonrefundable, persisted, and restores ordinary scoring', () => {
  const { game, state, declare, complete } = fixture()
  expect(declare().success).toBe(true)
  const listener = vi.fn()
  eventBus.on('riichiChanged', listener)
  expect(game.processAction({ type: 'abandonRiichi' }).success).toBe(true)
  expect(listener).toHaveBeenCalledWith({ status: 'spent' })
  expect(state.gold).toBe(7)
  const saved = game.captureRun()
  game.restoreRun(parseClassicRunSnapshot(JSON.parse(JSON.stringify(saved))))
  expect(declare().success).toBe(false)
  expect(game.captureRun()).toEqual(saved)
  const ids = complete()
  expect(
    game.previewScore(ids)!.detectedYaku.map((y) => y.definition.id)
  ).not.toContain('riichi')
})

it.each(['complete', 'gold', 'hidden', 'open', 'inactive'] as const)(
  'rejects %s declarations without mutations',
  (reason) => {
    const { game, state, declare, complete } = fixture()
    if (reason === 'complete') complete()
    if (reason === 'gold') state.gold = 0
    if (reason === 'hidden') state.faceDownTileIds.add(state.handTiles[0].id)
    if (reason === 'open')
      state.melds = [
        new Meld(MeldType.Sequence, state.handTiles.slice(0, 3), false),
      ]
    if (reason === 'inactive') state.handsRemaining = 0
    const before = game.captureRun()
    expect(game.getRiichiState().reason).toBe(reason)
    expect(declare().success).toBe(false)
    expect(game.captureRun()).toEqual(before)
  }
)

it('does not reveal the shape of hidden tiles through eligibility', () => {
  const { game, state } = fixture()
  state.faceDownTileIds.add(state.handTiles[0].id)
  const search = vi.spyOn(game, 'findCompleteHandSelection')
  expect(game.getRiichiState().reason).toBe('hidden')
  expect(search).not.toHaveBeenCalled()
})

it('refuses a pledge against a fixed-size Boss without charging', () => {
  const { game, state, declare } = fixture()
  state.roundManager.getCurrentRound()!.bossMandate = BOSS_MANDATES.find(
    (m) => m.id === 'the_psychic'
  )!
  const before = game.captureRun()
  expect(game.getRiichiState().reason).toBe('boss')
  expect(declare().success).toBe(false)
  expect(game.captureRun()).toEqual(before)
})

it('settles a pledge on exhaustive defeat without refund or round-end income', () => {
  const { game, state, declare } = fixture()
  expect(declare().success).toBe(true)
  state.handTiles = state.handTiles.slice(0, 1)
  state.wall = []
  expect(
    game.processAction({ type: 'discard', tileId: state.handTiles[0].id })
      .success
  ).toBe(true)
  expect(state.phase).toBe('gameOver')
  expect(state.riichiStatus).toBe('spent')
  expect(state.gold).toBe(7)
  expect(state.lastRoundSummary?.netGoldChange).toBe(0)
})

it('requires a genuine completion, not a Shanten Clemency virtual tile', () => {
  const { game, state, complete, declare } = fixture()
  complete()
  state.handTiles.pop()
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'shanten_clemency')!
  )
  const ids = state.handTiles.map((t) => t.id)
  expect(game.isCompleteHand(ids)).toBe(true)
  expect(declare().success).toBe(true)
  expect(game.findCompleteHandSelection()).toBeNull()
  expect(game.previewScore(ids)).toBeNull()
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(false)
  expect(game.processAction({ type: 'abandonRiichi' }).success).toBe(true)
  expect(game.previewScore(ids)).not.toBeNull()
})

it('activates Pluto and Riichi Devotee only when the declared Yaku survives Boss filtering', () => {
  const { game, state, declare, complete } = fixture()
  expect(declare().success).toBe(true)
  const ids = complete(),
    base = game.previewScore(ids)!
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-riichi-devotee')!
  )
  const devotee = game.previewScore(ids)!
  // Additive Decree Mult raises the separate Court factor from 1 to 4.
  expect(devotee.equation!.multiplier).toBeCloseTo(
    base.equation!.multiplier * 4
  )
  game.setConsumableUnlockResolver(() => true)
  expect(
    game.addCelestialOrb(
      CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
    )
  ).toBe(true)
  expect(
    game.processAction({
      type: 'useOrb',
      orbId: game.getCelestialOrbs()[0].instanceId,
    }).success
  ).toBe(true)
  const pluto = game.previewScore(ids)!
  expect(pluto.equation!.multiplier).toBeCloseTo(
    devotee.equation!.multiplier + 4
  )
  expect(pluto.equation!.points).toBe(devotee.equation!.points + 10)
  state.mandateEffectSystem.activateMandate(THE_EYE, state.handTiles, [])
  state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...state.mandateEffectSystem.toJSON(),
    scoredYakuIds: ['riichi'],
  })
  const blocked = game.previewScore(ids)!
  expect(blocked.detectedYaku.map((y) => y.definition.id)).not.toContain(
    'riichi'
  )
  state.decreeSystem.removeDecree('decree-riichi-devotee')
  expect(game.previewScore(ids)).toEqual(blocked)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score).toBe(blocked.finalScore)
  expect(state.riichiStatus).toBe('spent')
})

it('resets only on a new round/run, never refunds a skipped pledge', () => {
  const { game, state, declare } = fixture()
  expect(declare().success).toBe(true)
  const paid = state.gold
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(state.gold).toBe(paid)
  expect(state.riichiStatus).toBe('available')
  expect(declare().success).toBe(true)
  game.startNewRun(8)
  expect(game.getState().riichiStatus).toBe('available')
})

it('reads legacy saves without inventing a pledge and rejects malformed new state', () => {
  const { game } = fixture(),
    old = game.captureRun()
  delete old.state.riichiStatus
  game.restoreRun(parseClassicRunSnapshot(JSON.parse(JSON.stringify(old))))
  expect(game.getRiichiState().status).toBe('available')
  expect(game.captureRun()).toEqual(old)
  for (const status of [null, true, 1, 'declared', {}]) {
    const bad = JSON.parse(JSON.stringify(old))
    bad.state.riichiStatus = status
    expect(() => parseClassicRunSnapshot(bad)).toThrow(/riichiStatus/)
  }
})

it.each([THE_EYE, THE_MOUTH])(
  '$name previews never spend Boss Yaku eligibility',
  (mandate) => {
    const { game, state, declare, complete } = fixture()
    expect(declare().success).toBe(true)
    const ids = complete()
    state.mandateEffectSystem.activateMandate(mandate, state.handTiles, [])
    const before = game.captureRun(),
      forecast = game.previewScore(ids)!
    expect(game.previewScore(ids)).toEqual(forecast)
    expect(game.captureRun()).toEqual(before)
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.score).toBe(forecast.finalScore)
    expect(state.mandateEffectSystem.toJSON()).not.toEqual(
      before.state.mandateEffectSystem
    )
    expect(state.riichiStatus).toBe('spent')
  }
)

it('does not add Riichi beneath an exclusive natural Yakuman', () => {
  const { game, state, declare } = fixture()
  expect(declare().success).toBe(true)
  state.handTiles = [
    ...[TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu].flatMap((s) =>
      [1, 9].map((r) => new Tile(s, r, `${s}-${r}`))
    ),
    ...[1, 2, 3, 4].map((r) => new Tile(TileSuit.Wind, r, `w-${r}`)),
    ...[1, 2, 3, 3].map((r, i) => new Tile(TileSuit.Dragon, r, `d-${i}`)),
  ]
  const ids = state.handTiles.map((t) => t.id),
    forecast = game.previewScore(ids)!
  expect(forecast.detectedYaku.every((y) => y.definition.tier === 4)).toBe(true)
  expect(forecast.detectedYaku.length).toBeGreaterThan(0)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score).toBe(forecast.finalScore)
  expect(state.riichiStatus).toBe('spent')
})

it('allows genuine Winter completions and enlarged racks without scoring spare tiles', () => {
  const { game, state, declare, complete } = fixture()
  expect(declare().success).toBe(true)
  complete()
  state.handTiles[0] = new Tile(TileSuit.Manzu, 4, state.handTiles[0].id)
  state.seasonSystem.forceSetSeason('Winter', false)
  const spare = new Tile(TileSuit.Wind, 4, 'unused-north')
  state.handTiles.push(spare)
  const ids = game.findCompleteHandSelection()!,
    forecast = game.previewScore(ids)!
  expect(ids).toHaveLength(14)
  expect(ids).not.toContain(spare.id)
  expect(forecast.detectedYaku.map((y) => y.definition.id)).toContain('riichi')
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score).toBe(forecast.finalScore)
  expect(state.handTiles).toContainEqual(spare)
})
