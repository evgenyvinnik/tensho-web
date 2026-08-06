/**
 * Fate Seal System for Tensho Mahjong Roguelike
 *
 * Fate Seals (運命符) are the Tarot card equivalent - single-use consumables
 * that alter the current hand or single decision.
 *
 * Core Rules:
 * - One seal can be used per round by default
 * - Seals operate at "Heaven" authority: they override most table rules
 * - Using a seal never changes the wall composition, only the current hand state
 * - Seals are keyed to hand structure (melds, waits, pairs)
 *
 * See ITEM_LIBRARIES.md for the complete Fate Seal library.
 */

import { Tile, TileSuit } from '../core/Tile'
import { EnhancementType, SealType, EditionType } from '../core/TileModifier'
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
// FATE SEAL TYPES
// =============================================================================

/**
 * Effect types that Fate Seals can have
 */
export type FateSealEffectType =
  | 'enhance_tiles' // Apply enhancement to tiles
  | 'convert_suit' // Convert tiles to a different suit
  | 'convert_to_wild' // Make tiles wild (count as any suit)
  | 'create_consumable' // Create other consumables
  | 'duplicate_consumable' // Copy last used consumable
  | 'gold_generation' // Generate gold
  | 'rank_modification' // Change tile ranks
  | 'destroy_tiles' // Remove tiles from hand/deck
  | 'copy_tile' // Duplicate a tile
  | 'transform_tile' // Change one tile into another
  | 'apply_seal' // Add a seal to a tile
  | 'apply_edition' // Add edition to decree/tile
  | 'sell_value_bonus' // Get gold from decree sell values

/**
 * Fate Seal effect definition
 */
export interface FateSealEffect {
  type: FateSealEffectType
  description: string
  tileCount?: number // Number of tiles affected
  enhancement?: EnhancementType
  sealType?: SealType
  editionType?: EditionType
  targetSuit?: TileSuit
  goldAmount?: number
  goldMax?: number
  rankChange?: number
  consumableType?: 'FateSeal' | 'CelestialOrb' | 'VoidScript'
  consumableCount?: number
  requiresSelection?: boolean // Whether player needs to select tiles
  selectionCount?: number // How many tiles to select
}

/**
 * Fate Seal definition
 */
export interface FateSeal extends BaseConsumable {
  type: 'FateSeal'
  effect: FateSealEffect
  mahjongTwist: string // Thematic description of the mahjong-specific aspect
}

// =============================================================================
// FATE SEAL DEFINITIONS
// =============================================================================

/**
 * Generate a base Fate Seal ID
 */
function _createFateSealId(name: string): string {
  return `fate_seal_${name.toLowerCase().replace(/\s+/g, '_')}`
}

/**
 * Complete Fate Seal library from ITEM_LIBRARIES.md
 */
