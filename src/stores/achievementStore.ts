/**
 * Achievement Store - Heavenly Accolades (天賞)
 *
 * Manages achievement tracking with localStorage persistence.
 * Based on ARCHITECTURE.MD Section 30 - Heavenly Accolades.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProgressionStore } from './progressionStore'
import { useArchiveStore } from './archiveStore'
import { useStakeStore } from './stakeStore'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import { isDiscoveryAchievementComplete } from '../utils/achievementDiscovery'
import { getGoldDecreeProgress } from '../utils/stakeMastery'
import type { AchievementArtId, ControlArtId } from '../utils/generatedArt'
import { getAllFateSeals } from '../systems/FateSealSystem'
import { getAllCelestialOrbs } from '../systems/CelestialOrbSystem'

const ACHIEVEMENT_STAKE_TIERS: Readonly<Record<string, number>> = {
  red: 2,
  black: 4,
  gold: 8,
}

/**
 * Achievement categories based on ARCHITECTURE.MD
 */
export type AchievementCategory =
  | 'progression'
  | 'cumulative'
  | 'skill'
  | 'scoring'
  | 'collection'
  | 'mastery'
  | 'challenge'

/**
 * Achievement definition
 */
export interface AchievementDefinition {
  id: string
  nameKey: string // i18n key for name
  descriptionKey: string // i18n key for description
  japaneseTitle: string // Japanese ceremonial name
  category: AchievementCategory
  icon: AchievementArtId // Generated image identity
  reward?: {
    category: 'decrees' | 'charters' | 'tableStyles'
    itemId: string
  }
  condition: {
    type: string
    target?: number
    value?: string
  }
}

/**
 * Achievement progress tracking
 */
export interface AchievementProgress {
  id: string
  unlocked: boolean
  unlockedAt?: number // Timestamp
  progress?: number // For cumulative achievements
  seen?: boolean // Whether the player has seen the unlock notification
}

/**
 * Statistics tracked for achievement conditions
 */
export interface AchievementStats {
  // Progression
  highestActReached: number
  runsCompleted: number
  runsWon: number

  // Cumulative
  totalTilesPlayed: number
  totalTilesDiscarded: number
  totalGoldEarned: number
  maxGoldInRun: number
  totalFateSealsUsed: number
  totalCelestialOrbsUsed: number
  totalDecreesPurchased: number
  maxGlassTilesBrokenInHand: number

  // Scoring
  highestSingleHandScore: number
  totalWindYakuScored: number
  maxWindYakuInRun: number
  totalDragonYakuScored: number
  totalYakumanScored: number
  highestYakuLevel: number
  wildHalfFlushesScored: number
  roundsWonWithoutHonorDiscards: number

  // Skill
  fastestWinRounds: number
  fastestWinPaidTurns: number
  maxChartersPurchasedByAct5: number

  // Collection
  fateSealsDiscovered: number
  celestialOrbsDiscovered: number
  voidScriptsDiscovered: number
  chartersDiscovered: number
  totalItemsDiscovered: number

  // Challenge
  challengeRunsCompleted: number // Historical save field; Challenge Runs deferred.
  minimumWallSize: number
  maximumWallSize: number
  winsWithoutReroll: number
}

/**
 * Achievement store state
 */
export interface AchievementState {
  // Achievement progress
  achievements: Record<string, AchievementProgress>

  // Statistics for tracking conditions
  stats: AchievementStats

  // Actions
  unlockAchievement: (id: string) => void
  markAsSeen: (id: string) => void
  updateProgress: (id: string, progress: number) => void
  incrementStat: (stat: keyof AchievementStats, amount?: number) => void
  setStat: (stat: keyof AchievementStats, value: number) => void
  checkAchievements: () => void
  getUnlockedCount: () => number
  getUnseenUnlocks: () => string[]
  resetAchievements: () => void
}

/**
 * Default stats
 */
