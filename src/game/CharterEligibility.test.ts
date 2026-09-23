import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
  synchronizePersistedMetaState,
} from './MetaProgressionBridge'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useCharterStore } from '../stores/charterStore'
import { CharterSystem } from '../systems/CharterSystem'
import {
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'
import {
  BASE_CHARTERS,
  UPGRADED_CHARTERS,
  getAvailableCharters,
  isCharterAvailable,
} from '../config/charterDefinitions'

afterEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
  useProgressionStore.getState().resetProgression()
  useCharterStore.getState().clearCharters()
  useArchiveStore.getState().resetArchive()
})

it.each(TEA_HOUSE_UPGRADED_CHARTERS)(
  'gates $id offers and real purchases, including stale offers and new runs',
  (upgrade) => {
    const unlocked = new Set<string>()
    const game = new GameOrchestrator()
    game.setCharterUnlockResolver((id) => unlocked.has(id))
    game.startNewRun(7)
    // Isolate the upgrade pool by granting every base. This is not balance evidence.
    for (const base of TEA_HOUSE_BASE_CHARTERS)
      expect(game.addImperialCharter(base)).toBe(true)
    const state = game.getState() as OrchestratorState
    Object.assign(state, {
      phase: 'shop',
      lastCompletedRoundType: 'Boss',
      gold: 100,
    })
    expect(game.canAddImperialCharter(upgrade)).toBe(false)
    expect(game.addImperialCharter(upgrade)).toBe(false)
    expect(game.shop.open()).toBe(true)
    expect(game.shop.state.charterOffering).toBeNull()
    expect(game.shop.close()).toBe(true)

    unlocked.add(upgrade.id)
    expect(game.shop.open()).toBe(true)
    const offer = game.shop.state.charterOffering!
    expect(offer.item.id).toBe(upgrade.id)
    const before = state.gold
    unlocked.clear()
    expect(game.shop.purchase(offer.id)).toEqual({
      success: false,
      reason: 'unavailable',
    })
    expect(state.gold).toBe(before)
    expect(offer.isPurchased).toBe(false)
    unlocked.add(upgrade.id)
    expect(game.shop.purchase(offer.id).success).toBe(true)
    expect(state.gold).toBe(before - offer.finalCost)
    expect(state.charterSystem.hasCharter(upgrade.id)).toBe(true)
    expect(game.shop.purchase(offer.id).success).toBe(false)
    expect(game.addImperialCharter(upgrade)).toBe(false)
    expect(state.gold).toBe(before - offer.finalCost)

    game.startNewRun(8)
    expect(game.canAddImperialCharter(upgrade)).toBe(false)
    const base = TEA_HOUSE_BASE_CHARTERS.find(
      (charter) => charter.upgradeId === upgrade.id
    )!
    expect(game.addImperialCharter(base)).toBe(true)
    expect(game.canAddImperialCharter(upgrade)).toBe(true)
  }
)

it('defaults to base-only eligibility in both canonical helpers and standalone systems', () => {
  const bases = new Set(BASE_CHARTERS.map((charter) => charter.id))
  expect(getAvailableCharters(new Set()).map((charter) => charter.id)).toEqual(
    BASE_CHARTERS.map((charter) => charter.id)
  )
  expect(getAvailableCharters(bases)).toEqual([])
  const system = new CharterSystem()
  for (const base of BASE_CHARTERS)
    expect(system.purchaseCharter(base.id)).not.toBeNull()
  for (const upgrade of UPGRADED_CHARTERS) {
    expect(isCharterAvailable(upgrade.id, bases)).toBe(false)
    expect(system.purchaseCharter(upgrade.id)).toBeNull()
    expect(system.isUpgradeAvailable(upgrade.baseId!)).toBe(false)
  }
  expect(system.getRandomAvailableCharter()).toBeNull()
})

it('reads the current persisted unlock registry rather than a start-of-run snapshot', () => {
  useProgressionStore.getState().resetProgression()
  const game = new GameOrchestrator()
  game.setCharterUnlockResolver((id) =>
    useProgressionStore.getState().isItemUnlocked(id)
  )
  game.startNewRun(7)
  const base = TEA_HOUSE_BASE_CHARTERS.find(
    (charter) => charter.id === 'seed_pouch'
  )!
  const upgrade = TEA_HOUSE_UPGRADED_CHARTERS.find(
    (charter) => charter.id === 'money_tree'
  )!
  expect(game.addImperialCharter(base)).toBe(true)
  expect(game.canAddImperialCharter(upgrade)).toBe(false)
  useProgressionStore.getState().unlockItem('unlock_money_tree')
  expect(game.canAddImperialCharter(upgrade)).toBe(true)
  useProgressionStore.getState().resetProgression()
  expect(game.canAddImperialCharter(upgrade)).toBe(false)
})

