/**
 * Mandate Effect System for Tensho Mahjong Roguelike
 *
 * Applies mandate restrictions during Boss Rounds, tracks active mandate effects,
 * and handles mandate defeat/completion.
 *
 * Based on ARCHITECTURE.MD Section 21 (Mandates)
 *
 * Integration points:
 * - Integrates with GameOrchestrator.ts for round flow
 * - Applies debuffs via DebuffSystem.ts
 * - Works with RoundManager.ts for mandate selection
 */

import { Tile, TileSuit } from '../core/Tile'
import { DebuffSystem, DebuffSource } from '../game/DebuffSystem'
import { OwnedDecree } from './types'
import {
  MandateDefinition,
  selectRandomMandate,
} from '../config/mandateDefinitions'

// =============================================================================
// MANDATE STATE TYPES
// =============================================================================

/**
 * State for tracking active mandate effects
 */
export interface MandateState {
  /** The currently active mandate (null if not in boss round) */
  activeMandate: MandateDefinition | null
  /** Whether the mandate has been defeated/cleared */
  isDefeated: boolean
  /** Yaku IDs that have already been scored this round (for The Eye) */
  scoredYakuIds: Set<string>
  /** The first yaku type scored this round (for The Mouth) */
  firstYakuType: string | null
  /** Number of hands played this round (for The Needle) */
  handsPlayed: number
  /** Tile IDs that are force-locked (for Cerulean Bell) */
  lockedTileIds: Set<string>
  /** Decree IDs that are disabled (for Crimson Heart) */
  disabledDecreeIds: Set<string>
  /** Whether decrees are shuffled/hidden (for Amber Acorn) */
  decreesShuffled: boolean
  /** Stable shuffled presentation order for hidden Decrees (for Amber Acorn) */
  shuffledDecreeIds: string[]
  /** Whether all tiles are debuffed until decree sold (for Verdant Leaf) */
  allTilesDebuffed: boolean
  /** Modified redraws for this round (for The Water) */
  modifiedRedraws: number | null
  /** Modified max hands for this round (for The Needle) */
  modifiedMaxHands: number | null
  /** Required hand size (for The Psychic) */
  requiredHandSize: number | null
  /** Previously used tile IDs in this act (for The Pillar) */
  usedTileIds: Set<string>
}

/**
 * Result of applying a mandate effect
 */
export interface MandateApplicationResult {
  success: boolean
  message: string
  modifiedScore?: number
  modifiedRedraws?: number
  modifiedMaxHands?: number
  debuffedTileIds?: string[]
  disabledDecreeIds?: string[]
  lockedTileIds?: string[]
}

/**
 * Context for scoring with mandate effects
 */
export interface MandateScoringContext {
  basePoints: number
  multiplier: number
  yakuIds: string[]
  yakuTiers: Map<string, number>
}

// =============================================================================
// MANDATE EFFECT SYSTEM CLASS
// =============================================================================

/**
 * Manages mandate application, effects, and tracking during Boss Rounds
 */
export class MandateEffectSystem {
  private state: MandateState
  private debuffSystem: DebuffSystem | null = null
  private seededRandom: (() => number) | null = null

  constructor() {
    this.state = this.createInitialState()
  }

  /**
   * Create initial mandate state
   */
  private createInitialState(): MandateState {
    return {
      activeMandate: null,
      isDefeated: false,
      scoredYakuIds: new Set(),
      firstYakuType: null,
      handsPlayed: 0,
      lockedTileIds: new Set(),
      disabledDecreeIds: new Set(),
      decreesShuffled: false,
      shuffledDecreeIds: [],
      allTilesDebuffed: false,
      modifiedRedraws: null,
      modifiedMaxHands: null,
      requiredHandSize: null,
      usedTileIds: new Set(),
    }
  }

  /**
   * Set the debuff system for applying tile debuffs
   */
  setDebuffSystem(debuffSystem: DebuffSystem): void {
    this.debuffSystem = debuffSystem
  }

