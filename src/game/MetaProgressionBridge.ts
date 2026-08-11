/**
 * Connects authoritative gameplay events to the three persisted meta systems.
 *
 * Gameplay code only emits domain events. This bridge owns the cross-run side
 * effects so the Archive, unlock progression, and achievements stay in sync
 * without introducing store dependencies into the orchestrator.
 */

import type { ArchiveCategory } from '../config/archiveDefinitions'
import type { UnlockCategory } from '../config/unlockDefinitions'
import {
  getAchievementDefinition,
  type AchievementStats,
  useAchievementStore,
} from '../stores/achievementStore'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import type {
  ProgressionEventPayload,
  UnlockCheckResult,
} from '../systems/MetaProgressionSystem'
import type { DiscoveryTrigger } from '../systems/ArchiveSystem'
import { createEventSubscription, eventBus } from './EventBus'

const UNLOCK_ARCHIVE_CATEGORIES: Partial<Record<UnlockCategory, ArchiveCategory>> = {
  decree: 'decrees',
  table_style: 'walls',
  charter: 'charters',
  consumable: 'consumables',
}

const SOURCE_TRIGGERS = {
  starting: 'starting',
  purchase: 'purchase',
  pack_open: 'pack_open',
  generated: 'unlock',
} as const satisfies Record<string, DiscoveryTrigger>

interface ActiveRunMeta {
  stake: number
  wallId: string
  hadFlowers: boolean
}

let activeRun: ActiveRunMeta | null = null
let bridgeCleanup: (() => void) | null = null

function syncProgressionUnlocks(result: UnlockCheckResult): void {
  const archive = useArchiveStore.getState()

  for (const unlock of result.newUnlocks) {
    const archiveCategory = UNLOCK_ARCHIVE_CATEGORIES[unlock.category]
    if (archiveCategory) {
      archive.unlockItem(archiveCategory, unlock.unlocksId)
    }

    if (unlock.category === 'stake') {
      const parsedTier = Number(unlock.unlocksId.match(/\d+/)?.[0])
      if (Number.isFinite(parsedTier)) {
        eventBus.emit('stakeUnlocked', {
          stakeLevel: parsedTier,
          stakeName: unlock.unlocksId,
        })
      }
    }
  }
}

function processProgressionEvent(event: ProgressionEventPayload): UnlockCheckResult {
  const result = useProgressionStore.getState().processEvent(event)
  syncProgressionUnlocks(result)
  return result
}

function incrementAchievementStat(stat: keyof AchievementStats, amount = 1): void {
  useAchievementStore.getState().incrementStat(stat, amount)
}

function maximizeAchievementStat(stat: keyof AchievementStats, value: number): void {
  const achievementStore = useAchievementStore.getState()
  if (value > achievementStore.stats[stat]) {
    achievementStore.setStat(stat, value)
  }
}

function minimizeAchievementStat(stat: keyof AchievementStats, value: number): void {
  const achievementStore = useAchievementStore.getState()
  if (value < achievementStore.stats[stat]) {
    achievementStore.setStat(stat, value)
  }
}

function checkAchievements(): void {
  const before = useAchievementStore.getState().achievements
  const previouslyUnlocked = new Set(
    Object.values(before)
      .filter((achievement) => achievement.unlocked)
      .map((achievement) => achievement.id)
  )

  useAchievementStore.getState().checkAchievements()

  for (const achievement of Object.values(useAchievementStore.getState().achievements)) {
    if (!achievement.unlocked || previouslyUnlocked.has(achievement.id)) continue
    const definition = getAchievementDefinition(achievement.id)
    eventBus.emit('achievementUnlocked', {
      achievementId: achievement.id,
      achievementName: definition?.japaneseTitle ?? achievement.id,
    })
  }
}

function recordArchiveItem(
  category: ArchiveCategory,
  itemId: string,
  trigger: DiscoveryTrigger
): boolean {
  const archive = useArchiveStore.getState()
  const entry = archive.getEntry(category, itemId)
  if (!entry) return false

  if (!entry.isUnlocked) {
    archive.unlockItem(category, itemId)
  }

  const discovered = useArchiveStore.getState().discoverItem(
    category,
    itemId,
    trigger,
    useProgressionStore.getState().stats.totalRunsStarted,
    useProgressionStore.getState().stats.highestActReached
  )

  useArchiveStore.getState().incrementUsage(category, itemId)
  useArchiveStore.getState().addToCurrentRun(category, itemId)

  if (discovered) {
    incrementAchievementStat('totalItemsDiscovered')
    eventBus.emit('itemDiscovered', { itemType: category, itemId })
  }

  return discovered
}

