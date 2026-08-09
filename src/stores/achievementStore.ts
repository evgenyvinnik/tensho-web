/**
 * Achievement Store - Heavenly Accolades (天賞)
 *
 * Manages achievement tracking with localStorage persistence.
 * Based on ARCHITECTURE.MD Section 30 - Heavenly Accolades.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  icon: string // Emoji or icon identifier
  unlocks?: string // What this achievement unlocks (if any)
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

  // Scoring
  highestSingleHandScore: number
  totalWindYakuScored: number
  totalDragonYakuScored: number
  totalYakumanScored: number

  // Skill
  fastestWinRounds: number
  chartersPurchasedByAct4: number

  // Collection
  fateSealsDiscovered: number
  celestialOrbsDiscovered: number
  voidScriptsDiscovered: number
  chartersDiscovered: number
  totalItemsDiscovered: number

  // Challenge
  challengeRunsCompleted: number
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
  highestSingleHandScore: 0,
  totalWindYakuScored: 0,
  totalDragonYakuScored: 0,
  totalYakumanScored: 0,
  fastestWinRounds: Infinity,
  chartersPurchasedByAct4: 0,
  fateSealsDiscovered: 0,
  celestialOrbsDiscovered: 0,
  voidScriptsDiscovered: 0,
  chartersDiscovered: 0,
  totalItemsDiscovered: 0,
  challengeRunsCompleted: 0,
  minimumWallSize: 136,
  maximumWallSize: 136,
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
    icon: '👣',
    unlocks: 'Stage Master Decree',
    condition: { type: 'reach_act', target: 4 },
  },
  {
    id: 'ascending',
    nameKey: 'achievements.ascending.name',
    descriptionKey: 'achievements.ascending.description',
    japaneseTitle: '昇進',
    category: 'progression',
    icon: '⬆️',
    unlocks: 'Flower Pot Decree',
    condition: { type: 'reach_act', target: 8 },
  },
  {
    id: 'victory',
    nameKey: 'achievements.victory.name',
    descriptionKey: 'achievements.victory.description',
    japaneseTitle: '勝利',
    category: 'progression',
    icon: '🏆',
    unlocks: 'Blueprint Decree',
    condition: { type: 'win_run' },
  },
  {
    id: 'red_path',
    nameKey: 'achievements.redPath.name',
    descriptionKey: 'achievements.redPath.description',
    japaneseTitle: '赤道',
    category: 'progression',
    icon: '🔴',
    unlocks: 'Crimson Wall',
    condition: { type: 'win_stake', value: 'red' },
  },
  {
    id: 'black_path',
    nameKey: 'achievements.blackPath.name',
    descriptionKey: 'achievements.blackPath.description',
    japaneseTitle: '黒道',
    category: 'progression',
    icon: '⚫',
    unlocks: 'Obsidian Wall',
    condition: { type: 'win_stake', value: 'black' },
  },
  {
    id: 'golden_path',
    nameKey: 'achievements.goldenPath.name',
    descriptionKey: 'achievements.goldenPath.description',
    japaneseTitle: '金道',
    category: 'progression',
    icon: '🥇',
    condition: { type: 'win_stake', value: 'gold' },
  },

  // === CUMULATIVE ACCOLADES ===
  {
    id: 'tile_master',
    nameKey: 'achievements.tileMaster.name',
    descriptionKey: 'achievements.tileMaster.description',
    japaneseTitle: '牌師',
    category: 'cumulative',
    icon: '🀄',
    unlocks: 'Swift Hand Charter',
    condition: { type: 'tiles_played', target: 2500 },
  },
  {
    id: 'discard_artist',
    nameKey: 'achievements.discardArtist.name',
    descriptionKey: 'achievements.discardArtist.description',
    japaneseTitle: '捨牌芸者',
    category: 'cumulative',
    icon: '🎨',
    unlocks: 'Wasteful Plenty Charter',
    condition: { type: 'tiles_discarded', target: 2500 },
  },
  {
    id: 'fortune_built',
    nameKey: 'achievements.fortuneBuilt.name',
    descriptionKey: 'achievements.fortuneBuilt.description',
    japaneseTitle: '富豪',
    category: 'cumulative',
    icon: '💰',
    unlocks: 'Satellite Decree',
    condition: { type: 'max_gold', target: 400 },
  },

  // === SKILL ACCOLADES ===
  {
    id: 'wild_flush',
    nameKey: 'achievements.wildFlush.name',
    descriptionKey: 'achievements.wildFlush.description',
    japaneseTitle: '万能清一色',
    category: 'skill',
    icon: '🃏',
    condition: { type: 'special_hand', value: 'honitsu_wild' },
  },
  {
    id: 'speed_run',
    nameKey: 'achievements.speedRun.name',
    descriptionKey: 'achievements.speedRun.description',
    japaneseTitle: '疾走',
    category: 'skill',
    icon: '⚡',
    unlocks: 'Swift Andy Decree',
    condition: { type: 'win_in_rounds', target: 12 },
  },
  {
    id: 'charter_collector',
    nameKey: 'achievements.charterCollector.name',
    descriptionKey: 'achievements.charterCollector.description',
    japaneseTitle: '皇勅収集',
    category: 'skill',
    icon: '📜',
    condition: { type: 'charters_by_act', target: 5 },
  },
  {
    id: 'shattered',
    nameKey: 'achievements.shattered.name',
    descriptionKey: 'achievements.shattered.description',
    japaneseTitle: '粉砕',
    category: 'skill',
    icon: '💔',
    condition: { type: 'break_glass_tiles', target: 2 },
  },
  {
    id: 'royal_hand',
    nameKey: 'achievements.royalHand.name',
    descriptionKey: 'achievements.royalHand.description',
    japaneseTitle: '帝王手',
    category: 'skill',
    icon: '👑',
    condition: { type: 'score_yakuman' },
  },
  {
    id: 'retrograde',
    nameKey: 'achievements.retrograde.name',
    descriptionKey: 'achievements.retrograde.description',
    japaneseTitle: '逆行',
    category: 'skill',
    icon: '🔄',
    condition: { type: 'yaku_level', target: 10 },
  },
  {
    id: 'keeper_of_winds',
    nameKey: 'achievements.keeperOfWinds.name',
    descriptionKey: 'achievements.keeperOfWinds.description',
    japaneseTitle: '風守',
    category: 'skill',
    icon: '🌬️',
    condition: { type: 'wind_yaku_in_run', target: 10 },
  },
  {
    id: 'master_of_silence',
    nameKey: 'achievements.masterOfSilence.name',
    descriptionKey: 'achievements.masterOfSilence.description',
    japaneseTitle: '沈黙の師',
    category: 'skill',
    icon: '🤫',
    condition: { type: 'rounds_without_honor_discard', target: 3 },
  },
  {
    id: 'seal_bearer',
    nameKey: 'achievements.sealBearer.name',
    descriptionKey: 'achievements.sealBearer.description',
    japaneseTitle: '印持ち',
    category: 'skill',
    icon: '🔮',
    condition: { type: 'fate_seals_used', target: 10 },
  },

  // === SCORING ACCOLADES ===
  {
    id: 'score_10k',
    nameKey: 'achievements.score10k.name',
    descriptionKey: 'achievements.score10k.description',
    japaneseTitle: '万点',
    category: 'scoring',
    icon: '📊',
    unlocks: 'Lucky Sixes Decree',
    condition: { type: 'single_hand_score', target: 10000 },
  },
  {
    id: 'score_1m',
    nameKey: 'achievements.score1m.name',
    descriptionKey: 'achievements.score1m.description',
    japaneseTitle: '百万点',
    category: 'scoring',
    icon: '💎',
    unlocks: 'The Idol Decree',
    condition: { type: 'single_hand_score', target: 1000000 },
  },
  {
    id: 'score_100m',
    nameKey: 'achievements.score100m.name',
    descriptionKey: 'achievements.score100m.description',
    japaneseTitle: '億点',
    category: 'scoring',
    icon: '🌟',
    unlocks: 'Stuntman Decree',
    condition: { type: 'single_hand_score', target: 100000000 },
  },

  // === COLLECTION ACCOLADES ===
  {
    id: 'seal_scholar',
    nameKey: 'achievements.sealScholar.name',
    descriptionKey: 'achievements.sealScholar.description',
    japaneseTitle: '符学者',
    category: 'collection',
    icon: '📚',
    unlocks: 'Cartomancer Decree',
    condition: { type: 'discover_all_seals' },
  },
  {
    id: 'star_gazer',
    nameKey: 'achievements.starGazer.name',
    descriptionKey: 'achievements.starGazer.description',
    japaneseTitle: '星読み',
    category: 'collection',
    icon: '🔭',
    unlocks: 'Astronomer Decree',
    condition: { type: 'discover_all_orbs' },
  },
  {
    id: 'void_walker',
    nameKey: 'achievements.voidWalker.name',
    descriptionKey: 'achievements.voidWalker.description',
    japaneseTitle: '虚空歩者',
    category: 'collection',
    icon: '🌑',
    condition: { type: 'discover_all_scripts' },
  },
  {
    id: 'charter_complete',
    nameKey: 'achievements.charterComplete.name',
    descriptionKey: 'achievements.charterComplete.description',
    japaneseTitle: '皇勅全取',
    category: 'collection',
    icon: '📋',
    condition: { type: 'discover_all_charters' },
  },
  {
    id: 'archive_complete',
    nameKey: 'achievements.archiveComplete.name',
    descriptionKey: 'achievements.archiveComplete.description',
    japaneseTitle: '全録達成',
    category: 'collection',
    icon: '🏛️',
    condition: { type: 'discover_all' },
  },

  // === MASTERY ACCOLADES ===
  {
    id: 'archive_complete_plus',
    nameKey: 'achievements.archiveCompletePlus.name',
    descriptionKey: 'achievements.archiveCompletePlus.description',
    japaneseTitle: '全録達成・極',
    category: 'mastery',
    icon: '🏛️✨',
    condition: { type: 'all_walls_gold_stake' },
  },
  {
    id: 'archive_complete_plus_plus',
    nameKey: 'achievements.archiveCompletePlusPlus.name',
    descriptionKey: 'achievements.archiveCompletePlusPlus.description',
    japaneseTitle: '全録達成・究',
    category: 'mastery',
    icon: '🏛️🌟',
    condition: { type: 'gold_sticker_all_decrees' },
  },

  // === CHALLENGE ACCOLADES ===
  {
    id: 'rule_bender',
    nameKey: 'achievements.ruleBender.name',
    descriptionKey: 'achievements.ruleBender.description',
    japaneseTitle: '曲法者',
    category: 'challenge',
    icon: '🔧',
    condition: { type: 'complete_challenge_run' },
  },
  {
    id: 'rule_breaker',
    nameKey: 'achievements.ruleBreaker.name',
    descriptionKey: 'achievements.ruleBreaker.description',
    japaneseTitle: '破法者',
    category: 'challenge',
    icon: '💥',
    condition: { type: 'complete_all_challenges' },
  },
  {
    id: 'deck_minimalist',
    nameKey: 'achievements.deckMinimalist.name',
    descriptionKey: 'achievements.deckMinimalist.description',
    japaneseTitle: '極小山',
    category: 'challenge',
    icon: '📉',
    condition: { type: 'wall_size_max', target: 20 },
  },
  {
    id: 'deck_maximalist',
    nameKey: 'achievements.deckMaximalist.name',
    descriptionKey: 'achievements.deckMaximalist.description',
    japaneseTitle: '極大山',
    category: 'challenge',
    icon: '📈',
    condition: { type: 'wall_size_min', target: 80 },
  },
  {
    id: 'purist',
    nameKey: 'achievements.purist.name',
    descriptionKey: 'achievements.purist.description',
    japaneseTitle: '無転',
    category: 'challenge',
    icon: '🧘',
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
        const { stats } = get()
        set({
          stats: {
            ...stats,
            [stat]: (stats[stat] as number) + amount,
          },
        })
      },

      setStat: (stat: keyof AchievementStats, value: number) => {
        const { stats } = get()
        set({
          stats: {
            ...stats,
            [stat]: value,
          },
        })
      },

      checkAchievements: () => {
        const { stats, achievements, unlockAchievement } = get()

        for (const def of ACHIEVEMENT_DEFINITIONS) {
          if (achievements[def.id]?.unlocked) continue

          let shouldUnlock = false
          const { condition } = def

          switch (condition.type) {
            case 'reach_act':
              shouldUnlock = stats.highestActReached >= (condition.target || 0)
              break
            case 'win_run':
              shouldUnlock = (stats.runsWon ?? 0) > 0
              break
            case 'tiles_played':
              shouldUnlock = stats.totalTilesPlayed >= (condition.target || 0)
              break
            case 'tiles_discarded':
              shouldUnlock = stats.totalTilesDiscarded >= (condition.target || 0)
              break
            case 'max_gold':
              shouldUnlock = stats.maxGoldInRun >= (condition.target || 0)
              break
            case 'single_hand_score':
              shouldUnlock = stats.highestSingleHandScore >= (condition.target || 0)
              break
            case 'fate_seals_used':
              shouldUnlock = stats.totalFateSealsUsed >= (condition.target || 0)
              break
            case 'charters_by_act':
              shouldUnlock = stats.chartersPurchasedByAct4 >= (condition.target || 0)
              break
            case 'score_yakuman':
              shouldUnlock = (stats.totalYakumanScored ?? 0) > 0
              break
            case 'wind_yaku_in_run':
              shouldUnlock = stats.totalWindYakuScored >= (condition.target || 0)
              break
            case 'discover_all_seals':
              shouldUnlock = stats.fateSealsDiscovered >= 22
              break
            case 'discover_all_orbs':
              shouldUnlock = stats.celestialOrbsDiscovered >= 13
              break
            case 'discover_all_scripts':
              shouldUnlock = stats.voidScriptsDiscovered >= 20
              break
            case 'discover_all_charters':
              shouldUnlock = stats.chartersDiscovered >= 32
              break
            case 'discover_all':
              shouldUnlock = stats.totalItemsDiscovered >= 352
              break
            case 'win_in_rounds':
              shouldUnlock = stats.fastestWinRounds <= (condition.target || Infinity)
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
            case 'complete_challenge_run':
              shouldUnlock = stats.challengeRunsCompleted > 0
              break
          }

          if (shouldUnlock) {
            unlockAchievement(def.id)
          }
        }
      },

      getUnlockedCount: () => {
        const { achievements } = get()
        return Object.values(achievements).filter((a) => a.unlocked).length
      },

      getUnseenUnlocks: () => {
        const { achievements } = get()
        return Object.values(achievements)
          .filter((a) => a.unlocked && !a.seen)
          .map((a) => a.id)
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
      version: 2,
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
          },
        }
      },
    }
  )
)

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((def) => def.id === id)
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((def) => def.category === category)
}

/**
 * Get all category names with translations
 */
export const ACHIEVEMENT_CATEGORIES: Array<{
  id: AchievementCategory
  nameKey: string
  icon: string
}> = [
  { id: 'progression', nameKey: 'achievements.categories.progression', icon: '📈' },
  { id: 'cumulative', nameKey: 'achievements.categories.cumulative', icon: '🔢' },
  { id: 'skill', nameKey: 'achievements.categories.skill', icon: '🎯' },
  { id: 'scoring', nameKey: 'achievements.categories.scoring', icon: '💯' },
  { id: 'collection', nameKey: 'achievements.categories.collection', icon: '📚' },
  { id: 'mastery', nameKey: 'achievements.categories.mastery', icon: '🏆' },
  { id: 'challenge', nameKey: 'achievements.categories.challenge', icon: '🎮' },
]
