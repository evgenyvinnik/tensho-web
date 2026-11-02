/**
 * Celestial Orb System for Tensho Mahjong Roguelike
 *
 * Celestial Orbs (天球) are the Planet card equivalent - permanent upgrades
 * that enhance yaku families throughout the run.
 *
 * Core Rules:
 * - Orbs apply run-wide, stacking with Flowers/Decrees
 * - Using an Orb immediately upgrades its Yaku family by one level (cap 10)
 * - Matching Yaku receive the earned bonus; scoring does not grant levels
 *
 * Each orb provides:
 * - Base bonus per level (Mult and Chips)
 * - Scored-occurrence tracking for the ledger and Star Chart rewards
 *
 * See ITEM_LIBRARIES.md for the complete Celestial Orb library.
 */

import {
  isConsumableAvailable,
  type ConsumableUnlockResolver,
} from '../config/consumableUnlocks'
import {
  BaseConsumable,
  ConsumableRarity,
  ConsumableEdition,
  ConsumableUseResult,
  ConsumableEffectResult,
  generateConsumableInstanceId,
  calculateSellValue,
} from './ConsumableSystem'
import { runRandom } from '../game/RunRandom'
import type { PlayPatternId } from '../rules/PlayPattern'
import type { Meld } from '../core/Meld'
import { Tile, TileSuit } from '../core/Tile'

// =============================================================================
// CELESTIAL ORB TYPES
// =============================================================================

/**
 * Upgrade families that orbs level. Pattern families name what a play's groups
 * make, and each play scores at most one of them; tile families name what its
 * tiles show, and stack on top (see `playOrbCategories`).
 */
export type YakuCategory =
  // Pattern families: one per play.
  | 'Pairs'
  | 'ThreePairs'
  | 'Sequence'
  | 'SequencePair'
  | 'TwoSequences'
  | 'Triplets'
  | 'FullHouse'
  | 'Straights'
  | 'Quads'
  // Tile families: any that apply.
  | 'Winds'
  | 'Dragons'
  | 'MixedSuits'
  | 'Loose'
  | 'All' // Black Hole Orb - affects every family

/** Every family an Orb can level, in the order the game lists them. */
export const UPGRADE_FAMILY_IDS = [
  'Pairs',
  'ThreePairs',
  'Sequence',
  'SequencePair',
  'TwoSequences',
  'Triplets',
  'FullHouse',
  'Straights',
  'Quads',
  'Winds',
  'Dragons',
  'MixedSuits',
  'Loose',
] as const satisfies readonly Exclude<YakuCategory, 'All'>[]

/** The families that stack on a play's pattern family. */
export const TILE_FAMILY_IDS = [
  'Winds',
  'Dragons',
  'MixedSuits',
  'Loose',
] as const satisfies readonly YakuCategory[]

/**
 * Celestial Orb effect definition
 */
export interface CelestialOrbEffect {
  targetYaku: YakuCategory
  multPerLevel: number
  chipsPerLevel: number
  description: string
}

/**
 * Celestial Orb definition
 */
export interface CelestialOrb extends BaseConsumable {
  type: 'CelestialOrb'
  planetName: string // The title's celestial body, e.g. "Mercury"; the family label is the subtitle
  effect: CelestialOrbEffect
  currentLevel: number
  maxLevel: number
}

/**
 * State for tracking orb levels and yaku attunement
 */
export interface OrbAttunement {
  orbId: string
  yakuCategory: YakuCategory
  currentLevel: number
  timesTriggered: number
}

// =============================================================================
// CELESTIAL ORB DEFINITIONS
// =============================================================================

/**
 * Default max level for orbs
 */
export const DEFAULT_ORB_MAX_LEVEL = 10

/**
 * Complete Celestial Orb library from ITEM_LIBRARIES.md
 */
export const CELESTIAL_ORBS: Record<
  string,
  Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'>
