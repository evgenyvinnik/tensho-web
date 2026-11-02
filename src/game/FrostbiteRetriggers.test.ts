import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType } from '../core/TileModifier'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { redFiveSystem } from '../systems/RedFiveSystem'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'

afterEach(() => {
  redFiveSystem.disable()
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
})

it('keeps native red-five chips while weakening extra copies', () => {
  const f = fixture(2)
  redFiveSystem.enable()
  f.state.handTiles[0] = new Tile(TileSuit.Souzu, 5, 'play-4', true)
  f.add()
  const result = f.pay()
  expect(result.redFiveChips).toBe(62.5) // 50 native, 50 extra × one quarter
})

it('repeats one saved Lucky roll and never draws for it during scoring', () => {
  const f = fixture(1)
  f.add()
  f.state.handTiles[0] = f.state.handTiles[0].withEnhancement(
    EnhancementType.Lucky
  )
  f.state.luckyRolls = { 'play-4': { multiplier: 2, points: 40 } }
  const random = vi.spyOn(runRandom, 'next')
  const paid = f.pay()
  // Echo Stone repeats the same roll, at half strength under one Frostbite.
  expect(paid.modifierChips).toBe(40 + 40 * 0.5)
  expect(paid.modifierMultiplier).toBe(2 + (2 * 2 - 2) * 0.5)
  expect(paid.finalScore).toBe(Math.floor((15 + 5 * 0.5 + 30 + 60) * 3))
  expect(paid.goldEarned).toBe(0)
  expect(
    random.mock.calls.filter(([stream]) => stream === 'modifiers')
  ).toHaveLength(0)
})

it.each([
  (tile: Tile) => tile.withEnhancement(EnhancementType.Lucky),
  (tile: Tile) => tile.withEnhancement(EnhancementType.Gold),
])('does not pay suppressed physical tile repeats', (modify) => {
  const f = fixture(1)
  f.add()
  f.state.handTiles[0] = modify(f.state.handTiles[0])
  f.state.luckyRolls = { 'play-4': { multiplier: 2, points: 100 } }
  f.state.debuffSystem.debuffTile('play-4', {
    type: 'mandate',
    mandateId: 'test',
  })
  const result = f.pay()
  expect(result.tilePoints).toBe(10)
  expect(result.modifierChips).toBe(0)
  expect(result.modifierMultiplier).toBe(1)
  expect(result.goldEarned).toBe(0)
})

it('keeps a binary Phoenix rescue, its consumption and capacity unchanged under Frostbite', () => {
  const f = fixture(2)
  const phoenix = f.state.decreeSystem.acquireDecree({
    ...ALL_DECREES.find((d) => d.id === 'decree-phoenix')!,
    edition: 'Negative',
  })!
  f.add('decree-wide-grip')
  expect(f.state.decreeSystem.getMaxSlots()).toBe(6)
  expect(f.state.decreeSystem.getHandSizeBonus()).toBe(1)
  f.state.handsRemaining = 1
  expect(f.game.processAction({ type: 'play', tileIds: f.ids }).success).toBe(
    true
  )
  expect(f.state.phase).toBe('shop')
  expect(
    f.state.decreeSystem.getOwnedDecree(phoenix.instanceId!)
  ).toBeUndefined()
  expect(f.state.decreeSystem.getMaxSlots()).toBe(5)
})

function retainSuits(f: ReturnType<typeof fixture>) {
  f.state.handTiles.push(
    ...[
      TileSuit.Manzu,
      TileSuit.Pinzu,
      TileSuit.Souzu,
      TileSuit.Wind,
      TileSuit.Dragon,
    ].map((suit, i) => new Tile(suit, 1, `held-${i}`))
  )
  f.state.handTiles.push(new Tile(TileSuit.Manzu, 2, 'held-duplicate-suit'))
}

it.each([0, 1, 2])(
  'settles held-suit Treasure Hunter and copies once on a real win (%s Frostbites)',
  (count) => {
    const f = fixture(count)
    retainSuits(f)
    f.add('decree-blueprint')
    f.add('decree-treasure-hunter')
    const before = json(f.game.captureRun())
    f.game.previewScore(f.ids)
    expect(f.game.captureRun()).toEqual(before)
    f.state.targetScore = 1
    f.state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(f.game.processAction({ type: 'play', tileIds: f.ids }).success).toBe(
      true
    )
    expect(f.state.lastRoundSummary!.decreeGold).toBe(10 * 0.5 ** count)
    expect(f.state.handTiles.map((t) => t.id)).not.toContain('play-4')
    const saved = parseClassicRunSnapshot(json(f.game.captureRun()))
    f.game.restoreRun(saved)
    expect(f.game.captureRun()).toEqual(saved)
  }
)

