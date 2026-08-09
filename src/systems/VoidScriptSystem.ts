/**
 * Void Script System for Tensho Mahjong Roguelike
 *
 * Void Scripts (虚空巻) are the Spectral card equivalent - powerful effects
 * that come with significant downsides or costs.
 *
 * Core Rules:
 * - Each script has a downside (corruption, lost slot, penalty)
 * - Scripts can only be used once per round
 * - Scripts can corrupt Seasons or weaken Decrees temporarily
 *
 * Void Scripts operate at "Heaven" authority but with cosmic balance - every
 * boon comes with a price.
 *
 * See ITEM_LIBRARIES.md for the complete Void Script library.
 */

import { Tile, TileSuit } from '../core/Tile'
import { EditionType, SealType } from '../core/TileModifier'
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
// VOID SCRIPT TYPES
// =============================================================================

/**
 * Effect types that Void Scripts can have
 */
export type VoidScriptEffectType =
  | 'destroy_and_create' // Destroy tiles to create enhanced ones
  | 'apply_seal_to_tile' // Add a seal to a tile
  | 'apply_edition' // Add edition to tile or decree
  | 'create_rare_decree' // Create a rare decree with penalty
  | 'suit_conversion' // Convert all tiles to one suit
  | 'rank_conversion' // Convert all tiles to one rank
  | 'add_negative_edition' // Add negative to decree (+1 slot)
  | 'destroy_for_gold' // Destroy tiles for gold
  | 'copy_decree' // Copy a decree, destroy others
  | 'create_legendary' // Create legendary item (secret)
  | 'upgrade_all_yaku' // Upgrade all yaku (secret)
  | 'duplicate_tile' // Duplicate a tile with downside

/**
 * Penalty types for Void Script downsides
 */
export type VoidScriptPenaltyType =
  | 'lose_tile' // Random tile destroyed
  | 'lose_gold' // Gold set to 0
  | 'lose_hand_size' // -1 permanent hand size
  | 'lock_tile' // Random tile locked in dead pool
  | 'lose_decree_slot' // -1 decree slot next round
  | 'halve_base_score' // Halve base score next hand
  | 'destroy_decrees' // Destroy all other decrees
  | 'none' // No penalty (rare)

/**
 * Void Script effect definition
 */
export interface VoidScriptEffect {
  type: VoidScriptEffectType
  description: string
  // Effect parameters
  destroyCount?: number
  createCount?: number
  createType?: 'face' | 'terminal' | 'number' | 'enhanced'
  sealType?: SealType
  editionType?: EditionType
  goldAmount?: number
  // Target specification
  requiresSelection?: boolean
  selectionCount?: number
}

/**
 * Void Script penalty definition
 */
export interface VoidScriptPenalty {
  type: VoidScriptPenaltyType
  description: string
  value?: number
}

/**
 * Void Script definition
 */
export interface VoidScript extends BaseConsumable {
  type: 'VoidScript'
  effect: VoidScriptEffect
  penalty: VoidScriptPenalty
  mahjongTwist: string // Thematic description
}

// =============================================================================
// VOID SCRIPT DEFINITIONS
// =============================================================================

/**
 * Complete Void Script library from ITEM_LIBRARIES.md
 */
export const VOID_SCRIPTS: Record<
  string,
  Omit<VoidScript, 'instanceId' | 'isUsed'>
