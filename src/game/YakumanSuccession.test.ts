import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit } from '../core/Tile'
import {
  ALL_DECREES,
  DecreeSystem,
  YAKUMAN_SUCCESSION,
} from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { THE_ARM } from '../config/mandateDefinitions'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { ALL_YAKU as YAKU_DEFINITIONS } from '../rules/YakuDetector'
import { ascendYaku } from '../rules/yakuAscension'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})
const json = <T>(v: T): T => JSON.parse(JSON.stringify(v))
const patterns: Record<string, [TileSuit, number[]][]> = {
  honitsu: [
    [TileSuit.Manzu, [1, 2, 3, 1, 2, 3, 4, 5, 6, 9, 9]],
    [TileSuit.Wind, [1, 1, 1]],
  ],
  chinitsu: [[TileSuit.Manzu, [1, 2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5, 5]]],
  ryanpeikou: [
    [TileSuit.Manzu, [1, 2, 3, 1, 2, 3, 2, 3, 4, 2, 3, 4]],
    [TileSuit.Souzu, [7, 7]],
  ],
  junchan: [
    [TileSuit.Manzu, [1, 2, 3, 7, 8, 9, 1, 1]],
    [TileSuit.Pinzu, [1, 2, 3]],
    [TileSuit.Souzu, [9, 9, 9]],
  ],
  seven_pairs: [
    [TileSuit.Manzu, [1, 1, 2, 2, 4, 4]],
    [TileSuit.Pinzu, [3, 3, 5, 5]],
    [TileSuit.Souzu, [6, 6, 8, 8]],
  ],
}
function fixture(pattern = 'chinitsu', flowers = 2, table = 'green_felt') {
  const game = new GameOrchestrator()
  game.startNewRun(7, 1, table)
  const state = game.getState() as OrchestratorState
  state.flowerSystem = new FlowerSystem()
  state.decreeSystem = new DecreeSystem()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  for (let i = 1; i <= flowers; i++)
    state.flowerSystem.addFlower(Tile.createFlower(i, `flower-${i}`))
  if (flowers >= 2) state.decreeSystem.addSlot()
  state.handTiles = patterns[pattern].flatMap(([suit, ranks], j) =>
    ranks.map((rank, i) => new Tile(suit, rank, `play-${j}-${i}`))
  )
  state.wall = Array.from(
    { length: 70 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const ids = state.handTiles.map((t) => t.id)
  const add = (id = 'yakuman_succession') =>
    state.decreeSystem.acquireDecree(ALL_DECREES.find((d) => d.id === id)!)!
  const pay = () => {
    const preview = game.previewScore(ids)!
    const before = json(game.captureRun())
    expect(game.previewScore(ids)).toEqual(preview)
    expect(game.captureRun()).toEqual(before)
    const score = state.score
    expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.score - score).toBe(preview.finalScore)
    return preview
  }
  return { game, state, ids, add, pay }
}

it.each(Object.keys(patterns))(
  'ascends %s through real detection, preview, payment and Yakuman events',
  (pattern) => {
    const f = fixture(pattern)
    const baseline = f.game.previewScore(f.ids)!
    expect(
      baseline.detectedYaku.find((y) => y.definition.id === pattern)?.definition
        .tier
    ).toBe(3)
    f.add()
    const events: string[] = []
    eventBus.on('yakumanScored', (e) => events.push(e.yakuId))
    const result = f.pay()
    expect(
      result.detectedYaku.find((y) => y.definition.id === pattern)
    ).toMatchObject({
      definition: { tier: 4, ascended: true, multiplier: 4 },
    })
    expect(result.yakuMultiplier).toBeGreaterThan(baseline.yakuMultiplier)
    expect(events).toContain(pattern)
    expect(YAKU_DEFINITIONS.find((y) => y.id === pattern)?.tier).toBe(3)
    expect(
      YAKU_DEFINITIONS.find((y) => y.id === pattern)?.ascended
    ).toBeUndefined()
  }
)

it.each([0, 1, 2, 4])(
  'activates from current ownership, not acquisition history (%s Flowers)',
  (count) => {
    const f = fixture('chinitsu', count)
    f.add()
    expect(
      f.game
        .previewScore(f.ids)!
        .detectedYaku.some((y) => y.definition.ascended)
    ).toBe(count >= 2)
    if (count === 2) {
      f.state.flowerSystem.consumeFlower('flower-1')
      expect(
        f.game
          .previewScore(f.ids)!
          .detectedYaku.some((y) => y.definition.ascended)
      ).toBe(false)
      f.state.flowerSystem.addFlower(Tile.createFlower(1, 'returned-plum'))
      expect(f.pay().detectedYaku.some((y) => y.definition.ascended)).toBe(true)
    }
  }
)

it('preserves awakening-independent activation under Drought, but not a disabling Mandate', () => {
  const f = fixture()
  const owned = f.add()
  f.state.seasonSystem.forceSetSeason('Summer', true)
  expect(
    f.game.previewScore(f.ids)!.detectedYaku.some((y) => y.definition.ascended)
  ).toBe(true)
  f.state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...f.state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [owned.instanceId!],
  })
  expect(f.pay().detectedYaku.some((y) => y.definition.ascended)).toBe(false)
})

