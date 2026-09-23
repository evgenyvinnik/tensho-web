import { afterEach, beforeEach, expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { THE_TOOTH } from '../config/mandateDefinitions'
import { useProgressionStore } from '../stores/progressionStore'
import { useOmenStore } from '../stores/omenStore'
import { TEA_HOUSE_BASE_CHARTERS } from '../systems/TeaHouseSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'

beforeEach(() => {
  useProgressionStore.getState().resetProgression()
  initializeMetaProgressionBridge()
})

afterEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
  useProgressionStore.getState().resetProgression()
})

function setup() {
  const game = new GameOrchestrator()
  game.setCharterUnlockResolver((id) =>
    useProgressionStore.getState().isItemUnlocked(id)
  )
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.seasonSystem.clear()
  state.flowerSystem.clear()
  state.decreeSystem
    .getOwnedDecrees()
    .forEach((d) => state.decreeSystem.removeDecree(d.id))
  state.gold = 100
  return { game, state }
}

it.each([0, 1, 100])(
  'does not count a Tooth penalty with %i gold as spending or unlock the Charter',
  (gold) => {
    const { game, state } = setup()
    expect(
      game.addImperialCharter(
        TEA_HOUSE_BASE_CHARTERS.find((c) => c.id === 'abundant_stock')!
      )
    ).toBe(true)
    useProgressionStore.getState().updateStats({ totalGoldSpent: 2499 })
    state.gold = gold
    state.targetScore = 1e9
    state.roundManager.getCurrentRound()!.scoreTarget = 1e9
    state.handTiles = [2, 3, 4].map(
      (rank) => new Tile(TileSuit.Souzu, rank, `tile-${rank}`)
    )
    state.mandateEffectSystem.activateMandate(THE_TOOTH, state.handTiles, [])
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.map((t) => t.id),
      }).success
    ).toBe(true)
    expect(state.gold).toBe(Math.max(0, gold - 3))
    expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(2499)
    expect(
      useProgressionStore.getState().isItemUnlocked('plentiful_stock')
    ).toBe(false)
    expect(useProgressionStore.getState().stats.currentRunGold).toBe(state.gold)
  }
)

it('counts actual discounted shop payment once and preserves spending across new runs', () => {
  const { game, state } = setup()
  expect(
    game.addImperialCharter(
      TEA_HOUSE_BASE_CHARTERS.find((c) => c.id === 'abundant_stock')!
    )
  ).toBe(true)
  useProgressionStore.getState().updateStats({ totalGoldSpent: 2499 })
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Boss'
  game.shop.open()
  const offer = game.shop.state.charterOffering!
  offer.finalCost = 1
  expect(game.shop.purchase(offer.id).success).toBe(true)
  expect(state.gold).toBe(99)
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(2500)
  expect(useProgressionStore.getState().isItemUnlocked('plentiful_stock')).toBe(
    true
  )
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(2500)
  game.startNewRun(8)
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(2500)
})

it('counts paid shop rerolls once, but not failed or free rerolls', () => {
  const { game, state } = setup()
  state.phase = 'shop'
  game.shop.open()
  const before = state.gold
  expect(game.shop.reroll().success).toBe(true)
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(
    before - state.gold
  )
  const spent = useProgressionStore.getState().stats.totalGoldSpent
  state.gold = 0
  expect(game.shop.reroll().success).toBe(false)
  expect(game.purchaseItem('free', 0, 'Reroll')).toBe(true)
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(spent)
})

it('counts a paid Boss Mandate reroll once without counting a rejected second attempt', () => {
  const { game, state } = setup()
  state.charterSystem.purchaseCharter('directors_take')
  expect(game.rerollBossMandate().success).toBe(true)
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(10)
  expect(game.rerollBossMandate().success).toBe(false)
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(10)
})

it('does not infer spending from arbitrary negative events or their display labels', () => {
  setup()
  eventBus.emit('goldChanged', {
    previousGold: 100,
    newGold: 90,
    delta: -10,
    reason: 'Purchase',
  })
  expect(useProgressionStore.getState().stats.totalGoldSpent).toBe(0)
  expect(useProgressionStore.getState().stats.currentRunGold).toBe(90)
})