> = {
  // ---------------------------------------------------------------------------
  // Tile Manipulation Scripts
  // ---------------------------------------------------------------------------
  script_of_kinship: {
    id: 'script_of_kinship',
    type: 'VoidScript',
    name: 'Script of Kinship',
    japaneseName: '眷属の書',
    description: 'Destroy 1 random tile, add 3 random Enhanced Face tiles (Winds/Dragons)',
    rarity: 'Common',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'destroy_and_create',
      description: 'Create 3 enhanced honor tiles',
      destroyCount: 1,
      createCount: 3,
      createType: 'face',
    },
    penalty: {
      type: 'lose_tile',
      description: 'Lose 1 random tile',
    },
    mahjongTwist: 'The spirits demand sacrifice',
  },

  script_of_the_grave: {
    id: 'script_of_the_grave',
    type: 'VoidScript',
    name: 'Script of the Grave',
    japaneseName: '墓場の書',
    description: 'Destroy 1 random tile, add 2 random Enhanced Terminal tiles',
    rarity: 'Common',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'destroy_and_create',
      description: 'Create 2 enhanced terminal tiles',
      destroyCount: 1,
      createCount: 2,
      createType: 'terminal',
    },
    penalty: {
      type: 'lose_tile',
      description: 'Lose 1 random tile',
    },
    mahjongTwist: 'From the grave, new life',
  },

  script_of_incantation: {
    id: 'script_of_incantation',
    type: 'VoidScript',
    name: 'Script of Incantation',
    japaneseName: '呪文の書',
    description: 'Destroy 1 random tile, add 4 random Enhanced Number tiles',
    rarity: 'Common',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'destroy_and_create',
      description: 'Create 4 enhanced simple tiles',
      destroyCount: 1,
      createCount: 4,
      createType: 'number',
    },
    penalty: {
      type: 'lose_tile',
      description: 'Lose 1 random tile',
    },
    mahjongTwist: 'Words of power reshape reality',
  },

  script_of_immolation: {
    id: 'script_of_immolation',
    type: 'VoidScript',
    name: 'Script of Immolation',
    japaneseName: '焚焼の書',
    description: 'Destroys 5 random tiles from hand. Gain 20 gold.',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'destroy_for_gold',
      description: 'Destroy 5 tiles for 20 gold',
      destroyCount: 5,
      goldAmount: 20,
    },
    penalty: {
      type: 'none',
      description: 'The sacrifice is the price',
    },
    mahjongTwist: 'All returns to ash',
  },

  script_of_the_cryptid: {
    id: 'script_of_the_cryptid',
    type: 'VoidScript',
    name: 'Script of the Cryptid',
    japaneseName: '異形の書',
    description: 'Create 2 copies of 1 selected tile in hand',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'duplicate_tile',
      description: 'Duplicate a tile twice',
      createCount: 2,
      requiresSelection: true,
      selectionCount: 1,
    },
    penalty: {
      type: 'lock_tile',
      description: 'Lock a random tile in Dead Pool',
    },
    mahjongTwist: 'Duplicates lurk in shadows',
  },

  // ---------------------------------------------------------------------------
  // Seal Application Scripts
  // ---------------------------------------------------------------------------
  script_of_the_gold_seal: {
    id: 'script_of_the_gold_seal',
    type: 'VoidScript',
    name: 'Script of the Gold Seal',
    japaneseName: '金印の書',
    description: 'Add Gold Seal to 1 selected tile',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'apply_seal_to_tile',
      description: 'Apply Gold Seal',
      sealType: SealType.Gold,
      requiresSelection: true,
      selectionCount: 1,
    },
    penalty: {
      type: 'none',
      description: 'Rare find',
    },
    mahjongTwist: 'Golden fortune descends',
  },

  script_of_deja_vu: {
    id: 'script_of_deja_vu',
    type: 'VoidScript',
    name: 'Script of Deja Vu',
    japaneseName: '既視感の書',
    description: 'Add Red Seal to 1 selected tile (retrigger)',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'apply_seal_to_tile',
      description: 'Apply Red Seal (retrigger)',
      sealType: SealType.Red,
      requiresSelection: true,
      selectionCount: 1,
    },
    penalty: {
      type: 'none',
      description: 'Time loops',
    },
    mahjongTwist: 'This has happened before',
  },

  script_of_the_trance: {
    id: 'script_of_the_trance',
    type: 'VoidScript',
    name: 'Script of the Trance',
    japaneseName: '恍惚の書',
    description: 'Add Blue Seal to 1 tile (creates Orb for final hand)',
    rarity: 'Rare',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'apply_seal_to_tile',
      description: 'Apply Blue Seal',
      sealType: SealType.Blue,
      requiresSelection: true,
      selectionCount: 1,
    },
    penalty: {
      type: 'none',
      description: 'Cosmic alignment',
    },
    mahjongTwist: 'Stars whisper secrets',
  },

  script_of_the_medium: {
    id: 'script_of_the_medium',
    type: 'VoidScript',
    name: 'Script of the Medium',
    japaneseName: '霊媒の書',
    description: 'Add Purple Seal to 1 tile (creates Seal on discard)',
    rarity: 'Rare',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'apply_seal_to_tile',
      description: 'Apply Purple Seal',
      sealType: SealType.Purple,
      requiresSelection: true,
      selectionCount: 1,
    },
    penalty: {
      type: 'none',
      description: 'Spirits guide',
    },
    mahjongTwist: 'Channel the other side',
  },

  // ---------------------------------------------------------------------------
  // Edition Scripts
  // ---------------------------------------------------------------------------
  script_of_aura: {
    id: 'script_of_aura',
    type: 'VoidScript',
    name: 'Script of Aura',
    japaneseName: '光輪の書',
    description: 'Add Foil/Holo/Prismatic to 1 selected tile',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'apply_edition',
      description: 'Apply random premium edition',
      requiresSelection: true,
      selectionCount: 1,
    },
    penalty: {
      type: 'none',
      description: 'Rare blessing',
    },
    mahjongTwist: 'Light bends around the chosen',
  },

  script_of_ectoplasm: {
    id: 'script_of_ectoplasm',
    type: 'VoidScript',
    name: 'Script of Ectoplasm',
    japaneseName: '霊質の書',
    description: 'Add Negative to a random Decree (+1 Decree slot)',
    rarity: 'Rare',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'add_negative_edition',
      description: 'Add Negative edition to Decree',
    },
    penalty: {
      type: 'lose_hand_size',
      description: '-1 Hand Size permanently',
      value: 1,
    },
    mahjongTwist: 'The void grants power at a price',
  },

  // ---------------------------------------------------------------------------
  // Decree Scripts
  // ---------------------------------------------------------------------------
  script_of_the_wraith: {
    id: 'script_of_the_wraith',
    type: 'VoidScript',
    name: 'Script of the Wraith',
    japaneseName: '亡霊の書',
    description: 'Creates a random Rare Decree',
    rarity: 'Rare',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'create_rare_decree',
      description: 'Create a Rare Decree',
    },
    penalty: {
      type: 'lose_gold',
      description: 'Gold set to 0',
    },
    mahjongTwist: 'Ghosts demand payment',
  },

  script_of_the_ankh: {
    id: 'script_of_the_ankh',
    type: 'VoidScript',
    name: 'Script of the Ankh',
    japaneseName: '命の書',
    description: 'Copy a random Decree, destroy all other Decrees',
    rarity: 'Rare',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'copy_decree',
      description: 'Duplicate one Decree',
    },
    penalty: {
      type: 'destroy_decrees',
      description: 'Destroy all other Decrees',
    },
    mahjongTwist: 'Life eternal through sacrifice',
  },

  script_of_the_hex: {
    id: 'script_of_the_hex',
    type: 'VoidScript',
    name: 'Script of the Hex',
    japaneseName: '呪詛の書',
    description: 'Add Prismatic to random Decree, destroy all others',
    rarity: 'Rare',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'apply_edition',
      description: 'Add Prismatic edition to Decree',
      editionType: EditionType.Polychrome,
    },
    penalty: {
      type: 'destroy_decrees',
      description: 'Destroy all other Decrees',
    },
    mahjongTwist: 'Nuclear option',
  },

  // ---------------------------------------------------------------------------
  // Transformation Scripts
  // ---------------------------------------------------------------------------
  script_of_the_sigil: {
    id: 'script_of_the_sigil',
    type: 'VoidScript',
    name: 'Script of the Sigil',
    japaneseName: '印形の書',
    description: 'Converts ALL tiles in hand to a single random suit',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'suit_conversion',
      description: 'Convert all tiles to one suit',
    },
    penalty: {
      type: 'none',
      description: 'Massive commitment',
    },
    mahjongTwist: 'Unity through transformation',
  },

  script_of_the_ouija: {
    id: 'script_of_the_ouija',
    type: 'VoidScript',
    name: 'Script of the Ouija',
    japaneseName: '降霊の書',
    description: 'Converts ALL tiles in hand to a single random rank',
    rarity: 'Rare',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'rank_conversion',
      description: 'Convert all tiles to one rank',
    },
    penalty: {
      type: 'lose_hand_size',
      description: '-1 Hand Size permanently',
      value: 1,
    },
    mahjongTwist: 'Spirits dictate the numbers',
  },

  // ---------------------------------------------------------------------------
  // Secret/Legendary Scripts (0.3% chance to appear)
  // ---------------------------------------------------------------------------
  script_of_the_soul: {
    id: 'script_of_the_soul',
    type: 'VoidScript',
    name: 'Script of the Soul',
    japaneseName: '魂の書',
    description: 'Creates a Legendary (Heavenly Ordinance) Decree',
    rarity: 'Legendary',
    edition: 'Base',
    cost: 8,
    sellValue: 4,
    effect: {
      type: 'create_legendary',
      description: 'Create a Legendary Decree',
    },
    penalty: {
      type: 'lose_decree_slot',
      description: '-1 Decree slot',
      value: 1,
    },
    mahjongTwist: 'The ultimate sacrifice',
  },

  script_of_the_singularity: {
    id: 'script_of_the_singularity',
    type: 'VoidScript',
    name: 'Script of the Singularity',
    japaneseName: '特異点の書',
    description: 'Upgrade every Yaku by 1 level',
    rarity: 'Legendary',
    edition: 'Base',
    cost: 8,
    sellValue: 4,
    effect: {
      type: 'upgrade_all_yaku',
      description: 'Upgrade all Yaku',
    },
    penalty: {
      type: 'none',
      description: 'Cosmic gift',
    },
    mahjongTwist: 'All things converge',
  },

  // ---------------------------------------------------------------------------
  // Special Mechanic Scripts (from ARCHITECTURE.MD examples)
  // ---------------------------------------------------------------------------
  script_of_eclipse: {
    id: 'script_of_eclipse',
    type: 'VoidScript',
    name: 'Script of Eclipse',
    japaneseName: '蝕の書',
    description: 'Score at 1-shanten this round',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    effect: {
      type: 'destroy_and_create', // Special handling for shanten allowance
      description: 'Allow scoring at 1-shanten',
    },
    penalty: {
      type: 'lose_decree_slot',
      description: 'Lose a Decree slot next round',
      value: 1,
    },
    mahjongTwist: 'Darkness bends the rules',
  },

  script_of_mirrors: {
    id: 'script_of_mirrors',
    type: 'VoidScript',
    name: 'Script of Mirrors',
    japaneseName: '鏡の書',
    description: 'Duplicate one tile in hand',
    rarity: 'Uncommon',
    edition: 'Base',
    cost: 4,
    sellValue: 2,
    effect: {
      type: 'duplicate_tile',
      description: 'Duplicate selected tile',
      createCount: 1,
      requiresSelection: true,
      selectionCount: 1,
    },
    penalty: {
      type: 'lock_tile',
      description: 'Lock a random tile in Dead Pool',
    },
    mahjongTwist: 'Reflections become real',
  },

  script_of_silence: {
    id: 'script_of_silence',
    type: 'VoidScript',
    name: 'Script of Silence',
    japaneseName: '静寂の書',
    description: 'Ignore one invalid meld this hand',
    rarity: 'Rare',
    edition: 'Base',
    cost: 5,
    sellValue: 2,
    effect: {
      type: 'destroy_and_create', // Special handling for meld validation bypass
      description: 'Bypass meld validation once',
    },
    penalty: {
      type: 'halve_base_score',
      description: 'Halve base score this hand',
    },
    mahjongTwist: 'Silence breaks all rules',
  },
}