it('preserves previously owned effects when restoring while requiring eligibility for new purchases', () => {
  const original = new CharterSystem(() => true)
  expect(original.purchaseCharter('seed_pouch')).not.toBeNull()
  expect(original.purchaseCharter('money_tree')).not.toBeNull()
  expect(original.purchaseCharter('sharp_edge')).not.toBeNull()
  const restored = CharterSystem.fromState(original.toState())
  expect(restored.calculateEffects().interestCap).toBe(20)
  expect(restored.canPurchaseCharter('money_tree')).toBe(false)
  expect(restored.canPurchaseCharter('radiant_edge')).toBe(false)
  const eligible = CharterSystem.fromState(
    original.toState(),
    (id) => id === 'radiant_edge'
  )
  expect(eligible.canPurchaseCharter('radiant_edge')).toBe(true)
})

it('keeps the legacy Charter store consistent with the canonical eligibility rule', () => {
  useProgressionStore.getState().resetProgression()
  useCharterStore.getState().clearCharters()
  const store = useCharterStore.getState()
  expect(store.purchaseCharter('seed_pouch')).not.toBeNull()
  expect(store.purchaseCharter('money_tree')).toBeNull()
  expect(store.isUpgradeAvailable('seed_pouch')).toBe(false)
  useProgressionStore.getState().unlockItem('unlock_money_tree')
  expect(store.isUpgradeAvailable('seed_pouch')).toBe(true)
  expect(
    store.getAvailableCharters().some((charter) => charter.id === 'money_tree')
  ).toBe(true)
  expect(store.purchaseCharter('money_tree')).not.toBeNull()
  expect(store.purchaseCharter('money_tree')).toBeNull()
  store.clearCharters()
  expect(store.purchaseCharter('money_tree')).toBeNull()
})

it.each([9, 10])(
  'retains a prior %i-Charter run without adding counts from separate runs',
  (priorCount) => {
    useProgressionStore.getState().resetProgression()
    initializeMetaProgressionBridge()
    const game = new GameOrchestrator()
    game.setCharterUnlockResolver((id) =>
      useProgressionStore.getState().isItemUnlocked(id)
    )
    game.startNewRun(7)
    // Real acquisition events, with controlled grants instead of ten organic Boss shops.
    for (const base of TEA_HOUSE_BASE_CHARTERS.filter(
      (charter) => charter.id !== 'discount_sale'
    ).slice(0, priorCount)) {
      expect(game.addImperialCharter(base)).toBe(true)
    }
    expect(useProgressionStore.getState().stats.maxChartersInRun).toBe(
      priorCount
    )
    expect(
      useProgressionStore.getState().isItemUnlocked('liquidation_sale')
    ).toBe(false)
    game.startNewRun(8)
    expect(
      game.addImperialCharter(
        TEA_HOUSE_BASE_CHARTERS.find(
          (charter) => charter.id === 'discount_sale'
        )!
      )
    ).toBe(true)
    expect(
      useProgressionStore.getState().stats.currentRunChartersPurchased
    ).toBe(1)
    expect(useProgressionStore.getState().stats.maxChartersInRun).toBe(
      priorCount
    )
    expect(
      useProgressionStore.getState().isItemUnlocked('liquidation_sale')
    ).toBe(priorCount === 10)
    expect(
      game.canAddImperialCharter(
        TEA_HOUSE_UPGRADED_CHARTERS.find(
          (charter) => charter.id === 'liquidation_sale'
        )!
      )
    ).toBe(priorCount === 10)
  }
)

it('preserves historical upgraded-Charter purchases without treating Archive discovery as eligibility', () => {
  useProgressionStore.getState().resetProgression()
  initializeArchive()
  useArchiveStore.getState().resetArchive()
  useArchiveStore.getState().unlockItem('charters', 'radiant_edge')
  useProgressionStore.getState().updateStats({
    chartersPurchased: new Set(['seed_pouch', 'money_tree', 'unknown-upgrade']),
  })
  initializeMetaProgressionBridge()
  expect(useProgressionStore.getState().isItemUnlocked('money_tree')).toBe(true)
  expect(
    useArchiveStore.getState().getEntry('charters', 'money_tree')!.isUnlocked
  ).toBe(true)
  expect(useProgressionStore.getState().isItemUnlocked('radiant_edge')).toBe(
    false
  )
  expect(useProgressionStore.getState().isItemUnlocked('unknown-upgrade')).toBe(
    false
  )
  expect(useProgressionStore.getState().recentUnlocks).toEqual([])
  const unlocks = useProgressionStore.getState().unlocks
  synchronizePersistedMetaState()
  expect(useProgressionStore.getState().unlocks).toEqual(unlocks)
  useProgressionStore.getState().resetProgression()
  synchronizePersistedMetaState()
  expect(useProgressionStore.getState().isItemUnlocked('money_tree')).toBe(
    false
  )
})
