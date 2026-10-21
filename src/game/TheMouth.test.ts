import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { DEFAULT_MODIFIERS, SealType } from '../core/TileModifier'
import { THE_FLINT, THE_MOUTH } from '../config/mandateDefinitions'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

const PAIR = ['pair-0', 'pair-1']
const SEQUENCE = ['seq-0', 'seq-1', 'seq-2']
const OTHER_PAIR = ['pair-2', 'pair-3']
// 234m 456m 678p 345s 66s: Menzen Tsumo, Tanyao and Pinfu.
const MAHJONG = ([
  [TileSuit.Manzu, 2],
  [TileSuit.Manzu, 3],
  [TileSuit.Manzu, 4],
  [TileSuit.Manzu, 4],
  [TileSuit.Manzu, 5],
  [TileSuit.Manzu, 6],
  [TileSuit.Pinzu, 6],
  [TileSuit.Pinzu, 7],
  [TileSuit.Pinzu, 8],
  [TileSuit.Souzu, 3],
  [TileSuit.Souzu, 4],
  [TileSuit.Souzu, 5],
  [TileSuit.Souzu, 6],
  [TileSuit.Souzu, 6],
] satisfies [TileSuit, number][]).map(
  ([suit, rank], i) => new Tile(suit, rank, `mj-${i}`)
)

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  for (const d of state.decreeSystem.getOwnedDecrees())
    state.decreeSystem.removeDecree(d.id)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.faceDownTileIds.clear()
  state.targetScore = state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const goldSeal = { ...DEFAULT_MODIFIERS, seal: SealType.Gold }
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 5, 'pair-0'),
    new Tile(TileSuit.Pinzu, 5, 'pair-1'),
    new Tile(TileSuit.Souzu, 2, 'seq-0', false, goldSeal),
    new Tile(TileSuit.Souzu, 3, 'seq-1'),
    new Tile(TileSuit.Souzu, 4, 'seq-2'),
    new Tile(TileSuit.Manzu, 7, 'pair-2'),
    new Tile(TileSuit.Manzu, 7, 'pair-3'),
    ...MAHJONG,
  ]
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Wind, (i % 4) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.deadWall = []
  state.summerReserve = []
  state.wallTemplate = [...state.handTiles, ...state.wall]
  state.mandateEffectSystem.activateMandate(THE_MOUTH, state.handTiles, [])
  const play = (tileIds: string[]) =>
    game.processAction({ type: 'play', tileIds })
  return { game, state, play }
}

