/**
 * Decree System for Tensho Mahjong Roguelike
 *
 * Decrees are rule-modifying effects that persist across rounds within a run.
 * They represent authority-based rule modifications, not random effects.
 *
 * Hierarchy: Heaven (Seasons) > Court (Decrees) > Nature (Flowers) > Table (Tiles) > Grammar (Yaku)
 */

import {
  CopyDecreeEffect,
  Decree,
  DecreeEffect,
  DecreeRarity,
  OwnedDecree,
  RetriggerTarget,
  ScalingSource,
  ScoringContext,
  ScoreBreakdown,
  Sticker,
} from './types'
import { Tile, TileSuit } from '../core/Tile'
import { LIBRARY_DECREES } from '../config/decreeLibrary'

/**
 * Every effect a Decree carries: its primary effect plus any extras from
 * multi-part authored Decrees. Effect readers iterate this so a Decree that
 * does two things is never honoured for only one of them.
 */
function allEffectsOf(decree: Decree): DecreeEffect[] {
  return decree.extraEffects ? [decree.effect, ...decree.extraEffects] : [decree.effect]
}

/**
 * How many units of a scaling source the run currently holds.
 *
 * Seasons count the whole stack, falling back to the active Season, so a
 * "per Season" Decree pays for every Season in play rather than only the
 * topmost one.
 */
function countScalingSource(source: ScalingSource, context: ScoringContext): number {
  switch (source) {
    case 'flower_count':
      return context.flowers.flowers.length
    case 'season_count':
      return Math.max(
        context.season.seasonStack.length,
        context.season.activeSeason ? 1 : 0
      )
    default:
      return 0
  }
}

/** The played tiles a retrigger effect applies to. */
function matchRetriggerTargets(tiles: Tile[], target: RetriggerTarget): Tile[] {
  switch (target) {
    case 'all':
      return tiles
    case 'first':
      return tiles.slice(0, 1)
    case 'last':
      return tiles.slice(-1)
    case 'dragon':
      return tiles.filter((tile) => tile.suit === TileSuit.Dragon)
    case 'wind':
      return tiles.filter((tile) => tile.suit === TileSuit.Wind)
    case 'honor':
      return tiles.filter((tile) => tile.isHonor)
    case 'terminal':
      return tiles.filter((tile) => tile.isTerminal)
    default:
      return []
  }
}

// =============================================================================
// STARTER DECREES
// =============================================================================

/**
 * River Tax (Common) - Gain 1 Gold per tile discarded
 */
export const RIVER_TAX: Decree = {
  id: 'river_tax',
  name: 'River Tax',
  description: 'Gain 1 Gold per tile discarded this round.',
  category: 'Entropy',
  rarity: 'LocalEdict',
  cost: 4,
  effect: {
    type: 'gold',
    trigger: 'OnDiscard',
    description: '+1 Gold per discard',
    amount: 1,
    perTile: true,
  },
}

/**
 * Extended Hand Grant (Common) - +3 draws before failure
 */
export const EXTENDED_HAND_GRANT: Decree = {
  id: 'extended_hand_grant',
  name: 'Extended Hand Grant',
  description: '+3 additional draws before round failure.',
  category: 'Entropy',
  rarity: 'LocalEdict',
  cost: 5,
  effect: {
    type: 'draw',
    trigger: 'Passive',
    description: '+3 draws per round',
    additionalDraws: 3,
  },
}

/**
 * Tanyao Dispensation (Uncommon) - Terminals allowed in Tanyao
 */
export const TANYAO_DISPENSATION: Decree = {
  id: 'tanyao_dispensation',
  name: 'Tanyao Dispensation',
  description: 'Terminal tiles (1s and 9s) are allowed in Tanyao hands.',
  category: 'YakuDoctrine',
  rarity: 'RegionalMandate',
  cost: 6,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Terminals allowed in Tanyao',
    ruleId: 'tanyao_terminals',
    modification: { allowTerminals: true },
  },
}