export const FATE_SEALS: Record<string, Omit<FateSeal, 'instanceId' | 'isUsed'>> = {
  // ---------------------------------------------------------------------------
  // Enhancement Seals
  // ---------------------------------------------------------------------------
  seal_of_the_alchemist: {
    id: 'seal_of_the_alchemist',
    type: 'FateSeal',
    name: 'Seal of the Alchemist',
    japaneseName: '錬金術師の印',
    description: 'Enhances 2 selected tiles with Lucky Mark',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'enhance_tiles',
      description: 'Apply Lucky Mark to 2 tiles',
      tileCount: 2,
      enhancement: EnhancementType.Lucky,
      requiresSelection: true,
      selectionCount: 2,
    },
    mahjongTwist: 'Tiles shimmer with fortune',
  },

  seal_of_the_empress: {
    id: 'seal_of_the_empress',
    type: 'FateSeal',
    name: 'Seal of the Empress',
    japaneseName: '女帝の印',
    description: 'Enhances 2 selected tiles with Score Bonus Mark',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'enhance_tiles',
      description: 'Apply Bonus Mark to 2 tiles',
      tileCount: 2,
      enhancement: EnhancementType.Bonus,
      requiresSelection: true,
      selectionCount: 2,
    },
    mahjongTwist: 'Imperial blessing',
  },

  seal_of_the_sage: {
    id: 'seal_of_the_sage',
    type: 'FateSeal',
    name: 'Seal of the Sage',
    japaneseName: '賢者の印',
    description: 'Enhances 2 selected tiles with Bonus Chip Mark',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'enhance_tiles',
      description: 'Apply Chip Bonus Mark to 2 tiles',
      tileCount: 2,
      enhancement: EnhancementType.Bonus,
      requiresSelection: true,
      selectionCount: 2,
    },
    mahjongTwist: 'Ancient wisdom',
  },

  seal_of_harmony: {
    id: 'seal_of_harmony',
    type: 'FateSeal',
    name: 'Seal of Harmony',
    japaneseName: '和の印',
    description: 'Converts 1 tile to Wild (counts as any suit)',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'convert_to_wild',
      description: 'Make 1 tile wild',
      tileCount: 1,
      enhancement: EnhancementType.Wild,
      requiresSelection: true,
      selectionCount: 1,
    },
    mahjongTwist: 'Balance of elements',
  },

  seal_of_fortitude: {
    id: 'seal_of_fortitude',
    type: 'FateSeal',
    name: 'Seal of Fortitude',
    japaneseName: '剛の印',
    description: 'Enhances 1 tile to Steel Mark (x1.5 Mult when held)',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'enhance_tiles',
      description: 'Apply Steel Mark to 1 tile',
      tileCount: 1,
      enhancement: EnhancementType.Steel,
      requiresSelection: true,
      selectionCount: 1,
    },
    mahjongTwist: 'Unbreakable resolve',
  },

  seal_of_glass: {
    id: 'seal_of_glass',
    type: 'FateSeal',
    name: 'Seal of Glass',
    japaneseName: '硝子の印',
    description: 'Enhances 1 tile to Glass Mark (x2 Mult, may shatter)',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'enhance_tiles',
      description: 'Apply Glass Mark to 1 tile',
      tileCount: 1,
      enhancement: EnhancementType.Glass,
      requiresSelection: true,
      selectionCount: 1,
    },
    mahjongTwist: 'Beautiful but fragile',
  },

  seal_of_wealth: {
    id: 'seal_of_wealth',
    type: 'FateSeal',
    name: 'Seal of Wealth',
    japaneseName: '富の印',
    description: 'Enhances 1 tile to Gold Mark (+3 gold if held at round end)',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'enhance_tiles',
      description: 'Apply Gold Mark to 1 tile',
      tileCount: 1,
      enhancement: EnhancementType.Gold,
      requiresSelection: true,
      selectionCount: 1,
    },
    mahjongTwist: 'Prosperity granted',
  },

  seal_of_stone: {
    id: 'seal_of_stone',
    type: 'FateSeal',
    name: 'Seal of Stone',
    japaneseName: '石の印',
    description: 'Enhances 1 tile to Stone Mark (+50 Chips, always scores)',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'enhance_tiles',
      description: 'Apply Stone Mark to 1 tile',
      tileCount: 1,
      enhancement: EnhancementType.Stone,
      requiresSelection: true,
      selectionCount: 1,
    },
    mahjongTwist: 'Immutable foundation',
  },

  // ---------------------------------------------------------------------------
  // Suit Conversion Seals
  // ---------------------------------------------------------------------------
  seal_of_manzu: {
    id: 'seal_of_manzu',
    type: 'FateSeal',
    name: 'Seal of Manzu',
    japaneseName: '萬子の印',
    description: 'Converts up to 3 tiles to Manzu suit',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'convert_suit',
      description: 'Convert up to 3 tiles to Manzu',
      tileCount: 3,
      targetSuit: TileSuit.Manzu,
      requiresSelection: true,
      selectionCount: 3,
    },
    mahjongTwist: 'Way of Characters',
  },

  seal_of_pinzu: {
    id: 'seal_of_pinzu',
    type: 'FateSeal',
    name: 'Seal of Pinzu',
    japaneseName: '筒子の印',
    description: 'Converts up to 3 tiles to Pinzu suit',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'convert_suit',
      description: 'Convert up to 3 tiles to Pinzu',
      tileCount: 3,
      targetSuit: TileSuit.Pinzu,
      requiresSelection: true,
      selectionCount: 3,
    },
    mahjongTwist: 'Way of Circles',
  },

  seal_of_souzu: {
    id: 'seal_of_souzu',
    type: 'FateSeal',
    name: 'Seal of Souzu',
    japaneseName: '索子の印',
    description: 'Converts up to 3 tiles to Souzu suit',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'convert_suit',
      description: 'Convert up to 3 tiles to Souzu',
      tileCount: 3,
      targetSuit: TileSuit.Souzu,
      requiresSelection: true,
      selectionCount: 3,
    },
    mahjongTwist: 'Way of Bamboo',
  },

  seal_of_unity: {
    id: 'seal_of_unity',
    type: 'FateSeal',
    name: 'Seal of Unity',
    japaneseName: '統一の印',
    description: 'Converts up to 3 tiles to Honor tiles',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'convert_suit',
      description: 'Convert up to 3 tiles to Honors',
      tileCount: 3,
      targetSuit: TileSuit.Wind, // Will be handled specially for honors
      requiresSelection: true,
      selectionCount: 3,
    },
    mahjongTwist: 'Path of honors',
  },

  // ---------------------------------------------------------------------------
  // Creation Seals
  // ---------------------------------------------------------------------------
  seal_of_the_oracle: {
    id: 'seal_of_the_oracle',
    type: 'FateSeal',
    name: 'Seal of the Oracle',
    japaneseName: '巫女の印',
    description: 'Creates up to 2 random Celestial Orbs (if room)',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    effect: {
      type: 'create_consumable',
      description: 'Create up to 2 Celestial Orbs',
      consumableType: 'CelestialOrb',
      consumableCount: 2,
    },
    mahjongTwist: 'Commune with stars',
  },

  seal_of_the_emperor: {
    id: 'seal_of_the_emperor',
    type: 'FateSeal',
    name: 'Seal of the Emperor',
    japaneseName: '皇帝の印',
    description: 'Creates up to 2 random Fate Seals (if room)',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    effect: {
      type: 'create_consumable',
      description: 'Create up to 2 Fate Seals',
      consumableType: 'FateSeal',
      consumableCount: 2,
    },
    mahjongTwist: 'Royal decree',
  },

  seal_of_the_fool: {
    id: 'seal_of_the_fool',
    type: 'FateSeal',
    name: 'Seal of the Fool',
    japaneseName: '愚者の印',
    description: 'Creates the last Fate Seal or Celestial Orb used this run',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    effect: {
      type: 'duplicate_consumable',
      description: 'Duplicate last used consumable',
    },
    mahjongTwist: 'Mirrors The Fool',
  },

  seal_of_judgment: {
    id: 'seal_of_judgment',
    type: 'FateSeal',
    name: 'Seal of Judgment',
    japaneseName: '審判の印',
    description: 'Creates a random Decree (if room)',
    rarity: 'Rare',
    edition: 'Base',
    cost: 6,
    sellValue: 3,
    effect: {
      type: 'create_consumable',
      description: 'Create a random Decree',
      consumableType: 'FateSeal', // Special handling for decree creation
      consumableCount: 1,
    },
    mahjongTwist: 'Court decides',
  },

  // ---------------------------------------------------------------------------
  // Gold Seals
  // ---------------------------------------------------------------------------
  seal_of_the_hermit: {
    id: 'seal_of_the_hermit',
    type: 'FateSeal',
    name: 'Seal of the Hermit',
    japaneseName: '隠者の印',
    description: 'Doubles gold (max +20 gold)',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'gold_generation',
      description: 'Double current gold (max +20)',
      goldAmount: -1, // -1 indicates doubling
      goldMax: 20,
    },
    mahjongTwist: 'Wisdom through solitude',
  },

  seal_of_balance: {
    id: 'seal_of_balance',
    type: 'FateSeal',
    name: 'Seal of Balance',
    japaneseName: '均衡の印',
    description: 'Gives total sell value of all Decrees (max 50 gold)',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'sell_value_bonus',
      description: 'Gain gold equal to total Decree sell value',
      goldMax: 50,
    },
    mahjongTwist: 'Equilibrium restored',
  },

  // ---------------------------------------------------------------------------
  // Tile Manipulation Seals
  // ---------------------------------------------------------------------------
  seal_of_strength: {
    id: 'seal_of_strength',
    type: 'FateSeal',
    name: 'Seal of Strength',
    japaneseName: '力の印',
    description: 'Increases rank of up to 2 tiles by 1 (max 9)',
    rarity: 'Common',
    edition: 'Base',
    cost: 3,
    sellValue: 1,
    effect: {
      type: 'rank_modification',
      description: 'Increase rank of up to 2 tiles by 1',
      tileCount: 2,
      rankChange: 1,
      requiresSelection: true,
      selectionCount: 2,
    },
    mahjongTwist: 'Growth through struggle',
  },

  seal_of_release: {
    id: 'seal_of_release',
    type: 'FateSeal',
    name: 'Seal of Release',
    japaneseName: '解放の印',
    description: 'Destroys up to 2 selected tiles permanently',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'destroy_tiles',
      description: 'Destroy up to 2 tiles',
      tileCount: 2,
      requiresSelection: true,
      selectionCount: 2,
    },
    mahjongTwist: 'Let go of the past',
  },

  seal_of_transmutation: {
    id: 'seal_of_transmutation',
    type: 'FateSeal',
    name: 'Seal of Transmutation',
    japaneseName: '変容の印',
    description: 'Select 2 tiles, left becomes copy of right',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    effect: {
      type: 'copy_tile',
      description: 'Copy one tile to another',
      tileCount: 2,
      requiresSelection: true,
      selectionCount: 2,
    },
    mahjongTwist: 'Death and rebirth',
  },

  // ---------------------------------------------------------------------------
  // Edition/Fortune Seals
  // ---------------------------------------------------------------------------
  seal_of_fortune: {
    id: 'seal_of_fortune',
    type: 'FateSeal',
    name: 'Seal of Fortune',
    japaneseName: '運命の印',
    description: '1 in 4 chance to add Foil/Holo/Prismatic to random Decree',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'apply_edition',
      description: '25% chance to add edition to Decree',
    },
    mahjongTwist: 'Wheel of fate spins',
  },

  // ---------------------------------------------------------------------------
  // Secret/Legendary Seals
  // ---------------------------------------------------------------------------
  seal_of_the_immortal: {
    id: 'seal_of_the_immortal',
    type: 'FateSeal',
    name: 'Seal of the Immortal',
    japaneseName: '不死の印',
    description: 'Creates a Mythic Decree (if room)',
    rarity: 'Legendary',
    edition: 'Base',
    cost: 10,
    sellValue: 5,
    effect: {
      type: 'create_consumable',
      description: 'Create a Mythic (Heavenly Ordinance) Decree',
      consumableType: 'FateSeal', // Special handling
      consumableCount: 1,
    },
    mahjongTwist: 'Transcend mortality',
  },

  seal_of_the_void: {
    id: 'seal_of_the_void',
    type: 'FateSeal',
    name: 'Seal of the Void',
    japaneseName: '虚空の印',
    description: 'Upgrades every Yaku by 1 level',
    rarity: 'Legendary',
    edition: 'Base',
    cost: 10,
    sellValue: 5,
    effect: {
      type: 'enhance_tiles', // Special handling for yaku upgrade
      description: 'Upgrade all Yaku by 1 level',
    },
    mahjongTwist: 'Embrace the emptiness',
  },
}

