/**
 * Flower System for Tensho Mahjong Roguelike
 *
 * Flowers are persistent run-wide modifiers that accumulate across rounds.
 * They provide passive scaling bonuses and unlock special decree interactions.
 *
 * Flower Types:
 * - Plum: +5% score per sequence
 * - Orchid: +5% score per honor tile
 * - Chrysanthemum: +5% score per concealed meld
 * - Bamboo: +5% score per terminal
 *
 * Set Bonuses:
 * - 2 Flowers: +1 Decree slot
 * - 3 Flowers: Unlock special decrees in shop
 * - 4 Flowers: Double all flower effectiveness
 */

import { Tile, TileSuit } from '../core/Tile'
import { MeldType } from '../core/Meld'
import {
  FlowerTile,
  FlowerVariant,
  FlowerEffect,
  FlowerMutation,
  FlowerSetBonus,
  FlowerCollection,
  ScoringContext,
} from './types'

// =============================================================================
// FLOWER DEFINITIONS
// =============================================================================

/**
 * Base effects for each flower type
 */
export const FLOWER_BASE_EFFECTS: Record<FlowerVariant, FlowerEffect> = {
  Plum: {
    type: 'percentage_bonus',
    target: 'sequence',
    percentagePerMatch: 5, // +5% per completed sequence
  },
  Orchid: {
    type: 'percentage_bonus',
    target: 'honor',
    percentagePerMatch: 5, // +5% per honor tile
  },
  Chrysanthemum: {
    type: 'percentage_bonus',
    target: 'concealed_meld',
    percentagePerMatch: 5, // +5% per concealed meld
  },
  Bamboo: {
    type: 'percentage_bonus',
    target: 'terminal',
    percentagePerMatch: 5, // +5% per terminal
  },
}

/**
 * Advanced mutations for flowers (unlockable later in meta-progression)
 */
export const FLOWER_MUTATIONS: Record<FlowerVariant, FlowerMutation> = {
  Plum: {
    type: 'mutation',
    mutationId: 'plum_overlap',
    description: 'Sequences may overlap by one tile',
    isUnlocked: false,
  },
  Orchid: {
    type: 'mutation',
    mutationId: 'orchid_double_dragons',
    description: 'Dragons count as double honors for scoring',
    isUnlocked: false,
  },
  Chrysanthemum: {
    type: 'mutation',
    mutationId: 'chrysanthemum_exponential',
    description: 'Concealed hands gain exponential scaling',
    isUnlocked: false,
  },
  Bamboo: {
    type: 'mutation',
    mutationId: 'bamboo_wild_anchor',
    description: 'Terminals act as wild adjacency anchors',
    isUnlocked: false,
  },
}

/**
 * Set bonuses for collecting multiple flowers
 */
export const FLOWER_SET_BONUSES: FlowerSetBonus[] = [
  {
    requiredCount: 2,
    effect: {
      type: 'decree_slot',
      value: 1,
      description: '+1 Decree slot',
    },
  },
  {
    requiredCount: 3,
    effect: {
      type: 'unlock_decrees',
      description: 'Unlock Flower-triggered Decrees in shop',
    },
  },
  {
    requiredCount: 4,
    effect: {
      type: 'double_effectiveness',
      value: 2,
      description: 'All Flowers gain double effectiveness',
    },
  },
]

// =============================================================================
// FLOWER SYSTEM CLASS
// =============================================================================

/**
 * Manages flower collection, effects, and interactions
 */
export class FlowerSystem {
  private flowers: FlowerTile[] = []
  private unlockedMutations: Set<string> = new Set()

  constructor() {
    this.flowers = []
  }

  /**
   * Get all collected flowers
   */
  getFlowers(): FlowerTile[] {
    return [...this.flowers]
  }

  /**
   * Get the count of collected flowers
   */
  getFlowerCount(): number {
    return this.flowers.length
  }

  /**
   * Check if a specific flower type has been collected
   */
  hasFlowerType(type: FlowerVariant): boolean {
    return this.flowers.some((f) => f.type === type)
  }