/**
 * Get all Void Scripts as an array
 */
export function getAllVoidScripts(): Omit<VoidScript, 'instanceId' | 'isUsed'>[] {
  return Object.values(VOID_SCRIPTS)
}

/**
 * Get Void Scripts by rarity
 */
export function getVoidScriptsByRarity(
  rarity: ConsumableRarity
): Omit<VoidScript, 'instanceId' | 'isUsed'>[] {
  return getAllVoidScripts().filter((script) => script.rarity === rarity)
}

// =============================================================================
// VOID SCRIPT SYSTEM CLASS
// =============================================================================

/**
 * Manages Void Script usage, penalties, and effects
 */
export class VoidScriptSystem {
  private decreeSlotsLostNextRound: number = 0
  private handSizePenalty: number = 0
  private allowShantenScoring: boolean = false
  private bypassMeldValidation: boolean = false
  private baseScoreHalved: boolean = false

  /**
   * Use a Void Script
   */
  useScript(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    const effects: ConsumableEffectResult[] = []
    let message = ''
    let success = true

    // Apply the main effect
    switch (script.effect.type) {
      case 'destroy_and_create': {
        const createResult = this.handleDestroyAndCreate(script, context)
        effects.push(...createResult.effects)
        message = createResult.message
        success = createResult.success
        break
      }

      case 'apply_seal_to_tile': {
        const sealResult = this.handleApplySeal(script, context)
        effects.push(...sealResult.effects)
        message = sealResult.message
        success = sealResult.success
        break
      }

      case 'apply_edition': {
        const editionResult = this.handleApplyEdition(script, context)
        effects.push(...editionResult.effects)
        message = editionResult.message
        success = editionResult.success
        break
      }

      case 'create_rare_decree': {
        const decreeResult = this.handleCreateRareDecree(script, context)
        effects.push(...decreeResult.effects)
        message = decreeResult.message
        success = decreeResult.success
        break
      }

      case 'suit_conversion': {
        const suitResult = this.handleSuitConversion(script, context)
        effects.push(...suitResult.effects)
        message = suitResult.message
        success = suitResult.success
        break
      }

      case 'rank_conversion': {
        const rankResult = this.handleRankConversion(script, context)
        effects.push(...rankResult.effects)
        message = rankResult.message
        success = rankResult.success
        break
      }

      case 'add_negative_edition': {
        const negResult = this.handleAddNegativeEdition(script, context)
        effects.push(...negResult.effects)
        message = negResult.message
        success = negResult.success
        break
      }

      case 'destroy_for_gold': {
        const goldResult = this.handleDestroyForGold(script, context)
        effects.push(...goldResult.effects)
        message = goldResult.message
        success = goldResult.success
        break
      }

      case 'copy_decree': {
        const copyResult = this.handleCopyDecree(script, context)
        effects.push(...copyResult.effects)
        message = copyResult.message
        success = copyResult.success
        break
      }

      case 'create_legendary': {
        const legResult = this.handleCreateLegendary(script, context)
        effects.push(...legResult.effects)
        message = legResult.message
        success = legResult.success
        break
      }

      case 'upgrade_all_yaku': {
        const yakuResult = this.handleUpgradeAllYaku(script, context)
        effects.push(...yakuResult.effects)
        message = yakuResult.message
        success = yakuResult.success
        break
      }

      case 'duplicate_tile': {
        const dupResult = this.handleDuplicateTile(script, context)
        effects.push(...dupResult.effects)
        message = dupResult.message
        success = dupResult.success
        break
      }

      default:
        message = 'Unknown script effect'
        success = false
    }

    // Apply the penalty
    if (success && script.penalty.type !== 'none') {
      const penaltyResult = this.applyPenalty(script.penalty, context)
      effects.push(...penaltyResult.effects)
      message += ` ${penaltyResult.message}`
    }

    return { success, message, effects }
  }

