import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useOmenStore } from '../stores/omenStore'
import { DecreeSystem } from '../systems/DecreeSystem'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { runRandom } from './RunRandom'

const earned = () =>
  useAchievementStore.getState().achievements.charter_collector.unlocked
const record = () =>
  useAchievementStore.getState().stats.maxChartersPurchasedByAct5
function start() {
  const game = new GameOrchestrator()
  // Seed 8's Boss shops offer no Ancient Script, so Acts advance in order.
  game.startNewRun(8)
  return game
}
function purchaseEvent(actNumber: number) {
  eventBus.emit('charterRedeemed', {
    charterId: 'merchant_license',
    charterName: 'Fixture',
    actNumber,
  })
}
function resume(game: GameOrchestrator) {
  game.restoreRun(
    parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
  )
}
beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useAchievementStore.getState().resetAchievements()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  useOmenStore.getState().clearForNewRun()
  vi.restoreAllMocks()
  runRandom.reset()
})

it('earns five real boss-shop purchases through Act 5, with reload and no extra Charter on reroll', () => {
  const game = start()
  const notices = vi.fn()
  const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
    if (achievementId === 'charter_collector') notices()
  })
  try {
    let purchases = 0
    for (let round = 0; round < 15; round++) {
      const state = game.getState() as OrchestratorState
      expect(state.currentAct).toBe(Math.floor(round / 3) + 1)
      // Fixture scoring and funds only. Round transitions, generated boss
      // offerings, purchase validation, payment and save lifecycle are real.
      state.decreeSystem = new DecreeSystem()
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.mandateEffectSystem.deactivateMandate()
      state.roundManager.getCurrentRound()!.bossMandate = undefined
      state.roundManager.getCurrentRound()!.scoreTarget = 1
      state.targetScore = 1
      state.handsRemaining = 1
      state.gold = 100
      state.faceDownTileIds.clear()
      state.handTiles = [
        new Tile(TileSuit.Manzu, 5, 'charter-a'),
        new Tile(TileSuit.Manzu, 5, 'charter-b'),
      ]
      expect(
        game.processAction({
          type: 'play',
          tileIds: state.handTiles.map((t) => t.id),
        }).success
      ).toBe(true)
      expect(game.shop.open()).toBe(true)
      const offering = game.shop.state.charterOffering
      if (round % 3 !== 2) expect(offering).toBeNull()
      else {
        expect(offering).toBeTruthy()
        expect(game.shop.purchase(offering!.id).success).toBe(true)
        purchases++
        expect(game.shop.purchase(offering!.id).success).toBe(false)
        expect(game.shop.reroll().success).toBe(true)
        expect(game.shop.state.charterOffering?.isPurchased).toBe(true)
      }
      expect(record()).toBe(purchases)
      expect(earned()).toBe(purchases === 5)
      resume(game)
      expect(game.captureRun().meta?.chartersPurchasedByAct5).toBe(purchases)
      expect(record()).toBe(purchases)
      if (round < 14) game.exitShop()
    }
    expect(notices).toHaveBeenCalledOnce()
  } finally {
    off()
  }
})

it('retains the best single-run count, never adds separate runs together', () => {
  start()
  for (let act = 1; act <= 4; act++) purchaseEvent(act)
  expect(record()).toBe(4)
  const fresh = start()
  purchaseEvent(1)
  expect(fresh.captureRun().meta?.chartersPurchasedByAct5).toBe(1)
  expect(record()).toBe(4)
  expect(earned()).toBe(false)
})

it.each([0, 6, 8, -1, 1.5, NaN, Infinity])(
  'does not count purchases at invalid or late Act %s',
  (act) => {
    start()
    for (let i = 1; i <= 4; i++) purchaseEvent(i)
    purchaseEvent(act)
    expect(record()).toBe(4)
    expect(earned()).toBe(false)
  }
)

it('ignores purchases outside a run and in Full Unlock practice', () => {
  purchaseEvent(1)
  expect(record()).toBe(0)
  const game = start()
  useProgressionStore.setState({ fullUnlockEnabled: true })
  for (let act = 1; act <= 5; act++) purchaseEvent(act)
  expect(record()).toBe(0)
  expect(game.captureRun().meta?.chartersPurchasedByAct5).toBe(0)
  expect(earned()).toBe(false)
})

it('does not infer purchase history for an older run, but counts subsequently observed purchases', () => {
  const game = start()
  const saved = game.captureRun()
  delete saved.meta!.chartersPurchasedByAct5
  game.restoreRun(parseClassicRunSnapshot(saved))
  expect(record()).toBe(0)
  purchaseEvent(5)
  expect(record()).toBe(1)
  expect(earned()).toBe(false)
})

it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid saved purchase count %s',
  (count) => {
    const saved = start().captureRun()
    saved.meta!.chartersPurchasedByAct5 = count
    expect(() => parseClassicRunSnapshot(saved)).toThrow()
  }
)

it.each([false, true])(
  'preserves earned legacy awards (%s), not the cross-run counter',
  async (unlocked) => {
    const saved = JSON.stringify({
      version: 3,
      state: {
        stats: {
          chartersPurchasedByAct4: 500,
          minimumWallSize: 120,
          maximumWallSize: 144,
        },
        achievements: {
          charter_collector: {
            id: 'charter_collector',
            unlocked,
            seen: unlocked,
          },
        },
      },
    })
    vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
      key === 'tensho-achievements' ? saved : null
    )
    await useAchievementStore.persist.rehydrate()
    useAchievementStore.getState().checkAchievements()
    expect(record()).toBe(0)
    expect(earned()).toBe(unlocked)
    expect(useAchievementStore.getState().stats.minimumWallSize).toBe(120)
    expect(useAchievementStore.getState().stats.maximumWallSize).toBe(144)
  }
)

it('retains version 4 single-run progress after profile rehydration', async () => {
  start()
  for (let act = 1; act <= 4; act++) purchaseEvent(act)
  const { stats, achievements } = useAchievementStore.getState()
  const saved = JSON.stringify({ version: 4, state: { stats, achievements } })
  useAchievementStore.getState().resetAchievements()
  vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-achievements' ? saved : null
  )
  await useAchievementStore.persist.rehydrate()
  expect(record()).toBe(4)
  expect(earned()).toBe(false)
})