/**
 * Get all Fate Seals as an array
 */
export function getAllFateSeals(): Omit<FateSeal, 'instanceId' | 'isUsed'>[] {
  return Object.values(FATE_SEALS)
}

/**
 * Get Fate Seals by rarity
 */
export function getFateSealsByRarity(
  rarity: ConsumableRarity
): Omit<FateSeal, 'instanceId' | 'isUsed'>[] {
  return getAllFateSeals().filter((seal) => seal.rarity === rarity)
}

// =============================================================================
// FATE SEAL SYSTEM CLASS
// =============================================================================

/**
 * Manages Fate Seal usage and effects
 */
export class FateSealSystem {
  private lastUsedConsumable: BaseConsumable | null = null
  private yakuLevels: Map<string, number> = new Map()

  constructor() {
    this.lastUsedConsumable = null
  }

  /**
   * Use a Fate Seal
   */
  useSeal(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    let message = ''
    let success = true

    switch (seal.effect.type) {
      case 'enhance_tiles': {
        const enhanceResult = this.applyEnhancement(seal, context)
        effects.push(...enhanceResult.effects)
        message = enhanceResult.message
        success = enhanceResult.success
        break
      }

      case 'convert_suit': {
        const convertResult = this.applySuitConversion(seal, context)
        effects.push(...convertResult.effects)
        message = convertResult.message
        success = convertResult.success
        break
      }

      case 'convert_to_wild': {
        const wildResult = this.applyWildConversion(seal, context)
        effects.push(...wildResult.effects)
        message = wildResult.message
        success = wildResult.success
        break
      }

      case 'create_consumable': {
        const createResult = this.createConsumables(seal, context)
        effects.push(...createResult.effects)
        message = createResult.message
        success = createResult.success
        break
      }

      case 'duplicate_consumable': {
        const dupResult = this.duplicateLastConsumable(context)
        effects.push(...dupResult.effects)
        message = dupResult.message
        success = dupResult.success
        break
      }

      case 'gold_generation': {
        const goldResult = this.generateGold(seal, context)
        effects.push(...goldResult.effects)
        message = goldResult.message
        success = goldResult.success
        break
      }

      case 'sell_value_bonus': {
        const sellResult = this.getSellValueBonus(seal, context)
        effects.push(...sellResult.effects)
        message = sellResult.message
        success = sellResult.success
        break
      }

      case 'rank_modification': {
        const rankResult = this.modifyRanks(seal, context)
        effects.push(...rankResult.effects)
        message = rankResult.message
        success = rankResult.success
        break
      }

      case 'destroy_tiles': {
        const destroyResult = this.destroyTiles(seal, context)
        effects.push(...destroyResult.effects)
        message = destroyResult.message
        success = destroyResult.success
        break
      }

      case 'copy_tile': {
        const copyResult = this.copyTile(seal, context)
        effects.push(...copyResult.effects)
        message = copyResult.message
        success = copyResult.success
        break
      }

      case 'apply_edition': {
        const editionResult = this.applyEdition(seal, context)
        effects.push(...editionResult.effects)
        message = editionResult.message
        success = editionResult.success
        break
      }

      default:
        message = 'Unknown seal effect'
        success = false
    }

    if (success) {
      this.lastUsedConsumable = seal
    }

    return { success, message, effects }
  }

