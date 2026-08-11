/**
 * System Type Definitions for Tensho Mahjong Roguelike
 *
 * This file defines the core types for all game systems:
 * - Decrees (rule-modifying effects)
 * - Flowers (persistent run-wide modifiers)
 * - Seasons (round-scoped temporary modifiers)
 * - Shop items and offers
 * - Round and Act management
 */

import { Tile } from '../core/Tile'
import { Meld } from '../core/Meld'
import { ParsedHand } from '../core/Hand'

// =============================================================================
// DECREE SYSTEM TYPES
// =============================================================================

/**
 * Categories of decrees based on their effect type
 */
export type DecreeCategory =
  | 'Structural' // Alter what constitutes a legal hand
  | 'TileIdentity' // Alter what tiles represent
  | 'YakuDoctrine' // Alter yaku definition or hierarchy
  | 'Entropy' // Alter probability flow and tempo
  | 'Scaling' // Reward commitment and repetition

/**
 * Rarity tiers for decrees
 */
export type DecreeRarity =
  | 'LocalEdict' // Common - Small bonuses
  | 'RegionalMandate' // Uncommon - Moderate effects
  | 'ImperialDecree' // Rare - Strong rule-bending
  | 'HeavenlyOrdinance' // Mythic - Run-defining

/**
 * Effect trigger timing
 */
export type EffectTrigger =
  | 'OnDraw' // When a tile is drawn from the wall
  | 'OnDiscard' // When a tile is discarded to the river
  | 'OnScored' // For each tile in the winning hand
  | 'OnHeld' // For tiles remaining in hand (not scored)
  | 'Independent' // After all tiles scored, based on hand state
  | 'OnRoundStart' // When a round begins
  | 'OnRoundEnd' // After scoring is complete
  | 'Passive' // Always active, no specific trigger

/**
 * Base effect interface for all effect types
 */
export interface BaseEffect {
  trigger: EffectTrigger
  description: string
}

/**
 * A run quantity a Decree effect can scale with, so "+10 Mult per Flower"
 * grows as the collection does instead of paying a flat bonus.
 */
export type ScalingSource =
  | 'flower_count' // Flowers collected this run
  | 'season_count' // Seasons active this round

/**
 * Additive score bonus effect
 */
export interface AdditiveScoreEffect extends BaseEffect {
  type: 'additive_score'
  basePoints?: number // Added to base points
  multiplier?: number // Added to multiplier
  /** When set, the bonus is paid once per unit of this quantity. */
  scaleBy?: ScalingSource
}

/**
 * Multiplicative score effect
 */
export interface MultiplicativeScoreEffect extends BaseEffect {
  type: 'multiplicative_score'
  multiplier: number // Multiplied with total
  perTileCondition?: 'dominant_suit'
  /** When set, the multiplier compounds once per unit of this quantity. */
  scaleBy?: ScalingSource
}

/**
 * Gold generation effect
 */
export interface GoldEffect extends BaseEffect {
  type: 'gold'
  amount: number
  perTile?: boolean // If true, amount is per tile
  condition?: string // Optional condition description
}

/**
 * Draw modification effect
 */
export interface DrawEffect extends BaseEffect {
  type: 'draw'
  additionalDraws: number
}

/**
 * Rule modification effect
 */
export interface RuleModificationEffect extends BaseEffect {
  type: 'rule_modification'
  ruleId: string // Identifier for the rule being modified
  modification: Record<string, unknown>
}

/**
 * Which scoring tiles a retrigger effect repeats.
 */
export type RetriggerTarget =
  | 'all' // Every scoring tile
  | 'first' // The first tile in the played selection
  | 'last' // The last tile in the played selection
  | 'dragon'
  | 'wind'
  | 'honor' // Winds and dragons
  | 'terminal' // 1s and 9s

/**
 * Repeat scoring for matching tiles. A retriggered tile contributes its base
 * points and its modifier bonuses again, once per extra trigger.
 */
export interface RetriggerEffect extends BaseEffect {
  type: 'retrigger'
  target: RetriggerTarget
  times: number
}

/**
 * Copy another owned Decree's effect. Resolved against the Decree order held
 * by the player, so the copy follows whatever it is pointed at.
 */
export interface CopyDecreeEffect extends BaseEffect {
  type: 'copy_decree'
  source: 'right' | 'left' | 'random' | 'all'
}

/**
 * Amplify detected yaku, either by scaling every yaku multiplier or by scoring
 * each yaku as though it sat a number of tiers higher.
 */
export interface YakuModifierEffect extends BaseEffect {
  type: 'yaku_modifier'
  multiplier?: number
  tierBonus?: number
}

/**
 * Scaling effect that grows over time
 */
export interface ScalingEffect extends BaseEffect {
  type: 'scaling'
  baseValue: number
  scalingFactor: number
  scalingCondition: string
  maxValue?: number
}

