import { afterEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit, getTileIdCounter } from '../core/Tile'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import type { Decree, DecreeEffect, RoundState } from '../systems/types'
import type { TeaHouseOffering } from '../systems/TeaHouseSystem'
import { runRandom } from '../game/RunRandom'
import {
  GameOrchestrator,
  type OrchestratorState,
} from '../game/GameOrchestrator'
import { eventBus } from '../game/EventBus'
import {
  buyObservedDecrees,
  chooseBuildShopPurchase,
  observeShopPlay,
  type ShopPolicyContext,
} from '../../scripts/lib/classic-shop-policy'

afterEach(() => {
  runRandom.reset()
  eventBus.clear()
  vi.restoreAllMocks()
})
const tiles = [4, 5, 6].map(
  (rank) => new Tile(TileSuit.Souzu, rank, `sample-${rank}`)
)
const round: RoundState = {
  actNumber: 2,
  roundNumber: 1,
  roundType: 'Small',
  scoreTarget: 1000,
  currentScore: 0,
  handsPlayed: 0,
  maxHands: 4,
  discardsRemaining: 3,
  maxDiscards: 3,
  isCompleted: false,
  isWon: false,
}
function decree(id: string, effect: DecreeEffect): Decree {
  return {
    id,
    name: id,
    description: id,
    category: 'Scaling',
    rarity: 'LocalEdict',
    cost: 4,
    effect,
  }
}
const chips = (id: string, amount: number) =>
  decree(id, {
    type: 'additive_score',
    trigger: 'Independent',
    description: id,
    basePoints: amount,
  })
const mult = (id: string, amount: number) =>
  decree(id, {
    type: 'multiplicative_score',
    trigger: 'Independent',
    description: id,
    multiplier: amount,
  })
function offer(item: Decree, finalCost = 0): TeaHouseOffering {
  return {
    id: item.id,
    slotIndex: 0,
    itemType: 'Decree',
    item,
    baseCost: finalCost,
    finalCost,
    editionCost: 0,
    sellValue: 2,
    isPurchased: false,
    isLocked: false,
  }
}
function context(system = new DecreeSystem()): ShopPolicyContext {
  return {
    decrees: system.toState(),
    offers: [],
    samples: [
      observeShopPlay(
        tiles,
        new Set(),
        tiles.map((t) => t.id),
        round,
        4
      )!,
    ],
    flowers: { flowers: [], activeBonuses: [], totalEffectiveness: 1 },
    gold: 25,
    basePlays: 4,
  }
}

it('prefers complementary multiplication once the owned build has substantial chips', () => {
  const c = context()
  c.offers = [offer(chips('chips', 60)), offer(mult('mult', 2))]
  expect(chooseBuildShopPurchase(c)?.offerId).toBe('chips')
  const owned = new DecreeSystem()
  owned.acquireDecree(chips('owned-chips', 200))
  expect(
    chooseBuildShopPurchase({ ...c, decrees: owned.toState() })?.offerId
  ).toBe('mult')
})

it('uses configured plays rather than the stale last-round allowance in a real shop', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem(1)
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
    }).success
  ).toBe(true)
  expect(game.shop.open()).toBe(true)
  state.gold = 25
  state.handsAllowance = 7
  const offers = game.shop.state.itemOfferings.slice(0, 2)
  const items = [
    chips('chips', 20),
    decree('draw3', {
      type: 'draw',
      trigger: 'Passive',
      description: 'Three extra plays',
      additionalDraws: 3,
    }),
  ]
  offers.forEach((entry, index) =>
    Object.assign(entry, {
      ...offer(items[index]),
      id: entry.id,
    })
  )
  const purchase = vi.spyOn(game.shop, 'purchase')
  // With four base plays: 45*7 > 65*4. With stale seven: 45*10 < 65*7.
  expect(buyObservedDecrees(game, context().samples, offers)).toEqual({
    purchases: 1,
    sold: 0,
  })
  expect(purchase).toHaveBeenNthCalledWith(1, offers[1].id)
  expect(state.decreeSystem.getOwnedDecrees().map((d) => d.id)).toEqual([
    'draw3',
  ])
})

it('does not credit a gated suit bonus that recent observed plays do not satisfy', () => {
  const wrongSuit = mult('pinzu', 100)
  if (wrongSuit.effect.type === 'multiplicative_score')
    wrongSuit.effect.requires = 'all_pinzu'
  expect(
    chooseBuildShopPurchase({
      ...context(),
      offers: [offer(wrongSuit), offer(chips('usable', 50), 5)],
    })?.offerId
  ).toBe('usable')
})

it('retains canonical copy and edition contributions', () => {
  const system = new DecreeSystem()
  system.acquireDecree(chips('owned', 200))
  const copy = decree('copy', {
    type: 'copy_decree',
    source: 'left',
    trigger: 'Independent',
    description: 'copy',
  })
  const c = {
    ...context(system),
    offers: [offer(chips('small', 10)), offer(copy)],
  }
  expect(chooseBuildShopPurchase(c)?.offerId).toBe('copy')
  const foil = { ...chips('foil', 0), edition: 'Foil' as const }
  expect(
    chooseBuildShopPurchase({
      ...context(),
      offers: [offer(chips('plain', 0)), offer(foil)],
    })?.offerId
  ).toBe('foil')
})