  /**
   * Get active set bonuses based on flower count
   */
  getActiveBonuses(): FlowerSetBonus[] {
    return FLOWER_SET_BONUSES.filter(
      (bonus) => this.flowers.length >= bonus.requiredCount
    )
  }

  /**
   * Get the effectiveness multiplier (1.0 normally, 2.0 with all 4 flowers)
   */
  getEffectivenessMultiplier(): number {
    const doubleBonus = this.getActiveBonuses().find(
      (b) => b.effect.type === 'double_effectiveness'
    )
    return doubleBonus ? (doubleBonus.effect.value as number) : 1.0
  }

  /**
   * Add a flower to the collection
   */
  addFlower(tile: Tile): FlowerTile | null {
    if (tile.suit !== TileSuit.Flower) {
      return null
    }

    const flowerType = this.getFlowerVariantFromRank(tile.rank)
    if (!flowerType) {
      return null
    }

    // Check if already collected this flower type
    if (this.hasFlowerType(flowerType)) {
      return null // Cannot collect duplicate flower types
    }

    const flowerTile: FlowerTile = {
      id: tile.id,
      type: flowerType,
      effect: FLOWER_BASE_EFFECTS[flowerType],
      mutation: this.unlockedMutations.has(FLOWER_MUTATIONS[flowerType].mutationId)
        ? { ...FLOWER_MUTATIONS[flowerType], isUnlocked: true }
        : undefined,
    }

    this.flowers.push(flowerTile)
    return flowerTile
  }

  /**
   * Convert tile rank to flower variant
   */
  private getFlowerVariantFromRank(rank: number): FlowerVariant | null {
    switch (rank) {
      case 1:
        return 'Plum'
      case 2:
        return 'Orchid'
      case 3:
        return 'Chrysanthemum'
      case 4:
        return 'Bamboo'
      default:
        return null
    }
  }

  /**
   * Calculate total flower bonus for scoring
   */
  calculateFlowerBonus(context: ScoringContext): number {
    if (this.flowers.length === 0) {
      return 1.0 // No bonus (multiply by 1)
    }

    const effectiveness = this.getEffectivenessMultiplier()
    let totalPercentage = 0

    for (const flower of this.flowers) {
      const matchCount = this.countMatches(flower.effect.target, context)
      const bonus = matchCount * flower.effect.percentagePerMatch * effectiveness
      totalPercentage += bonus
    }

    // Convert percentage to multiplier (e.g., 25% becomes 1.25)
    return 1 + totalPercentage / 100
  }

  /**
   * Count matches for a specific target type
   */
  private countMatches(
    target: 'sequence' | 'honor' | 'concealed_meld' | 'terminal',
    context: ScoringContext
  ): number {
    switch (target) {
      case 'sequence':
        return context.melds.filter((m) => m.type === MeldType.Sequence).length

      case 'honor':
        return context.tiles.filter((t) => t.isHonor).length

      case 'concealed_meld':
        return context.melds.filter((m) => m.isConcealed).length

      case 'terminal':
        return context.tiles.filter((t) => t.isTerminal).length

      default:
        return 0
    }
  }

  /**
   * Get bonus decree slots from flower collection
   */
  getBonusDecreeSlots(): number {
    const slotBonus = this.getActiveBonuses().find(
      (b) => b.effect.type === 'decree_slot'
    )
    return slotBonus ? (slotBonus.effect.value as number) : 0
  }

  /**
   * Check if flower-triggered decrees are unlocked
   */
  areSpecialDecreesUnlocked(): boolean {
    return this.getActiveBonuses().some(
      (b) => b.effect.type === 'unlock_decrees'
    )
  }

  /**
   * Get the current flower collection state
   */
  getCollection(): FlowerCollection {
    return {
      flowers: [...this.flowers],
      activeBonuses: this.getActiveBonuses(),
      totalEffectiveness: this.getEffectivenessMultiplier(),
    }
  }

  /**
   * Unlock a flower mutation (meta-progression)
   */
  unlockMutation(mutationId: string): void {
    this.unlockedMutations.add(mutationId)

    // Update existing flowers with their mutations
    for (const flower of this.flowers) {
      const mutation = FLOWER_MUTATIONS[flower.type]
      if (mutation.mutationId === mutationId) {
        flower.mutation = { ...mutation, isUnlocked: true }
      }
    }
  }

