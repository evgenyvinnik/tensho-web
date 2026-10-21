import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import {
  CelestialOrbSystem,
  CELESTIAL_ORBS,
  type CelestialOrb,
} from '../systems/CelestialOrbSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import type { FateSeal } from '../systems/FateSealSystem'
import { firstSealTargets } from '../gameplay/wallSeals'
import { useOmenStore } from '../stores/omenStore'
import {
  SEAL_OMEN,
  BLESSING_PACK_OMEN,
  FOIL_OMEN,
  HOLOGRAPHIC_OMEN,
  NEGATIVE_OMEN,
} from '../config/omenDefinitions'

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

const definition = (id: string) => ALL_DECREES.find((d) => d.id === id)!

function fixture(...ids: string[]) {
  const game = new GameOrchestrator()
  game.setDecreeUnlockResolver(() => true)
  game.setConsumableUnlockResolver(() => true)
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem(10)
  ids.forEach((id) =>
    expect(state.decreeSystem.acquireDecree(definition(id))).not.toBeNull()
  )
  const suppress = (...disabledDecreeIds: string[]) => {
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds,
    })
  }
  const win = () => {
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    state.handsRemaining = 1 // No unrelated swift-clear Omen.
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
      }).success
    ).toBe(true)
    expect(state.phase).toBe('shop')
  }
  return { game, state, suppress, win }
}

function upgrade(state: OrchestratorState, ...ids: string[]) {
  for (const id of ids)
    expect(
      state.celestialOrbSystem.useOrb(
        CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS[id])
      ).success
    ).toBe(true)
}

function restore(game: GameOrchestrator) {
  const saved = JSON.parse(JSON.stringify(game.captureRun()))
  game.restoreRun(parseClassicRunSnapshot(saved))
  return saved
}

describe('Satellite round settlement', () => {
  it('counts distinct serialized upgraded families, not Orbs used or levels gained; reload never replays payout', () => {
    const f = fixture('satellite')
    upgrade(f.state, 'pluto_orb', 'pluto_orb', 'mercury_orb')
    const before = f.game.captureRun()
    const ids = f.state.handTiles.slice(0, 2).map((t) => t.id)
    f.game.previewScore(ids)
    f.game.previewScore(ids)
    expect(f.game.captureRun()).toEqual(before)
    restore(f.game)
    const state = f.game.getState() as OrchestratorState
    state.targetScore = 1
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    state.handsRemaining = 1
    expect(f.game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      true
    )
    expect(state.lastRoundSummary!.decreeGold).toBe(2)
    expect(state.celestialOrbSystem.getYakuLevel('Pairs')).toBe(3)
    const gold = state.gold
    restore(f.game)
    expect(f.game.getState().gold).toBe(gold)
    const settled = f.game.captureRun()
    expect(f.game.processAction({ type: 'play', tileIds: ids }).success).toBe(
      false
    )
    expect(f.game.captureRun()).toEqual(settled)
  })

  it.each([
    ['none', 4],
    ['source', 0],
    ['copy', 2],
    ['debuffed', 0],
  ] as const)(
    'copies Satellite and honors %s suppression',
    (mode, expected) => {
      const f = fixture('decree-blueprint', 'satellite')
      upgrade(f.state, 'pluto_orb', 'mercury_orb')
      if (mode === 'source') f.suppress('satellite')
      if (mode === 'copy') f.suppress('decree-blueprint')
      if (mode === 'debuffed')
        f.state.decreeSystem.getOwnedDecree('satellite')!.isDebuffed = true
      f.win()
      expect(f.state.lastRoundSummary!.decreeGold).toBe(expected)
    }
  )

  it('pays zero for baseline levels and on a lost round even with upgraded families', () => {
    const baseline = fixture('satellite')
    baseline.win()
    expect(baseline.state.lastRoundSummary!.decreeGold).toBe(0)
    const f = fixture('satellite')
    upgrade(f.state, 'black_hole_orb')
    f.state.targetScore = 1e12
    f.state.roundManager.getCurrentRound()!.scoreTarget = 1e12
    f.state.handsRemaining = 1
    const gold = f.state.gold
    expect(
      f.game.processAction({
        type: 'play',
        tileIds: f.state.handTiles.slice(0, 2).map((t) => t.id),
      }).success
    ).toBe(true)
    expect(f.state.phase).toBe('gameOver')
    expect(f.state.lastRoundSummary!.decreeGold).toBe(0)
    expect(f.state.gold).toBe(gold)
    restore(f.game)
    expect(f.game.getState().gold).toBe(gold)
  })
})