const DEFAULT_STATS: AchievementStats = {
  highestActReached: 0,
  runsCompleted: 0,
  runsWon: 0,
  totalTilesPlayed: 0,
  totalTilesDiscarded: 0,
  totalGoldEarned: 0,
  maxGoldInRun: 0,
  totalFateSealsUsed: 0,
  totalCelestialOrbsUsed: 0,
  totalDecreesPurchased: 0,
  maxGlassTilesBrokenInHand: 0,
  highestSingleHandScore: 0,
  totalWindYakuScored: 0,
  maxWindYakuInRun: 0,
  totalDragonYakuScored: 0,
  totalYakumanScored: 0,
  highestYakuLevel: 1,
  wildHalfFlushesScored: 0,
  roundsWonWithoutHonorDiscards: 0,
  fastestWinRounds: Infinity,
  fastestWinPaidTurns: Infinity,
  maxChartersPurchasedByAct5: 0,
  fateSealsDiscovered: 0,
  celestialOrbsDiscovered: 0,
  voidScriptsDiscovered: 0,
  chartersDiscovered: 0,
  totalItemsDiscovered: 0,
  challengeRunsCompleted: 0,
  minimumWallSize: Number.MAX_SAFE_INTEGER,
  maximumWallSize: 0,
  winsWithoutReroll: 0,
}