/**
 * Moonlit Seal (Uncommon) - Honor tiles add stacking multiplier
 */
export const MOONLIT_SEAL: Decree = {
  id: 'moonlit_seal',
  name: 'Moonlit Seal',
  description: 'Each Honor tile in your winning hand adds +0.1x to multiplier.',
  category: 'Scaling',
  rarity: 'RegionalMandate',
  cost: 6,
  effect: {
    type: 'scaling',
    trigger: 'OnScored',
    description: '+0.1x Mult per Honor tile',
    baseValue: 0,
    scalingFactor: 0.1,
    scalingCondition: 'honor_tile_count',
    maxValue: 2.0,
  },
}

/**
 * Pure Suit Asceticism (Rare) - Dominant suit tiles scale multiplicatively
 */
export const PURE_SUIT_ASCETICISM: Decree = {
  id: 'pure_suit_asceticism',
  name: 'Pure Suit Asceticism',
  description: 'Tiles of your dominant suit gain +10% score each. Stacks multiplicatively.',
  category: 'Scaling',
  rarity: 'ImperialDecree',
  cost: 8,
  effect: {
    type: 'multiplicative_score',
    trigger: 'OnScored',
    description: 'x1.1 per dominant suit tile',
    multiplier: 1.1,
    perTileCondition: 'dominant_suit',
  },
}

/**
 * Collection of all starter decrees
 */
export const STARTER_DECREES: Decree[] = [
  RIVER_TAX,
  EXTENDED_HAND_GRANT,
  TANYAO_DISPENSATION,
  MOONLIT_SEAL,
  PURE_SUIT_ASCETICISM,
]

// =============================================================================
// ADDITIONAL DECREES (from ARCHITECTURE.MD)
// =============================================================================

export const BROKEN_STAIR_EDICT: Decree = {
  id: 'broken_stair_edict',
  name: 'Broken Stair Edict',
  description: 'Sequences may skip one rank (e.g., 1-3-4 is valid).',
  category: 'Structural',
  rarity: 'RegionalMandate',
  cost: 7,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Sequences may skip one rank',
    ruleId: 'sequence_skip',
    modification: { allowSkip: true, skipAmount: 1 },
  },
}

export const FALSE_EYE_MANDATE: Decree = {
  id: 'false_eye_mandate',
  name: 'False Eye Mandate',
  description: 'One meld may serve as the pair for hand validation.',
  category: 'Structural',
  rarity: 'ImperialDecree',
  cost: 8,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Meld can act as pair',
    ruleId: 'meld_as_pair',
    modification: { allowMeldAsPair: true },
  },
}

export const HONOR_TRANSMUTATION: Decree = {
  id: 'honor_transmutation',
  name: 'Honor Transmutation',
  description: 'Honor tiles may count as suited tiles of your most common suit.',
  category: 'TileIdentity',
  rarity: 'ImperialDecree',
  cost: 9,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Honors count as suited tiles',
    ruleId: 'honor_as_suited',
    modification: { honorAsSuited: true },
  },
}

export const CELESTIAL_WILDCARD: Decree = {
  id: 'celestial_wildcard',
  name: 'Celestial Wildcard',
  description: 'One tile per hand may impersonate any other tile.',
  category: 'TileIdentity',
  rarity: 'HeavenlyOrdinance',
  cost: 12,
  flowerRequirement: 2,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'One wild tile per hand',
    ruleId: 'wildcard_tile',
    modification: { wildcardCount: 1 },
  },
}

export const DEAD_WALL_WRIT: Decree = {
  id: 'dead_wall_writ',
  name: 'Dead Wall Writ',
  description: 'Once per round, draw from the discard pool instead of the wall.',
  category: 'Entropy',
  rarity: 'RegionalMandate',
  cost: 6,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Draw from discards once per round',
    ruleId: 'dead_wall_draw',
    modification: { deadWallDraws: 1 },
  },
}