it('does not invent a suit for empty/bonus-only racks or a disabled Treasure Hunter', () => {
  const f = fixture()
  f.add('decree-blueprint')
  const hunter = f.add('decree-treasure-hunter')
  expect(f.state.decreeSystem.calculateRoundEndGold()).toBe(0)
  expect(
    f.state.decreeSystem.calculateRoundEndGold(undefined, [
      Tile.createFlower(1, 'flower'),
    ])
  ).toBe(0)
  expect(
    f.state.decreeSystem.calculateRoundEndGold(
      new Set([hunter.instanceId!]),
      f.state.handTiles
    )
  ).toBe(0)
})

it('interprets the legacy missing suit condition for copies without mutating the saved inventory', () => {
  const f = fixture()
  f.add('decree-blueprint')
  const hunter = f.add('decree-treasure-hunter')
  if (hunter.effect.type !== 'gold') throw Error('Expected gold')
  hunter.effect = { ...hunter.effect }
  delete hunter.effect.scaleBy
  const before = json(f.state.decreeSystem.toState())
  const loaded = DecreeSystem.fromState(before)
  expect(loaded.calculateRoundEndGold(undefined, f.state.handTiles)).toBe(2)
  expect(loaded.toState()).toEqual(before)
})

it('keeps Treasure Hunter income win-only while final defeat still charges Rental', () => {
  const f = fixture(2)
  retainSuits(f)
  f.state.decreeSystem.acquireDecree({
    ...ALL_DECREES.find((d) => d.id === 'decree-treasure-hunter')!,
    stickers: [{ type: 'Rental', goldPerRound: 3 }],
  })
  const gold = f.state.gold
  f.state.handsRemaining = 1
  expect(f.game.processAction({ type: 'play', tileIds: f.ids }).success).toBe(
    true
  )
  expect(f.state.phase).toBe('gameOver')
  expect(f.state.gold).toBe(gold - 3)
  expect(f.state.lastRoundSummary).toMatchObject({
    decreeGold: 0,
    rentalCost: 3,
  })
})
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
function fixture(frostbites = 0) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem()
  state.mandateEffectSystem.deactivateMandate()
  state.handTiles = [4, 5, 6].map(
    (rank) => new Tile(TileSuit.Souzu, rank, `play-${rank}`)
  )
  state.wall = Array.from(
    { length: 60 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  if (frostbites) {
    state.seasonSystem.forceSetSeason('Winter', true)
    const saved = state.seasonSystem.toState()
    state.seasonSystem = SeasonSystem.fromState({
      ...saved,
      seasonStack: Array.from({ length: frostbites }, (_, i) => ({
        ...saved.seasonStack[0],
        id: `frost-${i}`,
      })),
    })
  }
  const ids = state.handTiles.map((t) => t.id)
  const add = (id = 'decree-echo-stone') =>
    state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === id)!)!
  const pay = () => {
    const before = json(game.captureRun())
    const preview = game.previewScore(ids)!
    expect(game.previewScore(ids)).toEqual(preview)
    expect(game.captureRun()).toEqual(before)
    const score = state.score,
      gold = state.gold
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.score - score).toBe(preview.finalScore)
    expect(state.gold - gold).toBe(preview.goldEarned)
    return preview
  }
  return { game, state, ids, add, pay }
}

it.each([0, 1, 2])(
  'pays fractional face and Bonus Edition repeats with %s Frostbites',
  (count) => {
    const f = fixture(count)
    f.state.handTiles[0] = f.state.handTiles[0].withEnhancement(
      EnhancementType.Bonus
    )
    f.add()
    const paid = f.pay(),
      strength = 0.5 ** count
    expect(paid.tilePoints).toBe(15 + 5 * strength)
    expect(paid.modifierChips).toBe(30 + 30 * strength)
    expect(paid.structurePoints).toBe(30)
    expect(paid.finalScore).toBe(Math.floor(75 + 35 * strength))
  }
)

it.each([0, 1, 2])(
  'pays fractional Gold Edition repeats with %s Frostbites',
  (count) => {
    const f = fixture(count)
    f.state.handTiles[0] = f.state.handTiles[0].withEnhancement(
      EnhancementType.Gold
    )
    f.add()
    const paid = f.pay(),
      strength = 0.5 ** count
    expect(paid.goldEarned).toBe(Math.floor(3 + 3 * strength))
    expect(paid.finalScore).toBe(Math.floor(45 + 5 * strength))
  }
)

/** A Lucky roll whose ×1.5 is the play's native tile multiplier. */
function luckyFirst(f: ReturnType<typeof fixture>) {
  const [first] = f.state.handTiles
  f.state.handTiles[0] = first.withEnhancement(EnhancementType.Lucky)
  f.state.luckyRolls = { [first.id]: { multiplier: 1.5, points: 20 } }
}

