import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { useOmenStore } from '../stores/omenStore'
import { BlessingPackSystem } from '../systems/BlessingPackSystem'
import type { BlessingPack } from '../systems/types'
import { BOSS_MANDATES } from '../systems/RoundManager'
import { getCelestialOrbsByRarity } from '../systems/CelestialOrbSystem'
import {
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const charter = (id: string) =>
  [...TEA_HOUSE_BASE_CHARTERS, ...TEA_HOUSE_UPGRADED_CHARTERS].find(
    (c) => c.id === id
  )!

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function setup(id: 'star_chart' | 'omen_lens') {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.setCharterUnlockResolver(() => true)
  if (id === 'omen_lens')
    expect(game.addImperialCharter(charter('crystal_lens'))).toBe(true)
  game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate =
    BOSS_MANDATES.find((m) => m.id === 'the_wall')!
  for (let i = 0; i < 3; i++) {
    const state = game.getState()
    state.flowerSystem.clear()
    state.seasonSystem.clear()
    Object.assign(state, { gold: 100, targetScore: 1 })
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
      }).success
    ).toBe(true)
    expect(game.shop.open()).toBe(true)
    if (i < 2) game.exitShop()
  }
  const saved = json(game.captureRun())
  saved.shop.teaHouse.charterOffering!.item = charter(id)
  // Two exact Celestial/Arcana packs, generated before buying the Charter.
  for (const offer of saved.shop.teaHouse.packOfferings)
    offer.item = {
      ...(offer.item as BlessingPack),
      type: id === 'star_chart' ? 'Celestial' : 'Arcana',
    }
  const packs = new BlessingPackSystem()
  packs.generateOfferingsForPacks(
    saved.shop.teaHouse.packOfferings.map((o) => o.item) as Parameters<
      BlessingPackSystem['generateOfferingsForPacks']
    >[0]
  )
  saved.shop.packs = json(packs.toState())
  saved.random = runRandom.toState()
  // Generated consumables advance this separate identity counter as well.
  saved.consumableInstanceCounter = game.captureRun().consumableInstanceCounter
  game.restoreRun(parseClassicRunSnapshot(saved))
  return game
}

it('Star Chart immediately guarantees the most-used Yaku in unopened shelf packs, preserving the other choices', () => {
  const game = setup('star_chart')
  const offered = game.shop
    .toState()
    .packs.currentOfferings.flatMap((p) =>
      p.contents.map((c) => (c.data as { id: string }).id)
    )
  const target = getCelestialOrbsByRarity('Common').find(
    (o) => !offered.includes(o.id)
  )!
  expect(target).toBeTruthy()
  game.getState().celestialOrbSystem.onYakuScored(target.effect.targetYaku)
  const before = json(game.captureRun())
  const offer = game.shop.state.charterOffering!
  expect(game.shop.validatePurchase(offer.id).success).toBe(true)
  expect(game.captureRun()).toEqual(before)
  expect(game.shop.purchase(offer.id).success).toBe(true)
  const after = json(game.captureRun())
  for (const [i, pack] of after.shop.packs.currentOfferings.entries()) {
    expect(pack.contents[0].data).toMatchObject({ id: target.id })
    expect(pack.contents[0].id).toBe(
      before.shop.packs.currentOfferings[i].contents[0].id
    )
    expect(pack.contents.slice(1)).toEqual(
      before.shop.packs.currentOfferings[i].contents.slice(1)
    )
  }
  expect(after.random).toEqual(before.random)
  expect(after.shop.teaHouse.packOfferings).toEqual(
    before.shop.teaHouse.packOfferings
  )
  expect(game.getState().gold).toBe(before.state.gold - offer.finalCost)
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(game.captureRun()).toEqual(after)
  game.restoreRun(parseClassicRunSnapshot(after))
  expect(game.shop.open()).toBe(true)
  expect(game.captureRun()).toEqual(after)
  const packOffer = game.shop.state.packOfferings[0]
  expect(game.shop.purchase(packOffer.id).success).toBe(true)
  expect(game.shop.confirmPack([0]).success).toBe(true)
  expect(game.getState().celestialOrbs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: target.id, source: 'pack_open' }),
    ])
  )
})

