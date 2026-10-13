/**
 * Action Processor for Tensho Mahjong Roguelike
 *
 * Processes player actions with validation and state updates.
 * All actions go through this processor to ensure game rules are followed.
 */

import { Tile } from '../core/Tile'
import { Meld } from '../core/Meld'
import { ScoreBreakdown } from '../rules/ScoringEngine'
import { DetectedYaku } from '../rules/YakuDetector'
import type { RoundType } from '../systems/types'

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Draw action - draw a tile from the wall
 */
export interface DrawAction {
  type: 'draw'
}

/**
 * Play action - play selected tiles as a hand
 */
export interface PlayAction {
  type: 'play'
  tileIds: string[]
}

/**
 * REDRAW - send any number of selected tiles to the river and refill the rack.
 * Spends a free redraw if one is left, otherwise a Turn.
 */
export interface RedrawAction {
  type: 'redraw'
  tileIds: string[]
}

/**
 * Use Fate Seal action
 */
export interface UseSealAction {
  type: 'useSeal'
  sealId: string
  targets?: string[]
}

/** Use a Celestial Orb to permanently upgrade its attuned yaku. */
export interface UseOrbAction {
  type: 'useOrb'
  orbId: string
}

/**
 * Use Void Script action
 */
export interface UseScriptAction {
  type: 'useScript'
  scriptId: string
  targets?: string[]
}

/**
 * Union type for all player actions
 */
export type PlayerAction =
  | DrawAction
  | PlayAction
  | RedrawAction
  | UseSealAction
  | UseOrbAction
  | UseScriptAction

// =============================================================================
// RESULT TYPES
// =============================================================================

/**
 * Base effect interface
 */
export interface BaseEffect {
  type: string
  description: string
}

/**
 * Tile added effect
 */
export interface TileAddedEffect extends BaseEffect {
  type: 'tile_added'
  tile: Tile
}

/**
 * Tile removed effect
 */
export interface TileRemovedEffect extends BaseEffect {
  type: 'tile_removed'
  tileId: string
}

/**
 * Score added effect
 */
export interface ScoreAddedEffect extends BaseEffect {
  type: 'score_added'
  score: number
  breakdown: ScoreBreakdown
}

/**
 * Gold changed effect
 */
export interface GoldChangedEffect extends BaseEffect {
  type: 'gold_changed'
  delta: number
  newTotal: number
}

/**
 * Bonus tile drawn effect
 */
export interface BonusTileDrawnEffect extends BaseEffect {
  type: 'bonus_tile_drawn'
  tile: Tile
  isFlower: boolean
}

/**
 * Round state changed effect
 */
export interface RoundStateChangedEffect extends BaseEffect {
  type: 'round_state_changed'
  handsRemaining: number
  discardsRemaining: number
  redrawsRemaining: number
}

/**
 * Yaku detected effect
 */
export interface YakuDetectedEffect extends BaseEffect {
  type: 'yaku_detected'
  yaku: DetectedYaku[]
}

/**
 * Union type for all effects
 */
export type Effect =
  | TileAddedEffect
  | TileRemovedEffect
  | ScoreAddedEffect
  | GoldChangedEffect
  | BonusTileDrawnEffect
  | RoundStateChangedEffect
  | YakuDetectedEffect
  | BaseEffect

/**
 * Validation result for actions
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Result of processing an action
 */
export interface ActionResult {
  success: boolean
  effects: Effect[]
  errors?: string[]
}

// =============================================================================
// GAME STATE SNAPSHOT
// =============================================================================

/**
 * Snapshot of game state for action processing
 */
export interface GameStateSnapshot {
  // Hand state
  handTiles: Tile[]
  /** Current ordinary rack capacity, including active Season/Charter rules. */
  handSizeLimit?: number
  melds: Meld[]
  selectedTileIds: string[]

  // Wall state
  wallRemaining: number
  deadWallRemaining: number
  /** Playable replacements available after resolving bonus/dead-wall chains. */
  redrawReplacementCapacity?: number

  // Round state
  roundType: RoundType | null
  handsRemaining: number
  discardsRemaining: number
  redrawsRemaining: number
  currentScore: number
  targetScore: number

  // Resources
  gold: number

  // Consumable inventory and round-scoped usage
  fateSealIds: string[]
  celestialOrbIds: string[]
  voidScriptIds: string[]
  fateSealUsesRemaining: number
  voidScriptUsesRemaining: number

  // Restrictions from mandates
  mandateRestrictions?: MandateRestrictions
}

/**
 * Restrictions from active boss mandates
 */
export interface MandateRestrictions {
  lockedTileIds?: readonly string[]
  noDiscards?: boolean
  fixedHandSize?: number
  singleHand?: boolean
  debuffedSuit?: string
  debuffedTileType?: string
}

// =============================================================================
// ACTION PROCESSOR CLASS
// =============================================================================

/**
 * Processes player actions with validation
 */
export class ActionProcessor {
  /**
   * Validate an action against current game state
   */
  validate(action: PlayerAction, state: GameStateSnapshot): ValidationResult {
    switch (action.type) {
      case 'draw':
        return this.validateDraw(state)
      case 'play':
        return this.validatePlay(action, state)
      case 'redraw':
        return this.validateRedraw(action, state)
      case 'useSeal':
        return this.validateUseSeal(action, state)
      case 'useOrb':
        return this.validateUseOrb(action, state)
      case 'useScript':
        return this.validateUseScript(action, state)
      default:
        return { isValid: false, errors: ['Unknown action type'] }
    }
  }

