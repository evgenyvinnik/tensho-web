import { afterEach, describe, expect, it, vi } from 'vitest'
import { THE_WHEEL } from '../config/mandateDefinitions'
import { ALL_OMENS } from '../config/omenDefinitions'
import { Tile, TileSuit } from '../core/Tile'
import { useOmenStore } from '../stores/omenStore'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { OmenTagSystem } from '../systems/OmenTagSystem'
import { BlessingPackSystem } from '../systems/BlessingPackSystem'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
} from '../systems/TeaHouseSystem'
import { runRandom } from './RunRandom'

// Exercise the actual JSON boundary, not just an in-memory class copy.
function json<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

afterEach(() => {
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
  vi.restoreAllMocks()
})

describe('Classic subsystem snapshots', () => {
  it('restores a pending tile pack with usable rewards and permits only one claim', () => {
    runRandom.start(881)
    const packs = new BlessingPackSystem()
    packs.generateOfferingsForPacks([
      {
        id: 'pending-pack',
        type: 'Tile',
        size: 'Normal',
        cost: 4,
        choiceCount: 3,
        selectCount: 1,
      },
    ])
    expect(packs.openPack('pending-pack')).not.toBeNull()
    expect(packs.selectContent('pending-pack', 1)).toBe(true)
    const saved = json(packs.toState())
    const randomBefore = runRandom.toState()
    const restored = BlessingPackSystem.fromState(saved)
    expect(runRandom.toState()).toEqual(randomBefore)
    expect(restored.openPack('pending-pack')).toBeNull()
    const rewards = restored.confirmSelection('pending-pack')
    expect(rewards).toHaveLength(1)
    expect(rewards[0].data).toBeInstanceOf(Tile)
    expect(rewards[0].data).toEqual(
      packs.toState().currentOfferings[0].contents[1].data
    )
    expect(restored.confirmSelection('pending-pack')).toEqual([])
    const claimed = BlessingPackSystem.fromState(json(restored.toState()))
    expect(claimed.confirmSelection('pending-pack')).toEqual([])
    expect(saved.currentOfferings[0].isResolved).toBe(false)
  })

  it('isolates saved pack contents from later mutation', () => {
    runRandom.start(881)
    const packs = new BlessingPackSystem()
    packs.generateOfferingsForPacks([
      {
        id: 'pending-pack',
        type: 'Tile',
        size: 'Normal',
        cost: 4,
        choiceCount: 3,
        selectCount: 1,
      },
    ])
    const saved = packs.toState()
    saved.currentOfferings[0].contents[0].description = 'snapshot only'
    expect(
      packs.toState().currentOfferings[0].contents[0].description
    ).not.toBe('snapshot only')
    const restored = BlessingPackSystem.fromState(saved)
    saved.currentOfferings[0].contents[0].description = 'changed again'
    expect(restored.toState().currentOfferings[0].contents[0].description).toBe(
      'snapshot only'
    )
  })

  it('keeps the remaining interest bonus without restarting its duration', () => {
    const omens = new OmenTagSystem()
    omens.setSeed(17)
    omens.handleRoundSkip(
      'Small',
      ALL_OMENS.filter((o) => o.id !== 'interest_omen').map((o) => o.id)
    )
    omens.onRoundEnd()
    expect(omens.getOngoingEffects()).toMatchObject({
      interestCapBonus: 2,
      interestBoostRounds: 2,
    })

    const restored = OmenTagSystem.fromState(json(omens.toState()))
    expect(restored.getOngoingEffects()).toEqual(omens.getOngoingEffects())
    restored.onRoundEnd()
    expect(restored.getInterestCapBonus()).toBe(2)
    restored.onRoundEnd()
    expect(restored.getInterestCapBonus()).toBe(0)
  })

  it('does not erase or notify the live Omen store while constructing a restored system', () => {
    const omens = new OmenTagSystem()
    useOmenStore.getState().addTag('double_omen')
    useOmenStore.getState().setLockedSeason('Winter', 'saved-lock')
    useOmenStore.setState({ noInterestRounds: 2, handsPlayedThisRun: 4 })
    const before = useOmenStore.getState()
    const notify = vi.fn()
    const unsubscribe = useOmenStore.subscribe(notify)
    try {
      OmenTagSystem.fromState(json(omens.toState()))
      expect(useOmenStore.getState()).toBe(before)
      expect(notify).not.toHaveBeenCalled()
    } finally {
      unsubscribe()
    }
  })

  it('continues seeded skip rewards without falling back to ambient randomness', () => {
    const omens = new OmenTagSystem()
    omens.setSeed(123)
    omens.handleRoundSkip('Small')
    omens.handleRoundSkip('Large')
    const restored = OmenTagSystem.fromState(json(omens.toState()))
    // Omen instance IDs may use ambient randomness; the chosen reward may not.
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const sample = (system: OmenTagSystem) =>
      Array.from(
        { length: 12 },
        (_, i) => system.handleRoundSkip(i % 2 ? 'Large' : 'Small').omen?.id
      )
    expect(sample(restored)).toEqual(sample(omens))
  })

  it('continues a boss face-down sequence after JSON restoration', () => {
    const mandate = new MandateEffectSystem()
    const tile = new Tile(TileSuit.Manzu, 2, 'tile')
    mandate.setSeed(741)
    mandate.activateMandate(THE_WHEEL, [tile], [])
    for (let i = 0; i < 9; i++) mandate.shouldTileBeFaceDown(tile)
    const restored = MandateEffectSystem.fromJSON(json(mandate.toJSON()))
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const sample = (system: MandateEffectSystem) =>
      Array.from({ length: 80 }, () => system.shouldTileBeFaceDown(tile))
    expect(sample(restored)).toEqual(sample(mandate))
  })

  it('retains the remaining free shop rerolls, without resetting used ones', () => {
    runRandom.start(77)
    const shop = new TeaHouseSystem()
    shop.generateShop([], false, { freeRerolls: 2 })
    expect(shop.rerollItems()?.cost).toBe(0)
    const restored = TeaHouseSystem.fromSerializedState(
      json(shop.toSerializedState())
    )
    expect(restored.getCurrentRerollCost()).toBe(0)
    expect(restored.rerollItems()?.cost).toBe(0)
    expect(restored.getCurrentRerollCost()).toBe(7)
  })

  it('keeps visit discounts on offers generated after a restored reroll', () => {
    const shop = new TeaHouseSystem(1, () => 0)
    shop.generateShop([], false, { discountPercentage: 50 })
    vi.spyOn(runRandom, 'next').mockReturnValue(0)
    vi.spyOn(Date, 'now').mockReturnValue(100)
    const restored = TeaHouseSystem.fromSerializedState(
      json(shop.toSerializedState())
    )
    expect(restored.rerollItems()).toEqual(shop.rerollItems())
  })

  it('rehydrates illustrated wall tiles as usable Tile instances', () => {
    const shop = new TeaHouseSystem(1, () => 0.99)
    shop.applyCharter(
      TEA_HOUSE_BASE_CHARTERS.find((c) => c.id === 'tile_trading')!
    )
    const original = shop.generateShop().itemOfferings
    expect(original.every((o) => o.itemType === 'Tile')).toBe(true)
    const restored = TeaHouseSystem.fromSerializedState(
      json(shop.toSerializedState())
    )
    for (const offering of restored.getState().itemOfferings) {
      expect(offering.item).toBeInstanceOf(Tile)
      expect(offering.item).toEqual(original[offering.slotIndex].item)
    }
  })

  it('resumes exact shop stock, prices and paid/free rerolls without drawing on restore', () => {
    vi.spyOn(Date, 'now').mockReturnValue(100)
    runRandom.start(8231)
    const shop = new TeaHouseSystem(8)
    shop.generateShop([], true, {
      flowerCount: 3,
      freeRerolls: 2,
      discountPercentage: 25,
    })
    const bought = shop.getState().itemOfferings[0]
    expect(shop.purchaseOffering(bought.id).success).toBe(true)
    shop.rerollItems()
    const before = json(runRandom.toState())
    const snapshot = json(shop.toSerializedState())
    const restored = TeaHouseSystem.fromSerializedState(snapshot)
    expect(runRandom.toState()).toEqual(before)
    expect(restored.getState()).toEqual(shop.getState())
    expect(restored.purchaseOffering(bought.id).success).toBe(false)
    // Consumable definitions use the separate global 'consumables' stream too.
    // Restore the whole run cursor between continuations. Future instance IDs
    // are intentionally opaque; existing purchased IDs are checked above.
    const sample = (system: TeaHouseSystem) =>
      JSON.parse(
        JSON.stringify(
          Array.from({ length: 6 }, () => system.rerollItems()),
          (key, value) => (key === 'instanceId' ? '<new-instance>' : value)
        )
      )
    const expected = sample(shop)
    runRandom.restore(before)
    expect(sample(restored)).toEqual(expected)
    expect(snapshot.rerollsThisVisit).toBe(1)
    expect(snapshot.itemOfferings[0].isPurchased).toBe(true)
  })

  it('does not share mutable shop offers with snapshots or other restorations', () => {
    const shop = new TeaHouseSystem(1, () => 0)
    shop.generateShop()
    const snapshot = shop.toSerializedState()
    const restored = TeaHouseSystem.fromSerializedState(snapshot)
    const other = TeaHouseSystem.fromSerializedState(snapshot)
    const id = snapshot.itemOfferings[0].id
    expect(restored.purchaseOffering(id).success).toBe(true)
    expect(shop.getState().itemOfferings[0].isPurchased).toBe(false)
    expect(snapshot.itemOfferings[0].isPurchased).toBe(false)
    expect(other.getState().itemOfferings[0].isPurchased).toBe(false)
  })

  it('reattaches live Charter eligibility rather than serializing or granting unlocks', () => {
    const shop = new TeaHouseSystem(1, () => 0)
    shop.applyCharter(
      TEA_HOUSE_BASE_CHARTERS.find((c) => c.id === 'abundant_stock')!
    )
    const saved = json(shop.toSerializedState())
    const restored = TeaHouseSystem.fromSerializedState(saved, {
      random: () => 0,
      isCharterUnlocked: (id) => id === 'plentiful_stock',
    })
    expect(restored.generateShop([], true).charterOffering?.item.id).toBe(
      'plentiful_stock'
    )
    const locked = TeaHouseSystem.fromSerializedState(saved, {
      random: () => 0,
    })
    expect(locked.generateShop([], true).charterOffering?.item.id).not.toBe(
      'plentiful_stock'
    )
  })

  it('defaults older snapshots without inventing bonuses or new random seeds', () => {
    const omens = new OmenTagSystem()
    const oldOmen = {
      ...omens.toState(),
      randomCursor: undefined,
      interestCapBonus: undefined,
      interestBoostRoundsRemaining: undefined,
    }
    expect(OmenTagSystem.fromState(oldOmen).getInterestCapBonus()).toBe(0)
    expect(OmenTagSystem.fromState(oldOmen).toState().randomCursor).toBeNull()
    const mandate = new MandateEffectSystem()
    const oldMandate = { ...mandate.toJSON(), randomCursor: undefined }
    expect(
      MandateEffectSystem.fromJSON(oldMandate).toJSON().randomCursor
    ).toBeNull()
    const shop = new TeaHouseSystem()
    const oldShop = {
      ...shop.toSerializedState(),
      freeRerollsThisVisit: undefined,
      visitDiscountPercentage: undefined,
    }
    const restored = TeaHouseSystem.fromSerializedState(oldShop)
    expect(restored.getCurrentRerollCost()).toBe(5)
    expect(restored.toSerializedState().visitDiscountPercentage).toBe(0)
  })

  it('does not clear live tags when a staged random cursor is invalid', () => {
    const omens = new OmenTagSystem()
    useOmenStore.getState().addTag('double_omen')
    const before = useOmenStore.getState()
    expect(() =>
      OmenTagSystem.fromState({ ...omens.toState(), randomCursor: -1 })
    ).toThrow()
    expect(useOmenStore.getState()).toBe(before)
  })
})
