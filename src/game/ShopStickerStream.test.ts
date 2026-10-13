import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TeaHouseSystem,
  type TeaHouseOffering,
} from '../systems/TeaHouseSystem'
import type { Decree } from '../systems/types'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

const STAKES = [1, 2, 3, 4, 5, 6, 7, 8]

// Offering ids include the clock.
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(100)
})

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  vi.restoreAllMocks()
})

const stickersOf = (offer: TeaHouseOffering) =>
  offer.itemType === 'Decree'
    ? ((offer.item as Decree).stickers ?? []).map((s) => s.type)
    : []

const identity = (offer: TeaHouseOffering) => ({
  slotIndex: offer.slotIndex,
  itemType: offer.itemType,
  itemId: offer.item.id,
  edition: offer.edition,
})

const price = (offer: TeaHouseOffering) => ({
  baseCost: offer.baseCost,
  editionCost: offer.editionCost,
  finalCost: offer.finalCost,
  sellValue: offer.sellValue,
})

/** Stakes change stickers only: the same offers at the same prices, except Rental's 1 Gold. */
function expectSameShop(
  white: TeaHouseOffering[],
  staked: TeaHouseOffering[]
): void {
  expect(staked.map(identity)).toEqual(white.map(identity))
  staked.forEach((offer, index) => {
    if (stickersOf(offer).includes('Rental')) expect(offer.baseCost).toBe(1)
    else expect(price(offer)).toEqual(price(white[index]))
  })
}

/** Six visits, every third after a Boss, each followed by three rerolls. */
function seededVisits(seed: number, stake: number): TeaHouseOffering[] {
  runRandom.start(seed)
  const shop = new TeaHouseSystem(stake)
  const seen: TeaHouseOffering[] = []
  for (let visit = 0; visit < 6; visit += 1) {
    const state = shop.generateShop([], visit % 3 === 2)
    seen.push(...state.itemOfferings, ...state.packOfferings)
    if (state.charterOffering) seen.push(state.charterOffering)
    for (let reroll = 0; reroll < 3; reroll += 1)
      seen.push(...shop.rerollItems()!.newState.itemOfferings)
  }
  return seen
}

describe('Stake stickers and the seeded shop', () => {
  it.each([5, 18, 20, 4242])(
    'offers the same Decrees and prices on every Stake for seed %i',
    (seed) => {
      const byStake = STAKES.map((stake) => seededVisits(seed, stake))
      for (const staked of byStake.slice(1)) expectSameShop(byStake[0], staked)
      // The sample must actually exercise every sticker.
      const gold = byStake[7].flatMap(stickersOf)
      expect(new Set(gold)).toEqual(
        new Set(['Eternal', 'Perishable', 'Rental'])
      )
    }
  )

  it('nests stickers: a higher Stake only adds stickers to the same offer', () => {
    const byStake = STAKES.map((stake) => seededVisits(77, stake))
    for (let index = 0; index < 7; index += 1) {
      byStake[index].forEach((offer, slot) => {
        const higher = stickersOf(byStake[index + 1][slot])
        for (const type of stickersOf(offer)) expect(higher).toContain(type)
      })
    }
    // Eternal is the only Stake 4–6 sticker and appears on the same offers.
    expect(byStake[3].map(stickersOf)).toEqual(byStake[5].map(stickersOf))
    expect(byStake[3].flatMap(stickersOf)).toContain('Eternal')
  })

  it('opens the same Tea House from a fresh run on every Stake', () => {
    const open = (stake: number) => {
      const game = new GameOrchestrator()
      game.startNewRun(18, stake)
      const state = game.getState() as OrchestratorState
      state.phase = 'shop'
      state.lastCompletedRoundType = 'Small'
      state.gold = 1000
      expect(game.shop.open()).toBe(true)
      const seen = [
        ...game.shop.state.itemOfferings,
        ...game.shop.state.packOfferings,
      ]
      for (let reroll = 0; reroll < 4; reroll += 1) {
        expect(game.shop.reroll().success).toBe(true)
        seen.push(...game.shop.state.itemOfferings)
      }
      eventBus.clear()
      return structuredClone(seen)
    }
    const white = open(1)
    for (const stake of STAKES.slice(1)) expectSameShop(white, open(stake))
  })

  it('saves the sticker cursor and restores saves that predate it', () => {
    const game = new GameOrchestrator()
    game.startNewRun(18, 8)
    const state = game.getState() as OrchestratorState
    state.phase = 'shop'
    state.lastCompletedRoundType = 'Small'
    state.gold = 1000
    expect(game.shop.open()).toBe(true)
    const snapshot = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    expect(snapshot.random.streams.shopStickers).toBeTypeOf('number')
    const continueShop = () => {
      for (let reroll = 0; reroll < 3; reroll += 1)
        expect(game.shop.reroll().success).toBe(true)
      return structuredClone(game.shop.state.itemOfferings)
    }
    const uninterrupted = continueShop()
    game.restoreRun(snapshot)
    expect(continueShop()).toEqual(uninterrupted)

    // A save from before the sticker stream keeps its shop cursor; stickers
    // then start from the stream's seed-derived origin.
    const legacy = structuredClone(snapshot)
    delete legacy.random.streams.shopStickers
    game.restoreRun(parseClassicRunSnapshot(legacy))
    const resumed = continueShop()
    expect(resumed.map(identity)).toEqual(uninterrupted.map(identity))
    expect(game.captureRun().random.streams.shopStickers).toBeTypeOf('number')
  })
})
