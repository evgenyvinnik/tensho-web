import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { RunRandom, runRandom } from './RunRandom'
import { eventBus } from './EventBus'
import { useOmenStore } from '../stores/omenStore'
import { parseClassicRunSnapshot } from './validateClassicRun'
import type { BlessingPack } from '../systems/types'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})
const definition = (id: string) => ALL_DECREES.find((d) => d.id === id)!
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))
function fixture(waiting = false) {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
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
  state.gold = 100
  state.decreeSystem = new DecreeSystem(waiting ? 2 : 5)
  for (const id of waiting
    ? ['decree-doppelganger']
    : ['decree-ancient-scroll', 'decree-wide-grip'])
    state.decreeSystem.acquireDecree(definition(id))
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.itemOfferings[0]
  offer.itemType = 'Decree'
  offer.item = definition(waiting ? 'decree-wide-grip' : 'decree-doppelganger')
  offer.finalCost = 8
  return { game, state, offer }
}

it.each([false, true])(
  'repeated shop validation is RNG/save-pure, including a waiting copy (%s)',
  (waiting) => {
    const { game, offer } = fixture(waiting)
    const before = json(game.captureRun())
    for (let i = 0; i < 20; i++)
      expect(game.shop.validatePurchase(offer.id).success).toBe(true)
    expect(json(game.captureRun())).toEqual(before)
    game.restoreRun(parseClassicRunSnapshot(before))
    expect(game.shop.validatePurchase(offer.id).success).toBe(true)
    expect(json(game.captureRun())).toEqual(before)
  }
)

it('purchase selects once from the same cursor regardless of how often it was inspected', () => {
  const { game, state, offer } = fixture()
  const before = json(game.captureRun())
  const expected = RunRandom.fromState(before.random)
  const target = expected.pick(
    'decreeCopies',
    state.decreeSystem.getOwnedDecrees()
  )!
  for (let i = 0; i < 12; i++) game.shop.validatePurchase(offer.id)
  expect(game.shop.purchase(offer.id).success).toBe(true)
  expect(
    state.decreeSystem.getOwnedDecree('decree-doppelganger')!.randomCopyTargetId
  ).toBe(target.instanceId)
  expect(runRandom.toState().streams.decreeCopies).toBe(
    expected.toState().streams.decreeCopies
  )
  const bought = json(game.captureRun())
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(json(game.captureRun())).toEqual(bought)
  game.restoreRun(parseClassicRunSnapshot(bought))
  expect(json(game.captureRun())).toEqual(bought)
})

it.each([true, false])(
  'pack selection preflight never draws, including combined-capacity rejection (%s)',
  (fits) => {
    const { game, state } = fixture()
    if (!fits) state.decreeSystem.removeSlots(2) // only one of the two choices fits
    const offer = game.shop.state.packOfferings[0]
    const pack = game.shop.packOfferings.find(
      (p) => p.pack.id === (offer.item as BlessingPack).id
    )!
    pack.maxSelections = 2
    pack.contents = ['decree-doppelganger', 'decree-wide-grip'].map(
      (id, i) => ({
        id: `copy-choice-${i}`,
        type: 'Decree',
        rarity: 'rare',
        name: definition(id).name,
        description: definition(id).description,
        data: definition(id),
      })
    )
    expect(game.shop.purchase(offer.id).success).toBe(true)
    const before = json(game.captureRun())
    for (let i = 0; i < 10; i++)
      expect(game.shop.validatePackSelection([0, 1]).success).toBe(fits)
    expect(json(game.captureRun())).toEqual(before)
    if (fits) {
      const expected = RunRandom.fromState(before.random)
      const target = expected.pick(
        'decreeCopies',
        state.decreeSystem.getOwnedDecrees()
      )!
      expect(game.shop.confirmPack([0, 1]).success).toBe(true)
      expect(
        state.decreeSystem.getOwnedDecree('decree-doppelganger')!
          .randomCopyTargetId
      ).toBe(target.instanceId)
      expect(runRandom.toState().streams.decreeCopies).toBe(
        expected.toState().streams.decreeCopies
      )
    } else {
      expect(game.shop.confirmPack([0, 1]).success).toBe(false)
      expect(json(game.captureRun())).toEqual(before)
    }
  }
)