export const SHANTEN_CLEMENCY: Decree = {
  id: 'shanten_clemency',
  name: 'Shanten Clemency',
  description: 'Hands may score at 1-shanten with a 50% score penalty.',
  category: 'Entropy',
  rarity: 'ImperialDecree',
  cost: 9,
  effect: {
    type: 'rule_modification',
    trigger: 'Passive',
    description: 'Score at 1-shanten (-50%)',
    ruleId: 'shanten_clemency',
    modification: { allowedShanten: 1, penalty: 0.5 },
  },
}

export const CLOSED_HAND_AUSTERITY: Decree = {
  id: 'closed_hand_austerity',
  name: 'Closed-Hand Austerity',
  description: 'Fully concealed hands gain x1.5 score multiplier.',
  category: 'Scaling',
  rarity: 'ImperialDecree',
  cost: 8,
  effect: {
    type: 'conditional',
    trigger: 'Independent',
    description: 'x1.5 for concealed hands',
    condition: {
      type: 'hand_state',
      target: 'isConcealed',
      operator: 'eq',
      value: true,
    },
    effect: {
      type: 'multiplicative_score',
      trigger: 'Independent',
      description: 'x1.5 Mult for concealed',
      multiplier: 1.5,
    },
  },
}

export const TERMINAL_DEVOTION: Decree = {
  id: 'terminal_devotion',
  name: 'Terminal Devotion',
  description: 'Each terminal tile in your hand adds +5% to final score.',
  category: 'Scaling',
  rarity: 'RegionalMandate',
  cost: 5,
  effect: {
    type: 'scaling',
    trigger: 'OnScored',
    description: '+5% per terminal',
    baseValue: 0,
    scalingFactor: 0.05,
    scalingCondition: 'terminal_count',
  },
}

export const YAKU_REPETITION_CHARTER: Decree = {
  id: 'yaku_repetition_charter',
  name: 'Yaku Repetition Charter',
  description: 'Scoring the same yaku type in consecutive rounds compounds multipliers.',
  category: 'Scaling',
  rarity: 'ImperialDecree',
  cost: 9,
  effect: {
    type: 'scaling',
    trigger: 'OnRoundEnd',
    description: 'Repeated yaku compounds',
    baseValue: 0,
    scalingFactor: 0.2,
    scalingCondition: 'repeated_yaku',
    maxValue: 3.0,
  },
}

/**
 * All available decrees in the game
 */
/** The hand-written rule-bending Decrees, which drive engine rule changes. */
export const RULE_DECREES: Decree[] = [
  ...STARTER_DECREES,
  BROKEN_STAIR_EDICT,
  FALSE_EYE_MANDATE,
  HONOR_TRANSMUTATION,
  CELESTIAL_WILDCARD,
  DEAD_WALL_WRIT,
  SHANTEN_CLEMENCY,
  CLOSED_HAND_AUSTERITY,
  TERMINAL_DEVOTION,
  YAKU_REPETITION_CHARTER,
]

/**
 * The full pool the shop and reward systems draw from: the rule-bending
 * Decrees above plus every authored Decree the engine can run. Ids are unique,
 * with the hand-written definition winning any collision.
 */
export const ALL_DECREES: Decree[] = [
  ...RULE_DECREES,
  ...LIBRARY_DECREES.filter(
    (decree) => !RULE_DECREES.some((existing) => existing.id === decree.id)
  ),
]

// =============================================================================
// DECREE SYSTEM CLASS
// =============================================================================

/**
 * Manages decree acquisition, effects, and interactions
 */
export class DecreeSystem {
  private ownedDecrees: OwnedDecree[] = []
  private maxSlots: number = 5
  private currentRound: number = 0

  constructor(initialSlots: number = 5) {
    this.maxSlots = initialSlots
  }

  /**
   * Get all owned decrees
   */
  getOwnedDecrees(): OwnedDecree[] {
    return [...this.ownedDecrees]
  }