/**
 * All achievement definitions based on ARCHITECTURE.MD Section 30
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // === PROGRESSION ACCOLADES ===
  {
    id: 'first_steps',
    nameKey: 'achievements.firstSteps.name',
    descriptionKey: 'achievements.firstSteps.description',
    japaneseTitle: '初歩',
    category: 'progression',
    icon: 'first_steps',
    reward: { category: 'decrees', itemId: 'stage_master' },
    condition: { type: 'reach_act', target: 4 },
  },
  {
    id: 'ascending',
    nameKey: 'achievements.ascending.name',
    descriptionKey: 'achievements.ascending.description',
    japaneseTitle: '昇進',
    category: 'progression',
    icon: 'ascending',
    reward: { category: 'decrees', itemId: 'flower_pot' },
    condition: { type: 'reach_act', target: 8 },
  },
  {
    id: 'victory',
    nameKey: 'achievements.victory.name',
    descriptionKey: 'achievements.victory.description',
    japaneseTitle: '勝利',
    category: 'progression',
    icon: 'victory',
    reward: { category: 'decrees', itemId: 'decree-blueprint' },
    condition: { type: 'win_run' },
  },
  {
    id: 'red_path',
    nameKey: 'achievements.redPath.name',
    descriptionKey: 'achievements.redPath.description',
    japaneseTitle: '赤道',
    category: 'progression',
    icon: 'red_path',
    reward: { category: 'tableStyles', itemId: 'crimson_wall' },
    condition: { type: 'win_stake', value: 'red' },
  },
  {
    id: 'black_path',
    nameKey: 'achievements.blackPath.name',
    descriptionKey: 'achievements.blackPath.description',
    japaneseTitle: '黒道',
    category: 'progression',
    icon: 'black_path',
    reward: { category: 'tableStyles', itemId: 'obsidian_wall' },
    condition: { type: 'win_stake', value: 'black' },
  },
  {
    id: 'golden_path',
    nameKey: 'achievements.goldenPath.name',
    descriptionKey: 'achievements.goldenPath.description',
    japaneseTitle: '金道',
    category: 'progression',
    icon: 'golden_path',
    condition: { type: 'win_stake', value: 'gold' },
  },

  // === CUMULATIVE ACCOLADES ===
  {
    id: 'tile_master',
    nameKey: 'achievements.tileMaster.name',
    descriptionKey: 'achievements.tileMaster.description',
    japaneseTitle: '牌師',
    category: 'cumulative',
    icon: 'tile_master',
    reward: { category: 'charters', itemId: 'swift_hand' },
    condition: { type: 'tiles_played', target: 2500 },
  },
  {
    id: 'discard_artist',
    nameKey: 'achievements.discardArtist.name',
    descriptionKey: 'achievements.discardArtist.description',
    japaneseTitle: '捨牌芸者',
    category: 'cumulative',
    icon: 'discard_artist',
    reward: { category: 'charters', itemId: 'wasteful_plenty' },
    condition: { type: 'tiles_discarded', target: 2500 },
  },
  {
    id: 'fortune_built',
    nameKey: 'achievements.fortuneBuilt.name',
    descriptionKey: 'achievements.fortuneBuilt.description',
    japaneseTitle: '富豪',
    category: 'cumulative',
    icon: 'fortune_built',
    reward: { category: 'decrees', itemId: 'satellite' },
    condition: { type: 'max_gold', target: 400 },
  },

  // === SKILL ACCOLADES ===
  {
    id: 'wild_flush',
    nameKey: 'achievements.wildFlush.name',
    descriptionKey: 'achievements.wildFlush.description',
    japaneseTitle: '万能清一色',
    category: 'skill',
    icon: 'wild_flush',
    condition: { type: 'special_hand', value: 'honitsu_wild' },
  },
  {
    id: 'speed_run',
    nameKey: 'achievements.speedRun.name',
    descriptionKey: 'achievements.speedRun.description',
    japaneseTitle: '疾走',
    category: 'skill',
    icon: 'speed_run',
    reward: { category: 'decrees', itemId: 'swift_andy' },
    condition: { type: 'win_paid_turns', target: 48 },
  },
  {
    id: 'charter_collector',
    nameKey: 'achievements.charterCollector.name',
    descriptionKey: 'achievements.charterCollector.description',
    japaneseTitle: '皇勅収集',
    category: 'skill',
    icon: 'charter_collector',
    condition: { type: 'charters_by_act', target: 5 },
  },
  {
    id: 'shattered',
    nameKey: 'achievements.shattered.name',
    descriptionKey: 'achievements.shattered.description',
    japaneseTitle: '粉砕',
    category: 'skill',
    icon: 'shattered',
    condition: { type: 'break_glass_tiles', target: 2 },
  },
  {
    id: 'royal_hand',
    nameKey: 'achievements.royalHand.name',
    descriptionKey: 'achievements.royalHand.description',
    japaneseTitle: '帝王手',
    category: 'skill',
    icon: 'royal_hand',
    condition: { type: 'score_yakuman' },
  },
  {
    id: 'retrograde',
    nameKey: 'achievements.retrograde.name',
    descriptionKey: 'achievements.retrograde.description',
    japaneseTitle: '逆行',
    category: 'skill',
    icon: 'retrograde',
    condition: { type: 'yaku_level', target: 10 },
  },
  {
    id: 'keeper_of_winds',
    nameKey: 'achievements.keeperOfWinds.name',
    descriptionKey: 'achievements.keeperOfWinds.description',
    japaneseTitle: '風守',
    category: 'skill',
    icon: 'keeper_of_winds',
    condition: { type: 'wind_yaku_in_run', target: 10 },
  },
  {
    id: 'master_of_silence',
    nameKey: 'achievements.masterOfSilence.name',
    descriptionKey: 'achievements.masterOfSilence.description',
    japaneseTitle: '沈黙の師',
    category: 'skill',
    icon: 'master_of_silence',
    condition: { type: 'rounds_without_honor_discard', target: 3 },
  },
  {
    id: 'seal_bearer',
    nameKey: 'achievements.sealBearer.name',
    descriptionKey: 'achievements.sealBearer.description',
    japaneseTitle: '印持ち',
    category: 'skill',
    icon: 'seal_bearer',
    condition: { type: 'fate_seals_used', target: 10 },
  },

  // === SCORING ACCOLADES ===
  {
    id: 'score_10k',
    nameKey: 'achievements.score10k.name',
    descriptionKey: 'achievements.score10k.description',
    japaneseTitle: '万点',
    category: 'scoring',
    icon: 'score_10k',
    reward: { category: 'decrees', itemId: 'lucky_sixes' },
    condition: { type: 'single_hand_score', target: 10000 },
  },
  {
    id: 'score_1m',
    nameKey: 'achievements.score1m.name',
    descriptionKey: 'achievements.score1m.description',
    japaneseTitle: '百万点',
    category: 'scoring',
    icon: 'score_1m',
    reward: { category: 'decrees', itemId: 'the_idol' },
    condition: { type: 'single_hand_score', target: 1000000 },
  },
  {
    id: 'score_100m',
    nameKey: 'achievements.score100m.name',
    descriptionKey: 'achievements.score100m.description',
    japaneseTitle: '億点',
    category: 'scoring',
    icon: 'score_100m',
    reward: { category: 'decrees', itemId: 'stuntman' },
    condition: { type: 'single_hand_score', target: 100000000 },
  },

  // === COLLECTION ACCOLADES ===
  {
    id: 'seal_scholar',
    nameKey: 'achievements.sealScholar.name',
    descriptionKey: 'achievements.sealScholar.description',
    japaneseTitle: '符学者',
    category: 'collection',
    icon: 'seal_scholar',
    reward: { category: 'decrees', itemId: 'cartomancer' },
    condition: { type: 'discover_all_seals' },
  },
  {
    id: 'star_gazer',
    nameKey: 'achievements.starGazer.name',
    descriptionKey: 'achievements.starGazer.description',
    japaneseTitle: '星読み',
    category: 'collection',
    icon: 'star_gazer',
    reward: { category: 'decrees', itemId: 'astronomer' },
    condition: { type: 'discover_all_orbs' },
  },
  {
    id: 'void_walker',
    nameKey: 'achievements.voidWalker.name',
    descriptionKey: 'achievements.voidWalker.description',
    japaneseTitle: '虚空歩者',
    category: 'collection',
    icon: 'void_walker',
    condition: { type: 'discover_all_scripts' },
  },
  {
    id: 'charter_complete',
    nameKey: 'achievements.charterComplete.name',
    descriptionKey: 'achievements.charterComplete.description',
    japaneseTitle: '皇勅全取',
    category: 'collection',
    icon: 'charter_complete',
    condition: { type: 'discover_all_charters' },
  },
  {
    id: 'archive_complete',
    nameKey: 'achievements.archiveComplete.name',
    descriptionKey: 'achievements.archiveComplete.description',
    japaneseTitle: '全録達成',
    category: 'collection',
    icon: 'archive_complete',
    condition: { type: 'discover_all' },
  },

  // === MASTERY ACCOLADES ===
  {
    id: 'archive_complete_plus',
    nameKey: 'achievements.archiveCompletePlus.name',
    descriptionKey: 'achievements.archiveCompletePlus.description',
    japaneseTitle: '全録達成・極',
    category: 'mastery',
    icon: 'archive_complete_plus',
    condition: { type: 'all_walls_gold_stake' },
  },
  {
    id: 'archive_complete_plus_plus',
    nameKey: 'achievements.archiveCompletePlusPlus.name',
    descriptionKey: 'achievements.archiveCompletePlusPlus.description',
    japaneseTitle: '全録達成・究',
    category: 'mastery',
    icon: 'archive_complete_plus_plus',
    condition: { type: 'gold_sticker_all_decrees' },
  },

  // === CHALLENGE ACCOLADES (regular-run feats) ===
  // Challenge Runs and Rule Bender/Breaker are deferred. Persisted historical
  // records remain readable, but are not part of the active award catalog.
  {
    id: 'deck_minimalist',
    nameKey: 'achievements.deckMinimalist.name',
    descriptionKey: 'achievements.deckMinimalist.description',
    japaneseTitle: '極小山',
    category: 'challenge',
    icon: 'deck_minimalist',
    condition: { type: 'wall_size_max', target: 20 },
  },
  {
    id: 'deck_maximalist',
    nameKey: 'achievements.deckMaximalist.name',
    descriptionKey: 'achievements.deckMaximalist.description',
    japaneseTitle: '極大山',
    category: 'challenge',
    icon: 'deck_maximalist',
    condition: { type: 'wall_size_min', target: 80 },
  },
  {
    id: 'purist',
    nameKey: 'achievements.purist.name',
    descriptionKey: 'achievements.purist.description',
    japaneseTitle: '無転',
    category: 'challenge',
    icon: 'purist',
    condition: { type: 'win_without_reroll' },
  },
]

/**
 * Create initial achievements map from definitions
 */