> = {
  // Pattern families: a play scores the one its groups make.
  pluto_orb: {
    id: 'pluto_orb',
    type: 'CelestialOrb',
    name: 'Pluto Orb',
    japaneseName: '冥王星',
    planetName: 'Pluto',
    description:
      'Raises Pairs by 1 level for this run (up to level 9). Each level adds +10 base points and +1 Mult to every play that scores Pairs.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Pairs',
      multPerLevel: 1,
      chipsPerLevel: 10,
      description: '+10 base points and +1 Mult per level when Pairs scores',
    },
  },
  planet_x_orb: {
    id: 'planet_x_orb',
    type: 'CelestialOrb',
    name: 'Planet X Orb',
    japaneseName: '惑星X',
    planetName: 'Planet X',
    description:
      'Raises Three Pairs by 1 level for this run (up to level 9). Each level adds +20 base points and +3 Mult to every play that scores Three Pairs.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'ThreePairs',
      multPerLevel: 3,
      chipsPerLevel: 20,
      description:
        '+20 base points and +3 Mult per level when Three Pairs scores',
    },
  },
  venus_orb: {
    id: 'venus_orb',
    type: 'CelestialOrb',
    name: 'Venus Orb',
    japaneseName: '金星',
    planetName: 'Venus',
    description:
      'Raises Sequence by 1 level for this run (up to level 9). Each level adds +15 base points and +2 Mult to every play that scores Sequence.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Sequence',
      multPerLevel: 2,
      chipsPerLevel: 15,
      description: '+15 base points and +2 Mult per level when Sequence scores',
    },
  },
  moon_orb: {
    id: 'moon_orb',
    type: 'CelestialOrb',
    name: 'Moon Orb',
    japaneseName: '月',
    planetName: 'Moon',
    description:
      'Raises Sequence + Pair by 1 level for this run (up to level 9). Each level adds +15 base points and +2 Mult to every play that scores Sequence + Pair.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'SequencePair',
      multPerLevel: 2,
      chipsPerLevel: 15,
      description:
        '+15 base points and +2 Mult per level when Sequence + Pair scores',
    },
  },
  mercury_orb: {
    id: 'mercury_orb',
    type: 'CelestialOrb',
    name: 'Mercury Orb',
    japaneseName: '水星',
    planetName: 'Mercury',
    description:
      'Raises Two Sequences by 1 level for this run (up to level 9). Each level adds +30 base points and +4 Mult to every play that scores Two Sequences.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'TwoSequences',
      multPerLevel: 4,
      chipsPerLevel: 30,
      description:
        '+30 base points and +4 Mult per level when Two Sequences scores',
    },
  },
  earth_orb: {
    id: 'earth_orb',
    type: 'CelestialOrb',
    name: 'Earth Orb',
    japaneseName: '地球',
    planetName: 'Earth',
    description:
      'Raises Triplets by 1 level for this run (up to level 9). Each level adds +30 base points and +4 Mult to every play that scores Triplets.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Triplets',
      multPerLevel: 4,
      chipsPerLevel: 30,
      description: '+30 base points and +4 Mult per level when Triplets scores',
    },
  },
  jupiter_orb: {
    id: 'jupiter_orb',
    type: 'CelestialOrb',
    name: 'Jupiter Orb',
    japaneseName: '木星',
    planetName: 'Jupiter',
    description:
      'Raises Full House by 1 level for this run (up to level 9). Each level adds +30 base points and +5 Mult to every play that scores Full House.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'FullHouse',
      multPerLevel: 5,
      chipsPerLevel: 30,
      description:
        '+30 base points and +5 Mult per level when Full House scores',
    },
  },
  saturn_orb: {
    id: 'saturn_orb',
    type: 'CelestialOrb',
    name: 'Saturn Orb',
    japaneseName: '土星',
    planetName: 'Saturn',
    description:
      'Raises Straights by 1 level for this run (up to level 9). Each level adds +30 base points and +3 Mult to every play that scores Straights.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Straights',
      multPerLevel: 3,
      chipsPerLevel: 30,
      description:
        '+30 base points and +3 Mult per level when Straights scores',
    },
  },
  mars_orb: {
    id: 'mars_orb',
    type: 'CelestialOrb',
    name: 'Mars Orb',
    japaneseName: '火星',
    planetName: 'Mars',
    description:
      'Raises Quads by 1 level for this run (up to level 9). Each level adds +50 base points and +5 Mult to every play that scores Quads.',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Quads',
      multPerLevel: 5,
      chipsPerLevel: 50,
      description: '+50 base points and +5 Mult per level when Quads scores',
    },
  },

  // Tile families: they stack on the pattern family.
  eris_orb: {
    id: 'eris_orb',
    type: 'CelestialOrb',
    name: 'Eris Orb',
    japaneseName: 'エリス',
    planetName: 'Eris',
    description:
      'Raises Winds by 1 level for this run (up to level 9). Each level adds +10 base points and +1 Mult to every play that scores Winds.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Winds',
      multPerLevel: 1,
      chipsPerLevel: 10,
      description: '+10 base points and +1 Mult per level when Winds scores',
    },
  },
  uranus_orb: {
    id: 'uranus_orb',
    type: 'CelestialOrb',
    name: 'Uranus Orb',
    japaneseName: '天王星',
    planetName: 'Uranus',
    description:
      'Raises Dragons by 1 level for this run (up to level 9). Each level adds +10 base points and +1 Mult to every play that scores Dragons.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Dragons',
      multPerLevel: 1,
      chipsPerLevel: 10,
      description: '+10 base points and +1 Mult per level when Dragons scores',
    },
  },
  neptune_orb: {
    id: 'neptune_orb',
    type: 'CelestialOrb',
    name: 'Neptune Orb',
    japaneseName: '海王星',
    planetName: 'Neptune',
    description:
      'Raises Mixed Suits by 1 level for this run (up to level 9). Each level adds +10 base points and +0.5 Mult to every play that scores Mixed Suits.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'MixedSuits',
      multPerLevel: 0.5,
      chipsPerLevel: 10,
      description:
        '+10 base points and +0.5 Mult per level when Mixed Suits scores',
    },
  },
  ceres_orb: {
    id: 'ceres_orb',
    type: 'CelestialOrb',
    name: 'Ceres Orb',
    japaneseName: 'ケレス',
    planetName: 'Ceres',
    description:
      'Raises Loose Tiles by 1 level for this run (up to level 9). Each level adds +5 base points for every loose tile in a play.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Loose',
      multPerLevel: 0,
      chipsPerLevel: 5,
      description: '+5 base points per level for each loose tile',
    },
  },

  // ---------------------------------------------------------------------------
  // Mythic Orb
  // ---------------------------------------------------------------------------
  black_hole_orb: {
    id: 'black_hole_orb',
    type: 'CelestialOrb',
    name: 'Black Hole Orb',
    japaneseName: 'ブラックホール',
    planetName: 'Black Hole',
    description:
      'Raises all 13 hand families by 1 level for this run (up to level 9 each). Each family gains its usual base points and Mult; one already at level 9 stays there.',
    rarity: 'Legendary',
    edition: 'Base',
    cost: 10,
    sellValue: 5,
    maxLevel: 1, // Black hole only works once but affects all yaku
    effect: {
      targetYaku: 'All',
      multPerLevel: 0,
      chipsPerLevel: 0,
      description: 'Raises every hand family by 1 level',
    },
  },
}

