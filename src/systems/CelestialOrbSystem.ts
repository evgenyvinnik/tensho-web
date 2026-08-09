/**
 * Celestial Orb System for Tensho Mahjong Roguelike
 *
 * Celestial Orbs (天球) are the Planet card equivalent - permanent upgrades
 * that enhance yaku families throughout the run.
 *
 * Core Rules:
 * - Orbs apply run-wide, stacking with Flowers/Decrees
 * - Orbs "attune" to a yaku category and grow with repeated triggers
 * - Orbs level up only when their attuned yaku is scored
 *
 * Each orb provides:
 * - Base bonus per level (Mult and Chips)
 * - Level increases when the associated yaku is scored
 *
 * See ITEM_LIBRARIES.md for the complete Celestial Orb library.
 */

import {
  BaseConsumable,
  ConsumableRarity,
  ConsumableEdition,
  ConsumableUseResult,
  ConsumableEffectResult,
  generateConsumableInstanceId,
  calculateSellValue,
} from './ConsumableSystem'

// =============================================================================
// CELESTIAL ORB TYPES
// =============================================================================

/**
 * Yaku categories that orbs can attune to
 */
export type YakuCategory =
  | 'Riichi'
  | 'Tanyao'
  | 'Yakuhai'
  | 'Pinfu'
  | 'Ittsu'
  | 'Honitsu'
  | 'Toitoi'
  | 'Chinitsu'
  | 'Sanshoku'
  | 'SevenPairs'
  | 'Chanta'
  | 'Kokushi'
  | 'All' // Black Hole Orb - affects all yaku

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
  planetName: string // e.g., "Mercury", "Venus", etc.
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
 * Chips and Mult required to level up
 */
export const LEVEL_UP_THRESHOLDS = [
  0, // Level 1 (starting)
  1, // Level 2
  2, // Level 3
  3, // Level 4
  5, // Level 5
  7, // Level 6
  10, // Level 7
  13, // Level 8
  17, // Level 9
  21, // Level 10
]

/**
 * Complete Celestial Orb library from ITEM_LIBRARIES.md
 */
export const CELESTIAL_ORBS: Record<
  string,
  Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'>