it('does not stack copies or let a copied disabled target grant ascension', () => {
  const f = fixture()
  f.add('decree-blueprint')
  const target = f.add()
  const once = f.game.previewScore(f.ids)!
  f.add()
  expect(f.game.previewScore(f.ids)!.yakuMultiplier).toBe(once.yakuMultiplier)
  f.state.decreeSystem.removeDecree(
    f.state.decreeSystem.getOwnedDecrees()[2].instanceId!
  )
  f.state.mandateEffectSystem = MandateEffectSystem.fromJSON({
    ...f.state.mandateEffectSystem.toJSON(),
    disabledDecreeIds: [target.instanceId!],
  })
  expect(f.pay().detectedYaku.some((y) => y.definition.ascended)).toBe(false)
})

it.each([1, 2])(
  'Frostbite weakens only numeric ascension gain (%s stacks)',
  (count) => {
    const f = fixture()
    const base = f.game.previewScore(f.ids)!.yakuMultiplier
    f.add()
    const boosted = f.game.previewScore(f.ids)!.yakuMultiplier
    f.state.seasonSystem.forceSetSeason('Winter', true)
    const state = f.state.seasonSystem.toState()
    f.state.seasonSystem = SeasonSystem.fromState({
      ...state,
      seasonStack: Array.from({ length: count }, (_, i) => ({
        ...state.seasonStack[0],
        id: `frost-${i}`,
      })),
    })
    const result = f.pay()
    expect(result.yakuMultiplier).toBeCloseTo(
      base + (boosted - base) * 0.5 ** count
    )
    expect(result.detectedYaku.some((y) => y.definition.ascended)).toBe(true)
  }
)

it('The Arm prevents ascension; Nexus cannot promote lower-tier candidates into it', () => {
  const f = fixture()
  f.add()
  f.add('decree-yaku-nexus')
  f.state.mandateEffectSystem.activateMandate(
    THE_ARM,
    f.state.handTiles,
    f.state.decreeSystem.getOwnedDecrees()
  )
  expect(f.pay().detectedYaku.some((y) => y.definition.ascended)).toBe(false)
  for (const definition of YAKU_DEFINITIONS.filter((y) => y.tier !== 3)) {
    const detected = { definition, isApplicable: true }
    expect(ascendYaku(detected, true, 3)).toBe(detected)
  }
})

it('ascension satisfies real Yakuman Decree gates without changing Orb families or duplicate IDs', () => {
  const f = fixture()
  f.add('decree-yakuman-blessing')
  const baseline = f.game.previewScore(f.ids)!
  f.add()
  const boosted = f.game.previewScore(f.ids)!
  expect(boosted.finalScore).toBeGreaterThan(baseline.finalScore * 5)
  expect(boosted.detectedYaku.map((y) => y.definition.id)).toEqual(
    baseline.detectedYaku.map((y) => y.definition.id)
  )
  const saved = parseClassicRunSnapshot(json(f.game.captureRun()))
  f.game.restoreRun(saved)
  expect(f.game.captureRun()).toEqual(saved)
  expect(f.game.previewScore(f.ids)).toEqual(boosted)
})