describe('entry-only free Tea House rewards', () => {
  it.each(
    [
      [FOIL_OMEN],
      [HOLOGRAPHIC_OMEN],
      [NEGATIVE_OMEN],
      [FOIL_OMEN, HOLOGRAPHIC_OMEN, NEGATIVE_OMEN],
    ].map((omens) => ({ omens, name: omens.map((o) => o.id).join('+') }))
  )(
    'preserves both free rewards, a Blueprint copy, and $name edition guarantees across reload and purchase',
    ({ omens }) => {
      const f = fixture('decree-blueprint', 'cartomancer', 'astronomer')
      f.win()
      for (const omen of omens)
        expect(useOmenStore.getState().addOmen(omen)).not.toBeNull()
      expect(f.game.shop.open()).toBe(true)
      const offers = f.game.shop.state.itemOfferings
      expect(offers).toHaveLength(3 + omens.length)
      expect(offers.slice(0, 3).map((o) => o.itemType)).toEqual([
        'FateSeal',
        'FateSeal',
        'CelestialOrb',
      ])
      const decrees = offers.filter((o) => o.itemType === 'Decree')
      expect(decrees.map((o) => o.edition)).toEqual(
        omens.map((omen) => {
          if (omen.id === FOIL_OMEN.id) return 'Foil'
          if (omen.id === HOLOGRAPHIC_OMEN.id) return 'Holographic'
          return 'Negative'
        })
      )
      expect(offers.every((o) => o.finalCost === 0 && o.sellValue === 0)).toBe(
        true
      )
      expect(new Set(offers.map((o) => o.id)).size).toBe(offers.length)
      expect(offers.map((o) => o.slotIndex)).toEqual(offers.map((_, i) => i))
      const saved = restore(f.game)
      expect(f.game.shop.open()).toBe(true)
      expect(f.game.captureRun()).toEqual(saved)
      // Purchase appended Decrees and the Orb: none may consume either Seal.
      for (const offer of offers.slice(2))
        expect(f.game.shop.purchase(offer.id).success).toBe(true)
      expect(
        f.game.shop.state.itemOfferings
          .filter((o) => !o.isPurchased)
          .map((o) => o.id)
      ).toEqual(offers.slice(0, 2).map((o) => o.id))
      const bought = restore(f.game)
      expect(f.game.shop.open()).toBe(true)
      for (const offer of offers.slice(2))
        expect(f.game.shop.purchase(offer.id).success).toBe(false)
      expect(f.game.captureRun()).toEqual(bought)
    }
  )

  it('combines copied rewards and stacked Omens without replacing their guarantees', () => {
    const f = fixture('decree-blueprint', 'cartomancer', 'astronomer')
    f.win()
    useOmenStore.getState().addOmen(SEAL_OMEN)
    useOmenStore.getState().addOmen(BLESSING_PACK_OMEN)
    expect(f.game.shop.open()).toBe(true)
    const offers = f.game.shop.state.itemOfferings
    expect(
      offers.slice(1, 4).map((o) => [o.itemType, o.finalCost, o.sellValue])
    ).toEqual([
      ['FateSeal', 0, 0],
      ['FateSeal', 0, 0],
      ['CelestialOrb', 0, 0],
    ])
    expect(offers[0].itemType).toBe('FateSeal')
    expect(offers[0].finalCost).toBeGreaterThan(0) // Existing paid Omen semantics.
    expect(f.game.shop.state.packOfferings[0].finalCost).toBe(0)
    const saved = restore(f.game)
    expect(f.game.shop.open()).toBe(true)
    expect(f.game.captureRun()).toEqual(saved)
  })

  it.each(['cartomancer', 'astronomer'])(
    '%s offers survive failed purchase and reload; claims cannot be replayed',
    (id) => {
      const f = fixture(id)
      f.win()
      expect(f.game.shop.open()).toBe(true)
      const offer = f.game.shop.state.itemOfferings[0]
      expect(offer.finalCost).toBe(0)
      expect(offer.sellValue).toBe(0)
      offer.isLocked = true
      const locked = f.game.captureRun()
      expect(f.game.shop.purchase(offer.id).success).toBe(false)
      expect(f.game.captureRun()).toEqual(locked)
      offer.isLocked = false
      restore(f.game)
      const gold = f.game.getState().gold
      const targets =
        offer.itemType === 'FateSeal'
          ? firstSealTargets(
              offer.item as FateSeal,
              f.game.getSealableWallTiles()
            )
          : undefined
      expect(
        f.game.shop.purchase(offer.id, { type: 'gold' }, targets).success
      ).toBe(true)
      expect(f.game.getState().gold).toBe(gold)
      expect(f.game.shop.visitTotals).toEqual({
        goldSpent: 0,
        itemsPurchased: 1,
      })
      if (offer.itemType === 'CelestialOrb') {
        const orb = offer.item as CelestialOrb
        expect(
          f.game
            .getState()
            .celestialOrbSystem.getYakuLevel(orb.effect.targetYaku)
        ).toBeGreaterThan(1)
      }
      const bought = restore(f.game)
      expect(f.game.shop.open()).toBe(true)
      expect(f.game.shop.purchase(offer.id).success).toBe(false)
      expect(f.game.captureRun()).toEqual(bought)
    }
  )

  it.each(['cartomancer', 'astronomer'])(
    '%s suppression also removes copied offers',
    (id) => {
      const f = fixture('decree-blueprint', id)
      f.win()
      f.suppress(id)
      expect(f.game.shop.open()).toBe(true)
      expect(
        f.game.shop.state.itemOfferings.every((o) => o.finalCost > 0)
      ).toBe(true)
      expect(f.game.shop.close()).toBe(true)
      f.suppress('decree-blueprint')
      expect(f.game.shop.open()).toBe(true)
      expect(
        f.game.shop.state.itemOfferings.filter((o) => o.finalCost === 0)
      ).toHaveLength(1)
      expect(f.game.shop.close()).toBe(true)
      f.suppress()
      f.state.decreeSystem.getOwnedDecree(id)!.isDebuffed = true
      expect(f.game.shop.open()).toBe(true)
      expect(
        f.game.shop.state.itemOfferings.every((o) => o.finalCost > 0)
      ).toBe(true)
    }
  )

  it.each(['cartomancer', 'astronomer'])(
    'buying %s mid-visit preserves stock and activates only at the next entry',
    (id) => {
      const f = fixture()
      f.win()
      f.state.gold = 100
      expect(f.game.shop.open()).toBe(true)
      const offer = f.game.shop.state.itemOfferings[0]
      Object.assign(offer, {
        itemType: 'Decree',
        item: definition(id),
        finalCost: 8,
      })
      expect(f.game.shop.purchase(offer.id).success).toBe(true)
      const stock = f.game.captureRun().shop
      expect(f.game.shop.open()).toBe(true)
      expect(f.game.captureRun().shop).toEqual(stock)
      restore(f.game)
      expect(f.game.shop.open()).toBe(true)
      expect(f.game.captureRun().shop).toEqual(stock)
      expect(f.game.shop.reroll().success).toBe(true)
      expect(
        f.game.shop.state.itemOfferings.every((o) => o.finalCost > 0)
      ).toBe(true)
      f.game.exitShop()
      const state = f.game.getState() as OrchestratorState
      state.targetScore = 1
      state.roundManager.getCurrentRound()!.scoreTarget = 1
      state.handsRemaining = 1
      expect(
        f.game.processAction({
          type: 'play',
          tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
        }).success
      ).toBe(true)
      expect(f.game.shop.open()).toBe(true)
      expect(f.game.shop.state.itemOfferings[0].finalCost).toBe(0)
      expect(f.game.shop.reroll().success).toBe(true)
      expect(
        f.game.shop.state.itemOfferings.every((o) => o.finalCost > 0)
      ).toBe(true)
    }
  )
})