> = {
  // ---------------------------------------------------------------------------
  // Standard Orbs
  // ---------------------------------------------------------------------------
  pluto_orb: {
    id: 'pluto_orb',
    type: 'CelestialOrb',
    name: 'Pluto Orb',
    japaneseName: '冥王星',
    planetName: 'Pluto',
    description: 'Attunes to Riichi yaku. +1 Mult, +10 Chips per level.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Riichi',
      multPerLevel: 1,
      chipsPerLevel: 10,
      description: '+1 Mult, +10 Chips per level when Riichi is scored',
    },
  },

  mercury_orb: {
    id: 'mercury_orb',
    type: 'CelestialOrb',
    name: 'Mercury Orb',
    japaneseName: '水星',
    planetName: 'Mercury',
    description: 'Attunes to Tanyao yaku. +1 Mult, +15 Chips per level.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Tanyao',
      multPerLevel: 1,
      chipsPerLevel: 15,
      description: '+1 Mult, +15 Chips per level when Tanyao is scored',
    },
  },

  uranus_orb: {
    id: 'uranus_orb',
    type: 'CelestialOrb',
    name: 'Uranus Orb',
    japaneseName: '天王星',
    planetName: 'Uranus',
    description: 'Attunes to Yakuhai yaku. +1 Mult, +20 Chips per level.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Yakuhai',
      multPerLevel: 1,
      chipsPerLevel: 20,
      description: '+1 Mult, +20 Chips per level when Yakuhai is scored',
    },
  },

  venus_orb: {
    id: 'venus_orb',
    type: 'CelestialOrb',
    name: 'Venus Orb',
    japaneseName: '金星',
    planetName: 'Venus',
    description: 'Attunes to Pinfu yaku. +2 Mult, +20 Chips per level.',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Pinfu',
      multPerLevel: 2,
      chipsPerLevel: 20,
      description: '+2 Mult, +20 Chips per level when Pinfu is scored',
    },
  },

  saturn_orb: {
    id: 'saturn_orb',
    type: 'CelestialOrb',
    name: 'Saturn Orb',
    japaneseName: '土星',
    planetName: 'Saturn',
    description: 'Attunes to Ittsu (Straight) yaku. +3 Mult, +30 Chips per level.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Ittsu',
      multPerLevel: 3,
      chipsPerLevel: 30,
      description: '+3 Mult, +30 Chips per level when Ittsu is scored',
    },
  },

  jupiter_orb: {
    id: 'jupiter_orb',
    type: 'CelestialOrb',
    name: 'Jupiter Orb',
    japaneseName: '木星',
    planetName: 'Jupiter',
    description: 'Attunes to Honitsu (Half-Flush) yaku. +2 Mult, +15 Chips per level.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Honitsu',
      multPerLevel: 2,
      chipsPerLevel: 15,
      description: '+2 Mult, +15 Chips per level when Honitsu is scored',
    },
  },

  earth_orb: {
    id: 'earth_orb',
    type: 'CelestialOrb',
    name: 'Earth Orb',
    japaneseName: '地球',
    planetName: 'Earth',
    description: 'Attunes to Toitoi yaku. +2 Mult, +25 Chips per level.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Toitoi',
      multPerLevel: 2,
      chipsPerLevel: 25,
      description: '+2 Mult, +25 Chips per level when Toitoi is scored',
    },
  },

  mars_orb: {
    id: 'mars_orb',
    type: 'CelestialOrb',
    name: 'Mars Orb',
    japaneseName: '火星',
    planetName: 'Mars',
    description: 'Attunes to Chinitsu (Full Flush) yaku. +3 Mult, +30 Chips per level.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Chinitsu',
      multPerLevel: 3,
      chipsPerLevel: 30,
      description: '+3 Mult, +30 Chips per level when Chinitsu is scored',
    },
  },

  neptune_orb: {
    id: 'neptune_orb',
    type: 'CelestialOrb',
    name: 'Neptune Orb',
    japaneseName: '海王星',
    planetName: 'Neptune',
    description:
      'Attunes to Sanshoku (Mixed Triple) yaku. +4 Mult, +40 Chips per level.',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Sanshoku',
      multPerLevel: 4,
      chipsPerLevel: 40,
      description: '+4 Mult, +40 Chips per level when Sanshoku is scored',
    },
  },

  // ---------------------------------------------------------------------------
  // Secret Orbs (Unlockable)
  // ---------------------------------------------------------------------------
  planet_x_orb: {
    id: 'planet_x_orb',
    type: 'CelestialOrb',
    name: 'Planet X Orb',
    japaneseName: '惑星X',
    planetName: 'Planet X',
    description: 'Attunes to Seven Pairs yaku. +3 Mult, +35 Chips per level.',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'SevenPairs',
      multPerLevel: 3,
      chipsPerLevel: 35,
      description: '+3 Mult, +35 Chips per level when Seven Pairs is scored',
    },
  },

  ceres_orb: {
    id: 'ceres_orb',
    type: 'CelestialOrb',
    name: 'Ceres Orb',
    japaneseName: 'ケレス',
    planetName: 'Ceres',
    description: 'Attunes to Chanta (Terminals) yaku. +4 Mult, +40 Chips per level.',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Chanta',
      multPerLevel: 4,
      chipsPerLevel: 40,
      description: '+4 Mult, +40 Chips per level when Chanta is scored',
    },
  },

  eris_orb: {
    id: 'eris_orb',
    type: 'CelestialOrb',
    name: 'Eris Orb',
    japaneseName: 'エリス',
    planetName: 'Eris',
    description: 'Attunes to Kokushi Musou yaku. +3 Mult, +50 Chips per level.',
    rarity: 'Legendary',
    edition: 'Base',
    cost: 8,
    sellValue: 4,
    maxLevel: DEFAULT_ORB_MAX_LEVEL,
    effect: {
      targetYaku: 'Kokushi',
      multPerLevel: 3,
      chipsPerLevel: 50,
      description: '+3 Mult, +50 Chips per level when Kokushi is scored',
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
    description: 'Upgrades ALL Yaku by 1 level when used.',
    rarity: 'Legendary',
    edition: 'Base',
    cost: 10,
    sellValue: 5,
    maxLevel: 1, // Black hole only works once but affects all yaku
    effect: {
      targetYaku: 'All',
      multPerLevel: 0,
      chipsPerLevel: 0,
      description: 'Upgrades all yaku levels by 1',
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

  /**
   * Initialize all yaku categories at level 1
   */
  private initializeYakuCategories(): void {
    const categories: YakuCategory[] = [
      'Riichi',
      'Tanyao',
      'Yakuhai',
      'Pinfu',
      'Ittsu',
      'Honitsu',
      'Toitoi',
      'Chinitsu',
      'Sanshoku',
      'SevenPairs',
      'Chanta',
      'Kokushi',
    ]

    for (const category of categories) {
      this.orbLevels.set(category, 1)
      this.yakuTriggerCounts.set(category, 0)
    }
  }

  /**
   * Use a Celestial Orb to level up a yaku category
   */
  useOrb(orb: CelestialOrb): ConsumableUseResult {
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

    if (currentLevel >= orb.maxLevel) {
      return {
        success: false,
        message: `${targetYaku} is already at max level (${orb.maxLevel})`,
        effects: [],
      }
    }

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

  /**
   * Get the current level for a yaku category
   */
  getYakuLevel(yaku: YakuCategory): number {
    return this.orbLevels.get(yaku) || 1
  }

  /**
   * Get all yaku levels
   */
  getAllYakuLevels(): Map<YakuCategory, number> {
    return new Map(this.orbLevels)
  }

  /**
   * Calculate bonus mult for a yaku based on orb levels
   */
  calculateYakuMult(yaku: YakuCategory): number {
    const level = this.getYakuLevel(yaku)
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
  calculateYakuChips(yaku: YakuCategory): number {
    const level = this.getYakuLevel(yaku)
    const orbDef = getCelestialOrbByYaku(yaku)

    if (!orbDef) {
      return 0
    }

    return orbDef.effect.chipsPerLevel * Math.max(0, level - 1)
  }

  /**
   * Calculate total bonus for a scored yaku
   */
  calculateYakuBonus(yaku: YakuCategory): { mult: number; chips: number } {
    return {
      mult: this.calculateYakuMult(yaku),
      chips: this.calculateYakuChips(yaku),
    }
  }

  /**
   * Called when a yaku is scored - increments trigger count
   * Used for potential auto-leveling mechanics
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
    excludeIds: string[] = []
  ): Omit<CelestialOrb, 'instanceId' | 'isUsed' | 'currentLevel'> | null {
    const available = getAllCelestialOrbs().filter(
      (orb) => !excludeIds.includes(orb.id) && orb.rarity !== 'Legendary'
    )

    if (available.length === 0) return null

    const roll = Math.random()
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
      return available[Math.floor(Math.random() * available.length)]
    }

    return candidates[Math.floor(Math.random() * candidates.length)]
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
   * Restore from serialized state
   */
  static fromState(state: {
    orbLevels: [YakuCategory, number][]
    yakuTriggerCounts: [YakuCategory, number][]
    activeOrbs: CelestialOrb[]
  }): CelestialOrbSystem {
    const system = new CelestialOrbSystem()
    system.orbLevels = new Map(state.orbLevels)
    system.yakuTriggerCounts = new Map(state.yakuTriggerCounts)
    system.activeOrbs = [...state.activeOrbs]
    return system
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Map yaku IDs to yaku categories
 */
export function mapYakuIdToCategory(yakuId: string): YakuCategory | null {
  const mapping: Record<string, YakuCategory> = {
    riichi: 'Riichi',
    tanyao: 'Tanyao',
    yakuhai: 'Yakuhai',
    pinfu: 'Pinfu',
    ittsu: 'Ittsu',
    honitsu: 'Honitsu',
    toitoi: 'Toitoi',
    chinitsu: 'Chinitsu',
    sanshoku: 'Sanshoku',
    sanshoku_doujun: 'Sanshoku',
    chiitoitsu: 'SevenPairs',
    seven_pairs: 'SevenPairs',
    chanta: 'Chanta',
    kokushi: 'Kokushi',
    kokushi_musou: 'Kokushi',
  }

  return mapping[yakuId.toLowerCase()] || null
}

/**
 * Get Japanese name for a yaku category
 */
export function getYakuCategoryJapaneseName(category: YakuCategory): string {
  const names: Record<YakuCategory, string> = {
    Riichi: '立直',
    Tanyao: '断幺九',
    Yakuhai: '役牌',
    Pinfu: '平和',
    Ittsu: '一気通貫',
    Honitsu: '混一色',
    Toitoi: '対々和',
    Chinitsu: '清一色',
    Sanshoku: '三色同順',
    SevenPairs: '七対子',
    Chanta: '混全帯幺九',
    Kokushi: '国士無双',
    All: '全役',
  }

  return names[category]
}

/**
 * Get display name for a yaku category
 */
export function getYakuCategoryDisplayName(category: YakuCategory): string {
  const names: Record<YakuCategory, string> = {
    Riichi: 'Riichi',
    Tanyao: 'All Simples',
    Yakuhai: 'Value Tiles',
    Pinfu: 'No Points',
    Ittsu: 'Pure Straight',
    Honitsu: 'Half Flush',
    Toitoi: 'All Triplets',
    Chinitsu: 'Full Flush',
    Sanshoku: 'Mixed Triple Sequence',
    SevenPairs: 'Seven Pairs',
    Chanta: 'Terminals in All Sets',
    Kokushi: 'Thirteen Orphans',
    All: 'All Yaku',
  }

  return names[category]
}