/**
 * Conditional effect with requirements
 */
export interface ConditionalEffect extends BaseEffect {
  type: 'conditional'
  condition: DecreeCondition
  effect: DecreeEffect
}

/**
 * Condition for conditional effects
 */
export interface DecreeCondition {
  type:
    | 'tile_count'
    | 'meld_type'
    | 'suit'
    | 'yaku'
    | 'hand_state'
    | 'round_state'
  target: string
  operator: 'gte' | 'lte' | 'eq' | 'contains' | 'not_contains'
  value: number | string | boolean
}

/**
 * Union type for all decree effects
 */
export type DecreeEffect =
  | AdditiveScoreEffect
  | MultiplicativeScoreEffect
  | GoldEffect
  | DrawEffect
  | RuleModificationEffect
  | ScalingEffect
  | ConditionalEffect
  | RetriggerEffect
  | CopyDecreeEffect
  | YakuModifierEffect

/**
 * Sticker types that can be applied to decrees at higher stakes
 */
export type StickerType = 'Eternal' | 'Perishable' | 'Rental'

export type DecreeEdition = 'Foil' | 'Holographic' | 'Polychrome' | 'Negative'

/**
 * Sticker data attached to a decree
 */
export interface Sticker {
  type: StickerType
  roundsRemaining?: number // For Perishable
  goldPerRound?: number // For Rental
}

/**
 * Full decree definition
 */
export interface Decree {
  id: string
  name: string
  description: string
  category: DecreeCategory
  rarity: DecreeRarity
  effect: DecreeEffect
  /**
   * Additional effects for Decrees that do more than one thing (e.g. "+150
   * Chips, -2 Hand Size"). Applied alongside `effect` everywhere effects are
   * read, so a multi-part Decree is never partially honoured.
   */
  extraEffects?: DecreeEffect[]
  flowerRequirement?: number // Number of flowers needed to activate
  cost: number // Base purchase cost in gold
  sellValue?: number // Value when sold (default: cost / 2)
  sticker?: Sticker
  edition?: DecreeEdition
  isDebuffed?: boolean // If true, effect is disabled
}

/**
 * Runtime state for an owned decree
 */
export interface OwnedDecree extends Decree {
  acquiredRound: number
  roundsActive: number
  scalingValue?: number // Current value for scaling effects
}

// =============================================================================
// FLOWER SYSTEM TYPES
// =============================================================================

/**
 * Types of flowers available
 */
export type FlowerVariant = 'Plum' | 'Orchid' | 'Chrysanthemum' | 'Bamboo'

/**
 * Effect provided by a flower
 */
export interface FlowerEffect {
  type: 'percentage_bonus'
  target: 'sequence' | 'honor' | 'concealed_meld' | 'terminal'
  percentagePerMatch: number // e.g., 5 for +5% per matching element
}

/**
 * Mutation effect for advanced flowers
 */
export interface FlowerMutation {
  type: 'mutation'
  mutationId: string
  description: string
  isUnlocked: boolean
}

/**
 * Flower tile definition
 */
export interface FlowerTile {
  id: string
  type: FlowerVariant
  effect: FlowerEffect
  mutation?: FlowerMutation
}

/**
 * Set bonus for collecting multiple flowers
 */
export interface FlowerSetBonus {
  requiredCount: number
  effect: {
    type: 'decree_slot' | 'unlock_decrees' | 'double_effectiveness'
    value?: number
    description: string
  }
}

/**
 * Runtime flower collection state
 */
export interface FlowerCollection {
  flowers: FlowerTile[]
  activeBonuses: FlowerSetBonus[]
  totalEffectiveness: number // Multiplier for flower effects (1.0 = normal, 2.0 = doubled)
}

// =============================================================================
// SEASON SYSTEM TYPES
// =============================================================================

/**
 * Types of seasons available
 */
export type SeasonVariant = 'Spring' | 'Summer' | 'Autumn' | 'Winter'

/**
 * Types of corrupted seasons
 */
export type CorruptedSeasonVariant = 'Drought' | 'Monsoon' | 'Frostbite' | 'Decay'

/**
 * Base season effect
 */
export interface SeasonEffect {
  type: 'draw_bonus' | 'score_modifier' | 'wall_modifier' | 'yaku_modifier' | 'legality_modifier'
  value: number
  description: string
}

/**
 * Corrupted season negative effect
 */
export interface CorruptedSeasonEffect {
  type: 'suppress_flowers' | 'randomize_draws' | 'halve_decrees' | 'discard_penalty'
  severity: number
  description: string
}

/**
 * Season tile definition
 */