describe('The Mouth', () => {
  it('locks the hand type of the first play, and a preview never locks it', () => {
    const { game, state, play } = fixture()
    const sequence = game.previewScore(SEQUENCE)!
    expect(sequence.blockedByMandate).toBeUndefined()
    expect(sequence.finalScore).toBeGreaterThan(0)
    expect(game.previewScore(PAIR)!.finalScore).toBeGreaterThan(0)
    expect(state.mandateEffectSystem.getLockedPattern()).toBeNull()

    const pair = game.previewScore(PAIR)!
    expect(play(PAIR).success).toBe(true)
    expect(state.score).toBe(pair.finalScore)
    expect(state.mandateEffectSystem.getLockedPattern()).toBe('pair')
  })

  it('pays nothing for any other hand type, but the play still spends a Turn', () => {
    const { game, state, play } = fixture()
    expect(play(PAIR).success).toBe(true)
    const score = state.score,
      gold = state.gold,
      turns = state.handsRemaining
    const played: { score: number; blocked?: boolean; pattern: string }[] = []
    eventBus.on('handPlayed', (data) => played.push(data))

    const forecast = game.previewScore(SEQUENCE)!
    expect(forecast).toMatchObject({
      blockedByMandate: true,
      finalScore: 0,
      goldEarned: 0,
      pattern: { id: 'sequence' },
    })
    expect(forecast.equation.total).toBe(0)

    expect(play(SEQUENCE).success).toBe(true)
    expect(state.score).toBe(score)
    // The Gold Seal on the forbidden play pays nothing either.
    expect(state.gold).toBe(gold)
    expect(state.handsRemaining).toBe(turns - 1)
    expect(state.handTiles.some((t) => SEQUENCE.includes(t.id))).toBe(false)
    expect(played).toEqual([
      expect.objectContaining({ pattern: 'sequence', score: 0, blocked: true }),
    ])
    expect(state.mandateEffectSystem.getLockedPattern()).toBe('pair')
  })

  it('keeps paying the locked hand type', () => {
    const { game, state, play } = fixture()
    expect(play(PAIR).success).toBe(true)
    const before = state.score
    const forecast = game.previewScore(OTHER_PAIR)!
    expect(forecast.blockedByMandate).toBeUndefined()
    expect(forecast.finalScore).toBeGreaterThan(0)
    expect(play(OTHER_PAIR).success).toBe(true)
    expect(state.score).toBe(before + forecast.finalScore)
  })

  it('forbids a Mahjong hand after a smaller first play, Yaku and all', () => {
    const { game, state, play } = fixture()
    expect(play(PAIR).success).toBe(true)
    const yaku: string[] = []
    eventBus.on('yakuScored', ({ yakuId }) => yaku.push(yakuId))
    const ids = MAHJONG.map((t) => t.id)
    const forecast = game.previewScore(ids)!
    expect(forecast.pattern.id).toBe('mahjong')
    expect(forecast.blockedByMandate).toBe(true)
    expect(forecast.detectedYaku).toEqual([])
    const before = state.score
    expect(play(ids).success).toBe(true)
    expect(state.score).toBe(before)
    expect(yaku).toEqual([])
  })

  it('lets a Mahjong first play keep every Yaku it earns', () => {
    const { game, state, play } = fixture()
    const ids = MAHJONG.map((t) => t.id)
    const forecast = game.previewScore(ids)!
    expect(forecast.detectedYaku.map((y) => y.definition.id)).toEqual([
      'menzen_tsumo',
      'tanyao',
      'pinfu',
    ])
    expect(play(ids).success).toBe(true)
    expect(state.score).toBe(forecast.finalScore)
    expect(state.mandateEffectSystem.getLockedPattern()).toBe('mahjong')
    expect(game.previewScore(PAIR)!.blockedByMandate).toBe(true)
  })

  it('saves the lock and restores it', () => {
    const { game, play } = fixture()
    expect(play(PAIR).success).toBe(true)
    const snapshot = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    expect(snapshot.state.mandateEffectSystem.lockedPatternId).toBe('pair')
    game.restoreRun(snapshot)
    expect(game.captureRun()).toEqual(snapshot)
    const restored = game.getState() as OrchestratorState
    expect(restored.mandateEffectSystem.getLockedPattern()).toBe('pair')
    expect(game.previewScore(SEQUENCE)!.blockedByMandate).toBe(true)
  })

  it('reads a save from the Yaku-lock rules as an unlocked round', () => {
    const { game } = fixture()
    const legacy = JSON.parse(JSON.stringify(game.captureRun()))
    delete legacy.state.mandateEffectSystem.lockedPatternId
    legacy.state.mandateEffectSystem.firstYakuType = 'menzen_tsumo'
    const snapshot = parseClassicRunSnapshot(legacy)
    expect(snapshot.state.mandateEffectSystem.lockedPatternId).toBeNull()
    expect(snapshot.state.mandateEffectSystem).not.toHaveProperty(
      'firstYakuType'
    )
    expect(snapshot.state.mandateEffectSystem.activeMandate?.effect.type).toBe(
      'single_play_pattern'
    )
  })

  it('rejects a saved lock that names no hand type', () => {
    const { game } = fixture()
    const bad = JSON.parse(JSON.stringify(game.captureRun()))
    bad.state.mandateEffectSystem.lockedPatternId = 'menzen_tsumo'
    expect(() => parseClassicRunSnapshot(bad)).toThrow(/lockedPatternId/)
  })
})

describe('MandateEffectSystem hand-type lock', () => {
  it('allows every hand type without The Mouth, and never locks', () => {
    const system = new MandateEffectSystem()
    expect(system.allowsPlayPattern('pair')).toBe(true)
    system.activateMandate(THE_FLINT, [], [])
    expect(system.allowsPlayPattern('pair')).toBe(true)
    expect(system.allowsPlayPattern('sequence')).toBe(true)
    expect(system.getLockedPattern()).toBeNull()
  })

  it('forgets the lock when the round ends', () => {
    const system = new MandateEffectSystem()
    system.activateMandate(THE_MOUTH, [], [])
    expect(system.allowsPlayPattern('triplet', true)).toBe(true)
    expect(system.getLockedPattern()).toBeNull()
    expect(system.allowsPlayPattern('triplet')).toBe(true)
    expect(system.allowsPlayPattern('pair', true)).toBe(false)
    expect(system.getLockedPattern()).toBe('triplet')
    system.deactivateMandate()
    expect(system.getLockedPattern()).toBeNull()
    system.activateMandate(THE_MOUTH, [], [])
    expect(system.allowsPlayPattern('pair')).toBe(true)
    expect(system.getLockedPattern()).toBe('pair')
  })
})
