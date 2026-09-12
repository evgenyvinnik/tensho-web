import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import {
  DECREE_OMEN,
  ORACLES_OMEN,
  OMEN_OF_CRESCENTS,
  SEAL_OMEN,
  VOID_OMEN,
  BLESSING_PACK_OMEN,
  FOIL_OMEN,
  HOLOGRAPHIC_OMEN,
  NEGATIVE_OMEN,
} from '../config/omenDefinitions'
import { ALL_DECREES } from '../systems/DecreeSystem'
import type { Decree } from '../systems/types'

afterEach(() => {
  eventBus.clear()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

function visit(seed: number) {
  const game = new GameOrchestrator()
  game.startNewRun(seed)
  const state = game.getState() as OrchestratorState
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Small'
  state.gold = 100
  const tag = useOmenStore.getState().addOmen(DECREE_OMEN)!
  expect(tag).not.toBeNull()
  return { game, state, tag }
}

it.each([1, 2, 3, 4, 5, 6])(
  'honors the paid Rare+ guarantee through purchase (seed %s)',
  (seed) => {
    const { game, state, tag } = visit(seed)
    expect(game.shop.open()).toBe(true)
    const offer = game.shop.state.itemOfferings.find(
      (o) => o.itemType === 'Decree'
    )!
    expect(offer).toBeDefined()
    expect(['ImperialDecree', 'HeavenlyOrdinance']).toContain(
      (offer.item as Decree).rarity
    )
    expect(state.gold).toBe(95)
    expect(
      useOmenStore.getState().consumedTags.filter((t) => t.id === tag.id)
    ).toHaveLength(1)
    const firstId = offer.id
    expect(game.shop.open()).toBe(true)
    expect(state.gold).toBe(95)
    expect(game.shop.state.itemOfferings[offer.slotIndex].id).toBe(firstId)
    expect(game.shop.purchase(offer.id).success).toBe(true)
    expect(state.gold).toBe(95 - offer.finalCost)
    expect(
      state.decreeSystem
        .getOwnedDecrees()
        .some((d) => d.id === (offer.item as Decree).id)
    ).toBe(true)
    expect(game.shop.purchase(offer.id).success).toBe(false)
  }
)

it('retains an impossible Rare+ Omen and its tradeoff while other shop Omens settle', () => {
  const { game, state, tag } = visit(7)
  // Explicit catalog-exhaustion fixture, not a claim about ordinary slot capacity.
  for (const decree of ALL_DECREES.filter((d) =>
    ['ImperialDecree', 'HeavenlyOrdinance'].includes(d.rarity)
  )) {
    state.decreeSystem.addSlot()
    expect(state.decreeSystem.acquireDecree(decree)).not.toBeNull()
  }
  useOmenStore.getState().addOmen(ORACLES_OMEN)
  expect(game.shop.open()).toBe(true)
  expect(state.gold).toBe(100)
  expect(useOmenStore.getState().activeTags.some((t) => t.id === tag.id)).toBe(
    true
  )
  expect(
    useOmenStore.getState().consumedTags.some((t) => t.id === tag.id)
  ).toBe(false)
  expect(game.shop.state.currentRerollCost).toBe(0)
  expect(game.shop.reroll().success).toBe(true)
  expect(state.gold).toBe(100)
  const released = ALL_DECREES.find((d) => d.rarity === 'ImperialDecree')!
  state.decreeSystem.removeDecree(released.id)
  expect(game.shop.close()).toBe(true)
  expect(game.shop.open()).toBe(true)
  expect(state.gold).toBe(95)
  expect(useOmenStore.getState().activeTags.some((t) => t.id === tag.id)).toBe(
    false
  )
  expect(
    useOmenStore.getState().consumedTags.filter((t) => t.id === tag.id)
  ).toHaveLength(1)
  expect((game.shop.state.itemOfferings[0].item as Decree).id).toBe(released.id)
})

it('falls back upward, never to Common, when only Legendary Decrees remain eligible', () => {
  const { game, state } = visit(8)
  for (const decree of ALL_DECREES.filter(
    (d) => d.rarity === 'ImperialDecree'
  )) {
    state.decreeSystem.addSlot()
    state.decreeSystem.acquireDecree(decree)
  }
  game.shop.open()
  expect((game.shop.state.itemOfferings[0].item as Decree).rarity).toBe(
    'HeavenlyOrdinance'
  )
  expect(state.gold).toBe(95)
})

it('fulfills stacked item, pack, and edition guarantees without overwriting each other', () => {
  const { game, state } = visit(9)
  for (const omen of [
    SEAL_OMEN,
    OMEN_OF_CRESCENTS,
    VOID_OMEN,
    BLESSING_PACK_OMEN,
    BLESSING_PACK_OMEN,
    BLESSING_PACK_OMEN,
    FOIL_OMEN,
    HOLOGRAPHIC_OMEN,
    NEGATIVE_OMEN,
  ])
    expect(useOmenStore.getState().addOmen(omen)).not.toBeNull()
  expect(game.shop.open()).toBe(true)
  expect(state.gold).toBe(95)
  const offers = game.shop.state.itemOfferings
  expect(offers.map((o) => o.itemType)).toEqual([
    'Decree',
    'FateSeal',
    'CelestialOrb',
    'VoidScript',
    'Decree',
    'Decree',
  ])
  const decrees = offers.filter((o) => o.itemType === 'Decree')
  expect(decrees.map((o) => o.edition)).toEqual([
    'Foil',
    'Holographic',
    'Negative',
  ])
  expect(decrees.map((o) => o.finalCost)).toEqual([0, 0, 0])
  expect((decrees[0].item as Decree).rarity).toBe('ImperialDecree')
  expect(new Set(offers.map((o) => o.id)).size).toBe(offers.length)
  const packs = game.shop.state.packOfferings
  expect(packs).toHaveLength(3)
  expect(packs.map((p) => [p.finalCost, p.sellValue])).toEqual([
    [0, 0],
    [0, 0],
    [0, 0],
  ])
  expect(game.shop.packOfferings).toHaveLength(3)
  expect(useOmenStore.getState().activeTags).toHaveLength(0)
  expect(useOmenStore.getState().consumedTags).toHaveLength(10)
  for (const pack of packs) {
    expect(game.shop.purchase(pack.id).success).toBe(true)
    expect(game.shop.skipPack().success).toBe(true)
    expect(game.shop.purchase(pack.id).success).toBe(false)
  }
  expect(state.gold).toBe(95)
  // Overflow offers are one-shot rewards, not permanent Charter capacity.
  expect(game.shop.reroll().success).toBe(true)
  expect(game.shop.state.itemOfferings).toHaveLength(2)
  expect(game.shop.close()).toBe(true)
  expect(game.shop.open()).toBe(true)
  expect(game.shop.state.itemOfferings).toHaveLength(2)
  expect(game.shop.state.packOfferings).toHaveLength(2)
  expect(game.shop.state.currentRerollCost).toBe(5)
})

it('retains edition Omens when every Decree is owned and a new run clears pending rewards', () => {
  const { game, state } = visit(10)
  for (const decree of ALL_DECREES) {
    if (state.decreeSystem.getOwnedDecrees().some((d) => d.id === decree.id))
      continue
    state.decreeSystem.addSlot()
    state.decreeSystem.acquireDecree(decree)
  }
  const editionTag = useOmenStore.getState().addOmen(NEGATIVE_OMEN)!
  expect(game.shop.open()).toBe(true)
  expect(state.gold).toBe(100)
  expect(
    useOmenStore.getState().activeTags.some((t) => t.id === editionTag.id)
  ).toBe(true)
  game.startNewRun(11)
  expect(useOmenStore.getState().activeTags).toHaveLength(0)
  expect(useOmenStore.getState().consumedTags).toHaveLength(0)
})