function createInitialAchievements(): Record<string, AchievementProgress> {
  const achievements: Record<string, AchievementProgress> = {}
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    achievements[def.id] = {
      id: def.id,
      unlocked: false,
      progress: 0,
      seen: true,
    }
  }
  return achievements
}

/**
 * Achievement store with persistence
 */
export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: createInitialAchievements(),
      stats: DEFAULT_STATS,

      unlockAchievement: (id: string) => {
        if (useProgressionStore.getState().fullUnlockEnabled) return
        if (!getAchievementDefinition(id)) return
        const { achievements } = get()
        if (achievements[id] && !achievements[id].unlocked) {
          set({
            achievements: {
              ...achievements,
              [id]: {
                ...achievements[id],
                unlocked: true,
                unlockedAt: Date.now(),
                seen: false,
              },
            },
          })
        }
      },

      markAsSeen: (id: string) => {
        const { achievements } = get()
        if (achievements[id]) {
          set({
            achievements: {
              ...achievements,
              [id]: {
                ...achievements[id],
                seen: true,
              },
            },
          })
        }
      },

      updateProgress: (id: string, progress: number) => {
        if (useProgressionStore.getState().fullUnlockEnabled) return
        if (!getAchievementDefinition(id)) return
        const { achievements } = get()
        if (achievements[id]) {
          set({
            achievements: {
              ...achievements,
              [id]: {
                ...achievements[id],
                progress,
              },
            },
          })
        }
      },

      incrementStat: (stat: keyof AchievementStats, amount = 1) => {
        if (useProgressionStore.getState().fullUnlockEnabled) return
        const { stats } = get()
        set({
          stats: {
            ...stats,
            [stat]: (stats[stat] as number) + amount,
          },
        })
      },

      setStat: (stat: keyof AchievementStats, value: number) => {
        if (useProgressionStore.getState().fullUnlockEnabled) return
        const { stats } = get()
        set({
          stats: {
            ...stats,
            [stat]: value,
          },
        })
      },

      checkAchievements: () => {
        if (useProgressionStore.getState().fullUnlockEnabled) return
        const { stats, achievements, unlockAchievement } = get()
        const lifetime = useProgressionStore.getState().stats

        for (const def of ACHIEVEMENT_DEFINITIONS) {
          if (achievements[def.id]?.unlocked) continue

          let shouldUnlock = false
          const { condition } = def

          switch (condition.type) {
            case 'reach_act':
              shouldUnlock =
                Math.max(stats.highestActReached, lifetime.highestActReached) >=
                (condition.target || 0)
              break
            case 'win_run':
              shouldUnlock = (stats.runsWon ?? 0) > 0
              break
            case 'win_stake': {
              const tier = ACHIEVEMENT_STAKE_TIERS[condition.value ?? '']
              // Red/Black Path accept the named difficulty or higher (GAME_MECHANICS).
              // Selection/unlock summaries are not evidence of a completed run.
              shouldUnlock =
                tier !== undefined &&
                (Object.entries(useStakeStore.getState().wallProgress).some(
                  ([wallId, progress]) =>
                    progress.victories.some(
                      (win) =>
                        win.wallId === wallId &&
                        Number.isInteger(win.stakeTier) &&
                        win.stakeTier >= tier &&
                        win.stakeTier <= 8
                    )
                ) ||
                  Object.values(lifetime.stakeVictories).some((victories) =>
                    victories.some(
                      (wonTier) =>
                        Number.isInteger(wonTier) &&
                        wonTier >= tier &&
                        wonTier <= 8
                    )
                  ))
              break
            }
            case 'all_walls_gold_stake': {
              const { wallProgress } = useStakeStore.getState()
              // Retired walls remain in history, but mastery follows playable tables.
              shouldUnlock =
                TABLE_STYLE_DEFINITIONS.length > 0 &&
                TABLE_STYLE_DEFINITIONS.every(({ id }) =>
                  wallProgress[id]?.victories.some(
                    (win) =>
                      win.wallId === id &&
                      win.stakeTier === ACHIEVEMENT_STAKE_TIERS.gold
                  )
                )
              break
            }
            case 'gold_sticker_all_decrees': {
              const { completed, total } = getGoldDecreeProgress(
                useArchiveStore.getState().entries
              )
              shouldUnlock = total > 0 && completed === total
              break
            }
            case 'tiles_played':
              shouldUnlock = stats.totalTilesPlayed >= (condition.target || 0)
              break
            case 'tiles_discarded':
              shouldUnlock =
                stats.totalTilesDiscarded >= (condition.target || 0)
              break
            case 'break_glass_tiles':
              shouldUnlock =
                stats.maxGlassTilesBrokenInHand >= (condition.target || 0)
              break
            case 'max_gold':
              shouldUnlock =
                Math.max(stats.maxGoldInRun, lifetime.maxGoldInRun) >=
                (condition.target || 0)
              break
            case 'single_hand_score':
              shouldUnlock =
                Math.max(
                  stats.highestSingleHandScore,
                  lifetime.highestSingleHandScore
                ) >= (condition.target || 0)
              break
            case 'fate_seals_used':
              shouldUnlock = stats.totalFateSealsUsed >= (condition.target || 0)
              break
            case 'charters_by_act':
              shouldUnlock =
                stats.maxChartersPurchasedByAct5 >= (condition.target || 0)
              break
            case 'score_yakuman':
              shouldUnlock = (stats.totalYakumanScored ?? 0) > 0
              break
            case 'special_hand':
              shouldUnlock =
                condition.value === 'honitsu_wild' &&
                stats.wildHalfFlushesScored > 0
              break
            case 'yaku_level':
              shouldUnlock = stats.highestYakuLevel >= (condition.target || 0)
              break
            case 'wind_yaku_in_run':
              shouldUnlock = stats.maxWindYakuInRun >= (condition.target || 0)
              break
            case 'rounds_without_honor_discard':
              shouldUnlock =
                stats.roundsWonWithoutHonorDiscards >= (condition.target || 0)
              break
            case 'discover_all_seals':
            case 'discover_all_orbs': {
              const seals = condition.type === 'discover_all_seals'
              const catalog = seals ? getAllFateSeals() : getAllCelestialOrbs()
              const discovered = seals
                ? lifetime.fateSealsDiscovered
                : lifetime.celestialOrbsDiscovered
              const entries = useArchiveStore.getState().entries
              shouldUnlock =
                catalog.length > 0 &&
                catalog.every(
                  ({ id }) =>
                    discovered.has(id) ||
                    entries[`consumables:${id}`]?.discoveredAt != null
                )
              break
            }
            case 'discover_all_scripts':
            case 'discover_all_charters':
            case 'discover_all':
              shouldUnlock = isDiscoveryAchievementComplete(
                condition.type,
                useArchiveStore.getState().entries
              )
              break
            case 'win_paid_turns':
              shouldUnlock = [
                stats.fastestWinPaidTurns,
                lifetime.fastestWinPaidTurns,
              ].some(
                (turns) =>
                  Number.isSafeInteger(turns) &&
                  turns > 0 &&
                  turns <= (condition.target || 0)
              )
              break
            case 'wall_size_max':
              shouldUnlock = stats.minimumWallSize <= (condition.target || 0)
              break
            case 'wall_size_min':
              shouldUnlock = stats.maximumWallSize >= (condition.target || 0)
              break
            case 'win_without_reroll':
              shouldUnlock = stats.winsWithoutReroll > 0
              break
          }

          if (shouldUnlock) {
            unlockAchievement(def.id)
          }
        }
      },

      getUnlockedCount: () => {
        const { achievements } = get()
        return ACHIEVEMENT_DEFINITIONS.filter(
          (def) => achievements[def.id]?.unlocked
        ).length
      },

      getUnseenUnlocks: () => {
        if (useProgressionStore.getState().fullUnlockEnabled) return []
        const { achievements } = get()
        return ACHIEVEMENT_DEFINITIONS.filter(
          (def) => achievements[def.id]?.unlocked && !achievements[def.id]?.seen
        ).map((def) => def.id)
      },

      resetAchievements: () => {
        set({
          achievements: createInitialAchievements(),
          stats: DEFAULT_STATS,
        })
      },
    }),
    {
      name: 'tensho-achievements',
      version: 4,
      migrate: (persisted, version) => {
        const saved = persisted as Partial<
          Pick<AchievementState, 'achievements' | 'stats'>
        >
        // Versions <=2 never observed wall composition: both counters were
        // fixed placeholders. Preserve earned awards, not fabricated history.
        return {
          achievements: {
            ...createInitialAchievements(),
            ...saved.achievements,
          },
          stats: {
            ...DEFAULT_STATS,
            ...saved.stats,
            ...(version < 3
              ? {
                  minimumWallSize: DEFAULT_STATS.minimumWallSize,
                  maximumWallSize: DEFAULT_STATS.maximumWallSize,
                }
              : {}),
            // The old Act-4 counter accumulated across runs. It cannot prove
            // progress toward the new single-run rule; retain earned awards.
            maxChartersPurchasedByAct5: 0,
          },
        }
      },
      partialize: (state) => ({
        achievements: state.achievements,
        stats: state.stats,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<
          Pick<AchievementState, 'achievements' | 'stats'>
        >
        return {
          ...current,
          achievements: {
            ...current.achievements,
            ...saved.achievements,
          },
          stats: {
            ...DEFAULT_STATS,
            ...saved.stats,
            // JSON serializes the unset Infinity sentinel as null. It must not
            // become a zero-round win when achievement conditions compare it.
            fastestWinRounds: saved.stats?.fastestWinRounds ?? Infinity,
            fastestWinPaidTurns: saved.stats?.fastestWinPaidTurns ?? Infinity,
          },
        }
      },
    }
  )
)

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(
  id: string
): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((def) => def.id === id)
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(
  category: AchievementCategory
): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((def) => def.category === category)
}

/**
 * Get all category names with translations
 */
export const ACHIEVEMENT_CATEGORIES: Array<{
  id: AchievementCategory
  nameKey: string
  icon: ControlArtId
}> = [
  {
    id: 'progression',
    nameKey: 'achievements.categories.progression',
    icon: 'chart',
  },
  {
    id: 'cumulative',
    nameKey: 'achievements.categories.cumulative',
    icon: 'cumulative',
  },
  { id: 'skill', nameKey: 'achievements.categories.skill', icon: 'target' },
  { id: 'scoring', nameKey: 'achievements.categories.scoring', icon: 'score' },
  {
    id: 'collection',
    nameKey: 'achievements.categories.collection',
    icon: 'collection',
  },
  { id: 'mastery', nameKey: 'achievements.categories.mastery', icon: 'trophy' },
  {
    id: 'challenge',
    nameKey: 'achievements.categories.challenge',
    icon: 'challenge',
  },
]