  /**
   * Get the number of available decree slots
   */
  getAvailableSlots(): number {
    return this.maxSlots - this.ownedDecrees.length
  }

  getMaxSlots(): number {
    return this.maxSlots
  }

  /**
   * Add a decree slot
   */
  addSlot(): void {
    this.maxSlots++
  }

  /** Remove temporary capacity without deleting already-owned Decrees. */
  removeSlots(count: number = 1): void {
    this.maxSlots = Math.max(0, this.maxSlots - Math.max(0, count))
  }

  /**
   * Check if a decree can be acquired
   */
  canAcquireDecree(decree: Decree, flowerCount: number = 0): boolean {
    const effectiveSlots = this.maxSlots + (decree.edition === 'Negative' ? 1 : 0)
    if (this.ownedDecrees.length >= effectiveSlots) {
      return false
    }
    if (decree.flowerRequirement && flowerCount < decree.flowerRequirement) {
      return false
    }
    return true
  }

  /**
   * Acquire a new decree
   */
  acquireDecree(decree: Decree, sticker?: Sticker): OwnedDecree | null {
    const effectiveSlots = this.maxSlots + (decree.edition === 'Negative' ? 1 : 0)
    if (this.ownedDecrees.length >= effectiveSlots) {
      return null
    }

    if (decree.edition === 'Negative') this.maxSlots++

    const ownedDecree: OwnedDecree = {
      ...decree,
      acquiredRound: this.currentRound,
      roundsActive: 0,
      sticker: sticker ?? decree.sticker,
      scalingValue: decree.effect.type === 'scaling' ? 0 : undefined,
    }

    this.ownedDecrees.push(ownedDecree)
    return ownedDecree
  }

  /**
   * Sell a decree for gold
   */
  sellDecree(decreeId: string): number {
    const index = this.ownedDecrees.findIndex((d) => d.id === decreeId)
    if (index === -1) {
      return 0
    }

    const decree = this.ownedDecrees[index]

    // Eternal decrees cannot be sold
    if (decree.sticker?.type === 'Eternal') {
      return 0
    }

    const sellValue = decree.sellValue ?? Math.floor(decree.cost / 2)
    this.ownedDecrees.splice(index, 1)
    if (decree.edition === 'Negative') this.removeSlots()
    return sellValue
  }

  /**
   * Remove a decree without selling
   */
  removeDecree(decreeId: string): boolean {
    const index = this.ownedDecrees.findIndex((d) => d.id === decreeId)
    if (index === -1) {
      return false
    }

    const decree = this.ownedDecrees[index]
    if (decree.sticker?.type === 'Eternal') {
      return false
    }

    this.ownedDecrees.splice(index, 1)
    if (decree.edition === 'Negative') this.removeSlots()
    return true
  }

  /** Apply or replace a Decree edition while keeping Negative capacity balanced. */
  applyEdition(decreeId: string, edition: Decree['edition']): boolean {
    const decree = this.ownedDecrees.find((candidate) => candidate.id === decreeId)
    if (!decree || !edition) return false

    if (decree.edition === 'Negative' && edition !== 'Negative') {
      this.removeSlots()
    } else if (decree.edition !== 'Negative' && edition === 'Negative') {
      this.addSlot()
    }
    decree.edition = edition
    return true
  }

  /**
   * Update decree states at the start of a round
   */
  onRoundStart(): void {
    this.currentRound++

    for (const decree of this.ownedDecrees) {
      decree.roundsActive++

      // Handle Perishable sticker
      if (decree.sticker?.type === 'Perishable') {
        if (decree.sticker.roundsRemaining !== undefined) {
          decree.sticker.roundsRemaining--
          if (decree.sticker.roundsRemaining <= 0) {
            decree.isDebuffed = true
          }
        }
      }
    }
  }

  /**
   * Calculate rental costs at end of round
   */
  calculateRentalCosts(): number {
    let totalCost = 0
    for (const decree of this.ownedDecrees) {
      if (decree.sticker?.type === 'Rental') {
        totalCost += decree.sticker.goldPerRound ?? 3
      }
    }
    return totalCost
  }