  /**
   * Initialize seeded random for deterministic behavior
   */
  setSeed(seed: number): void {
    let s = seed
    this.seededRandom = () => {
      s += 0x6d2b79f5
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  /**
   * Get random number (seeded or Math.random)
   */
  private getRandom(): number {
    return this.seededRandom ? this.seededRandom() : Math.random()
  }

  // ===========================================================================
  // MANDATE LIFECYCLE
  // ===========================================================================

  /**
   * Activate a mandate for a boss round
   */
  activateMandate(
    mandate: MandateDefinition,
    tiles: Tile[],
    decrees: OwnedDecree[]
  ): MandateApplicationResult {
    // Reset state for new mandate
    this.state = this.createInitialState()
    this.state.activeMandate = mandate

    // Apply immediate mandate effects
    return this.applyMandateOnActivation(mandate, tiles, decrees)
  }

  /**
   * Select and activate a mandate for the given act
   */
  selectAndActivateMandate(
    actNumber: number,
    tiles: Tile[],
    decrees: OwnedDecree[],
    excludeIds: string[] = []
  ): { mandate: MandateDefinition; result: MandateApplicationResult } {
    const mandate = selectRandomMandate(
      actNumber,
      excludeIds,
      this.seededRandom ? Math.floor(this.getRandom() * 1000000) : undefined
    )

    const result = this.activateMandate(mandate, tiles, decrees)

    return { mandate, result }
  }

  /**
   * Apply mandate effects when first activated
   */
  private applyMandateOnActivation(
    mandate: MandateDefinition,
    tiles: Tile[],
    decrees: OwnedDecree[]
  ): MandateApplicationResult {
    const result: MandateApplicationResult = {
      success: true,
      message: `Mandate activated: ${mandate.name} (${mandate.japaneseName})`,
    }

    switch (mandate.effect.type) {
      case 'score_multiplier':
        // Handled in score calculation, no immediate effect
        result.message += ` - Score requirement multiplied by ${mandate.effect.value}x`
        break

      case 'halve_score':
        // Handled in score calculation
        result.message += ' - Base points and multiplier halved'
        break

      case 'no_repeat_yaku':
        // Tracked during scoring
        result.message += ' - Each yaku can only score once'
        break

      case 'single_yaku_type':
        // Tracked during scoring
        result.message += ' - Only one yaku type can be scored'
        break

      case 'decrease_yaku_tier':
        // Handled in score calculation
        result.message += ` - Yaku tiers decreased by ${mandate.effect.value}`
        break

      case 'single_hand':
        this.state.modifiedMaxHands = 1
        result.modifiedMaxHands = 1
        result.message += ' - Must complete in exactly 1 hand'
        break

      case 'no_discards':
        this.state.modifiedRedraws = 0
        result.modifiedRedraws = 0
        result.message += ' - No redraws available'
        break

      case 'fixed_hand_size':
        this.state.requiredHandSize = mandate.effect.value as number
        result.message += ` - Must play exactly ${mandate.effect.value} tiles`
        break

      case 'discard_after_draw':
        // Handled during draw phase
        result.message += ` - ${mandate.effect.value} random tiles discarded after each draw`
        break

      case 'debuff_suit':
        result.debuffedTileIds = this.applyDebuffSuit(
          tiles,
          mandate.effect.target as string,
          mandate.id
        )
        result.message += ` - All ${mandate.effect.target} tiles debuffed`
        break

      case 'debuff_tile_type':
        result.debuffedTileIds = this.applyDebuffTileType(
          tiles,
          mandate.effect.target as string,
          mandate.id
        )
        result.message += ` - All ${mandate.effect.target} tiles debuffed`
        break

      case 'debuff_used_tiles':
        result.debuffedTileIds = this.applyDebuffUsedTiles(tiles, mandate.id)
        result.message += ' - Previously used tiles debuffed'
        break

      case 'shuffle_decrees':
        this.state.decreesShuffled = true
        this.state.shuffledDecreeIds = decrees.map((decree) => decree.id)
        for (let i = this.state.shuffledDecreeIds.length - 1; i > 0; i--) {
          const j = Math.floor(this.getRandom() * (i + 1))
          ;[this.state.shuffledDecreeIds[i], this.state.shuffledDecreeIds[j]] = [
            this.state.shuffledDecreeIds[j],
            this.state.shuffledDecreeIds[i],
          ]
        }
        result.message += ' - All decrees shuffled and face-down'
        break

      case 'debuff_until_sell':
        this.state.allTilesDebuffed = true
        result.debuffedTileIds = this.applyDebuffAllTiles(tiles, mandate.id)
        result.message += ' - All tiles debuffed until a decree is sold'
        break

      case 'disable_random_decree':
        result.disabledDecreeIds = this.applyDisableRandomDecree(decrees)
        result.message += ' - Random decrees will be disabled each hand'
        break

      case 'lock_random_tile':
        // Handled during draw phase
        result.message += ' - Random tiles will be locked each draw'
        break

      case 'hand_size_reduction':
        // Handled during hand validation - reduces the max tile count in hand
        result.message += ` - Hand size reduced by ${mandate.effect.value}`
        break

      case 'gold_per_tile':
        // Handled during tile scoring
        result.message += ` - Lose ${mandate.effect.value} gold per tile played`
        break

      case 'most_played_yaku_zeroes_gold':
        // Handled during scoring
        result.message += ' - Playing most-played Yaku sets gold to 0'
        break

      case 'first_hand_face_down':
        // Handled during draw phase - first hand tiles are face-down
        result.message += ' - First hand drawn face-down'
        break

      case 'tiles_face_down_ratio':
        // Handled during draw phase - 1 in N tiles are face-down
        result.message += ` - 1 in ${mandate.effect.value} tiles drawn face-down`
        break

      case 'tiles_face_down_after_play':
        // Handled after each hand play
        result.message += ' - Tiles drawn face-down after each hand'
        break

      case 'fixed_draw_count':
        // Handled during draw phase
        result.message += ` - After play/discard, always draw ${mandate.effect.value} tiles`
        break

      case 'honor_tiles_face_down':
        // Handled during draw phase - honor tiles are face-down
        result.message += ' - All Honor tiles drawn face-down'
        break
    }

    return result
  }

  /**
   * Deactivate the current mandate (round complete)
   */
  deactivateMandate(): void {
    if (this.debuffSystem) {
      // Clear mandate-specific debuffs
      this.debuffSystem.removeDebuffsBySource('mandate')
    }

    this.state.activeMandate = null
    this.state.isDefeated = false
    this.state.scoredYakuIds.clear()
    this.state.firstYakuType = null
    this.state.lockedTileIds.clear()
    this.state.disabledDecreeIds.clear()
    this.state.decreesShuffled = false
    this.state.shuffledDecreeIds = []
    this.state.allTilesDebuffed = false
    this.state.modifiedRedraws = null
    this.state.modifiedMaxHands = null
    this.state.requiredHandSize = null
  }

  /**
   * Mark mandate as defeated (boss round won)
   */
  defeatMandate(): void {
    this.state.isDefeated = true
  }

  /**
   * Clear used tile tracking for new act
   */
  clearUsedTiles(): void {
    this.state.usedTileIds.clear()
  }

  // ===========================================================================
  // DEBUFF APPLICATION
  // ===========================================================================

  /**
   * Apply debuffs to tiles of a specific suit
   */
  private applyDebuffSuit(
    tiles: Tile[],
    suit: string,
    mandateId: string
  ): string[] {
    if (!this.debuffSystem) return []

    const debuffedIds: string[] = []
    const source: DebuffSource = { type: 'mandate', mandateId }

    const suitMap: Record<string, TileSuit> = {
      souzu: TileSuit.Souzu,
      pinzu: TileSuit.Pinzu,
      manzu: TileSuit.Manzu,
    }

    const targetSuit = suitMap[suit.toLowerCase()]
    if (!targetSuit) return []

    for (const tile of tiles) {
      if (tile.suit === targetSuit) {
        this.debuffSystem.debuffTile(tile.id, source)
        debuffedIds.push(tile.id)
      }
    }

    return debuffedIds
  }

  /**
   * Apply debuffs to tiles of a specific type
   */
  private applyDebuffTileType(
    tiles: Tile[],
    tileType: string,
    mandateId: string
  ): string[] {
    if (!this.debuffSystem) return []

    const debuffedIds: string[] = []
    const source: DebuffSource = { type: 'mandate', mandateId }

    for (const tile of tiles) {
      let shouldDebuff = false

      switch (tileType.toLowerCase()) {
        case 'dragon':
          shouldDebuff = tile.suit === TileSuit.Dragon
          break
        case 'wind':
          shouldDebuff = tile.suit === TileSuit.Wind
          break
        case 'honor':
          shouldDebuff = tile.isHonor
          break
        case 'terminal':
          shouldDebuff = tile.isTerminal
          break
        case 'simple':
          shouldDebuff = tile.isSimple
          break
      }

      if (shouldDebuff) {
        this.debuffSystem.debuffTile(tile.id, source)
        debuffedIds.push(tile.id)
      }
    }

    return debuffedIds
  }

  /**
   * Apply debuffs to previously used tiles (The Pillar)
   */
  private applyDebuffUsedTiles(tiles: Tile[], mandateId: string): string[] {
    if (!this.debuffSystem) return []

    const debuffedIds: string[] = []
    const source: DebuffSource = { type: 'mandate', mandateId }

    for (const tile of tiles) {
      if (this.state.usedTileIds.has(tile.id)) {
        this.debuffSystem.debuffTile(tile.id, source)
        debuffedIds.push(tile.id)
      }
    }

    return debuffedIds
  }

  /**
   * Apply debuffs to all tiles (Verdant Leaf)
   */
  private applyDebuffAllTiles(tiles: Tile[], mandateId: string): string[] {
    if (!this.debuffSystem) return []

    const debuffedIds: string[] = []
    const source: DebuffSource = { type: 'mandate', mandateId }

    for (const tile of tiles) {
      this.debuffSystem.debuffTile(tile.id, source)
      debuffedIds.push(tile.id)
    }

    return debuffedIds
  }

  /**
   * Disable a random decree (Crimson Heart)
   */
  private applyDisableRandomDecree(decrees: OwnedDecree[]): string[] {
    const eligibleDecrees = decrees.filter(
      (d) => !d.isDebuffed && !this.state.disabledDecreeIds.has(d.id)
    )

    if (eligibleDecrees.length === 0) return []

    const randomIndex = Math.floor(this.getRandom() * eligibleDecrees.length)
    const decree = eligibleDecrees[randomIndex]

    this.state.disabledDecreeIds.add(decree.id)

    return [decree.id]
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handle draw event (for The Hook, Cerulean Bell)
   */
  onDraw(
    handTiles: Tile[],
    drawnTile: Tile
  ): { discardedTileIds: string[]; lockedTileId: string | null } {
    const result = {
      discardedTileIds: [] as string[],
      lockedTileId: null as string | null,
    }

    if (!this.state.activeMandate) return result

    const mandate = this.state.activeMandate

    // The Hook: Discard random tiles after draw
    if (mandate.effect.type === 'discard_after_draw') {
      const discardCount = mandate.effect.value as number
      const availableTiles = handTiles.filter(
        (t) => t.id !== drawnTile.id && !this.state.lockedTileIds.has(t.id)
      )

      for (let i = 0; i < discardCount && availableTiles.length > 0; i++) {
        const randomIndex = Math.floor(this.getRandom() * availableTiles.length)
        const tile = availableTiles.splice(randomIndex, 1)[0]
        result.discardedTileIds.push(tile.id)
      }
    }

    // Cerulean Bell: Lock a random tile
    if (mandate.effect.type === 'lock_random_tile') {
      const unlockableTiles = handTiles.filter(
        (t) => !this.state.lockedTileIds.has(t.id)
      )

      if (unlockableTiles.length > 0) {
        const randomIndex = Math.floor(this.getRandom() * unlockableTiles.length)
        const tile = unlockableTiles[randomIndex]
        this.state.lockedTileIds.add(tile.id)
        result.lockedTileId = tile.id
      }
    }

    return result
  }

  /**
   * Handle hand played event
   */
  onHandPlayed(
    playedTileIds: string[],
    decrees: OwnedDecree[]
  ): { disabledDecreeIds: string[] } {
    const result = { disabledDecreeIds: [] as string[] }

    this.state.handsPlayed++

    // Track used tiles for The Pillar
    for (const tileId of playedTileIds) {
      this.state.usedTileIds.add(tileId)
      this.state.lockedTileIds.delete(tileId)
    }

    if (!this.state.activeMandate) return result

    // Crimson Heart: Disable random decree each hand
    if (this.state.activeMandate.effect.type === 'disable_random_decree') {
      this.state.disabledDecreeIds.clear()
      result.disabledDecreeIds = this.applyDisableRandomDecree(decrees)
    }

    return result
  }

  /**
   * Handle decree sold event (for Verdant Leaf)
   */
  onDecreeSold(_tiles: Tile[]): boolean {
    if (!this.state.activeMandate) return false

    if (
      this.state.activeMandate.effect.type === 'debuff_until_sell' &&
      this.state.allTilesDebuffed
    ) {
      // Remove all tile debuffs
      if (this.debuffSystem) {
        this.debuffSystem.removeDebuffsBySource(
          'mandate',
          this.state.activeMandate.id
        )
      }

      this.state.allTilesDebuffed = false
      return true
    }

    return false
  }

  // ===========================================================================
  // SCORING MODIFICATION
  // ===========================================================================

  /**
   * Apply mandate effects to scoring
   */
  applyToScoring(context: MandateScoringContext): MandateScoringContext {
    if (!this.state.activeMandate) return context

    const mandate = this.state.activeMandate
    const result = { ...context }

    switch (mandate.effect.type) {
      case 'halve_score':
        result.basePoints = Math.floor(result.basePoints * 0.5)
        result.multiplier = result.multiplier * 0.5
        break

      case 'decrease_yaku_tier': {
        const tierDecrease = mandate.effect.value as number
        const adjustedTiers = new Map<string, number>()
        for (const [yakuId, tier] of result.yakuTiers) {
          adjustedTiers.set(yakuId, Math.max(0, tier - tierDecrease))
        }
        result.yakuTiers = adjustedTiers
        break
      }

      case 'no_repeat_yaku':
        // Filter out already scored yaku
        result.yakuIds = result.yakuIds.filter((id) => {
          if (this.state.scoredYakuIds.has(id)) {
            return false
          }
          this.state.scoredYakuIds.add(id)
          return true
        })
        break

      case 'single_yaku_type':
        if (result.yakuIds.length > 0) {
          if (!this.state.firstYakuType) {
            // First yaku scored - set the type
            this.state.firstYakuType = result.yakuIds[0]
          }
          // Filter to only matching yaku type
          result.yakuIds = result.yakuIds.filter(
            (id) => id === this.state.firstYakuType
          )
        }
        break
    }

    return result
  }

  /**
   * Get score requirement multiplier from mandate
   */
  getScoreRequirementMultiplier(): number {
    if (!this.state.activeMandate) return 1

    if (this.state.activeMandate.effect.type === 'score_multiplier') {
      return this.state.activeMandate.effect.value as number
    }

    return 1
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  /**
   * Check if a hand play is valid given mandate restrictions
   */
  validateHandPlay(tileIds: string[]): { valid: boolean; error?: string } {
    if (!this.state.activeMandate) {
      return { valid: true }
    }

    const mandate = this.state.activeMandate

    // The Psychic: Must play exactly N tiles
    if (mandate.effect.type === 'fixed_hand_size') {
      const requiredSize = mandate.effect.value as number
      if (tileIds.length !== requiredSize) {
        return {
          valid: false,
          error: `Must play exactly ${requiredSize} tiles (${mandate.name})`,
        }
      }
    }

    // Check for locked tiles that must be included
    for (const lockedId of this.state.lockedTileIds) {
      if (!tileIds.includes(lockedId)) {
        return {
          valid: false,
          error: `Locked tiles must be included in hand (${mandate.name})`,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Check if more hands can be played
   */
  canPlayMoreHands(defaultMaxHands: number): boolean {
    const maxHands = this.state.modifiedMaxHands ?? defaultMaxHands
    return this.state.handsPlayed < maxHands
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /**
   * Get the current active mandate
   */
  getActiveMandate(): MandateDefinition | null {
    return this.state.activeMandate
  }

  /**
   * Check if there is an active mandate
   */
  hasActiveMandate(): boolean {
    return this.state.activeMandate !== null
  }

  /**
   * Get current mandate state
   */
  getState(): Readonly<MandateState> {
    return this.state
  }

  /**
   * Get modified redraws (if any)
   */
  getModifiedRedraws(): number | null {
    return this.state.modifiedRedraws
  }

  /**
   * Get modified max hands (if any)
   */
  getModifiedMaxHands(): number | null {
    return this.state.modifiedMaxHands
  }

  /**
   * Get required hand size (if any)
   */
  getRequiredHandSize(): number | null {
    return this.state.requiredHandSize
  }

  /**
   * Get locked tile IDs
   */
  getLockedTileIds(): string[] {
    return Array.from(this.state.lockedTileIds)
  }

  /**
   * Get disabled decree IDs
   */
  getDisabledDecreeIds(): string[] {
    return Array.from(this.state.disabledDecreeIds)
  }

  /** Get the stable hidden presentation order generated for Amber Acorn. */
  getShuffledDecreeIds(): string[] {
    return [...this.state.shuffledDecreeIds]
  }

  /**
   * Check if decrees are shuffled/hidden
   */
  areDecreesShuffled(): boolean {
    return this.state.decreesShuffled
  }

  /**
   * Check if all tiles are debuffed
   */
  areAllTilesDebuffed(): boolean {
    return this.state.allTilesDebuffed
  }

  /**
   * Get hands played this round
   */
  getHandsPlayed(): number {
    return this.state.handsPlayed
  }

  /**
   * Check if tile is locked
   */
  isTileLocked(tileId: string): boolean {
    return this.state.lockedTileIds.has(tileId)
  }

  /**
   * Get hand size reduction from mandate (The Manacle)
   */
  getHandSizeReduction(): number {
    if (!this.state.activeMandate) return 0
    if (this.state.activeMandate.effect.type === 'hand_size_reduction') {
      return (this.state.activeMandate.effect.value as number) ?? 0
    }
    return 0
  }

  /**
   * Get gold penalty per tile played (The Tooth)
   */
  getGoldPenaltyPerTile(): number {
    if (!this.state.activeMandate) return 0
    if (this.state.activeMandate.effect.type === 'gold_per_tile') {
      return (this.state.activeMandate.effect.value as number) ?? 0
    }
    return 0
  }

  /**
   * Check if playing most-played yaku should zero gold (The Ox)
   */
  shouldZeroGoldForMostPlayedYaku(): boolean {
    if (!this.state.activeMandate) return false
    return this.state.activeMandate.effect.type === 'most_played_yaku_zeroes_gold'
  }

  /**
   * Check if first hand should be face-down (The House)
   */
  isFirstHandFaceDown(): boolean {
    if (!this.state.activeMandate) return false
    return (
      this.state.activeMandate.effect.type === 'first_hand_face_down' &&
      this.state.handsPlayed === 0
    )
  }

  /**
   * Get face-down tile ratio (The Wheel - 1 in N tiles face-down)
   */
  getFaceDownTileRatio(): number | null {
    if (!this.state.activeMandate) return null
    if (this.state.activeMandate.effect.type === 'tiles_face_down_ratio') {
      return (this.state.activeMandate.effect.value as number) ?? null
    }
    return null
  }

  /**
   * Check if tiles should be face-down after play (The Fish)
   */
  shouldTilesBeFaceDownAfterPlay(): boolean {
    if (!this.state.activeMandate) return false
    return this.state.activeMandate.effect.type === 'tiles_face_down_after_play'
  }

  /**
   * Get fixed draw count (The Serpent)
   */
  getFixedDrawCount(): number | null {
    if (!this.state.activeMandate) return null
    if (this.state.activeMandate.effect.type === 'fixed_draw_count') {
      return (this.state.activeMandate.effect.value as number) ?? null
    }
    return null
  }

  /**
   * Check if honor tiles should be face-down (The Mark)
   */
  areHonorTilesFaceDown(): boolean {
    if (!this.state.activeMandate) return false
    return this.state.activeMandate.effect.type === 'honor_tiles_face_down'
  }

  /**
   * Resolve whether a newly drawn tile is hidden by the active mandate.
   * Ratio checks consume the mandate's seeded RNG so identical runs reveal the
   * same information.
   */
  shouldTileBeFaceDown(
    tile: Tile,
    context: { isStartingHand?: boolean; afterHandPlay?: boolean } = {}
  ): boolean {
    if (!this.state.activeMandate) return false

    if (context.isStartingHand && this.isFirstHandFaceDown()) return true
    if (context.afterHandPlay && this.shouldTilesBeFaceDownAfterPlay()) return true
    if (this.areHonorTilesFaceDown() && tile.isHonor) return true

    const ratio = this.getFaceDownTileRatio()
    return ratio !== null && ratio > 0 && this.getRandom() < 1 / ratio
  }

  /**
   * Check if decree is disabled by mandate
   */
  isDecreeDisabled(decreeId: string): boolean {
    return this.state.disabledDecreeIds.has(decreeId)
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize mandate system state
   */
  toJSON(): {
    activeMandate: MandateDefinition | null
    isDefeated: boolean
    scoredYakuIds: string[]
    firstYakuType: string | null
    handsPlayed: number
    lockedTileIds: string[]
    disabledDecreeIds: string[]
    decreesShuffled: boolean
    shuffledDecreeIds: string[]
    allTilesDebuffed: boolean
    modifiedRedraws: number | null
    modifiedMaxHands: number | null
    requiredHandSize: number | null
    usedTileIds: string[]
  } {
    return {
      activeMandate: this.state.activeMandate,
      isDefeated: this.state.isDefeated,
      scoredYakuIds: Array.from(this.state.scoredYakuIds),
      firstYakuType: this.state.firstYakuType,
      handsPlayed: this.state.handsPlayed,
      lockedTileIds: Array.from(this.state.lockedTileIds),
      disabledDecreeIds: Array.from(this.state.disabledDecreeIds),
      decreesShuffled: this.state.decreesShuffled,
      shuffledDecreeIds: [...this.state.shuffledDecreeIds],
      allTilesDebuffed: this.state.allTilesDebuffed,
      modifiedRedraws: this.state.modifiedRedraws,
      modifiedMaxHands: this.state.modifiedMaxHands,
      requiredHandSize: this.state.requiredHandSize,
      usedTileIds: Array.from(this.state.usedTileIds),
    }
  }

  /**
   * Restore from serialized state
   */
  static fromJSON(data: {
    activeMandate: MandateDefinition | null
    isDefeated: boolean
    scoredYakuIds: string[]
    firstYakuType: string | null
    handsPlayed: number
    lockedTileIds: string[]
    disabledDecreeIds: string[]
    decreesShuffled: boolean
    shuffledDecreeIds?: string[]
    allTilesDebuffed: boolean
    modifiedRedraws: number | null
    modifiedMaxHands: number | null
    requiredHandSize: number | null
    usedTileIds: string[]
  }): MandateEffectSystem {
    const system = new MandateEffectSystem()
    system.state = {
      activeMandate: data.activeMandate,
      isDefeated: data.isDefeated,
      scoredYakuIds: new Set(data.scoredYakuIds),
      firstYakuType: data.firstYakuType,
      handsPlayed: data.handsPlayed,
      lockedTileIds: new Set(data.lockedTileIds),
      disabledDecreeIds: new Set(data.disabledDecreeIds),
      decreesShuffled: data.decreesShuffled,
      shuffledDecreeIds: [...(data.shuffledDecreeIds ?? [])],
      allTilesDebuffed: data.allTilesDebuffed,
      modifiedRedraws: data.modifiedRedraws,
      modifiedMaxHands: data.modifiedMaxHands,
      requiredHandSize: data.requiredHandSize,
      usedTileIds: new Set(data.usedTileIds),
    }
    return system
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get display information for a mandate
 */
export function getMandateDisplayInfo(mandate: MandateDefinition): {
  name: string
  japaneseName: string
  description: string
  difficulty: string
  category: string
} {
  return {
    name: mandate.name,
    japaneseName: mandate.japaneseName,
    description: mandate.description,
    difficulty: mandate.difficulty,
    category: mandate.category,
  }
}

/**
 * Check if a mandate is a showdown mandate
 */
export function isShowdownMandate(mandate: MandateDefinition): boolean {
  return mandate.category === 'Showdown'
}

/**
 * Get the severity color for a mandate difficulty
 */
export function getMandateDifficultyColor(
  difficulty: MandateDefinition['difficulty']
): string {
  switch (difficulty) {
    case 'Easy':
      return '#4CAF50' // Green
    case 'Medium':
      return '#FFD54F' // Yellow
    case 'Hard':
      return '#FF5722' // Orange
    case 'Extreme':
      return '#D84315' // Deep Orange/Red
    default:
      return '#A0A0A0' // Gray
  }
}
