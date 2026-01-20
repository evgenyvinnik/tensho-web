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
 * Discard action - discard a tile to the river
 */
export interface DiscardAction {
  type: 'discard'
  tileId: string
}

/**
 * Play action - play selected tiles as a hand
 */
export interface PlayAction {
  type: 'play'
  tileIds: string[]
}

/**
 * Redraw action - return tiles to wall and draw replacements
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

/**
 * Use Void Script action
 */
export interface UseScriptAction {
  type: 'useScript'
  scriptId: string
  targets?: string[]
}

/**
 * Skip action - skip the current action opportunity
 */
export interface SkipAction {
  type: 'skip'
}

/**
 * Union type for all player actions
 */
export type PlayerAction =
  | DrawAction
  | DiscardAction
  | PlayAction
  | RedrawAction
  | UseSealAction
  | UseScriptAction
  | SkipAction

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
  melds: Meld[]
  selectedTileIds: string[]

  // Wall state
  wallRemaining: number
  deadWallRemaining: number

  // Round state
  handsRemaining: number
  discardsRemaining: number
  redrawsRemaining: number
  currentScore: number
  targetScore: number

  // Resources
  gold: number

  // Restrictions from mandates
  mandateRestrictions?: MandateRestrictions
}

/**
 * Restrictions from active boss mandates
 */
export interface MandateRestrictions {
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
      case 'discard':
        return this.validateDiscard(action, state)
      case 'play':
        return this.validatePlay(action, state)
      case 'redraw':
        return this.validateRedraw(action, state)
      case 'useSeal':
        return this.validateUseSeal(action, state)
      case 'useScript':
        return this.validateUseScript(action, state)
      case 'skip':
        return { isValid: true, errors: [] }
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

    // Check if hand is already at maximum size (14 tiles)
    if (state.handTiles.length >= 14) {
      errors.push('Hand is at maximum size')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate a discard action
   */
  private validateDiscard(
    action: DiscardAction,
    state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []

    // Check mandate restrictions
    if (state.mandateRestrictions?.noDiscards) {
      errors.push('Discards are disabled by mandate')
    }

    // Check if tile exists in hand
    const tileExists = state.handTiles.some((t) => t.id === action.tileId)
    if (!tileExists) {
      errors.push('Tile not found in hand')
    }

    // Check if discards remaining
    if (state.discardsRemaining <= 0) {
      errors.push('No discards remaining')
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
   * Validate a redraw action
   */
  private validateRedraw(
    action: RedrawAction,
    state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []

    // Check if redraws remaining
    if (state.redrawsRemaining <= 0) {
      errors.push('No redraws remaining')
    }

    // Check tile count (max 5 tiles at once)
    if (action.tileIds.length > 5) {
      errors.push('Can only redraw up to 5 tiles at once')
    }

    if (action.tileIds.length === 0) {
      errors.push('Must select at least one tile to redraw')
    }

    // Check if all tiles exist in hand
    for (const tileId of action.tileIds) {
      const tileExists = state.handTiles.some((t) => t.id === tileId)
      if (!tileExists) {
        errors.push(`Tile ${tileId} not found in hand`)
      }
    }

    // Check if wall has enough tiles
    if (state.wallRemaining < action.tileIds.length) {
      errors.push('Not enough tiles in wall for redraw')
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
    _state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []

    if (!action.sealId) {
      errors.push('No seal specified')
    }

    // Additional validation would check if player owns the seal
    // and if targets are valid for the seal type

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
    _state: GameStateSnapshot
  ): ValidationResult {
    const errors: string[] = []

    if (!action.scriptId) {
      errors.push('No script specified')
    }

    // Additional validation would check if player owns the script
    // and if targets are valid for the script type

    return {
      isValid: errors.length === 0,
      errors,
    }
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

    if (state.discardsRemaining > 0 && state.handTiles.length > 0) {
      available.push('discard')
    }

    if (state.handsRemaining > 0 && state.handTiles.length >= 2) {
      available.push('play')
    }

    if (
      state.redrawsRemaining > 0 &&
      state.wallRemaining > 0 &&
      state.handTiles.length > 0
    ) {
      available.push('redraw')
    }

    available.push('skip')

    return available
  }
}

/**
 * Create a default action processor
 */
export function createActionProcessor(): ActionProcessor {
  return new ActionProcessor()
}