  /** Gold generated by active Decrees when tiles are discarded. */
  calculateDiscardGold(discardCount: number = 1): number {
    return this.getActiveDecrees().reduce((total, decree) => {
      for (const effect of allEffectsOf(decree)) {
        if (effect.type !== 'gold' || effect.trigger !== 'OnDiscard') continue
        total += effect.amount * (effect.perTile ? discardCount : 1)
      }
      return total
    }, 0)
  }

  /** Gold generated by active Decrees at the end of a completed round. */
  calculateRoundEndGold(): number {
    return this.getActiveDecrees().reduce((total, decree) => {
      for (const effect of allEffectsOf(decree)) {
        if (effect.type !== 'gold' || effect.trigger !== 'OnRoundEnd') continue
        total += effect.amount
      }
      return total
    }, 0)
  }

  /**
   * Get all active (non-debuffed) decrees
   */
  getActiveDecrees(): OwnedDecree[] {
    return this.ownedDecrees.filter((d) => !d.isDebuffed)
  }

  /**
   * Get decrees by trigger type
   */
  getDecreesByTrigger(trigger: string): OwnedDecree[] {
    return this.getActiveDecrees().filter((d) => d.effect.trigger === trigger)
  }

  /**
   * The effects a Decree contributes this scoring pass, with `copy_decree`
   * replaced by whatever it points at.
   *
   * Copies resolve one level deep: a copier that targets another copier gains
   * nothing from it. That keeps two copiers pointed at each other from looping
   * forever, and matches how the effect reads - it copies a Decree's effect,
   * not its copying.
   */
  private resolveEffects(
    decree: OwnedDecree,
    ownedInOrder: OwnedDecree[]
  ): DecreeEffect[] {
    const resolved: DecreeEffect[] = []

    for (const effect of allEffectsOf(decree)) {
      if (effect.type !== 'copy_decree') {
        resolved.push(effect)
        continue
      }

      for (const target of this.copyTargets(decree, effect.source, ownedInOrder)) {
        resolved.push(
          ...allEffectsOf(target).filter((inner) => inner.type !== 'copy_decree')
        )
      }
    }

    return resolved
  }

  /** The Decrees a copy effect draws from, in owned order. */
  private copyTargets(
    decree: OwnedDecree,
    source: CopyDecreeEffect['source'],
    ownedInOrder: OwnedDecree[]
  ): OwnedDecree[] {
    const others = ownedInOrder.filter((candidate) => candidate.id !== decree.id)
    if (others.length === 0) return []

    switch (source) {
      case 'all':
        return others
      case 'left':
        return [others[0]]
      case 'right': {
        const index = ownedInOrder.findIndex((c) => c.id === decree.id)
        const neighbour = ownedInOrder[index + 1]
        return neighbour ? [neighbour] : []
      }
      case 'random': {
        // Seeded by the copier's position so a hand scores the same twice -
        // the preview must not disagree with the play it is previewing.
        const index = Math.max(0, ownedInOrder.findIndex((c) => c.id === decree.id))
        return [others[index % others.length]]
      }
      default:
        return []
    }
  }

  /**
   * How many extra times each played tile should score, from Decree retriggers.
   *
   * Returns tile id to extra trigger count; a tile absent from the map scores
   * once as usual.
   */
  calculateRetriggers(tiles: Tile[]): Map<string, number> {
    const extra = new Map<string, number>()
    if (tiles.length === 0) return extra

    const active = this.getActiveDecrees()
    const amplifier = this.getRetriggerAmplifier()

    for (const decree of active) {
      for (const effect of this.resolveEffects(decree, active)) {
        if (effect.type !== 'retrigger') continue

        const times = effect.times * amplifier
        for (const tile of matchRetriggerTargets(tiles, effect.target)) {
          extra.set(tile.id, (extra.get(tile.id) ?? 0) + times)
        }
      }
    }

    return extra
  }

