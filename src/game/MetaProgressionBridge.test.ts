import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAchievementStore } from '../stores/achievementStore'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { useTableStyleStore } from '../stores/tableStyleStore'
import { ArchiveSystem } from '../systems/ArchiveSystem'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { createArchiveKey } from '../config/archiveDefinitions'
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
  if (!entry)
    throw new Error(`Expected an undiscovered ${category} Archive item`)
  return entry.itemId
}

describe('MetaProgressionBridge', () => {
  beforeEach(() => {
    shutdownMetaProgressionBridge()
    initializeArchive()
    useArchiveStore.getState().resetArchive()
    useProgressionStore.getState().resetProgression()
    useStakeStore.getState().resetAllProgress()
    useTableStyleStore.getState().resetAllProgress()
    useAchievementStore.getState().resetAchievements()
    initializeMetaProgressionBridge()
  })

  afterEach(() => {
    shutdownMetaProgressionBridge()
  })

  it('catalogs exactly the eight playable tables and preserves retired wall history', () => {
    const system = new ArchiveSystem()
    const old = {
      ...system.getEntry('walls', 'green_felt')!,
      itemId: 'red_wall',
      timesUsed: 9,
      discoveredAt: 123,
    }
    const saved = system.toState()
    saved.entries.push([createArchiveKey('walls', 'red_wall'), old])
    const restored = ArchiveSystem.fromState(saved)
    expect(
      restored.getEntriesByCategory('walls').map((entry) => entry.itemId)
    ).toEqual(TABLE_STYLE_DEFINITIONS.map((table) => table.id))
    expect(restored.getEntry('walls', 'red_wall')?.timesUsed).toBe(9)
    expect(restored.toState().entries).toContainEqual([
      createArchiveKey('walls', 'red_wall'),
      old,
    ])
    useArchiveStore
      .getState()
      .initializeEntries(restored.toState().entries.map(([, entry]) => entry))
    expect(
      useArchiveStore.getState().getEntriesByCategory('walls')
    ).toHaveLength(8)
    expect(
      useArchiveStore
        .getState()
        .getDiscoveredEntries()
        .some((entry) => entry.itemId === 'red_wall')
    ).toBe(false)
    expect(
      useArchiveStore.getState().getStats().categoryCounts.walls.total
    ).toBe(8)
  })

  it('makes an earned table selectable immediately and restores persisted unlocks idempotently', () => {
    eventBus.emit('actComplete', { actNumber: 3, totalScore: 5000 })
    expect(useTableStyleStore.getState().selectStyle('red_lacquer')).toBe(true)
    expect(
      useArchiveStore.getState().getEntry('walls', 'red_lacquer')?.isUnlocked
    ).toBe(true)
    useProgressionStore.getState().updateStats({ totalDecreesPurchased: 20 })
    shutdownMetaProgressionBridge()
    useTableStyleStore.getState().resetAllProgress()
    initializeMetaProgressionBridge()
    expect(useTableStyleStore.getState().isStyleUnlocked('red_lacquer')).toBe(
      true
    )
    shutdownMetaProgressionBridge()
    initializeMetaProgressionBridge()
    expect(useTableStyleStore.getState().stats.totalDecreesPurchased).toBe(20)
    expect(useTableStyleStore.getState().unlockHistory).toHaveLength(1)
    new GameOrchestrator().startNewRun(7, 1, 'red_lacquer')
    expect(
      useArchiveStore.getState().getEntry('walls', 'red_lacquer')?.timesUsed
    ).toBe(1)
  })

  it('requires four distinct Flowers in one run, not repeated draws of one type', () => {
    eventBus.emit('runStart', { seed: 7, stake: 1, wallVariant: 'green_felt' })
    for (let i = 0; i < 4; i++)
      eventBus.emit('flowerCollected', { flowerType: 'Plum', totalFlowers: 1 })
    expect(useTableStyleStore.getState().isStyleUnlocked('bamboo_mat')).toBe(
      false
    )
    for (const flowerType of ['Orchid', 'Chrysanthemum', 'Bamboo']) {
      eventBus.emit('flowerCollected', { flowerType, totalFlowers: 4 })
    }
    expect(useTableStyleStore.getState().isStyleUnlocked('bamboo_mat')).toBe(
      true
    )
    expect(useTableStyleStore.getState().stats.maxFlowersInRun).toBe(4)
  })

  it('checks owned Decrees at victory, not purchases or a win on an earlier run', () => {
    eventBus.emit('runStart', { seed: 7, stake: 1, wallVariant: 'green_felt' })
    eventBus.emit('runEnd', {
      victory: true,
      score: 100,
      act: 8,
      round: 3,
      decreesOwned: 2,
    })
    eventBus.emit('runStart', { seed: 8, stake: 1, wallVariant: 'green_felt' })
    for (let i = 0; i < 20; i++) {
      eventBus.emit('decreeAcquired', {
        decreeId: `test-${i}`,
        decreeName: 'Test',
        rarity: 'Common',
        source: 'purchase',
      })
    }
    expect(useTableStyleStore.getState().isStyleUnlocked('night_market')).toBe(
      true
    )
    expect(useTableStyleStore.getState().isStyleUnlocked('imperial_gold')).toBe(
      false
    )
    eventBus.emit('runEnd', {
      victory: true,
      score: 100,
      act: 8,
      round: 3,
      decreesOwned: 4,
    })
    expect(useTableStyleStore.getState().isStyleUnlocked('imperial_gold')).toBe(
      false
    )
    eventBus.emit('runStart', { seed: 9, stake: 1, wallVariant: 'green_felt' })
    eventBus.emit('runEnd', {
      victory: true,
      score: 100,
      act: 8,
      round: 3,
      decreesOwned: 5,
    })
    expect(useTableStyleStore.getState().selectStyle('imperial_gold')).toBe(
      true
    )
    expect(useTableStyleStore.getState().stats.maxDecreesInWin).toBe(5)
  })

  it('counts corrupted Seasons only after surviving their round and never across runs', () => {
    const corrupt = () =>
      eventBus.emit('seasonCorrupted', {
        corruptedType: 'Drought',
        effect: 'Test',
      })
    const win = () =>
      eventBus.emit('roundEnd', { won: true, score: 100, target: 100 })
    eventBus.emit('runStart', { seed: 7, stake: 1, wallVariant: 'green_felt' })
    corrupt()
    corrupt()
    win()
    eventBus.emit('runStart', { seed: 8, stake: 1, wallVariant: 'green_felt' })
    corrupt()
    win()
    expect(useTableStyleStore.getState().isStyleUnlocked('ghost_parlor')).toBe(
      false
    )
    corrupt()
    corrupt()
    eventBus.emit('roundEnd', { won: false, score: 0, target: 100 })
    win()
    expect(useTableStyleStore.getState().isStyleUnlocked('ghost_parlor')).toBe(
      false
    )
    corrupt()
    corrupt()
    win()
    expect(useTableStyleStore.getState().isStyleUnlocked('ghost_parlor')).toBe(
      true
    )
    expect(
      useTableStyleStore.getState().stats.maxCorruptedSeasonsSurvived
    ).toBe(3)
  })

  it('unlocks Dragon’s Den from a Yakuman and Temple Stone only from a flower-free win', () => {
    eventBus.emit('runStart', { seed: 7, stake: 1, wallVariant: 'green_felt' })
    eventBus.emit('yakumanScored', {
      yakuId: 'kokushi',
      yakuName: 'Thirteen Orphans',
    })
    expect(useTableStyleStore.getState().selectStyle('dragons_den')).toBe(true)
    eventBus.emit('flowerCollected', { flowerType: 'Plum', totalFlowers: 1 })
    eventBus.emit('runEnd', { victory: true, score: 100, act: 8, round: 3 })
    expect(useTableStyleStore.getState().isStyleUnlocked('temple_stone')).toBe(
      false
    )
    eventBus.emit('runStart', { seed: 8, stake: 1, wallVariant: 'green_felt' })
    eventBus.emit('runEnd', { victory: true, score: 100, act: 8, round: 3 })
    expect(useTableStyleStore.getState().selectStyle('temple_stone')).toBe(true)
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
    eventBus.emit('itemPurchased', {
      itemType: 'Tile',
      itemId: 'tile-5',
      cost: 3,
    })
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

    expect(
      currentEntries.filter((entry) => entry.category === 'walls')
    ).toHaveLength(1)
    expect(
      currentEntries.filter((entry) => entry.category === 'decrees')
    ).toHaveLength(2)
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
    expect(
      useStakeStore.getState().getHighestAvailableStake('green_felt')
    ).toBe(4)
  })
})