it.each([0, 1, 2])(
  'keeps a native Lucky multiplier intact while scaling echo gain (%s)',
  (count) => {
    const f = fixture(count)
    luckyFirst(f)
    f.add()
    const paid = f.pay(),
      strength = 0.5 ** count
    const native = 1.5,
      full = 1.5 ** 2
    expect(paid.modifierMultiplier).toBeCloseTo(
      native + (full - native) * strength
    )
    expect(paid.finalScore).toBe(
      Math.floor(
        (45 + 5 * strength + 20 + 20 * strength) *
          (native + (full - native) * strength)
      )
    )
  }
)

it('actually pays native tile multipliers without a retrigger Decree', () => {
  const f = fixture(2)
  luckyFirst(f)
  expect(f.pay().finalScore).toBe(Math.floor((45 + 20) * 1.5))
})

it.each([0, 2])(
  'pays the same multiplier layers for a complete hand (%s Frostbites)',
  (count) => {
    const f = fixture(count)
    f.state.handTiles = [
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (rank, i) => new Tile(TileSuit.Souzu, rank, `full-${i}`)
      ),
      ...[6, 6, 6].map(
        (rank, i) => new Tile(TileSuit.Manzu, rank, `triplet-${i}`)
      ),
      ...[5, 5].map((rank, i) => new Tile(TileSuit.Pinzu, rank, `pair-${i}`)),
    ]
    luckyFirst(f)
    const ids = f.state.handTiles.map((t) => t.id)
    f.add()
    const forecast = f.game.previewScore(ids)!
    expect(forecast.structure.kind).toBe('complete')
    expect(forecast.detectedYaku.length).toBeGreaterThan(0)
    expect(forecast.modifierMultiplier).toBe(1.5 + 0.75 * 0.5 ** count)
    // Mahjong's flat pattern Mult joins the Yaku before the tile layer.
    expect(forecast.finalScore).toBe(
      Math.floor(
        (forecast.basePoints + forecast.additiveBonus) *
          (forecast.yakuMultiplier + forecast.pattern.mult) *
          forecast.modifierMultiplier
      )
    )
    const score = f.state.score
    expect(f.game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(f.state.score - score).toBe(forecast.finalScore)
  }
)

it('resolves copies and Echo Dimension before weakening the combined repeat reward', () => {
  const f = fixture(2)
  f.add('decree-blueprint')
  const echo = f.add()
  f.add('decree-echo-dimension')
  expect(f.game.previewScore(f.ids)!.tilePoints).toBe(20) // four repeats × one quarter
  f.state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...f.state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [echo.instanceId!],
  })
  expect(f.pay().tilePoints).toBe(15)
})

it('saves fractional forecasts exactly and restores full rewards when Frostbite clears', () => {
  const f = fixture(2)
  f.add()
  f.state.handTiles[0] = f.state.handTiles[0].withEnhancement(
    EnhancementType.Bonus
  )
  const preview = f.game.previewScore(f.ids)
  const save = parseClassicRunSnapshot(json(f.game.captureRun()))
  f.game.restoreRun(save)
  expect(f.game.previewScore(f.ids)).toEqual(preview)
  f.game.getState().seasonSystem.clear()
  // Full repeat: 20 tile points + 30 sequence + 2 × the Bonus Edition's 30.
  expect(f.game.previewScore(f.ids)!.finalScore).toBe(110)
})

it('makes one Fate Seal and shatters Glass once, preserving the forecast even with repeated rewards', () => {
  const f = fixture(1)
  f.state.handTiles[0] = f.state.handTiles[0].withEnhancement(
    EnhancementType.Glass
  )
  f.add()
  const broken: { id: string; breaks: string }[] = []
  eventBus.on('tilesBroken', (e) =>
    broken.push(...e.tiles.map(({ tile, breaks }) => ({ id: tile.id, breaks })))
  )
  // A made Seal that waits for its wall tiles, so it changes no Gold.
  const made = vi
    .spyOn(FateSealSystem, 'getRandomFateSeal')
    .mockReturnValue(FATE_SEALS.seal_of_glass)
  vi.spyOn(runRandom, 'next').mockReturnValue(0)
  const result = f.pay()
  // Glass adds no ×Mult now; Echo Stone repeats only the face, at half strength.
  expect(result.modifierMultiplier).toBe(1)
  expect(result.finalScore).toBe(Math.floor(45 + 5 * 0.5))
  // The preview names what the play makes, but breaks nothing.
  expect(result.madeConsumables).toEqual([{ type: 'seal', tileId: 'play-4' }])
  expect(result.brokenTiles).toEqual([])
  expect(made).toHaveBeenCalledTimes(1)
  expect(f.state.fateSeals.map((seal) => seal.id)).toEqual(['seal_of_glass'])
  expect(broken).toEqual([{ id: 'play-4', breaks: 'shattered' }])
  // The shattered tile leaves the run instead of reaching the river.
  expect(f.state.discards.map((tile) => tile.id)).toEqual(['play-5', 'play-6'])
})