/**
 * Get all Celestial Orbs as an array
 */
export function getAllCelestialOrbs(): Omit<
  CelestialOrb,
  'instanceId' | 'isUsed' | 'currentLevel'
>[] {
  return Object.values(CELESTIAL_ORBS)
}

/**
 * Get Celestial Orbs by rarity
 */
export function getCelestialOrbsByRarity(
  rarity: ConsumableRarity
): Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'>[] {
  return getAllCelestialOrbs().filter((orb) => orb.rarity === rarity)
}

/**
 * Get Celestial Orb by target yaku
 */
export function getCelestialOrbByYaku(
  yaku: YakuCategory
): Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'> | undefined {
  return getAllCelestialOrbs().find((orb) => orb.effect.targetYaku === yaku)
}

// =============================================================================
// CELESTIAL ORB SYSTEM CLASS
// =============================================================================

/**
 * Manages Celestial Orb usage, leveling, and yaku bonuses
 */
export class CelestialOrbSystem {
  private orbLevels: Map<YakuCategory, number> = new Map()
  private yakuTriggerCounts: Map<YakuCategory, number> = new Map()
  private activeOrbs: CelestialOrb[] = []

  constructor() {
    this.initializeYakuCategories()
  }

  /** Every family starts at level 1, the unupgraded baseline. */
  private initializeYakuCategories(): void {
    for (const category of UPGRADE_FAMILY_IDS) {
      this.orbLevels.set(category, 1)
      this.yakuTriggerCounts.set(category, 0)
    }
  }