it.each([0.1, 0.9])(
  'Omen Lens applies the existing 20%% chance once to unopened Arcana choices (roll %s)',
  (roll) => {
    const game = setup('omen_lens')
    const before = json(game.captureRun())
    vi.spyOn(runRandom, 'next').mockReturnValue(roll)
    expect(
      game.shop.purchase(game.shop.state.charterOffering!.id).success
    ).toBe(true)
    const after = json(game.captureRun())
    for (const pack of after.shop.packs.currentOfferings)
      expect(
        pack.contents.every(
          (c) => c.type === (roll < 0.2 ? 'VoidScript' : 'FateSeal')
        )
      ).toBe(true)
    if (roll >= 0.2) expect(after.shop.packs).toEqual(before.shop.packs)
    expect(after.shop.teaHouse.packOfferings).toEqual(
      before.shop.teaHouse.packOfferings
    )
    vi.restoreAllMocks()
    game.restoreRun(parseClassicRunSnapshot(after))
    expect(game.shop.open()).toBe(true)
    expect(game.captureRun()).toEqual(after)
    expect(
      game.shop.purchase(game.shop.state.packOfferings[0].id).success
    ).toBe(true)
    expect(game.shop.confirmPack([0]).success).toBe(true)
    expect(
      (roll < 0.2 ? game.getState().voidScripts : game.getState().fateSeals)[0]
    ).toMatchObject({ source: 'pack_open' })
  }
)

it('does not reroll revealed/claimed packs or mutate packs on rejected Charter purchases', () => {
  const game = setup('omen_lens')
  const offer = game.shop.state.charterOffering!
  Object.assign(game.getState(), { gold: 0 })
  const rejected = json(game.captureRun())
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(game.captureRun()).toEqual(rejected)
  Object.assign(game.getState(), { gold: 100 })
  expect(game.shop.purchase(game.shop.state.packOfferings[0].id).success).toBe(
    true
  )
  const pending = json(game.captureRun())
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(game.captureRun()).toEqual(pending)
  expect(game.shop.confirmPack([0]).success).toBe(true)
  const before = json(game.captureRun())
  vi.spyOn(runRandom, 'next').mockReturnValue(0.1)
  expect(game.shop.purchase(offer.id).success).toBe(true)
  expect(game.shop.toState().packs.currentOfferings[0]).toEqual(
    before.shop.packs.currentOfferings[0]
  )
  expect(game.getState().fateSeals).toEqual(before.state.fateSeals)
  expect(
    game.shop
      .toState()
      .packs.currentOfferings[1].contents.every((c) => c.type === 'VoidScript')
  ).toBe(true)
})

it.each(['star_chart', 'omen_lens'] as const)(
  'replays %s reward outcomes from the checkpoint without shifting wall or shop randomness',
  (id) => {
    const game = setup(id)
    game.getState().celestialOrbSystem.onYakuScored('Tanyao')
    const before = json(game.captureRun())
    const offerId = game.shop.state.charterOffering!.id
    expect(game.shop.purchase(offerId).success).toBe(true)
    const after = json(game.captureRun())
    for (const stream of [
      'wall',
      'shop',
      'mandates',
      'omens',
      'decrees',
    ] as const)
      expect(after.random.streams[stream]).toBe(before.random.streams[stream])
    game.restoreRun(parseClassicRunSnapshot(before))
    expect(game.shop.purchase(offerId).success).toBe(true)
    const replay = json(game.captureRun())
    // New instances intentionally use monotonic, timestamped identities, even
    // after rewinding in the same process. Compare every other field exactly.
    const previousIds = new Set(
      before.shop.packs.currentOfferings.flatMap((p) =>
        p.contents.map((c) => (c.data as { instanceId: string }).instanceId)
      )
    )
    const normalizeNewIds = (snapshot: typeof after) => {
      for (const pack of snapshot.shop.packs.currentOfferings)
        for (const content of pack.contents) {
          const data = content.data as { instanceId: string }
          if (!previousIds.has(data.instanceId))
            data.instanceId = `new:${content.id}`
        }
      return { ...snapshot, consumableInstanceCounter: 0 }
    }
    expect(normalizeNewIds(json(replay))).toEqual(normalizeNewIds(json(after)))
    const ids = after.shop.packs.currentOfferings.flatMap((p) =>
      p.contents.map((c) => (c.data as { instanceId: string }).instanceId)
    )
    expect(new Set(ids).size).toBe(ids.length)
  }
)

it('does not invent a favored Yaku or reroll packs for an unrelated Charter', () => {
  for (const id of ['star_chart', 'steady_hand']) {
    const game = setup('star_chart')
    game.getState().celestialOrbSystem.clear()
    game.shop.state.charterOffering!.item = charter(id)
    const before = json(game.captureRun())
    expect(
      game.shop.purchase(game.shop.state.charterOffering!.id).success
    ).toBe(true)
    const after = game.captureRun()
    expect(after.shop.packs).toEqual(before.shop.packs)
    expect(after.random).toEqual(before.random)
    expect(after.consumableInstanceCounter).toBe(
      before.consumableInstanceCounter
    )
  }
})