  /**
   * Validate a draw action
   */
  private validateDraw(state: GameStateSnapshot): ValidationResult {
    const errors: string[] = []

    if (state.wallRemaining <= 0) {
      errors.push('No tiles remaining in wall')
    }

    if (state.handTiles.length >= (state.handSizeLimit ?? 14)) {
      errors.push('Hand is at maximum size')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate a play action
   */
  private validatePlay(
    action: PlayAction,
    state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if hands remaining
    if (state.handsRemaining <= 0) {
      errors.push('No hands remaining')
    }

    // Check if all tiles exist in hand
    if (new Set(action.tileIds).size !== action.tileIds.length) {
      errors.push('Play tiles must be unique')
    }
    for (const tileId of action.tileIds) {
      const tileExists = state.handTiles.some((t) => t.id === tileId)
      if (!tileExists) {
        errors.push(`Tile ${tileId} not found in hand`)
      }
    }

    // Check mandate restrictions for fixed hand size
    if (state.mandateRestrictions?.fixedHandSize !== undefined) {
      if (action.tileIds.length !== state.mandateRestrictions.fixedHandSize) {
        errors.push(
          `Must play exactly ${state.mandateRestrictions.fixedHandSize} tiles`
        )
      }
    }

    // Minimum tiles check (at least 2 for a pair)
    if (action.tileIds.length < 2) {
      errors.push('Must play at least 2 tiles')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Validate a REDRAW: any number of distinct, unlocked rack tiles, with a
   * free redraw or a Turn to spend that still leaves a Turn for a Play.
   */
  private validateRedraw(
    action: RedrawAction,
    state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []

    if (state.mandateRestrictions?.noDiscards) {
      errors.push('Boss Mandate: no Redraws this round')
    } else if (state.redrawsRemaining <= 0 && state.handsRemaining < 2) {
      // The last Turn is always a Play.
      errors.push('No Redraws left: your last Turn must be a Play')
    }

    if (action.tileIds.length === 0) {
      errors.push('Must select at least one tile to redraw')
    }

    if (new Set(action.tileIds).size !== action.tileIds.length) {
      errors.push('Redraw tiles must be unique')
    }
    if (
      action.tileIds.some((id) =>
        state.mandateRestrictions?.lockedTileIds?.includes(id)
      )
    ) {
      errors.push('Locked tiles cannot be redrawn')
    }

    for (const tileId of action.tileIds) {
      if (!state.handTiles.some((t) => t.id === tileId)) {
        errors.push(`Tile ${tileId} not found in hand`)
      }
    }

    if (state.wallRemaining < action.tileIds.length) {
      errors.push('Not enough tiles in wall for redraw')
    } else if (
      state.redrawReplacementCapacity !== undefined &&
      state.redrawReplacementCapacity < action.tileIds.length
    ) {
      errors.push('Not enough replacement tiles for redraw')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate a use seal action
   */
  private validateUseSeal(
    action: UseSealAction,
    state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []

    if (!action.sealId) {
      errors.push('No seal specified')
    } else if (!state.fateSealIds.includes(action.sealId)) {
      errors.push('Seal not found in inventory')
    }

    if (state.fateSealUsesRemaining <= 0) {
      errors.push('No Fate Seal uses remaining this round')
    }

    errors.push(...this.validateConsumableTargets(action.targets, state))

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate a use script action
   */
  private validateUseScript(
    action: UseScriptAction,
    state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []

    if (!action.scriptId) {
      errors.push('No script specified')
    } else if (!state.voidScriptIds.includes(action.scriptId)) {
      errors.push('Script not found in inventory')
    }

    if (state.voidScriptUsesRemaining <= 0) {
      errors.push('No Void Script uses remaining this round')
    }

    errors.push(...this.validateConsumableTargets(action.targets, state))

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private validateUseOrb(
    action: UseOrbAction,
    state: GameStateSnapshot
  ): ValidationResult {
    if (!action.orbId) {
      return { isValid: false, errors: ['No orb specified'] }
    }

    if (!state.celestialOrbIds.includes(action.orbId)) {
      return { isValid: false, errors: ['Orb not found in inventory'] }
    }

    return { isValid: true, errors: [] }
  }

  private validateConsumableTargets(
    targets: string[] | undefined,
    state: GameStateSnapshot
  ): string[] {
    if (!targets) return []

    const errors: string[] = []
    if (new Set(targets).size !== targets.length) {
      errors.push('Consumable targets must be unique')
    }

    for (const tileId of targets) {
      if (!state.handTiles.some((tile) => tile.id === tileId)) {
        errors.push(`Tile ${tileId} not found in hand`)
      }
    }

    return errors
  }

  /**
   * Check if an action can be performed
   */
  canPerform(action: PlayerAction, state: GameStateSnapshot): boolean {
    return this.validate(action, state).isValid
  }

  /**
   * Get available actions for the current state
   */
  getAvailableActions(state: GameStateSnapshot): PlayerAction['type'][] {
    const available: PlayerAction['type'][] = []

    if (this.canPerform({ type: 'draw' }, state)) {
      available.push('draw')
    }

    if (state.handsRemaining > 0 && state.handTiles.length >= 2) {
      available.push('play')
    }

    if (
      state.handTiles.some((tile) =>
        this.canPerform({ type: 'redraw', tileIds: [tile.id] }, state)
      )
    ) {
      available.push('redraw')
    }

    if (state.fateSealUsesRemaining > 0 && state.fateSealIds.length > 0) {
      available.push('useSeal')
    }

    if (state.celestialOrbIds.length > 0) {
      available.push('useOrb')
    }

    if (state.voidScriptUsesRemaining > 0 && state.voidScriptIds.length > 0) {
      available.push('useScript')
    }

    return available
  }
}

/**
 * Create a default action processor
 */
export function createActionProcessor(): ActionProcessor {
  return new ActionProcessor()
}