  /**
   * Use a Celestial Orb to level up a yaku category
   */
  useOrb(orb: CelestialOrb): ConsumableUseResult {
    const error = this.validateUse(orb)
    if (error) return { success: false, message: error, effects: [] }
    const effects: ConsumableEffectResult[] = []

    if (orb.effect.targetYaku === 'All') {
      // Black Hole Orb - upgrade all yaku
      for (const category of this.orbLevels.keys()) {
        const currentLevel = this.orbLevels.get(category) || 1
        const newLevel = Math.min(currentLevel + 1, DEFAULT_ORB_MAX_LEVEL)
        this.orbLevels.set(category, newLevel)

        effects.push({
          type: 'yaku_leveled',
          description: `${category} upgraded to level ${newLevel}`,
          value: newLevel,
        })
      }

      return {
        success: true,
        message: `${orb.name}: All Yaku upgraded by 1 level!`,
        effects,
      }
    }

    // Standard orb - level up specific yaku
    const targetYaku = orb.effect.targetYaku
    const currentLevel = this.orbLevels.get(targetYaku) || 1

    const newLevel = currentLevel + 1
    this.orbLevels.set(targetYaku, newLevel)

    effects.push({
      type: 'yaku_leveled',
      description: `${targetYaku} upgraded to level ${newLevel}`,
      value: newLevel,
    })

    // Add the orb to active orbs (for tracking)
    this.activeOrbs.push(orb)

    return {
      success: true,
      message: `${orb.name}: ${targetYaku} upgraded to level ${newLevel}`,
      effects,
    }
  }

  /** Whether an all-Yaku upgrade can still change at least one level. */
  canUpgradeAnyYaku(): boolean {
    return [...this.orbLevels.values()].some(
      (level) => level < DEFAULT_ORB_MAX_LEVEL
    )
  }

  /** Read-only, shared by availability and actual use. */
  validateUse(orb: CelestialOrb): string | null {
    if (orb.effect.targetYaku === 'All')
      return this.canUpgradeAnyYaku()
        ? null
        : `All Yaku are already at max level (${DEFAULT_ORB_MAX_LEVEL})`
    return this.getYakuLevel(orb.effect.targetYaku) >= orb.maxLevel
      ? `${orb.effect.targetYaku} is already at max level (${orb.maxLevel})`
      : null
  }

  /** Get the current level for a yaku category. */
  getYakuLevel(yaku: YakuCategory): number {
    return this.orbLevels.get(yaku) || 1
  }

  /**
   * Get all yaku levels
   */
  getAllYakuLevels(): Map<YakuCategory, number> {
    return new Map(this.orbLevels)
  }

  /** The Arm: lose levels, never below the unupgraded level 1. */
  lowerYakuLevel(yaku: YakuCategory, levels = 1): void {
    const level = this.orbLevels.get(yaku)
    if (level !== undefined)
      this.orbLevels.set(yaku, Math.max(1, level - levels))
  }

  /**
   * Calculate bonus mult for a yaku based on orb levels. `levelDrop` prices
   * it as if it had that many fewer levels, never below level 1.
   */
  calculateYakuMult(yaku: YakuCategory, levelDrop = 0): number {
    const level = Math.max(1, this.getYakuLevel(yaku) - levelDrop)
    const orbDef = getCelestialOrbByYaku(yaku)

    if (!orbDef) {
      return 0
    }

    // Level 1 is the unupgraded baseline. Only Orb-granted levels add a
    // bonus; otherwise every fresh run receives a free Orb bonus.
    return orbDef.effect.multPerLevel * Math.max(0, level - 1)
  }

  /**
   * Calculate bonus chips for a yaku based on orb levels
   */
  calculateYakuChips(yaku: YakuCategory, levelDrop = 0): number {
    const level = Math.max(1, this.getYakuLevel(yaku) - levelDrop)
    const orbDef = getCelestialOrbByYaku(yaku)

    if (!orbDef) {
      return 0
    }

    return orbDef.effect.chipsPerLevel * Math.max(0, level - 1)
  }

  /**
   * Calculate total bonus for a scored yaku
   */
  calculateYakuBonus(
    yaku: YakuCategory,
    levelDrop = 0
  ): { mult: number; chips: number } {
    return {
      mult: this.calculateYakuMult(yaku, levelDrop),
      chips: this.calculateYakuChips(yaku, levelDrop),
    }
  }

  /**
   * Records a scored occurrence for the ledger and Star Chart targeting.
   * This is not experience: levels change only through explicit upgrade effects.
   */
  onYakuScored(yaku: YakuCategory): void {
    const currentCount = this.yakuTriggerCounts.get(yaku) || 0
    this.yakuTriggerCounts.set(yaku, currentCount + 1)
  }

  /** Backward-compatible name used by the orchestrator. */
  triggerYaku(yaku: YakuCategory): void {
    this.onYakuScored(yaku)
  }