function synchronizePersistedMetaState(): void {
  const progression = useProgressionStore.getState()
  const archive = useArchiveStore.getState()

  for (const unlock of Object.values(progression.unlocks)) {
    const category = UNLOCK_ARCHIVE_CATEGORIES[unlock.category]
    if (category) archive.unlockItem(category, unlock.unlocksId)
  }

  const discoveredEntries = archive.getDiscoveredEntries()
  const achievements = useAchievementStore.getState()
  achievements.setStat(
    'totalItemsDiscovered',
    Math.max(achievements.stats.totalItemsDiscovered, discoveredEntries.length)
  )
  achievements.setStat(
    'chartersDiscovered',
    Math.max(
      achievements.stats.chartersDiscovered,
      discoveredEntries.filter((entry) => entry.category === 'charters').length
    )
  )
  achievements.setStat(
    'fateSealsDiscovered',
    Math.max(
      achievements.stats.fateSealsDiscovered,
      progression.stats.fateSealsDiscovered.size
    )
  )
  achievements.setStat(
    'celestialOrbsDiscovered',
    Math.max(
      achievements.stats.celestialOrbsDiscovered,
      progression.stats.celestialOrbsDiscovered.size
    )
  )
  achievements.setStat(
    'voidScriptsDiscovered',
    Math.max(
      achievements.stats.voidScriptsDiscovered,
      progression.stats.voidScriptsDiscovered.size
    )
  )
}