it('offers the distinct mythic item only with sufficient Flowers and preflights catalyst payment', () => {
  expect(DecreeSystem.getShopCandidates([], undefined, 1)).not.toContain(
    YAKUMAN_SUCCESSION
  )
  expect(DecreeSystem.getShopCandidates([], undefined, 2)).toContain(
    YAKUMAN_SUCCESSION
  )
  const f = fixture()
  f.state.targetScore = 1
  f.state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(f.game.processAction({ type: 'play', tileIds: f.ids }).success).toBe(
    true
  )
  f.game.shop.open()
  const offer = f.game.shop.state.itemOfferings[0]
  Object.assign(offer, {
    itemType: 'Decree',
    item: YAKUMAN_SUCCESSION,
    baseCost: 12,
    editionCost: 0,
    finalCost: 12,
    isLocked: false,
    isPurchased: false,
  })
  expect(
    f.game.shop.purchase(offer.id, { type: 'flower', flowerId: 'flower-1' })
  ).toEqual({ success: false, reason: 'flowerRequirement' })
  f.state.flowerSystem.addFlower(Tile.createFlower(3, 'third-flower'))
  expect(
    f.game.shop.purchase(offer.id, { type: 'flower', flowerId: 'third-flower' })
  ).toEqual({ success: true })
  expect(f.state.flowerSystem.getFlowerCount()).toBe(2)
  expect(f.state.decreeSystem.getOwnedDecrees()[0].id).toBe(
    'yakuman_succession'
  )
  expect(f.state.decreeSystem.getOwnedDecrees()[0].sellValue).toBe(0)
})

it('records ascended Seven Pairs only in its original Orb family after payment', () => {
  const f = fixture('seven_pairs')
  f.add()
  const orbs = f.state.celestialOrbSystem
  const before = json(orbs.toState())
  f.game.previewScore(f.ids)
  expect(orbs.toState()).toEqual(before)
  f.pay()
  expect(orbs.getYakuTriggerCount('SevenPairs')).toBe(1)
  expect(orbs.getYakuTriggerCount('Kokushi')).toBe(0)
  expect(orbs.getYakuTriggerCount('All')).toBe(0)
  const saved = parseClassicRunSnapshot(json(f.game.captureRun()))
  f.game.restoreRun(saved)
  expect(f.game.getState().celestialOrbSystem.toState()).toEqual(orbs.toState())
})

it('composes Succession, Nexus and Amplifier before Frostbite scales their combined gain', () => {
  const f = fixture()
  const ordinary = f.game.previewScore(f.ids)!.yakuMultiplier
  f.add()
  const ascended = f.game.previewScore(f.ids)!.yakuMultiplier
  f.add('decree-yaku-nexus')
  const nexus = f.game.previewScore(f.ids)!.yakuMultiplier
  expect(nexus).toBeGreaterThan(ascended)
  f.add('decree-yaku-amplifier')
  const combined = f.game.previewScore(f.ids)!.yakuMultiplier
  expect(combined).toBeGreaterThan(nexus)
  f.state.seasonSystem.forceSetSeason('Winter', true)
  expect(f.pay().yakuMultiplier).toBeCloseTo(
    ordinary + (combined - ordinary) / 2
  )
})

it('preserves natural Yakuman identity, multipliers and paid reveal payload', () => {
  const f = fixture()
  const naturalPattern: [TileSuit, number[]][] = [
    [TileSuit.Manzu, [1, 9, 1]],
    [TileSuit.Pinzu, [1, 9]],
    [TileSuit.Souzu, [1, 9]],
    [TileSuit.Wind, [1, 2, 3, 4]],
    [TileSuit.Dragon, [1, 2, 3]],
  ]
  f.state.handTiles = naturalPattern.flatMap(([suit, ranks], j) =>
    ranks.map((rank, i) => new Tile(suit, rank, `natural-${j}-${i}`))
  )
  const ids = f.state.handTiles.map((t) => t.id)
  const original = f.game.previewScore(ids)!
  expect(
    original.detectedYaku.find((y) => y.definition.id === 'kokushi')
  ).toBeDefined()
  f.add()
  const boosted = f.game.previewScore(ids)!
  expect(boosted.detectedYaku).toEqual(original.detectedYaku)
  expect(boosted.yakuMultiplier).toBe(original.yakuMultiplier)
  const events: unknown[] = []
  eventBus.on('yakumanScored', (event) => events.push(event))
  expect(f.game.processAction({ type: 'play', tileIds: ids }).success).toBe(
    true
  )
  expect(events).toContainEqual({
    yakuId: 'kokushi',
    yakuName: 'Kokushi Musou',
    multiplier: 5,
  })
})

it('applies the table Yakuman bonus to ascension, without amplifying unrelated patterns', () => {
  const f = fixture()
  f.add()
  const baseline = f.game.previewScore(f.ids)!
  expect(
    baseline.detectedYaku.filter((y) => y.definition.ascended)
  ).toHaveLength(1)
  const dragon = fixture('chinitsu', 2, 'dragons_den')
  dragon.add()
  expect(dragon.pay().yakuMultiplier).toBeCloseTo(
    (baseline.yakuMultiplier *
      (4 + dragon.state.tableModifiers.yakumanMultiplierBonus)) /
      4
  )
})