export interface SeasonTile {
  id: string
  type: SeasonVariant
  effect: SeasonEffect
  isCorrupted: boolean
  corruptedEffect?: CorruptedSeasonEffect
  corruptedType?: CorruptedSeasonVariant
}

/**
 * Runtime season state for a round
 */
export interface SeasonState {
  activeSeason: SeasonTile | null
  seasonStack: SeasonTile[] // Multiple seasons can stack
  isCorruptedRound: boolean
  effectMultiplier: number
}

// =============================================================================
// SHOP SYSTEM TYPES
// =============================================================================

/**
 * Types of items available in the shop
 */
export type ShopItemType =
  | 'Decree'
  | 'FateSeal'
  | 'CelestialOrb'
  | 'VoidScript'
  | 'Tile'
  | 'BlessingPack'
  | 'ImperialCharter'

/**
 * Pack sizes for blessing packs
 */
export type PackSize = 'Normal' | 'Jumbo' | 'Mega'

/**
 * Pack types available
 */
export type PackType = 'Arcana' | 'Celestial' | 'Tile' | 'Decree' | 'Void'

/**
 * Blessing pack definition
 */
export interface BlessingPack {
  id: string
  type: PackType
  size: PackSize
  cost: number
  choiceCount: number // How many options to show
  selectCount: number // How many can be selected
}

/**
 * Shop item with pricing
 */
export interface ShopItem {
  id: string
  type: ShopItemType
  item: Decree | BlessingPack | unknown // The actual item data
  baseCost: number
  discountedCost: number
  isPurchased: boolean
}

/**
 * Imperial Charter (voucher) definition
 */
export interface ImperialCharter {
  id: string
  name: string
  description: string
  cost: number
  effect: {
    type: string
    value: number | string | boolean
  }
  upgradeId?: string // ID of the upgraded version
  isUpgraded: boolean
}

/**
 * Shop state
 */
export interface ShopState {
  itemSlots: ShopItem[]
  blessingPacks: ShopItem[]
  charter: ShopItem | null
  rerollCost: number
  rerollCount: number
  discountPercentage: number
}

// =============================================================================
// ROUND SYSTEM TYPES
// =============================================================================

/**
 * Types of rounds within an act
 */
export type RoundType = 'Small' | 'Large' | 'Boss'

/**
 * Score multipliers for round types
 */
export const ROUND_MULTIPLIERS: Record<RoundType, number> = {
  Small: 1.0,
  Large: 1.5,
  Boss: 2.0,
}

/**
 * Boss mandate that adds restrictions
 */
export interface BossMandate {
  id: string
  name: string
  japaneseName: string
  description: string
  effect: {
    type: string
    value?: number | string
    target?: string
  }
  minAct: number // Minimum act where this mandate can appear
}

/**
 * Round state
 */
export interface RoundState {
  actNumber: number
  roundNumber: number
  roundType: RoundType
  scoreTarget: number
  currentScore: number
  handsPlayed: number
  maxHands: number
  discardsRemaining: number
  maxDiscards: number
  bossMandate?: BossMandate
  isCompleted: boolean
  isWon: boolean
}

/**
 * Act state containing multiple rounds
 */
export interface ActState {
  actNumber: number
  rounds: RoundState[]
  currentRoundIndex: number
  isCompleted: boolean
  baseScoreTarget: number
}

/**
 * Score requirements by act
 */
export interface ScoreRequirements {
  act1: number[]
  act2: number[]
  act3: number[]
  act4: number[]
  act5: number[]
  act6: number[]
  act7: number[]
  act8: number[]
}

// =============================================================================
// SCORING CONTEXT
// =============================================================================

/**
 * Full context for score calculation
 */
export interface ScoringContext {
  hand: ParsedHand
  tiles: Tile[]
  melds: Meld[]
  decrees: OwnedDecree[]
  flowers: FlowerCollection
  season: SeasonState
  round: RoundState
  yakuMultipliers: Map<string, number>
  isConcealed: boolean
  winningTile: Tile
}

/**
 * Score breakdown for display
 */
export interface ScoreBreakdown {
  basePoints: number
  tilePoints: number
  structurePoints: number
  additiveBonus: number
  yakuMultiplier: number
  decreeMultiplier: number
  flowerMultiplier: number
  seasonMultiplier: number
  finalScore: number
  bonusGold: number
}

// =============================================================================
// GAME STATE
// =============================================================================

/**
 * Full run state
 */
export interface RunState {
  sessionId: string
  seed: number
  currentAct: ActState
  ownedDecrees: OwnedDecree[]
  flowers: FlowerCollection
  gold: number
  maxDecreeSlots: number
  handsPerRound: number
  discardsPerRound: number
  handSize: number
  interestCap: number
  shopDiscountPercentage: number
  purchasedCharters: ImperialCharter[]
  roundsPlayed: number
  totalScore: number
  isRunActive: boolean
}