/** Install the singleton gameplay-to-meta bridge. Safe to call more than once. */
export function initializeMetaProgressionBridge(): () => void {
  if (bridgeCleanup) return bridgeCleanup

  initializeArchive()
  synchronizePersistedMetaState()

  const subscription = createEventSubscription()

  subscription.subscribe('runStart', ({ stake, wallVariant }) => {
    activeRun = { stake, wallId: wallVariant, hadFlowers: false }
    useArchiveStore.getState().clearCurrentRun()
    processProgressionEvent({ type: 'run_started' })
    recordArchiveItem('walls', wallVariant, 'starting')
    checkAchievements()
  })

  subscription.subscribe('roundStart', ({ actNumber }) => {
    processProgressionEvent({ type: 'act_reached', value: actNumber })
    maximizeAchievementStat('highestActReached', actNumber)
    checkAchievements()
  })

  subscription.subscribe('handPlayed', ({ tiles, score }) => {
    processProgressionEvent({ type: 'hand_scored', value: score })
    processProgressionEvent({ type: 'tile_played', value: tiles.length })
    maximizeAchievementStat('highestSingleHandScore', score)
    incrementAchievementStat('totalTilesPlayed', tiles.length)
    checkAchievements()
  })

  subscription.subscribe('tileDiscarded', () => {
    processProgressionEvent({ type: 'tile_discarded' })
    incrementAchievementStat('totalTilesDiscarded')
    checkAchievements()
  })

  subscription.subscribe('goldChanged', ({ delta, newGold }) => {
    if (delta > 0) {
      processProgressionEvent({ type: 'gold_earned', value: delta })
      incrementAchievementStat('totalGoldEarned', delta)
    } else if (delta < 0) {
      processProgressionEvent({ type: 'gold_spent', value: Math.abs(delta) })
    }

    const progression = useProgressionStore.getState()
    progression.updateStats({
      currentRunGold: newGold,
      maxGoldInRun: Math.max(progression.stats.maxGoldInRun, newGold),
    })
    maximizeAchievementStat('maxGoldInRun', newGold)
    checkAchievements()
  })

  subscription.subscribe('itemPurchased', ({ itemType }) => {
    if (itemType === 'Tile') {
      processProgressionEvent({ type: 'tile_purchased' })
    }
  })

  subscription.subscribe('decreeAcquired', ({ decreeId, source = 'purchase' }) => {
    recordArchiveItem('decrees', decreeId, SOURCE_TRIGGERS[source])
    if (source === 'purchase') {
      processProgressionEvent({ type: 'decree_purchased', itemId: decreeId })
      incrementAchievementStat('totalDecreesPurchased')
    } else {
      useProgressionStore.getState().discoverItem(decreeId, 'decree')
    }
    checkAchievements()
  })

  subscription.subscribe('charterRedeemed', ({ charterId, actNumber }) => {
    const discovered = recordArchiveItem('charters', charterId, 'purchase')
    processProgressionEvent({ type: 'charter_purchased', itemId: charterId })
    if (discovered) incrementAchievementStat('chartersDiscovered')
    if (actNumber <= 4) {
      incrementAchievementStat('chartersPurchasedByAct4')
    }
    checkAchievements()
  })

  subscription.subscribe(
    'consumableAcquired',
    ({ consumableType, itemId, source = 'purchase' }) => {
      const discovered = recordArchiveItem('consumables', itemId, SOURCE_TRIGGERS[source])
      processProgressionEvent({
        type: 'consumable_acquired',
        itemId,
        itemType: consumableType,
        source,
      })

      if (discovered) {
        if (consumableType === 'FateSeal') incrementAchievementStat('fateSealsDiscovered')
        if (consumableType === 'CelestialOrb') {
          incrementAchievementStat('celestialOrbsDiscovered')
        }
        if (consumableType === 'VoidScript') incrementAchievementStat('voidScriptsDiscovered')
      }
      checkAchievements()
    }
  )

  subscription.subscribe('fateSealUsed', ({ sealId }) => {
    processProgressionEvent({ type: 'fate_seal_used', itemId: sealId })
    incrementAchievementStat('totalFateSealsUsed')
    checkAchievements()
  })

  subscription.subscribe('celestialOrbUsed', ({ orbId }) => {
    processProgressionEvent({ type: 'celestial_orb_used', itemId: orbId })
    incrementAchievementStat('totalCelestialOrbsUsed')
    checkAchievements()
  })

  subscription.subscribe('voidScriptUsed', ({ scriptId }) => {
    processProgressionEvent({ type: 'void_script_used', itemId: scriptId })
    checkAchievements()
  })

  subscription.subscribe('roundSkipped', ({ omenTagGranted }) => {
    processProgressionEvent({ type: 'round_skipped' })
    if (omenTagGranted) recordArchiveItem('omens', omenTagGranted, 'skip_reward')
    checkAchievements()
  })

  subscription.subscribe('roundEnd', ({ won, score }) => {
    if (!won) return
    processProgressionEvent({ type: 'round_completed', value: score })
  })

  subscription.subscribe('mandateActivated', ({ mandateId }) => {
    recordArchiveItem('mandates', mandateId, 'mandate_encounter')
    processProgressionEvent({
      type: 'item_discovered',
      itemId: mandateId,
      itemType: 'mandate',
    })
    checkAchievements()
  })

  subscription.subscribe('yakuScored', ({ yakuId }) => {
    processProgressionEvent({ type: 'yaku_scored', itemId: yakuId })
    if (yakuId === 'yakuhai_wind') incrementAchievementStat('totalWindYakuScored')
    if (yakuId === 'yakuhai_dragon') incrementAchievementStat('totalDragonYakuScored')
    checkAchievements()
  })

  subscription.subscribe('yakumanScored', () => {
    processProgressionEvent({ type: 'yakuman_scored' })
    incrementAchievementStat('totalYakumanScored')
    checkAchievements()
  })

  subscription.subscribe('flowerCollected', () => {
    if (activeRun) activeRun.hadFlowers = true
    processProgressionEvent({ type: 'flower_collected' })
  })

  subscription.subscribe('packOpened', ({ packType, packSize }) => {
    const archiveId = `${packType.toLowerCase()}_${packSize.toLowerCase()}`
    recordArchiveItem('packs', archiveId, 'pack_open')
    processProgressionEvent({ type: 'pack_opened' })
    checkAchievements()
  })

  subscription.subscribe('shopRerolled', () => {
    processProgressionEvent({ type: 'shop_rerolled' })
  })

  subscription.subscribe('interestEarned', ({ amount }) => {
    processProgressionEvent({ type: 'interest_collected', wasMaxInterest: amount >= 5 })
  })

  subscription.subscribe('runEnd', ({ victory, score, act }) => {
    const progression = useProgressionStore.getState()
    const roundsCompleted = progression.stats.currentRunRoundsCompleted
    processProgressionEvent({ type: 'run_completed', value: score })
    processProgressionEvent(
      victory
        ? {
            type: 'run_won',
            stakeTier: activeRun?.stake ?? 1,
            wallId: activeRun?.wallId ?? 'green_felt',
            roundsCompleted,
            hadFlowers: activeRun?.hadFlowers ?? false,
          }
        : { type: 'run_lost' }
    )

    incrementAchievementStat('runsCompleted')
    if (victory) {
      useStakeStore.getState().recordVictory(
        score,
        act,
        activeRun?.wallId ?? 'green_felt',
        activeRun?.stake ?? 1
      )
      incrementAchievementStat('runsWon')
      minimizeAchievementStat('fastestWinRounds', roundsCompleted)
      useArchiveStore.getState().incrementWins(useArchiveStore.getState().currentRunItems)
    }
    checkAchievements()
    activeRun = null
  })

  bridgeCleanup = () => {
    subscription.unsubscribeAll()
    activeRun = null
    bridgeCleanup = null
  }
  return bridgeCleanup
}

/** Remove the bridge, primarily for isolated tests and hot reload. */
export function shutdownMetaProgressionBridge(): void {
  bridgeCleanup?.()
}