  /**
   * Check if a mutation is active
   */
  hasMutation(mutationId: string): boolean {
    return this.flowers.some(
      (f) => f.mutation?.mutationId === mutationId && f.mutation?.isUnlocked
    )
  }

  /**
   * Apply flower-decree interaction bonus
   * Flowers empower decrees: +10% decree effect per flower collected
   */
  getDecreeEmpowermentBonus(): number {
    return this.flowers.length * 0.1 // +10% per flower
  }

  /**
   * Check flower-season interactions
   */
  getSeasonInteraction(
    seasonType: string,
    context: ScoringContext
  ): { hasInteraction: boolean; effect: string; bonus: number } {
    // Chrysanthemum + Winter: Concealed hands ignore Winter's score penalty
    if (
      seasonType === 'Winter' &&
      this.hasFlowerType('Chrysanthemum') &&
      context.isConcealed
    ) {
      return {
        hasInteraction: true,
        effect: 'Winter penalty negated',
        bonus: 0.25, // Restores the 25% penalty
      }
    }

    // Bamboo + Summer: Terminal-heavy hands negate wall shrinkage
    if (seasonType === 'Summer' && this.hasFlowerType('Bamboo')) {
      const terminalCount = context.tiles.filter((t) => t.isTerminal).length
      if (terminalCount >= 4) {
        return {
          hasInteraction: true,
          effect: 'Wall shrinkage negated',
          bonus: 0,
        }
      }
    }

    // Orchid + Spring: Honor draws grant additional replacement draw
    if (seasonType === 'Spring' && this.hasFlowerType('Orchid')) {
      return {
        hasInteraction: true,
        effect: '+1 draw when drawing honors',
        bonus: 0,
      }
    }

    // Plum + Autumn: Sequences generate discard-pool recursion
    if (seasonType === 'Autumn' && this.hasFlowerType('Plum')) {
      return {
        hasInteraction: true,
        effect: 'Sequences can recur from discards',
        bonus: 0,
      }
    }

    return { hasInteraction: false, effect: '', bonus: 0 }
  }

  /**
   * Clear all flowers (for new run)
   */
  clear(): void {
    this.flowers = []
  }

  /**
   * Check if drought season suppresses flowers
   */
  applySuppression(_isDrought: boolean): void {
    // Drought suppression is handled in scoring by returning 1.0 multiplier
  }

  /**
   * Calculate flower bonus with potential suppression
   */
  calculateFlowerBonusWithSuppression(
    context: ScoringContext,
    isDrought: boolean
  ): number {
    if (isDrought) {
      return 1.0 // No bonus during drought
    }
    return this.calculateFlowerBonus(context)
  }

  /**
   * Serialize flower system state
   */
  toState(): {
    flowers: FlowerTile[]
    unlockedMutations: string[]
  } {
    return {
      flowers: [...this.flowers],
      unlockedMutations: Array.from(this.unlockedMutations),
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    flowers: FlowerTile[]
    unlockedMutations: string[]
  }): FlowerSystem {
    const system = new FlowerSystem()
    system.flowers = [...state.flowers]
    system.unlockedMutations = new Set(state.unlockedMutations)
    return system
  }
}

/**
 * Create a default flower tile from a standard tile
 */
export function createFlowerTile(
  tile: Tile,
  unlockedMutations: Set<string> = new Set()
): FlowerTile | null {
  if (tile.suit !== TileSuit.Flower) {
    return null
  }

  const variants: FlowerVariant[] = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']
  const variant = variants[tile.rank - 1]

  if (!variant) {
    return null
  }

  const mutation = FLOWER_MUTATIONS[variant]
  const isMutationUnlocked = unlockedMutations.has(mutation.mutationId)

  return {
    id: tile.id,
    type: variant,
    effect: FLOWER_BASE_EFFECTS[variant],
    mutation: isMutationUnlocked ? { ...mutation, isUnlocked: true } : undefined,
  }
}