  /** Multiplier applied to every retrigger count (Echo Dimension). */
  private getRetriggerAmplifier(): number {
    let factor = 1

    for (const decree of this.getActiveDecrees()) {
      for (const effect of allEffectsOf(decree)) {
        if (effect.type !== 'rule_modification') continue
        if (effect.ruleId !== 'retrigger_amplifier') continue
        const value = effect.modification.factor
        if (typeof value === 'number' && value > 0) factor *= value
      }
    }

    return factor
  }

  /**
   * Yaku amplification from Decrees: a multiplier applied to the combined yaku
   * multiplier, and a tier bonus that scores each yaku as if it ranked higher.
   */
  getYakuModifiers(): { multiplier: number; tierBonus: number } {
    let multiplier = 1
    let tierBonus = 0

    const active = this.getActiveDecrees()
    for (const decree of active) {
      for (const effect of this.resolveEffects(decree, active)) {
        if (effect.type !== 'yaku_modifier') continue
        if (effect.multiplier) multiplier *= effect.multiplier
        if (effect.tierBonus) tierBonus += effect.tierBonus
      }
    }

    return { multiplier, tierBonus }
  }

  /** Whether any active Decree turns on the named rule. */
  hasActiveRule(ruleId: string): boolean {
    return this.hasRuleModification(ruleId)
  }

  /** Gold multiplier from Decrees (Philosopher's Stone). */
  getGoldMultiplier(): number {
    let multiplier = 1

    for (const decree of this.getActiveDecrees()) {
      for (const effect of allEffectsOf(decree)) {
        if (effect.type !== 'rule_modification') continue
        if (effect.ruleId !== 'gold_multiplier') continue
        const value = effect.modification.factor
        if (typeof value === 'number' && value > 0) multiplier *= value
      }
    }

    return multiplier
  }

  /**
   * The Decrees that can save the run from a lost round, best first.
   *
   * Phoenix-style Decrees are consumed when they save a run; Immortal-style
   * ones persist but exact a permanent score penalty.
   */
  getLossPreventionDecrees(): OwnedDecree[] {
    return this.getActiveDecrees().filter((decree) =>
      allEffectsOf(decree).some(
        (effect) =>
          effect.type === 'rule_modification' && effect.ruleId === 'prevent_loss'
      )
    )
  }

  /**
   * Apply decree effects during scoring
   */
  applyDecreeEffects(
    context: ScoringContext,
    currentBreakdown: ScoreBreakdown
  ): ScoreBreakdown {
    let breakdown = { ...currentBreakdown }

    const contextDecreeIds = new Set(context.decrees.map((decree) => decree.id))
    const activeDecrees = this.getActiveDecrees().filter((decree) =>
      contextDecreeIds.has(decree.id)
    )

    for (const decree of activeDecrees) {
      for (const effect of this.resolveEffects(decree, activeDecrees)) {
        breakdown = this.applyDecreeEffect(decree, effect, context, breakdown)
      }
      switch (decree.edition) {
        case 'Foil':
          breakdown.additiveBonus += 50
          break
        case 'Holographic':
          breakdown.decreeMultiplier += 10
          break
        case 'Polychrome':
          breakdown.decreeMultiplier *= 1.5
          break
      }
    }

    return breakdown
  }