it.each(['Rental', 'Perishable'] as const)(
  'accounts for %s over the two-round horizon',
  (type) => {
    const limited = {
      ...chips('limited', 100),
      stickers: [{ type, goldPerRound: 3, roundsRemaining: 1 }],
    }
    const c = {
      ...context(),
      gold: 5,
      offers: [offer(limited), offer(chips('permanent', 100))],
    }
    expect(chooseBuildShopPurchase(c)?.offerId).toBe('permanent')
  }
)

it('replaces a weak physical copy without selling its Eternal sibling', () => {
  const system = new DecreeSystem(2)
  const eternal = system.acquireDecree({
    ...chips('duplicate', 1),
    stickers: [{ type: 'Eternal' }],
  })!
  const weak = system.acquireDecree(chips('duplicate', 1))!
  const choice = chooseBuildShopPurchase({
    ...context(system),
    offers: [offer(mult('upgrade', 10))],
  })
  expect(choice?.sellInstanceId).toBe(weak.instanceId)
  expect(choice?.sellInstanceId).not.toBe(eternal.instanceId)
  expect(choice?.reason).toBe('observed-build-replacement')
})

it('does not spend a Negative slot twice or propose impossible flower/price acquisitions', () => {
  const system = new DecreeSystem(0)
  system.acquireDecree({ ...chips('negative', 1), edition: 'Negative' })
  expect(
    chooseBuildShopPurchase({
      ...context(system),
      offers: [offer(mult('upgrade', 10))],
    })
  ).toBeNull()
  expect(
    chooseBuildShopPurchase({
      ...context(),
      offers: [
        offer(mult('expensive', 10), 100),
        offer({ ...mult('flower-gate', 10), flowerRequirement: 4 }),
      ],
    })
  ).toBeNull()
})

it('preserves unpriced survival powers and does not buy unknown multi-part penalties', () => {
  const system = new DecreeSystem(1)
  system.acquireDecree(ALL_DECREES.find((d) => d.id === 'decree-phoenix')!)
  expect(
    chooseBuildShopPurchase({
      ...context(system),
      offers: [offer(mult('upgrade', 100))],
    })
  ).toBeNull()
  const risky = {
    ...mult('risky', 100),
    extraEffects: [
      {
        type: 'rule_modification' as const,
        trigger: 'Passive' as const,
        description: 'unknown penalty',
        ruleId: 'unpriced',
        modification: {},
      },
    ],
  }
  expect(
    chooseBuildShopPurchase({ ...context(), offers: [offer(risky)] })
  ).toBeNull()
})

it('has no access to concealed samples and detaches remembered tiles', () => {
  const ids = tiles.map((t) => t.id)
  expect(observeShopPlay(tiles, new Set([ids[0]]), ids, round, 4)).toBeNull()
  expect(
    observeShopPlay(tiles, new Set(), [ids[0], ids[0]], round, 4)
  ).toBeNull()
  const sample = observeShopPlay(tiles, new Set(), ids, round, 4)!
  expect(sample.tiles[0]).not.toBe(tiles[0])
  expect(
    chooseBuildShopPurchase({
      ...context(),
      samples: [],
      offers: [offer(mult('upgrade', 10))],
    })
  ).toBeNull()
})

it('does not mutate ownership, sample tiles, counters or RNG while ranking', () => {
  runRandom.start(42)
  const c = { ...context(), offers: [offer(chips('candidate', 100))] }
  const before = JSON.stringify(c)
  const random = runRandom.toState()
  const tileCounter = getTileIdCounter()
  const first = chooseBuildShopPurchase(c)
  expect(first).not.toBeNull()
  expect(chooseBuildShopPurchase(c)).toEqual(first)
  expect(JSON.stringify(c)).toBe(before)
  expect(runRandom.toState()).toEqual(random)
  expect(getTileIdCounter()).toBe(tileCounter)
})

it('does not sell an unpriced survival copier or buy another copy of unknown powers', () => {
  const system = new DecreeSystem(2)
  system.acquireDecree(ALL_DECREES.find((d) => d.id === 'decree-phoenix')!)
  const copy = decree('copy', {
    type: 'copy_decree',
    source: 'left',
    trigger: 'Independent',
    description: 'copy',
  })
  system.acquireDecree(copy)
  expect(
    chooseBuildShopPurchase({
      ...context(system),
      offers: [offer(mult('upgrade', 100)), offer({ ...copy, id: 'copy-two' })],
    })
  ).toBeNull()
})

it('does not assign future scoring value to an already-expired offer', () => {
  const expired = {
    ...mult('expired', 100),
    stickers: [{ type: 'Perishable' as const, roundsRemaining: 0 }],
  }
  expect(
    chooseBuildShopPurchase({ ...context(), offers: [offer(expired)] })
  ).toBeNull()
})

it.each(['decree-supernova', 'decree-perfectionist'])(
  'does not misprice final-score threshold %s with the simplified model',
  (id) => {
    const threshold = ALL_DECREES.find((d) => d.id === id)!
    expect(
      chooseBuildShopPurchase({ ...context(), offers: [offer(threshold)] })
    ).toBeNull()
    const system = new DecreeSystem(1)
    system.acquireDecree(threshold)
    expect(
      chooseBuildShopPurchase({
        ...context(system),
        offers: [offer(mult('upgrade', 100))],
      })
    ).toBeNull()
  }
)