  /**
   * Apply a penalty
   */
  private applyPenalty(
    penalty: VoidScriptPenalty,
    _context: VoidScriptContext
  ): { message: string; effects: ConsumableEffectResult[] } {
    const effects: ConsumableEffectResult[] = []
    let message = ''

    switch (penalty.type) {
      case 'lose_tile':
        effects.push({
          type: 'tile_destroyed',
          description: 'Random tile destroyed',
        })
        message = '(Lost 1 tile)'
        break

      case 'lose_gold':
        effects.push({
          type: 'gold_lost',
          description: 'Gold set to 0',
          value: 0,
        })
        message = '(Gold set to 0)'
        break

      case 'lose_hand_size':
        this.handSizePenalty += penalty.value || 1
        effects.push({
          type: 'hand_size_reduced',
          description: `-${penalty.value || 1} Hand Size permanently`,
          value: penalty.value || 1,
        })
        message = `(-${penalty.value || 1} Hand Size)`
        break

      case 'lock_tile':
        effects.push({
          type: 'tile_locked',
          description: 'Random tile locked in Dead Pool',
        })
        message = '(Tile locked in Dead Pool)'
        break

      case 'lose_decree_slot':
        this.decreeSlotsLostNextRound += penalty.value || 1
        effects.push({
          type: 'decree_slot_lost',
          description: `-${penalty.value || 1} Decree slot next round`,
          value: penalty.value || 1,
        })
        message = `(-${penalty.value || 1} Decree slot next round)`
        break

      case 'halve_base_score':
        this.baseScoreHalved = true
        effects.push({
          type: 'score_halved',
          description: 'Base score halved this hand',
        })
        message = '(Base score halved)'
        break

      case 'destroy_decrees':
        effects.push({
          type: 'decrees_destroyed',
          description: 'All other Decrees destroyed',
        })
        message = '(All other Decrees destroyed)'
        break
    }

    return { message, effects }
  }