  /**
   * Apply one of a decree's effects.
   *
   * The owning decree is passed alongside the effect rather than folded into
   * it, so scaling effects can record their running value on the real owned
   * decree instead of on a copy.
   */
  private applyDecreeEffect(
    decree: OwnedDecree,
    effect: DecreeEffect,
    context: ScoringContext,
    breakdown: ScoreBreakdown
  ): ScoreBreakdown {
    const result = { ...breakdown }

    // Apply flower empowerment bonus (+10% per flower)
    const flowerBonus = 1 + context.flowers.flowers.length * 0.1

    switch (effect.type) {
      case 'additive_score': {
        // A scaled bonus is paid once per unit it scales with, so an empty
        // collection pays nothing rather than the flat amount.
        const stacks = effect.scaleBy ? countScalingSource(effect.scaleBy, context) : 1
        if (effect.basePoints) {
          result.additiveBonus += effect.basePoints * stacks * flowerBonus
        }
        if (effect.multiplier) {
          result.decreeMultiplier += effect.multiplier * stacks * flowerBonus
        }
        break
      }

      case 'multiplicative_score':
        if (effect.perTileCondition === 'dominant_suit') {
          const suitedCounts = new Map<string, number>()
          for (const tile of context.tiles.filter((candidate) => candidate.isSuited)) {
            suitedCounts.set(tile.suit, (suitedCounts.get(tile.suit) ?? 0) + 1)
          }
          const dominantSuitCount = Math.max(0, ...suitedCounts.values())
          result.decreeMultiplier *= effect.multiplier ** dominantSuitCount
        } else if (effect.scaleBy) {
          // Compounds per unit, matching how dominant-suit scaling already
          // reads: one application of the multiplier for each one.
          const stacks = countScalingSource(effect.scaleBy, context)
          result.decreeMultiplier *= effect.multiplier ** stacks
        } else {
          result.decreeMultiplier *= effect.multiplier
        }
        break

      case 'gold':
        // Gold effects are handled separately
        break

      case 'scaling': {
        const scalingValue = this.calculateScalingValue(effect, context)
        decree.scalingValue = scalingValue
        result.decreeMultiplier *= 1 + scalingValue * flowerBonus
        break
      }

      case 'conditional':
        if (this.checkCondition(effect.condition, context)) {
          return this.applyDecreeEffect(decree, effect.effect, context, result)
        }
        break
    }

    return result
  }

  /**
   * Calculate scaling value for scaling decrees
   */
  private calculateScalingValue(
    effect: DecreeEffect,
    context: ScoringContext
  ): number {
    if (effect.type !== 'scaling') {
      return 0
    }

    let count = 0

    switch (effect.scalingCondition) {
      case 'honor_tile_count':
        count = context.tiles.filter((t) => t.isHonor).length
        break

      case 'terminal_count':
        count = context.tiles.filter((t) => t.isTerminal).length
        break

      case 'repeated_yaku':
        count = [...context.yakuMultipliers.values()].filter(
          (repeatCount) => repeatCount > 0
        ).length
        break

      default:
        count = 0
    }

    const value = effect.baseValue + count * effect.scalingFactor
    return effect.maxValue ? Math.min(value, effect.maxValue) : value
  }

  /**
   * Check if a condition is met
   */
  private checkCondition(
    condition: { type: string; target: string; operator: string; value: unknown },
    context: ScoringContext
  ): boolean {
    let actualValue: unknown

    switch (condition.type) {
      case 'hand_state':
        if (condition.target === 'isConcealed') {
          actualValue = context.isConcealed
        }
        break

      case 'tile_count':
        actualValue = context.tiles.length
        break

      case 'meld_type':
        actualValue = context.melds.filter(
          (m) => m.type === condition.target
        ).length
        break

      default:
        return false
    }

    switch (condition.operator) {
      case 'eq':
        return actualValue === condition.value
      case 'gte':
        return (actualValue as number) >= (condition.value as number)
      case 'lte':
        return (actualValue as number) <= (condition.value as number)
      case 'contains':
        return (actualValue as unknown[]).includes(condition.value)
      case 'not_contains':
        return !(actualValue as unknown[]).includes(condition.value)
      default:
        return false
    }
  }

  /**
   * Calculate gold generation from decrees
   */
  calculateGoldGeneration(
    context: ScoringContext,
    discardCount: number
  ): number {
    let gold = 0

    for (const decree of this.getActiveDecrees()) {
      if (decree.effect.type === 'gold') {
        const effect = decree.effect
        if (effect.trigger === 'OnDiscard') {
          gold += effect.amount * discardCount
        } else if (effect.trigger === 'OnScored') {
          gold += effect.perTile ? effect.amount * context.tiles.length : effect.amount
        } else if (effect.trigger === 'OnRoundEnd') {
          gold += effect.amount
        }
      }
    }

    return gold
  }