  /**
   * Apply enhancement to selected tiles
   */
  private applyEnhancement(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    const selectedTiles = context.selectedTiles || []

    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tiles selected',
        effects: [],
      }
    }

    const enhancement = seal.effect.enhancement
    if (!enhancement) {
      return {
        success: false,
        message: 'No enhancement specified',
        effects: [],
      }
    }

    const affectedTileIds: string[] = []
    const maxTiles = seal.effect.tileCount || 1

    for (let i = 0; i < Math.min(selectedTiles.length, maxTiles); i++) {
      const tile = selectedTiles[i]
      // In real implementation, this would modify the tile's enhancement
      affectedTileIds.push(tile.id)
    }

    effects.push({
      type: 'enhancement_applied',
      description: `Applied ${enhancement} Mark to ${affectedTileIds.length} tile(s)`,
      value: enhancement,
      affectedTiles: affectedTileIds,
    })

    return {
      success: true,
      message: `${seal.name}: Enhanced ${affectedTileIds.length} tile(s) with ${enhancement} Mark`,
      effects,
    }
  }

  /**
   * Apply suit conversion to selected tiles
   */
  private applySuitConversion(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    const selectedTiles = context.selectedTiles || []

    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tiles selected',
        effects: [],
      }
    }

    const targetSuit = seal.effect.targetSuit
    if (!targetSuit) {
      return {
        success: false,
        message: 'No target suit specified',
        effects: [],
      }
    }

    const affectedTileIds: string[] = []
    const maxTiles = seal.effect.tileCount || 1

    for (let i = 0; i < Math.min(selectedTiles.length, maxTiles); i++) {
      const tile = selectedTiles[i]
      // Only convert suited tiles
      if (tile.isSuited) {
        affectedTileIds.push(tile.id)
      }
    }

    effects.push({
      type: 'suit_conversion',
      description: `Converted ${affectedTileIds.length} tile(s) to ${targetSuit}`,
      value: targetSuit,
      affectedTiles: affectedTileIds,
    })

    return {
      success: true,
      message: `${seal.name}: Converted ${affectedTileIds.length} tile(s) to ${targetSuit}`,
      effects,
    }
  }

  /**
   * Convert tiles to wild
   */
  private applyWildConversion(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    const selectedTiles = context.selectedTiles || []

    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tiles selected',
        effects: [],
      }
    }

    const affectedTileIds = selectedTiles
      .slice(0, seal.effect.tileCount || 1)
      .map((t) => t.id)

    effects.push({
      type: 'wild_conversion',
      description: `Made ${affectedTileIds.length} tile(s) wild`,
      affectedTiles: affectedTileIds,
    })

    return {
      success: true,
      message: `${seal.name}: Made ${affectedTileIds.length} tile(s) wild`,
      effects,
    }
  }

  /**
   * Create new consumables
   */
  private createConsumables(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    const count = seal.effect.consumableCount || 1
    const consumableType = seal.effect.consumableType

    if (!consumableType) {
      return {
        success: false,
        message: 'No consumable type specified',
        effects: [],
      }
    }

    // Check available slots
    const availableSlots = context.getAvailableSlots?.(consumableType) || 0
    const actualCount = Math.min(count, availableSlots)

    if (actualCount === 0) {
      return {
        success: false,
        message: `No room for ${consumableType}`,
        effects: [],
      }
    }

    effects.push({
      type: 'consumable_created',
      description: `Created ${actualCount} ${consumableType}(s)`,
      value: actualCount,
    })

    return {
      success: true,
      message: `${seal.name}: Created ${actualCount} ${consumableType}(s)`,
      effects,
    }
  }

  /**
   * Duplicate last used consumable
   */
  private duplicateLastConsumable(context: FateSealContext): ConsumableUseResult {
    if (!this.lastUsedConsumable) {
      return {
        success: false,
        message: 'No consumable has been used this run',
        effects: [],
      }
    }

    const availableSlots =
      context.getAvailableSlots?.(this.lastUsedConsumable.type) || 0

    if (availableSlots === 0) {
      return {
        success: false,
        message: `No room for ${this.lastUsedConsumable.type}`,
        effects: [],
      }
    }

    return {
      success: true,
      message: `Seal of the Fool: Created copy of ${this.lastUsedConsumable.name}`,
      effects: [
        {
          type: 'consumable_duplicated',
          description: `Duplicated ${this.lastUsedConsumable.name}`,
          value: this.lastUsedConsumable.id,
        },
      ],
    }
  }

  /**
   * Generate gold
   */
  private generateGold(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    let goldGenerated = 0
    const currentGold = context.currentGold || 0
    const maxGold = seal.effect.goldMax || Infinity

    if (seal.effect.goldAmount === -1) {
      // Doubling effect
      goldGenerated = Math.min(currentGold, maxGold)
    } else {
      goldGenerated = Math.min(seal.effect.goldAmount || 0, maxGold)
    }

    return {
      success: true,
      message: `${seal.name}: +${goldGenerated} gold`,
      effects: [
        {
          type: 'gold_generated',
          description: `Generated ${goldGenerated} gold`,
          value: goldGenerated,
        },
      ],
    }
  }

  /**
   * Get sell value bonus
   */
  private getSellValueBonus(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const totalSellValue = context.totalDecreeSellValue || 0
    const maxGold = seal.effect.goldMax || Infinity
    const goldGenerated = Math.min(totalSellValue, maxGold)

    return {
      success: true,
      message: `${seal.name}: +${goldGenerated} gold from Decree sell values`,
      effects: [
        {
          type: 'gold_generated',
          description: `Generated ${goldGenerated} gold from Decree sell values`,
          value: goldGenerated,
        },
      ],
    }
  }

  /**
   * Modify tile ranks
   */
  private modifyRanks(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    const selectedTiles = context.selectedTiles || []
    const rankChange = seal.effect.rankChange || 0

    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tiles selected',
        effects: [],
      }
    }

    const affectedTileIds: string[] = []
    const maxTiles = seal.effect.tileCount || 1

    for (let i = 0; i < Math.min(selectedTiles.length, maxTiles); i++) {
      const tile = selectedTiles[i]
      // Only modify suited tiles with valid rank results
      if (tile.isSuited) {
        const newRank = tile.rank + rankChange
        if (newRank >= 1 && newRank <= 9) {
          affectedTileIds.push(tile.id)
        }
      }
    }

    effects.push({
      type: 'rank_modified',
      description: `Modified rank of ${affectedTileIds.length} tile(s) by ${rankChange > 0 ? '+' : ''}${rankChange}`,
      value: rankChange,
      affectedTiles: affectedTileIds,
    })

    return {
      success: true,
      message: `${seal.name}: Modified ${affectedTileIds.length} tile rank(s)`,
      effects,
    }
  }

  /**
   * Destroy selected tiles
   */
  private destroyTiles(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    const selectedTiles = context.selectedTiles || []

    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tiles selected',
        effects: [],
      }
    }

    const maxTiles = seal.effect.tileCount || 1
    const destroyedTileIds = selectedTiles.slice(0, maxTiles).map((t) => t.id)

    effects.push({
      type: 'tiles_destroyed',
      description: `Destroyed ${destroyedTileIds.length} tile(s)`,
      affectedTiles: destroyedTileIds,
    })

    return {
      success: true,
      message: `${seal.name}: Destroyed ${destroyedTileIds.length} tile(s)`,
      effects,
    }
  }

  /**
   * Copy one tile to another
   */
  private copyTile(
    seal: FateSeal,
    context: FateSealContext
  ): ConsumableUseResult {
    const selectedTiles = context.selectedTiles || []

    if (selectedTiles.length < 2) {
      return {
        success: false,
        message: 'Select 2 tiles (left becomes copy of right)',
        effects: [],
      }
    }

    const sourceTile = selectedTiles[1]
    const targetTile = selectedTiles[0]

    return {
      success: true,
      message: `${seal.name}: ${targetTile.toString()} became a copy of ${sourceTile.toString()}`,
      effects: [
        {
          type: 'tile_copied',
          description: `Copied ${sourceTile.toString()} to ${targetTile.toString()}`,
          affectedTiles: [targetTile.id, sourceTile.id],
        },
      ],
    }
  }

  /**
   * Apply edition to a random Decree
   */
  private applyEdition(
    seal: FateSeal,
    _context: FateSealContext
  ): ConsumableUseResult {
    // 25% chance to apply edition
    if (Math.random() >= 0.25) {
      return {
        success: true,
        message: `${seal.name}: The wheel did not favor you this time`,
        effects: [
          {
            type: 'edition_failed',
            description: 'Edition application failed (75% chance)',
          },
        ],
      }
    }

    // Choose random edition
    const editions: EditionType[] = [EditionType.Foil, EditionType.Holographic, EditionType.Polychrome]
    const edition = editions[Math.floor(Math.random() * editions.length)]

    return {
      success: true,
      message: `${seal.name}: Applied ${edition} edition to a Decree`,
      effects: [
        {
          type: 'edition_applied',
          description: `Applied ${edition} edition`,
          value: edition,
        },
      ],
    }
  }

  /**
   * Get the last used consumable (for Seal of the Fool)
   */
  getLastUsedConsumable(): BaseConsumable | null {
    return this.lastUsedConsumable
  }

  /**
   * Set the last used consumable
   */
  setLastUsedConsumable(consumable: BaseConsumable): void {
    this.lastUsedConsumable = consumable
  }

  /**
   * Get a random Fate Seal weighted by rarity
   * Common: 70%, Uncommon: 25%, Rare: 5%
   */
  static getRandomFateSeal(excludeIds: string[] = []): Omit<FateSeal, 'instanceId' | 'isUsed'> | null {
    const available = getAllFateSeals().filter(
      (seal) => !excludeIds.includes(seal.id) && seal.rarity !== 'Legendary'
    )

    if (available.length === 0) return null

    const roll = Math.random()
    let targetRarity: ConsumableRarity

    if (roll < 0.7) {
      targetRarity = 'Common'
    } else if (roll < 0.95) {
      targetRarity = 'Uncommon'
    } else {
      targetRarity = 'Rare'
    }

    const candidates = available.filter((seal) => seal.rarity === targetRarity)

    if (candidates.length === 0) {
      // Fallback to any available seal
      return available[Math.floor(Math.random() * available.length)]
    }

    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  /**
   * Create a Fate Seal instance from a definition
   */
  static createFateSealInstance(
    sealDef: Omit<FateSeal, 'instanceId' | 'isUsed'>,
    edition: ConsumableEdition = 'Base'
  ): FateSeal {
    return {
      ...sealDef,
      instanceId: generateConsumableInstanceId(),
      edition,
      sellValue: calculateSellValue(sealDef.cost, edition),
      isUsed: false,
    }
  }
}

// =============================================================================
// CONTEXT INTERFACE
// =============================================================================

/**
 * Context provided when using a Fate Seal
 */
export interface FateSealContext {
  selectedTiles?: Tile[]
  currentGold?: number
  totalDecreeSellValue?: number
  getAvailableSlots?: (type: 'FateSeal' | 'CelestialOrb' | 'VoidScript') => number
  currentHand?: Tile[]
  currentMelds?: unknown[]
}
