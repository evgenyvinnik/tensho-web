import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAchievementStore } from '../stores/achievementStore'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { eventBus } from './EventBus'
import { GameOrchestrator } from './GameOrchestrator'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'

function getUndiscoveredItemId(
  category: 'decrees' | 'charters' | 'consumables' | 'omens' | 'mandates'
): string {
  const entry = useArchiveStore
    .getState()
    .getEntriesByCategory(category)
    .find((candidate) => candidate.discoveredAt === null)
  if (!entry) throw new Error(`Expected an undiscovered ${category} Archive item`)
  return entry.itemId
}

describe('MetaProgressionBridge', () => {
  beforeEach(() => {
    shutdownMetaProgressionBridge()
    initializeArchive()
    useArchiveStore.getState().resetArchive()
    useProgressionStore.getState().resetProgression()
    useStakeStore.getState().resetAllProgress()
    useAchievementStore.getState().resetAchievements()
    initializeMetaProgressionBridge()
  })

  afterEach(() => {
    shutdownMetaProgressionBridge()
  })

  it('initializes the Archive and records gameplay in every persisted meta system', () => {
    const archive = useArchiveStore.getState()
    const initialDiscoveredCount = archive.getDiscoveredEntries().length
    const decreeId = getUndiscoveredItemId('decrees')
    const charterId = getUndiscoveredItemId('charters')
    const consumableId = getUndiscoveredItemId('consumables')
    const omenId = getUndiscoveredItemId('omens')
    const mandateId = getUndiscoveredItemId('mandates')

    expect(archive.getStats().totalItems).toBeGreaterThan(150)

    eventBus.emit('runStart', { seed: 7, stake: 2, wallVariant: 'green_felt' })
    eventBus.emit('roundStart', {
      actNumber: 4,
      roundNumber: 1,
      roundType: 'Small',
      target: 500,
    })
    eventBus.emit('decreeAcquired', {
      decreeId,
      decreeName: 'Test Decree',
      rarity: 'Common',
      source: 'purchase',
    })
    eventBus.emit('charterRedeemed', {
      charterId,
      charterName: 'Test Charter',
      actNumber: 4,
    })
    eventBus.emit('consumableAcquired', {
      consumableType: 'FateSeal',
      itemId: consumableId,
      instanceId: 'test-seal-instance',
      name: 'Test Seal',
      source: 'purchase',
    })
    eventBus.emit('roundSkipped', {
      roundType: 'Small',
      omenTagGranted: omenId,
    })
    eventBus.emit('mandateActivated', {
      mandateId,
      mandateName: 'Test Mandate',
      effect: 'Test effect',
    })
    eventBus.emit('packOpened', {
      packId: 'runtime-pack-id',
      packType: 'Arcana',
      packSize: 'Normal',
    })
    eventBus.emit('handPlayed', {
      tiles: ['tile-1', 'tile-2', 'tile-3'],
      score: 750,
      yakuIds: [],
    })
    eventBus.emit('tileDiscarded', { tileId: 'tile-4', toDeadPool: false })
    eventBus.emit('itemPurchased', { itemType: 'Tile', itemId: 'tile-5', cost: 3 })
    eventBus.emit('goldChanged', {
      previousGold: 4,
      newGold: 14,
      delta: 10,
      reason: 'Test reward',
    })
    eventBus.emit('goldChanged', {
      previousGold: 14,
      newGold: 11,
      delta: -3,
      reason: 'Test purchase',
    })
    eventBus.emit('roundEnd', { won: true, score: 750, target: 500 })
    eventBus.emit('runEnd', {
      victory: false,
      score: 750,
      act: 4,
      round: 1,
    })

    const finalArchive = useArchiveStore.getState()
    expect(finalArchive.isDiscovered('decrees', decreeId)).toBe(true)
    expect(finalArchive.isDiscovered('charters', charterId)).toBe(true)
    expect(finalArchive.isDiscovered('consumables', consumableId)).toBe(true)
    expect(finalArchive.isDiscovered('omens', omenId)).toBe(true)
    expect(finalArchive.isDiscovered('mandates', mandateId)).toBe(true)
    expect(finalArchive.isDiscovered('packs', 'arcana_normal')).toBe(true)
    expect(finalArchive.getEntry('decrees', decreeId)?.timesUsed).toBe(1)
    expect(finalArchive.getDiscoveredEntries().length).toBeGreaterThanOrEqual(
      initialDiscoveredCount + 6
    )

    const progression = useProgressionStore.getState().stats
    expect(progression.totalRunsStarted).toBe(1)
    expect(progression.totalRunsCompleted).toBe(1)
    expect(progression.highestActReached).toBe(4)
    expect(progression.highestSingleHandScore).toBe(750)
    expect(progression.highestRoundScore).toBe(750)
    expect(progression.totalTilesPlayed).toBe(3)
    expect(progression.totalTilesDiscarded).toBe(1)
    expect(progression.totalTilesBought).toBe(1)
    expect(progression.totalDecreesPurchased).toBe(1)
    expect(progression.totalChartersPurchased).toBe(1)
    expect(progression.totalFateSealsBought).toBe(1)
    expect(progression.totalPacksOpened).toBe(1)
    expect(progression.totalRoundsSkipped).toBe(1)
    expect(progression.totalGoldEarned).toBe(10)
    expect(progression.totalGoldSpent).toBe(3)
    expect(progression.currentRunGold).toBe(11)

    const achievements = useAchievementStore.getState().stats
    expect(achievements.highestActReached).toBe(4)
    expect(achievements.highestSingleHandScore).toBe(750)
    expect(achievements.totalTilesPlayed).toBe(3)
    expect(achievements.totalTilesDiscarded).toBe(1)
    expect(achievements.totalGoldEarned).toBe(10)
    expect(achievements.maxGoldInRun).toBe(14)
    expect(achievements.totalDecreesPurchased).toBe(1)
    expect(achievements.fateSealsDiscovered).toBe(1)
    expect(achievements.chartersDiscovered).toBe(1)
    expect(achievements.chartersPurchasedByAct4).toBe(1)
    expect(achievements.runsCompleted).toBe(1)
    expect(achievements.runsWon).toBe(0)
  })

  it('records the default wall and starter Decrees after run initialization', () => {
    // Re-initialization must be idempotent and must not duplicate event listeners.
    initializeMetaProgressionBridge()

    const game = new GameOrchestrator()
    game.startNewRun(12345)

    const archive = useArchiveStore.getState()
    const currentEntries = archive.currentRunItems
      .map((key) => archive.entries[key])
      .filter(Boolean)

    expect(currentEntries.filter((entry) => entry.category === 'walls')).toHaveLength(1)
    expect(currentEntries.filter((entry) => entry.category === 'decrees')).toHaveLength(2)
    expect(archive.getEntry('walls', 'green_felt')?.timesUsed).toBe(1)
    expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(1)
  })

  it('records a victory against the wall and stake that actually completed the run', () => {
    eventBus.emit('runStart', { seed: 11, stake: 3, wallVariant: 'green_felt' })
    eventBus.emit('runEnd', {
      victory: true,
      score: 48_000,
      act: 8,
      round: 3,
    })

    const progress = useStakeStore.getState().getWallProgress('green_felt')
    expect(progress.highestCompleted).toBe(3)
    expect(progress.victories).toEqual([
      expect.objectContaining({
        wallId: 'green_felt',
        stakeTier: 3,
        finalScore: 48_000,
        actsCompleted: 8,
      }),
    ])
    expect(useStakeStore.getState().getHighestAvailableStake('green_felt')).toBe(4)
  })
})