  /**
   * Get additional draws granted by decrees
   */
  getAdditionalDraws(): number {
    let draws = 0

    for (const decree of this.getActiveDecrees()) {
      for (const effect of allEffectsOf(decree)) {
        if (effect.type === 'draw') {
          draws += effect.additionalDraws
        }
      }
    }

    return draws
  }

  /** Net hand-size change from Decrees, in tiles (may be negative). */
  getHandSizeBonus(): number {
    return this.sumRuleDelta('hand_size')
  }

  /** Net change to discards per round from Decrees (may be negative). */
  getAdditionalDiscards(): number {
    return this.sumRuleDelta('discard_count')
  }

  /** Total `delta` carried by every active rule modification with this id. */
  private sumRuleDelta(ruleId: string): number {
    let total = 0

    for (const decree of this.getActiveDecrees()) {
      for (const effect of allEffectsOf(decree)) {
        if (effect.type !== 'rule_modification' || effect.ruleId !== ruleId) continue
        const delta = effect.modification.delta
        if (typeof delta === 'number') total += delta
      }
    }

    return total
  }

  /**
   * Check if a rule modification is active
   */
  hasRuleModification(ruleId: string): boolean {
    return this.getActiveDecrees().some((d) =>
      allEffectsOf(d).some(
        (effect) =>
          effect.type === 'rule_modification' && effect.ruleId === ruleId
      )
    )
  }

  /**
   * Get a specific rule modification
   */
  getRuleModification(ruleId: string): Record<string, unknown> | null {
    const decree = this.getActiveDecrees().find(
      (d) =>
        d.effect.type === 'rule_modification' && d.effect.ruleId === ruleId
    )

    if (decree && decree.effect.type === 'rule_modification') {
      return decree.effect.modification
    }

    return null
  }

  /**
   * Apply seasonal effects (Frostbite halves decree effects)
   */
  applySeasonalDebuff(_isFrostbite: boolean): void {
    // Frostbite is handled by reducing effectiveness in applyDecreeEffect
    // This is tracked in the ScoringContext
  }

  /**
   * Get decrees by rarity for shop weighting
   */
  static getDecreesByRarity(rarity: DecreeRarity): Decree[] {
    return ALL_DECREES.filter((d) => d.rarity === rarity)
  }

  /**
   * Get random decree weighted by rarity
   * Common: 70%, Uncommon: 25%, Rare: 5%
   */
  static getRandomDecree(excludeIds: string[] = []): Decree | null {
    const available = ALL_DECREES.filter((d) => !excludeIds.includes(d.id))
    if (available.length === 0) return null

    const roll = Math.random()
    let targetRarity: DecreeRarity

    if (roll < 0.7) {
      targetRarity = 'LocalEdict'
    } else if (roll < 0.95) {
      targetRarity = 'RegionalMandate'
    } else {
      targetRarity = 'ImperialDecree'
    }

    const candidates = available.filter((d) => d.rarity === targetRarity)

    if (candidates.length === 0) {
      // Fallback to any available decree
      return available[Math.floor(Math.random() * available.length)]
    }

    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  /**
   * Serialize decree system state
   */
  toState(): {
    ownedDecrees: OwnedDecree[]
    maxSlots: number
    currentRound: number
  } {
    return {
      ownedDecrees: [...this.ownedDecrees],
      maxSlots: this.maxSlots,
      currentRound: this.currentRound,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    ownedDecrees: OwnedDecree[]
    maxSlots: number
    currentRound: number
  }): DecreeSystem {
    const system = new DecreeSystem(state.maxSlots)
    system.ownedDecrees = [...state.ownedDecrees]
    system.currentRound = state.currentRound
    return system
  }
}