  /**
   * Handle destroy and create effect
   */
  private handleDestroyAndCreate(
    script: VoidScript,
    _context: VoidScriptContext
  ): ConsumableUseResult {
    const destroyCount = script.effect.destroyCount || 1
    const createCount = script.effect.createCount || 1
    const createType = script.effect.createType || 'enhanced'

    // Special handling for shanten/meld bypass scripts
    if (script.id === 'script_of_eclipse') {
      this.allowShantenScoring = true
      return {
        success: true,
        message: `${script.name}: You may score at 1-shanten this round`,
        effects: [
          {
            type: 'shanten_allowed',
            description: '1-shanten scoring enabled',
          },
        ],
      }
    }

    if (script.id === 'script_of_silence') {
      this.bypassMeldValidation = true
      return {
        success: true,
        message: `${script.name}: One invalid meld will be ignored`,
        effects: [
          {
            type: 'meld_bypass',
            description: 'Meld validation bypassed once',
          },
        ],
      }
    }

    return {
      success: true,
      message: `${script.name}: Destroyed ${destroyCount} tile(s), created ${createCount} ${createType} tile(s)`,
      effects: [
        {
          type: 'tiles_created',
          description: `Created ${createCount} ${createType} tile(s)`,
          value: createCount,
        },
      ],
    }
  }