  /**
   * Get trigger count for a yaku
   */
  getYakuTriggerCount(yaku: YakuCategory): number {
    return this.yakuTriggerCounts.get(yaku) || 0
  }

  /**
   * Get the orb definition for a yaku category
   */
  getOrbForYaku(
    yaku: YakuCategory
  ): Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'> | undefined {
    return getCelestialOrbByYaku(yaku)
  }

  /**
   * Get active orbs
   */
  getActiveOrbs(): CelestialOrb[] {
    return [...this.activeOrbs]
  }

  /**
   * Get summary of all yaku bonuses for display
   */
  getYakuBonusSummary(): {
    yaku: YakuCategory
    level: number
    mult: number
    chips: number
  }[] {
    const summary: {
      yaku: YakuCategory
      level: number
      mult: number
      chips: number
    }[] = []

    for (const [yaku, level] of this.orbLevels) {
      if (level > 1) {
        // Only show upgraded yaku
        summary.push({
          yaku,
          level,
          mult: this.calculateYakuMult(yaku),
          chips: this.calculateYakuChips(yaku),
        })
      }
    }

    return summary
  }

  /**
   * Get a random Celestial Orb weighted by rarity
   * Common: 60%, Uncommon: 30%, Rare: 10%
   */
  static getRandomCelestialOrb(
    excludeIds: string[] = [],
    isUnlocked?: ConsumableUnlockResolver
  ): Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'> | null {
    const available = getAllCelestialOrbs().filter(
      (orb) =>
        !excludeIds.includes(orb.id) &&
        orb.rarity !== 'Legendary' &&
        isConsumableAvailable(orb.id, isUnlocked)
    )

    if (available.length === 0) return null

    const roll = runRandom.next('consumables')
    let targetRarity: ConsumableRarity

    if (roll < 0.6) {
      targetRarity = 'Common'
    } else if (roll < 0.9) {
      targetRarity = 'Uncommon'
    } else {
      targetRarity = 'Rare'
    }

    const candidates = available.filter((orb) => orb.rarity === targetRarity)

    if (candidates.length === 0) {
      return available[
        Math.floor(runRandom.next('consumables') * available.length)
      ]
    }

    return candidates[
      Math.floor(runRandom.next('consumables') * candidates.length)
    ]
  }

  /**
   * Get a Celestial Orb for the most-played yaku (for Star Chart charter)
   */
  getOrbForMostPlayedYaku(): Omit<
    CelestialOrb,
    'instanceId' | 'isUsed' | 'currentLevel'
  > | null {
    let maxCount = 0
    let mostPlayedYaku: YakuCategory | null = null

    for (const [yaku, count] of this.yakuTriggerCounts) {
      if (count > maxCount) {
        maxCount = count
        mostPlayedYaku = yaku
      }
    }

    if (!mostPlayedYaku) {
      return null
    }

    return getCelestialOrbByYaku(mostPlayedYaku) || null
  }

  /**
   * Create a Celestial Orb instance from a definition
   */
  static createCelestialOrbInstance(
    orbDef: Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'>,
    edition: ConsumableEdition = 'Base'
  ): CelestialOrb {
    return {
      ...orbDef,
      instanceId: generateConsumableInstanceId(),
      edition,
      sellValue: calculateSellValue(orbDef.cost, edition),
      currentLevel: 1,
      isUsed: false,
    }
  }

  /**
   * Clear all state (for new run)
   */
  clear(): void {
    this.initializeYakuCategories()
    this.activeOrbs = []
  }

  /**
   * Serialize the celestial orb system state
   */
  toState(): {
    orbLevels: [YakuCategory, number][]
    yakuTriggerCounts: [YakuCategory, number][]
    activeOrbs: CelestialOrb[]
  } {
    return {
      orbLevels: Array.from(this.orbLevels.entries()),
      yakuTriggerCounts: Array.from(this.yakuTriggerCounts.entries()),
      activeOrbs: [...this.activeOrbs],
    }
  }

  /**
   * Restore from serialized state. Levels saved under a retired family move to
   * the family its Orb raises now, so a player keeps what their Orbs earned.
   */
  static fromState(state: {
    orbLevels: [string, number][]
    yakuTriggerCounts: [string, number][]
    activeOrbs: CelestialOrb[]
  }): CelestialOrbSystem {
    const system = new CelestialOrbSystem()
    const restore = (
      target: Map<YakuCategory, number>,
      saved: [string, number][]
    ) => {
      for (const [savedFamily, value] of saved) {
        const family = currentFamily(savedFamily)
        if (family) target.set(family, Math.max(target.get(family) ?? 0, value))
      }
    }
    restore(system.orbLevels, state.orbLevels)
    restore(system.yakuTriggerCounts, state.yakuTriggerCounts)
    system.activeOrbs = [...state.activeOrbs]
    return system
  }
}

