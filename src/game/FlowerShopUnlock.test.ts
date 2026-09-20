import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import {
  ALL_DECREES,
  DecreeSystem,
  CELESTIAL_WILDCARD,
} from '../systems/DecreeSystem'
import { TeaHouseSystem } from '../systems/TeaHouseSystem'
import { BlessingPackSystem } from '../systems/BlessingPackSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import type { BlessingPack, Decree } from '../systems/types'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { DECREE_OMEN } from '../config/omenDefinitions'

const flowerDecrees = ALL_DECREES.filter((d) => d.flowerRequirement === 3)
const otherIds = ALL_DECREES.filter((d) => d.flowerRequirement !== 3).map(
  (d) => d.id
)
const flower = (rank: number, id = `flower-${rank}`) =>
  new Tile(TileSuit.Flower, rank, id)
afterEach(() => {
  vi.restoreAllMocks()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

describe('three-Flower shop unlock', () => {
  it('gates the seven catalogued per-Flower effects, including secondary effects', () => {
    expect(flowerDecrees.map((d) => d.id).sort()).toEqual(
      [
        'decree-flower-friend',
        'decree-garden-keeper',
        'decree-blossom-storm',
        'decree-flower-emperor',
        'decree-nature-bond',
        'decree-eternal-garden',
        'decree-world-tree',
      ].sort()
    )
    expect(CELESTIAL_WILDCARD.flowerRequirement).toBe(2)
    expect(DecreeSystem.getShopCandidates([], undefined, 2)).toContain(
      CELESTIAL_WILDCARD
    )
  })

  it.each([0, 1, 2, 3, 4])(
    'matches collection unlock, candidates and acquisition at %s Flowers',
    (count) => {
      const flowers = new FlowerSystem()
      for (let i = 1; i <= count; i++) flowers.addFlower(flower(i))
      if (count > 0) flowers.addFlower(flower(1, 'duplicate-plum'))
      const actualCount = count
      expect(flowers.getFlowerCount()).toBe(actualCount)
      expect(flowers.areSpecialDecreesUnlocked()).toBe(actualCount >= 3)
      const candidates = DecreeSystem.getShopCandidates(
        otherIds,
        undefined,
        count
      )
      expect(candidates).toEqual(count >= 3 ? flowerDecrees : [])
      for (const decree of flowerDecrees)
        expect(new DecreeSystem().canAcquireDecree(decree, count)).toBe(
          count >= 3
        )
    }
  )

  it('keeps the gate through guarantees, rarity fallback and rerolls, and resets for a new visit', () => {
    const shop = new TeaHouseSystem(1, () => 0)
    const offers = (count: number) =>
      shop
        .generateShop(otherIds, false, {
          flowerCount: count,
          guaranteedItems: [
            { itemType: 'Decree', minDecreeRarity: 'ImperialDecree' },
          ],
        })
        .itemOfferings.filter((o) => o.itemType === 'Decree')
    expect(offers(2)).toEqual([])
    expect(offers(3).length).toBeGreaterThan(0)
    expect(shop.rerollItems(otherIds)).not.toBeNull()
    expect(
      shop
        .getState()
        .itemOfferings.filter((o) => o.itemType === 'Decree')
        .every((o) => flowerDecrees.some((d) => d.id === (o.item as Decree).id))
    ).toBe(true)
    expect(offers(0)).toEqual([])
  })

  it('preserves the unlock on restored rerolls and defaults old visits to locked', () => {
    runRandom.start(82)
    vi.spyOn(runRandom, 'next').mockReturnValue(0)
    const shop = new TeaHouseSystem(1, () => 0)
    shop.generateShop(otherIds, false, { flowerCount: 3 })
    const saved = shop.toSerializedState()
    const restored = TeaHouseSystem.fromSerializedState(saved)
    expect(restored.toSerializedState().flowerCountForVisit).toBe(3)
    restored.rerollItems(otherIds)
    expect(
      restored.getState().itemOfferings.filter((o) => o.itemType === 'Decree')
    ).toHaveLength(2)
    expect(
      restored
        .getState()
        .itemOfferings.filter((o) => o.itemType === 'Decree')
        .every((o) => (o.item as Decree).flowerRequirement === 3)
    ).toBe(true)
    const legacy = { ...saved, flowerCountForVisit: undefined }
    const old = TeaHouseSystem.fromSerializedState(legacy)
    expect(old.toSerializedState().flowerCountForVisit).toBe(0)
    old.rerollItems(otherIds)
    expect(
      old.getState().itemOfferings.filter((o) => o.itemType === 'Decree')
    ).toEqual([])
  })

  it.each([0, 2, 3])(
    'pack fallback never bypasses eligibility at %s Flowers',
    (count) => {
      runRandom.start(81)
      const pack: BlessingPack = {
        id: 'flower-pack',
        type: 'Decree',
        size: 'Mega',
        cost: 8,
        choiceCount: 30,
        selectCount: 1,
      }
      const contents = new BlessingPackSystem().generateOfferingsForPacks(
        [pack],
        {
          flowerCount: count,
          ownedDecreeIds: otherIds,
        }
      )[0].contents
      expect(contents).toHaveLength(30)
      for (const content of contents)
        expect(
          (content.data as Decree).flowerRequirement ?? 0
        ).toBeLessThanOrEqual(count)
      if (count >= 3)
        expect(
          contents.some((c) => (c.data as Decree).flowerRequirement === 3)
        ).toBe(true)
    }
  )

  it('a real third Flower draw enables a deferred paid Omen and purchasable shop reward', () => {
    const game = new GameOrchestrator()
    game.startNewRun(1)
    const state = game.getState() as OrchestratorState
    state.flowerSystem.clear()
    state.flowerSystem.addFlower(flower(1))
    state.flowerSystem.addFlower(flower(2))
    // Catalog-exhaustion fixture: only the newly unlockable Decrees remain.
    for (const decree of ALL_DECREES.filter((d) => d.flowerRequirement !== 3)) {
      if (state.decreeSystem.getOwnedDecrees().some((d) => d.id === decree.id))
        continue
      state.decreeSystem.addSlot()
      state.decreeSystem.acquireDecree(decree)
    }
    state.decreeSystem.addSlot()
    state.phase = 'shop'
    state.gold = 100
    const tag = useOmenStore.getState().addOmen(DECREE_OMEN)!
    expect(game.shop.open()).toBe(true)
    expect(state.gold).toBe(100)
    expect(
      useOmenStore.getState().activeTags.some((t) => t.id === tag.id)
    ).toBe(true)
    expect(game.shop.close()).toBe(true)
    state.phase = 'gameplay'
    state.handTiles = state.handTiles.slice(0, 10)
    state.wall = [flower(3), new Tile(TileSuit.Pinzu, 4, 'live-tail')]
    state.drawIndex = 0
    state.deadWall = [new Tile(TileSuit.Pinzu, 5, 'replacement')]
    state.seasonSystem.clear()
    expect(game.processAction({ type: 'draw' }).success).toBe(true)
    expect(state.flowerSystem.getFlowerCount()).toBe(3)
    state.phase = 'shop'
    expect(game.shop.open()).toBe(true)
    expect(state.gold).toBe(95)
    const offer = game.shop.state.itemOfferings.find(
      (o) => o.itemType === 'Decree'
    )!
    expect((offer.item as Decree).flowerRequirement).toBe(3)
    expect(['ImperialDecree', 'HeavenlyOrdinance']).toContain(
      (offer.item as Decree).rarity
    )
    expect(game.shop.purchase(offer.id).success).toBe(true)
    expect(state.gold).toBe(95 - offer.finalCost)
    expect(
      state.decreeSystem
        .getOwnedDecrees()
        .some((d) => d.id === (offer.item as Decree).id)
    ).toBe(true)
    expect(
      useOmenStore.getState().activeTags.some((t) => t.id === tag.id)
    ).toBe(false)
  })
})