  /**
   * Handle apply seal effect
   */
  private handleApplySeal(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    const selectedTiles = context.selectedTiles || []
    const sealType = script.effect.sealType

    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tile selected',
        effects: [],
      }
    }

    if (!sealType) {
      return {
        success: false,
        message: 'No seal type specified',
        effects: [],
      }
    }

    return {
      success: true,
      message: `${script.name}: Applied ${sealType} Seal`,
      effects: [
        {
          type: 'seal_applied',
          description: `Applied ${sealType} Seal`,
          value: sealType,
          affectedTiles: [selectedTiles[0].id],
        },
      ],
    }
  }

  /**
   * Handle apply edition effect
   */
  private handleApplyEdition(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    // If specific edition, use it; otherwise random
    const editions: EditionType[] = [EditionType.Foil, EditionType.Holographic, EditionType.Polychrome]
    const edition =
      script.effect.editionType ||
      editions[Math.floor(Math.random() * editions.length)]

    const isDecreeTarget =
      script.id === 'script_of_the_hex' ||
      script.effect.description.includes('Decree')

    if (isDecreeTarget) {
      return {
        success: true,
        message: `${script.name}: Applied ${edition} edition to Decree`,
        effects: [
          {
            type: 'edition_applied_decree',
            description: `Applied ${edition} edition to Decree`,
            value: edition,
          },
        ],
      }
    }

    const selectedTiles = context.selectedTiles || []
    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tile selected',
        effects: [],
      }
    }

    return {
      success: true,
      message: `${script.name}: Applied ${edition} edition to tile`,
      effects: [
        {
          type: 'edition_applied',
          description: `Applied ${edition} edition`,
          value: edition,
          affectedTiles: [selectedTiles[0].id],
        },
      ],
    }
  }

  /**
   * Handle create rare decree effect
   */
  private handleCreateRareDecree(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    const availableSlots = context.getAvailableDecreeSlots?.() || 0

    if (availableSlots === 0) {
      return {
        success: false,
        message: 'No room for Decree',
        effects: [],
      }
    }

    return {
      success: true,
      message: `${script.name}: Created a Rare Decree`,
      effects: [
        {
          type: 'decree_created',
          description: 'Created Rare Decree',
          value: 'ImperialDecree',
        },
      ],
    }
  }

  /**
   * Handle suit conversion effect
   */
  private handleSuitConversion(
    script: VoidScript,
    _context: VoidScriptContext
  ): ConsumableUseResult {
    const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
    const targetSuit = suits[Math.floor(Math.random() * suits.length)]

    return {
      success: true,
      message: `${script.name}: All tiles converted to ${targetSuit}`,
      effects: [
        {
          type: 'suit_conversion',
          description: `All tiles converted to ${targetSuit}`,
          value: targetSuit,
        },
      ],
    }
  }

  /**
   * Handle rank conversion effect
   */
  private handleRankConversion(
    script: VoidScript,
    _context: VoidScriptContext
  ): ConsumableUseResult {
    const targetRank = Math.floor(Math.random() * 9) + 1

    return {
      success: true,
      message: `${script.name}: All tiles converted to rank ${targetRank}`,
      effects: [
        {
          type: 'rank_conversion',
          description: `All tiles converted to rank ${targetRank}`,
          value: targetRank,
        },
      ],
    }
  }

  /**
   * Handle add negative edition effect
   */
  private handleAddNegativeEdition(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    const decreeCount = context.getDecreeCount?.() || 0

    if (decreeCount === 0) {
      return {
        success: false,
        message: 'No Decrees to apply Negative edition',
        effects: [],
      }
    }

    return {
      success: true,
      message: `${script.name}: Added Negative edition to a Decree (+1 Decree slot)`,
      effects: [
        {
          type: 'negative_edition_applied',
          description: 'Negative edition applied (+1 slot)',
        },
      ],
    }
  }

  /**
   * Handle destroy for gold effect
   */
  private handleDestroyForGold(
    script: VoidScript,
    _context: VoidScriptContext
  ): ConsumableUseResult {
    const destroyCount = script.effect.destroyCount || 5
    const goldAmount = script.effect.goldAmount || 20

    return {
      success: true,
      message: `${script.name}: Destroyed ${destroyCount} tiles, gained ${goldAmount} gold`,
      effects: [
        {
          type: 'tiles_destroyed',
          description: `Destroyed ${destroyCount} tiles`,
          value: destroyCount,
        },
        {
          type: 'gold_gained',
          description: `Gained ${goldAmount} gold`,
          value: goldAmount,
        },
      ],
    }
  }

  /**
   * Handle copy decree effect
   */
  private handleCopyDecree(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    const decreeCount = context.getDecreeCount?.() || 0

    if (decreeCount === 0) {
      return {
        success: false,
        message: 'No Decrees to copy',
        effects: [],
      }
    }

    return {
      success: true,
      message: `${script.name}: Copied a random Decree`,
      effects: [
        {
          type: 'decree_copied',
          description: 'Random Decree duplicated',
        },
      ],
    }
  }

  /**
   * Handle create legendary effect
   */
  private handleCreateLegendary(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    const availableSlots = context.getAvailableDecreeSlots?.() || 0

    if (availableSlots === 0) {
      return {
        success: false,
        message: 'No room for Legendary Decree',
        effects: [],
      }
    }

    return {
      success: true,
      message: `${script.name}: Created a Legendary (Heavenly Ordinance) Decree!`,
      effects: [
        {
          type: 'legendary_decree_created',
          description: 'Legendary Decree created',
          value: 'HeavenlyOrdinance',
        },
      ],
    }
  }

  /**
   * Handle upgrade all yaku effect
   */
  private handleUpgradeAllYaku(
    script: VoidScript,
    _context: VoidScriptContext
  ): ConsumableUseResult {
    return {
      success: true,
      message: `${script.name}: All Yaku upgraded by 1 level!`,
      effects: [
        {
          type: 'all_yaku_upgraded',
          description: 'All Yaku levels increased by 1',
        },
      ],
    }
  }

  /**
   * Handle duplicate tile effect
   */
  private handleDuplicateTile(
    script: VoidScript,
    context: VoidScriptContext
  ): ConsumableUseResult {
    const selectedTiles = context.selectedTiles || []
    const createCount = script.effect.createCount || 1

    if (selectedTiles.length === 0) {
      return {
        success: false,
        message: 'No tile selected to duplicate',
        effects: [],
      }
    }

    const tile = selectedTiles[0]

    return {
      success: true,
      message: `${script.name}: Created ${createCount} copy/copies of ${tile.toString()}`,
      effects: [
        {
          type: 'tile_duplicated',
          description: `Duplicated ${tile.toString()} ${createCount} time(s)`,
          value: createCount,
          affectedTiles: [tile.id],
        },
      ],
    }
  }

  // ===========================================================================
  // STATE QUERIES
  // ===========================================================================

  /**
   * Get hand size penalty accumulated from Void Scripts
   */
  getHandSizePenalty(): number {
    return this.handSizePenalty
  }

  /**
   * Get decree slots to lose next round
   */
  getDecreeSlotsLostNextRound(): number {
    return this.decreeSlotsLostNextRound
  }

  /**
   * Check if shanten scoring is allowed this round
   */
  isShantenScoringAllowed(): boolean {
    return this.allowShantenScoring
  }

  /**
   * Check if meld validation bypass is active
   */
  isMeldValidationBypassed(): boolean {
    return this.bypassMeldValidation
  }

  /**
   * Check if base score is halved this hand
   */
  isBaseScoreHalved(): boolean {
    return this.baseScoreHalved
  }

  /**
   * Reset round-scoped effects
   */
  onRoundEnd(): void {
    this.allowShantenScoring = false
    this.bypassMeldValidation = false
    this.baseScoreHalved = false
    // Apply pending decree slot losses
    // (This would be handled by the consumable store/game orchestrator)
    this.decreeSlotsLostNextRound = 0
  }

  /**
   * Reset hand-scoped effects (called after each hand)
   */
  onHandEnd(): void {
    this.baseScoreHalved = false
    this.bypassMeldValidation = false
  }

  /**
   * Get a random Void Script weighted by rarity
   * Common: 50%, Uncommon: 35%, Rare: 15% (Legendary excluded)
   */
  static getRandomVoidScript(
    excludeIds: string[] = []
  ): Omit<VoidScript, 'instanceId' | 'isUsed'> | null {
    const available = getAllVoidScripts().filter(
      (script) => !excludeIds.includes(script.id) && script.rarity !== 'Legendary'
    )

    if (available.length === 0) return null

    const roll = Math.random()
    let targetRarity: ConsumableRarity

    if (roll < 0.5) {
      targetRarity = 'Common'
    } else if (roll < 0.85) {
      targetRarity = 'Uncommon'
    } else {
      targetRarity = 'Rare'
    }

    const candidates = available.filter((script) => script.rarity === targetRarity)

    if (candidates.length === 0) {
      return available[Math.floor(Math.random() * available.length)]
    }

    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  /**
   * Create a Void Script instance from a definition
   */
  static createVoidScriptInstance(
    scriptDef: Omit<VoidScript, 'instanceId' | 'isUsed'>,
    edition: ConsumableEdition = 'Base'
  ): VoidScript {
    return {
      ...scriptDef,
      instanceId: generateConsumableInstanceId(),
      edition,
      sellValue: calculateSellValue(scriptDef.cost, edition),
      isUsed: false,
    }
  }

  /**
   * Serialize the void script system state
   */
  toState(): {
    handSizePenalty: number
    decreeSlotsLostNextRound: number
    allowShantenScoring: boolean
    bypassMeldValidation: boolean
    baseScoreHalved: boolean
  } {
    return {
      handSizePenalty: this.handSizePenalty,
      decreeSlotsLostNextRound: this.decreeSlotsLostNextRound,
      allowShantenScoring: this.allowShantenScoring,
      bypassMeldValidation: this.bypassMeldValidation,
      baseScoreHalved: this.baseScoreHalved,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    handSizePenalty: number
    decreeSlotsLostNextRound: number
    allowShantenScoring: boolean
    bypassMeldValidation: boolean
    baseScoreHalved: boolean
  }): VoidScriptSystem {
    const system = new VoidScriptSystem()
    system.handSizePenalty = state.handSizePenalty
    system.decreeSlotsLostNextRound = state.decreeSlotsLostNextRound
    system.allowShantenScoring = state.allowShantenScoring
    system.bypassMeldValidation = state.bypassMeldValidation
    system.baseScoreHalved = state.baseScoreHalved
    return system
  }
}

// =============================================================================
// CONTEXT INTERFACE
// =============================================================================

/**
 * Context provided when using a Void Script
 */
export interface VoidScriptContext {
  selectedTiles?: Tile[]
  currentGold?: number
  currentHand?: Tile[]
  getAvailableDecreeSlots?: () => number
  getDecreeCount?: () => number
}