/**
 * Families retired by the October 2026 family rework, keyed to the family the
 * same Orb raises now. Riichi was Pluto's family before Pairs.
 */
const RETIRED_FAMILIES: Readonly<Record<string, YakuCategory>> = {
  Riichi: 'Pairs',
  Tanyao: 'TwoSequences', // Mercury
  Yakuhai: 'Dragons', // Uranus
  Pinfu: 'Sequence', // Venus
  Ittsu: 'Straights', // Saturn
  Honitsu: 'FullHouse', // Jupiter
  Toitoi: 'Triplets', // Earth
  Chinitsu: 'Quads', // Mars
  Sanshoku: 'MixedSuits', // Neptune
  SevenPairs: 'ThreePairs', // Planet X
  Chanta: 'Loose', // Ceres
  Kokushi: 'Winds', // Eris
}

function currentFamily(saved: string): YakuCategory | null {
  if ((UPGRADE_FAMILY_IDS as readonly string[]).includes(saved))
    return saved as YakuCategory
  return RETIRED_FAMILIES[saved] ?? null
}

// =============================================================================
// UPGRADE FAMILIES OF A PLAY
// =============================================================================

/**
 * Upgrade families an ordinary (tactical) play scores, one entry per payment:
 *
 * - its pattern family, the one its groups make (`PATTERN_FAMILIES`), at most
 *   one per play: a Sequence + Pair scores Sequence + Pair, not Sequence and
 *   Pairs as well;
 * - Winds or Dragons when any tile is one;
 * - Mixed Suits when its numbered tiles come from two or more suits;
 * - Loose Tiles once for every tile that belongs to no group.
 *
 * A Stone has no face, so it shows no suit or Honor and is not a loose tile;
 * a Wild tile counts as every suit, so it never makes a play Mixed Suits.
 */
export function playOrbCategories(
  patternId: PlayPatternId,
  groups: readonly Meld[],
  tiles: readonly Tile[]
): YakuCategory[] {
  const categories: YakuCategory[] = []
  const family = PATTERN_FAMILIES[patternId]
  if (family) categories.push(family)
  categories.push(...tileFamilies(tiles))
  const grouped = new Set(
    groups.flatMap((group) => group.tiles.map((tile) => tile.id))
  )
  for (const tile of tiles)
    if (!tile.isStone && !grouped.has(tile.id)) categories.push('Loose')
  return categories
}

/**
 * Families a complete Mahjong hand scores: only the tile families its tiles
 * show. It has no pattern family and no loose tiles.
 */
export function handOrbCategories(tiles: readonly Tile[]): YakuCategory[] {
  return tileFamilies(tiles)
}

function tileFamilies(tiles: readonly Tile[]): YakuCategory[] {
  const shown = tiles.filter((tile) => !tile.isStone)
  const families: YakuCategory[] = []
  if (shown.some((tile) => tile.suit === TileSuit.Wind)) families.push('Winds')
  if (shown.some((tile) => tile.suit === TileSuit.Dragon))
    families.push('Dragons')
  const numbered = shown.filter((tile) => tile.isSuited)
  if (numbered.length > 0 && !Tile.shareSuit(numbered))
    families.push('MixedSuits')
  return families
}

/** The pattern family each named play pattern belongs to. */
export const PATTERN_FAMILIES: Partial<Record<PlayPatternId, YakuCategory>> = {
  pair: 'Pairs',
  two_pairs: 'Pairs',
  three_pairs: 'ThreePairs',
  sequence: 'Sequence',
  sequence_pair: 'SequencePair',
  two_sequences: 'TwoSequences',
  triplet: 'Triplets',
  two_triplets: 'Triplets',
  triplet_sequence: 'Triplets',
  triplet_pair: 'FullHouse',
  straight4: 'Straights',
  straight5: 'Straights',
  straight6: 'Straights',
  straight_pair: 'Straights',
  quad: 'Quads',
  five_of_a_kind: 'Quads',
  six_of_a_kind: 'Quads',
  quad_pair: 'Quads',
}
