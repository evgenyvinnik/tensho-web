/**
 * Connects authoritative gameplay events to the three persisted meta systems.
 *
 * Gameplay code only emits domain events. This bridge owns the cross-run side
 * effects so the Archive, unlock progression, and achievements stay in sync
 * without introducing store dependencies into the orchestrator.
 */

import {
  createArchiveKey,
  type ArchiveCategory,
} from '../config/archiveDefinitions'
import {
  CHARTER_UNLOCKS,
  ALL_UNLOCKS,
  getUnlockById,
  type UnlockCategory,
} from '../config/unlockDefinitions'
import { getDecreeUnlockCondition } from '../config/decreeUnlocks'
import { getConsumableUnlockCondition } from '../config/consumableUnlocks'
import {
  ACHIEVEMENT_DEFINITIONS,
  getAchievementDefinition,
  type AchievementStats,
  useAchievementStore,
} from '../stores/achievementStore'
import { initializeArchive, useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { useTableStyleStore } from '../stores/tableStyleStore'
import type {
  ProgressionEventPayload,
  UnlockCheckResult,
} from '../systems/MetaProgressionSystem'
import { metaProgressionSystem } from '../systems/MetaProgressionSystem'
import type { DiscoveryTrigger } from '../systems/ArchiveSystem'
import { createEventSubscription, eventBus } from './EventBus'
import {
  runMetaContext,
  restoreMetaProgressionRunContext,
} from './RunMetaContext'
import { isSecretPattern } from '../rules/PlayPattern'

const UNLOCK_ARCHIVE_CATEGORIES: Partial<
  Record<UnlockCategory, ArchiveCategory>
> = {
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

let bridgeCleanup: (() => void) | null = null

function syncProgressionUnlocks(result: UnlockCheckResult): void {
  const archive = useArchiveStore.getState()

  for (const unlock of result.newUnlocks) {
    const archiveCategory = UNLOCK_ARCHIVE_CATEGORIES[unlock.category]
    if (archiveCategory) {
      archive.unlockItem(archiveCategory, unlock.unlocksId)
    }
    if (unlock.category === 'table_style') {
      useTableStyleStore.getState().unlockStyle(unlock.unlocksId)
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

function processProgressionEvent(
  event: ProgressionEventPayload
): UnlockCheckResult {
  const result = useProgressionStore.getState().processEvent(event)
  syncProgressionUnlocks(result)
  syncTableProgress()
  return result
}

/** Project lifetime counters without adding the same purchases again on reload. */
function syncTableProgress(): void {
  const { stats, fullUnlockEnabled } = useProgressionStore.getState()
  const tables = useTableStyleStore.getState()
  // Only victory histories prove difficulty. Selected stakes, availability,
  // and highestCompleted summaries cannot create a win during migration.
  const wonTiers = [
    ...Object.values(stats.stakeVictories).flat(),
    ...Object.entries(useStakeStore.getState().wallProgress).flatMap(
      ([wallId, progress]) =>
        progress.victories
          .filter((win) => win.wallId === wallId)
          .map((win) => win.stakeTier)
    ),
  ].filter((tier) => Number.isInteger(tier) && tier >= 1 && tier <= 8)
  tables.updateStats({
    highestTierWon: fullUnlockEnabled
      ? (tables.stats.highestTierWon ?? 0)
      : Math.max(0, ...wonTiers),
    highestActCompleted: Math.max(
      stats.highestActCompleted,
      stats.highestActReached - 1
    ),
    maxFlowersInRun: stats.currentRunFlowersCollected,
    maxDecreesInWin: stats.maxDecreesInWin,
    totalDecreesPurchased: Math.max(
      0,
      stats.totalDecreesPurchased - tables.stats.totalDecreesPurchased
    ),
    fewestDecreesInWin: Number.isSafeInteger(stats.fewestDecreesInWin)
      ? stats.fewestDecreesInWin
      : undefined,
    maxCorruptedSeasonsSurvived: stats.corruptedSeasonsSurvived,
    hasScoredYakuman: stats.yakumanScored > 0,
  })
}

function incrementAchievementStat(
  stat: keyof AchievementStats,
  amount = 1
): void {
  useAchievementStore.getState().incrementStat(stat, amount)
}

function maximizeAchievementStat(
  stat: keyof AchievementStats,
  value: number
): void {
  const achievementStore = useAchievementStore.getState()
  if (value > achievementStore.stats[stat]) {
    achievementStore.setStat(stat, value)
  }
}

function minimizeAchievementStat(
  stat: keyof AchievementStats,
  value: number
): void {
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
  syncAchievementRewards()

  for (const achievement of Object.values(
    useAchievementStore.getState().achievements
  )) {
    if (!achievement.unlocked || previouslyUnlocked.has(achievement.id))
      continue
    const definition = getAchievementDefinition(achievement.id)
    eventBus.emit('achievementUnlocked', {
      achievementId: achievement.id,
      achievementName: definition?.japaneseTitle ?? achievement.id,
    })
  }
}

/** An earned accolade is historical evidence, not permission to invent stats.
 * Charter rewards retain their separate base-purchase prerequisites.
 */
function syncAchievementRewards(): void {
  const progression = useProgressionStore.getState()
  if (progression.fullUnlockEnabled) return
  const { achievements } = useAchievementStore.getState()
  for (const { id, reward } of ACHIEVEMENT_DEFINITIONS) {
    if (
      !reward ||
      reward.category === 'charters' ||
      !achievements[id]?.unlocked
    )
      continue
    const category =
      reward.category === 'tableStyles' ? 'table_style' : 'decree'
    const unlock = ALL_UNLOCKS.find(
      (definition) =>
        definition.category === category &&
        definition.unlocksId === reward.itemId
    )
    if (!unlock) continue
    progression.unlockItem(unlock.id, false)
    syncProgressionUnlocks({ newUnlocks: [unlock], progressUpdates: [] })
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

  const discovered = useArchiveStore
    .getState()
    .discoverItem(
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

/** Reconcile derived counters/unlocks after hydration or a coordinated reset. */
export function synchronizePersistedMetaState(): void {
  const progression = useProgressionStore.getState()
  const archive = useArchiveStore.getState()

  if (progression.fullUnlockEnabled) {
    // Reconcile catalog additions after reload without inventing wins or awards.
    progression.enableFullUnlock()
    archive.unlockAll()
    const tables = useTableStyleStore.getState()
    for (const table of tables.getAllStyles()) tables.unlockStyle(table.id)
  }

  // Evaluate only recorded milestones (including legacy award records). This
  // restores eligibility without replaying gameplay or announcing old awards.
  useAchievementStore.getState().checkAchievements()
  syncAchievementRewards()

  // Older releases allowed upgrades before achievement gating. Preserve an
  // actual recorded acquisition, not Archive-only discovery/unlock flags.
  for (const definition of CHARTER_UNLOCKS) {
    if (progression.stats.chartersPurchased.has(definition.unlocksId)) {
      progression.unlockItem(definition.id, false)
    }
  }

  // Preserve actual historical acquisitions, not old Archive-only unlocked
  // flags. Blueprint's original unlock record ID remains valid.
  const gatedItems = ALL_UNLOCKS.filter(
    (definition) =>
      (definition.category === 'decree' &&
        getDecreeUnlockCondition(definition.unlocksId)) ||
      (definition.category === 'consumable' &&
        getConsumableUnlockCondition(definition.unlocksId))
  )
  for (const definition of gatedItems) {
    if (
      progression.stats.decreesDiscovered.has(definition.unlocksId) ||
      progression.stats.fateSealsDiscovered.has(definition.unlocksId) ||
      progression.stats.celestialOrbsDiscovered.has(definition.unlocksId)
    )
      progression.unlockItem(definition.id, false)
  }
  // Existing proven lifetime conditions may now unlock newly connected items.
  // No historic per-run Yakuman maximum is invented from a lifetime total.
  for (const definition of gatedItems) {
    const current = useProgressionStore.getState()
    if (
      metaProgressionSystem.checkUnlockConditions(definition, {
        stats: current.stats,
        unlockedIds: new Set(Object.keys(current.unlocks)),
      }).allMet
    )
      current.unlockItem(definition.id, false)
  }
  useArchiveStore.setState((state) => {
    const entries = { ...state.entries }
    for (const definition of gatedItems) {
      const key = `${definition.category === 'consumable' ? 'consumables' : 'decrees'}:${definition.unlocksId}`
      const entry = entries[key]
      if (entry)
        entries[key] = {
          ...entry,
          isUnlocked: useProgressionStore
            .getState()
            .isItemUnlocked(definition.unlocksId),
          unlockCondition:
            getDecreeUnlockCondition(definition.unlocksId) ??
            getConsumableUnlockCondition(definition.unlocksId),
        }
    }
    return { entries }
  })

  for (const unlock of Object.values(useProgressionStore.getState().unlocks)) {
    const canonical = getUnlockById(unlock.id) ?? unlock
    const category = UNLOCK_ARCHIVE_CATEGORIES[canonical.category]
    if (category) archive.unlockItem(category, canonical.unlocksId)
    if (canonical.category === 'table_style') {
      useTableStyleStore.getState().unlockStyle(canonical.unlocksId)
    }
  }
  syncTableProgress()

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

  subscription.subscribe('gameLoaded', ({ endlessContext }) => {
    // Reconnecting a legacy save is not a new run or another victory. The
    // engine's standalone snapshot codec remains exact without this bridge.
    if (endlessContext && !runMetaContext.current)
      restoreMetaProgressionRunContext(endlessContext)
  })

  subscription.subscribe('runStart', ({ stake, wallVariant }) => {
    runMetaContext.current = {
      stake,
      wallId: wallVariant,
      hadFlowers: false,
      flowerTypes: new Set(),
      pendingCorruptedSeasons: 0,
      windYakuScored: 0,
      shopRerolls: 0,
      paidTurns: 0,
      chartersPurchasedByAct5: 0,
    }
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

  subscription.subscribe('paidTurnSpent', () => {
    const run = runMetaContext.current
    if (run?.paidTurns !== undefined) run.paidTurns++
  })

  subscription.subscribe('wallCompositionChanged', ({ tileCount }) => {
    if (!Number.isSafeInteger(tileCount) || tileCount < 0) return
    minimizeAchievementStat('minimumWallSize', tileCount)
    maximizeAchievementStat('maximumWallSize', tileCount)
    checkAchievements()
  })

  subscription.subscribe('handPlayed', (event) => {
    const { tiles, score, pattern, glassTilesBroken = 0 } = event
    processProgressionEvent({ type: 'hand_scored', value: score })
    processProgressionEvent({ type: 'tile_played', value: tiles.length })
    maximizeAchievementStat('highestSingleHandScore', score)
    maximizeAchievementStat('maxGlassTilesBrokenInHand', glassTilesBroken)
    incrementAchievementStat('totalTilesPlayed', tiles.length)
    const activeRun = runMetaContext.current
    if (
      activeRun &&
      !useProgressionStore.getState().fullUnlockEnabled &&
      score > 0 &&
      !event.blocked &&
      Number.isInteger(event.windYakuScored) &&
      (event.windYakuScored ?? 0) > 0
    ) {
      const count = event.windYakuScored!
      activeRun.windYakuScored = (activeRun.windYakuScored ?? 0) + count
      incrementAchievementStat('totalWindYakuScored', count)
      maximizeAchievementStat('maxWindYakuInRun', activeRun.windYakuScored)
    }
    if (
      score > 0 &&
      !event.blocked &&
      event.allPlayedTilesWild &&
      event.yakuIds.includes('honitsu')
    ) {
      incrementAchievementStat('wildHalfFlushesScored')
    }
    checkAchievements()
    if (
      isSecretPattern(pattern) &&
      useProgressionStore.getState().discoverPattern(pattern)
    )
      eventBus.emit('secretPatternDiscovered', { pattern })
  })

  subscription.subscribe('tileDiscarded', () => {
    processProgressionEvent({ type: 'tile_discarded' })
    incrementAchievementStat('totalTilesDiscarded')
    checkAchievements()
  })

  subscription.subscribe(
    'goldChanged',
    ({ delta, newGold, spendingCategory }) => {
      if (delta > 0) {
        processProgressionEvent({ type: 'gold_earned', value: delta })
        incrementAchievementStat('totalGoldEarned', delta)
      } else if (delta < 0 && spendingCategory) {
        processProgressionEvent({ type: 'gold_spent', value: Math.abs(delta) })
      }

      const progression = useProgressionStore.getState()
      progression.updateStats({
        currentRunGold: newGold,
        maxGoldInRun: Math.max(progression.stats.maxGoldInRun, newGold),
      })
      maximizeAchievementStat('maxGoldInRun', newGold)
      checkAchievements()
    }
  )

  subscription.subscribe('itemPurchased', ({ itemType }) => {
    if (itemType === 'Tile') {
      processProgressionEvent({ type: 'tile_purchased' })
    }
  })

  subscription.subscribe(
    'decreeAcquired',
    ({ decreeId, source = 'purchase' }) => {
      // A paid pack from an older release may legitimately contain a newly
      // gated item. Grandfather its real acquisition immediately, as on reload.
      if (getDecreeUnlockCondition(decreeId)) {
        const unlock = ALL_UNLOCKS.find((item) => item.unlocksId === decreeId)
        if (unlock) useProgressionStore.getState().unlockItem(unlock.id, false)
      }
      recordArchiveItem('decrees', decreeId, SOURCE_TRIGGERS[source])
      if (source === 'purchase') {
        processProgressionEvent({ type: 'decree_purchased', itemId: decreeId })
        incrementAchievementStat('totalDecreesPurchased')
      } else {
        useProgressionStore.getState().discoverItem(decreeId, 'decree')
      }
      checkAchievements()
    }
  )

  subscription.subscribe('charterRedeemed', ({ charterId, actNumber }) => {
    const discovered = recordArchiveItem('charters', charterId, 'purchase')
    processProgressionEvent({ type: 'charter_purchased', itemId: charterId })
    if (discovered) incrementAchievementStat('chartersDiscovered')
    const run = runMetaContext.current
    if (
      run &&
      !useProgressionStore.getState().fullUnlockEnabled &&
      Number.isInteger(actNumber) &&
      actNumber >= 1 &&
      actNumber <= 5
    ) {
      run.chartersPurchasedByAct5 = (run.chartersPurchasedByAct5 ?? 0) + 1
      maximizeAchievementStat(
        'maxChartersPurchasedByAct5',
        run.chartersPurchasedByAct5
      )
    }
    checkAchievements()
  })

  subscription.subscribe(
    'buildProgressChanged',
    ({ decreeCount, editionDecreeCount, handSizeLimit }) => {
      processProgressionEvent({
        type: 'build_changed',
        decreesOwned: decreeCount,
        editionDecreeCount,
        handSizeLimit,
      })
    }
  )

  subscription.subscribe(
    'consumableAcquired',
    ({ consumableType, itemId, source = 'purchase' }) => {
      // Honor real acquisitions from already-paid legacy packs, as on reload.
      if (getConsumableUnlockCondition(itemId)) {
        const unlock = ALL_UNLOCKS.find((item) => item.unlocksId === itemId)
        if (unlock) useProgressionStore.getState().unlockItem(unlock.id, false)
      }
      const discovered = recordArchiveItem(
        'consumables',
        itemId,
        SOURCE_TRIGGERS[source]
      )
      processProgressionEvent({
        type: 'consumable_acquired',
        itemId,
        itemType: consumableType,
        source,
      })

      if (discovered) {
        if (consumableType === 'FateSeal')
          incrementAchievementStat('fateSealsDiscovered')
        if (consumableType === 'CelestialOrb') {
          incrementAchievementStat('celestialOrbsDiscovered')
        }
        if (consumableType === 'VoidScript')
          incrementAchievementStat('voidScriptsDiscovered')
      }
      checkAchievements()
    }
  )

  subscription.subscribe('fateSealUsed', ({ sealId, source }) => {
    processProgressionEvent({ type: 'fate_seal_used', itemId: sealId, source })
    incrementAchievementStat('totalFateSealsUsed')
    checkAchievements()
  })

  subscription.subscribe('celestialOrbUsed', ({ orbId, source }) => {
    processProgressionEvent({
      type: 'celestial_orb_used',
      itemId: orbId,
      source,
    })
    incrementAchievementStat('totalCelestialOrbsUsed')
    checkAchievements()
  })

  subscription.subscribe('yakuLevelsChanged', ({ highestLevel }) => {
    maximizeAchievementStat('highestYakuLevel', highestLevel)
    checkAchievements()
  })

  subscription.subscribe('voidScriptUsed', ({ scriptId }) => {
    processProgressionEvent({ type: 'void_script_used', itemId: scriptId })
    checkAchievements()
  })

  subscription.subscribe('omenEarned', ({ omenTagGranted }) => {
    // A swift clear takes the place of a skipped round in lifetime stats. It
    // still wins and pays interest, so it keeps the max-interest streak.
    processProgressionEvent({ type: 'round_skipped' })
    if (omenTagGranted)
      recordArchiveItem('omens', omenTagGranted, 'swift_clear')
    checkAchievements()
  })

  subscription.subscribe('roundEnd', ({ won, score, honorDiscards }) => {
    const corrupted = runMetaContext.current?.pendingCorruptedSeasons ?? 0
    if (runMetaContext.current)
      runMetaContext.current.pendingCorruptedSeasons = 0
    if (!won) {
      processProgressionEvent({
        type: 'interest_collected',
        wasMaxInterest: false,
      })
      return
    }
    processProgressionEvent({ type: 'round_completed', value: score })
    for (let i = 0; i < corrupted; i++) {
      processProgressionEvent({ type: 'corrupted_season_survived' })
    }
    if (honorDiscards === 0) {
      incrementAchievementStat('roundsWonWithoutHonorDiscards')
      checkAchievements()
    }
  })

  subscription.subscribe('actComplete', ({ actNumber }) => {
    processProgressionEvent({ type: 'act_completed', value: actNumber })
  })

  subscription.subscribe('seasonCorrupted', () => {
    if (runMetaContext.current) runMetaContext.current.pendingCorruptedSeasons++
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
    if (yakuId === 'yakuhai_dragon')
      incrementAchievementStat('totalDragonYakuScored')
    checkAchievements()
  })

  subscription.subscribe('yakumanScored', ({ yakuId }) => {
    // Paid tier-4 hands emit this event instead of yakuScored. Record their
    // family once too, including ordinary families ascended to Yakuman tier.
    processProgressionEvent({ type: 'yaku_scored', itemId: yakuId })
    processProgressionEvent({ type: 'yakuman_scored' })
    incrementAchievementStat('totalYakumanScored')
    checkAchievements()
  })

  subscription.subscribe('flowerCollected', ({ flowerType }) => {
    const activeRun = runMetaContext.current
    if (!activeRun) return
    activeRun.hadFlowers = true
    activeRun.flowerTypes.add(flowerType)
    processProgressionEvent({
      type: 'flower_collected',
      value: activeRun.flowerTypes.size,
    })
  })

  subscription.subscribe('packOpened', ({ packType, packSize }) => {
    const archiveId = `${packType.toLowerCase()}_${packSize.toLowerCase()}`
    recordArchiveItem('packs', archiveId, 'pack_open')
    processProgressionEvent({ type: 'pack_opened' })
    checkAchievements()
  })

  subscription.subscribe('shopRerolled', () => {
    const run = runMetaContext.current
    if (run?.shopRerolls !== undefined) run.shopRerolls++
    processProgressionEvent({ type: 'shop_rerolled' })
  })

  subscription.subscribe('interestSettled', ({ amount, cap }) => {
    processProgressionEvent({
      type: 'interest_collected',
      wasMaxInterest: cap > 0 && amount >= cap,
    })
  })

  subscription.subscribe(
    'runEnd',
    ({ victory, score, act, decreesOwned, decreeIds }) => {
      const progression = useProgressionStore.getState()
      const roundsCompleted = progression.stats.currentRunRoundsCompleted
      processProgressionEvent({ type: 'run_completed', value: score })
      processProgressionEvent(
        victory
          ? {
              type: 'run_won',
              stakeTier: runMetaContext.current?.stake ?? 1,
              wallId: runMetaContext.current?.wallId ?? 'green_felt',
              roundsCompleted,
              paidTurns: progression.fullUnlockEnabled
                ? undefined
                : runMetaContext.current?.paidTurns,
              hadFlowers: runMetaContext.current?.hadFlowers ?? false,
              decreesOwned,
            }
          : { type: 'run_lost' }
      )

      incrementAchievementStat('runsCompleted')
      if (victory) {
        if (!progression.fullUnlockEnabled && runMetaContext.current) {
          useArchiveStore
            .getState()
            .recordStakeVictory(
              [
                createArchiveKey('walls', runMetaContext.current.wallId),
                ...(decreeIds ?? []).map((id) =>
                  createArchiveKey('decrees', id)
                ),
              ],
              runMetaContext.current.stake
            )
        }
        useStakeStore
          .getState()
          .recordVictory(
            score,
            act,
            runMetaContext.current?.wallId ?? 'green_felt',
            runMetaContext.current?.stake ?? 1
          )
        incrementAchievementStat('runsWon')
        if (runMetaContext.current?.shopRerolls === 0)
          incrementAchievementStat('winsWithoutReroll')
        minimizeAchievementStat('fastestWinRounds', roundsCompleted)
        const paidTurns = runMetaContext.current?.paidTurns
        if (
          paidTurns !== undefined &&
          Number.isSafeInteger(paidTurns) &&
          paidTurns > 0
        )
          minimizeAchievementStat('fastestWinPaidTurns', paidTurns)
        useArchiveStore
          .getState()
          .incrementWins(useArchiveStore.getState().currentRunItems)
      }
      checkAchievements()
      // Securing the campaign settles the win; the run may continue in Endless.
      // Keep its proven run-local history without replaying runStart or rewards.
      if (!victory) runMetaContext.current = null
    }
  )

  subscription.subscribe('gameOver', ({ reason }) => {
    // Endless defeat deliberately emits no second runEnd event.
    if (reason !== 'victory') runMetaContext.current = null
  })

  subscription.subscribe('phaseChanged', ({ newPhase }) => {
    if (newPhase === 'menu') runMetaContext.current = null
  })

  bridgeCleanup = () => {
    subscription.unsubscribeAll()
    runMetaContext.current = null
    bridgeCleanup = null
  }
  return bridgeCleanup
}

/** Remove the bridge, primarily for isolated tests and hot reload. */
export function shutdownMetaProgressionBridge(): void {
  bridgeCleanup?.()
}

/** A deliberate data reset is not a completed/lost run. Keep subscriptions. */
export function resetMetaProgressionRunContext(): void {
  runMetaContext.current = null
}
