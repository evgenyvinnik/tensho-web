/**
 * Debuff System for Tensho Mahjong Roguelike
 *
 * Handles debuffed tiles and decrees. A debuffed entity has its
 * scoring contributions and effects suppressed but can still
 * participate in structural validation.
 *
 * Based on ARCHITECTURE.MD section 18a (Debuffed Tiles) and 18b (Debuffed Decrees)
 */

import { Tile } from '../core/Tile'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Sources that can apply debuffs
 */
export type DebuffSource =
  | { type: 'mandate'; mandateId: string }
  | { type: 'season'; seasonId: string }
  | { type: 'script'; scriptId: string }
  | { type: 'sticker'; stickerId: string }
  | { type: 'system'; reason: string }

/**
 * State for the debuff system
 */
export interface DebuffState {
  /** Set of tile IDs that are currently debuffed */
  debuffedTileIds: Set<string>
  /** Set of decree IDs that are currently debuffed */
  debuffedDecreeIds: Set<string>
  /** Map of entity ID to the source that debuffed it */
  debuffSources: Map<string, DebuffSource>
}

/**
 * Known debuff sources from ARCHITECTURE.MD
 */
export enum KnownDebuffSource {
  /** The Drought: All simples (2-8) are debuffed */
  DROUGHT = 'drought',
  /** The Frost: All honor tiles are debuffed */
  FROST = 'frost',
  /** The Blight: Tiles drawn after redraw are debuffed */
  BLIGHT = 'blight',
  /** Mandate of Restriction: Specific suit debuffed for this round */
  MANDATE_RESTRICTION = 'mandate_restriction',
  /** Corrupted Season effect */
  CORRUPTED_SEASON = 'corrupted_season',
  /** Perishable sticker expired */
  PERISHABLE_EXPIRED = 'perishable_expired',
}

// =============================================================================
// DEBUFF SYSTEM CLASS
// =============================================================================

/**
 * Manages debuffed tiles and decrees
 *
 * Debuffed Tile behavior:
 * - Does NOT contribute base points
 * - Does NOT trigger Tile Mark effects
 * - Does NOT activate "On Scored" effects
 * - CAN still form valid melds
 * - CAN still trigger hand-based Decree effects
 *
 * Debuffed Decree behavior:
 * - Decree effect is completely disabled
 * - Edition bonuses on Decree are disabled
 * - Still counts for "number of Decrees" effects
 * - Still provides sell value for economy calculations
 */
export class DebuffSystem {
  private state: DebuffState

  constructor() {
    this.state = {
      debuffedTileIds: new Set(),
      debuffedDecreeIds: new Set(),
      debuffSources: new Map(),
    }
  }

  // ===========================================================================
  // TILE DEBUFF OPERATIONS
  // ===========================================================================

  /**
   * Debuff a tile
   * @param tileId The ID of the tile to debuff
   * @param source The source causing the debuff
   */
  debuffTile(tileId: string, source: DebuffSource): void {
    this.state.debuffedTileIds.add(tileId)
    this.state.debuffSources.set(`tile:${tileId}`, source)
  }

  /**
   * Debuff multiple tiles
   * @param tileIds Array of tile IDs to debuff
   * @param source The source causing the debuff
   */
  debuffTiles(tileIds: string[], source: DebuffSource): void {
    for (const tileId of tileIds) {
      this.debuffTile(tileId, source)
    }
  }

  /**
   * Remove debuff from a tile
   * @param tileId The ID of the tile to remove debuff from
   */
  removeDebuffFromTile(tileId: string): void {
    this.state.debuffedTileIds.delete(tileId)
    this.state.debuffSources.delete(`tile:${tileId}`)
  }

  /**
   * Remove debuffs from all tiles with a specific source
   * @param sourceType The type of source to match
   * @param sourceId The ID within the source type (e.g., mandateId, seasonId)
   */
  removeDebuffsBySource(
    sourceType: DebuffSource['type'],
    sourceId?: string
  ): void {
    const toRemove: string[] = []

    for (const [key, source] of this.state.debuffSources.entries()) {
      if (source.type === sourceType) {
        const matchesId =
          sourceId === undefined ||
          ('mandateId' in source && source.mandateId === sourceId) ||
          ('seasonId' in source && source.seasonId === sourceId) ||
          ('scriptId' in source && source.scriptId === sourceId) ||
          ('stickerId' in source && source.stickerId === sourceId) ||
          ('reason' in source && source.reason === sourceId)

        if (matchesId) {
          toRemove.push(key)
        }
      }
    }

    for (const key of toRemove) {
      this.state.debuffSources.delete(key)

      if (key.startsWith('tile:')) {
        const tileId = key.slice(5)
        this.state.debuffedTileIds.delete(tileId)
      } else if (key.startsWith('decree:')) {
        const decreeId = key.slice(7)
        this.state.debuffedDecreeIds.delete(decreeId)
      }
    }
  }

  /**
   * Check if a tile is debuffed
   * @param tileId The ID of the tile to check
   * @returns true if the tile is debuffed
   */
  isTileDebuffed(tileId: string): boolean {
    return this.state.debuffedTileIds.has(tileId)
  }

  /**
   * Get all debuffed tile IDs
   * @returns Set of debuffed tile IDs
   */
  getDebuffedTileIds(): Set<string> {
    return new Set(this.state.debuffedTileIds)
  }

  /**
   * Filter tiles to get only non-debuffed ones for scoring
   * @param tiles Array of tiles to filter
   * @returns Array of tiles that are not debuffed
   */
  filterNonDebuffedTiles(tiles: Tile[]): Tile[] {
    return tiles.filter((tile) => !this.isTileDebuffed(tile.id))
  }

  // ===========================================================================
  // DECREE DEBUFF OPERATIONS
  // ===========================================================================

  /**
   * Debuff a decree
   * @param decreeId The ID of the decree to debuff
   * @param source The source causing the debuff
   */
  debuffDecree(decreeId: string, source: DebuffSource): void {
    this.state.debuffedDecreeIds.add(decreeId)
    this.state.debuffSources.set(`decree:${decreeId}`, source)
  }

  /**
   * Remove debuff from a decree
   * @param decreeId The ID of the decree to remove debuff from
   */
  removeDebuffFromDecree(decreeId: string): void {
    this.state.debuffedDecreeIds.delete(decreeId)
    this.state.debuffSources.delete(`decree:${decreeId}`)
  }

  /**
   * Check if a decree is debuffed
   * @param decreeId The ID of the decree to check
   * @returns true if the decree is debuffed
   */
  isDecreeDebuffed(decreeId: string): boolean {
    return this.state.debuffedDecreeIds.has(decreeId)
  }

  /**
   * Get all debuffed decree IDs
   * @returns Set of debuffed decree IDs
   */
  getDebuffedDecreeIds(): Set<string> {
    return new Set(this.state.debuffedDecreeIds)
  }

  // ===========================================================================
  // SOURCE TRACKING
  // ===========================================================================

  /**
   * Get the source that debuffed an entity
   * @param entityType 'tile' or 'decree'
   * @param entityId The ID of the entity
   * @returns The debuff source, or undefined if not debuffed
   */
  getDebuffSource(
    entityType: 'tile' | 'decree',
    entityId: string
  ): DebuffSource | undefined {
    return this.state.debuffSources.get(`${entityType}:${entityId}`)
  }

  // ===========================================================================
  // BULK OPERATIONS FOR KNOWN DEBUFF SOURCES
  // ===========================================================================

  /**
   * Apply The Drought effect - debuff all simple tiles (2-8)
   * @param tiles Array of all tiles in the game
   */
  applyDrought(tiles: Tile[]): void {
    const source: DebuffSource = {
      type: 'season',
      seasonId: KnownDebuffSource.DROUGHT,
    }

    for (const tile of tiles) {
      if (tile.isSimple) {
        this.debuffTile(tile.id, source)
      }
    }
  }

  /**
   * Apply The Frost effect - debuff all honor tiles
   * @param tiles Array of all tiles in the game
   */
  applyFrost(tiles: Tile[]): void {
    const source: DebuffSource = {
      type: 'season',
      seasonId: KnownDebuffSource.FROST,
    }

    for (const tile of tiles) {
      if (tile.isHonor) {
        this.debuffTile(tile.id, source)
      }
    }
  }

  /**
   * Apply The Blight effect - debuff tiles drawn after redraw
   * @param tileIds Array of tile IDs drawn after redraw
   */
  applyBlight(tileIds: string[]): void {
    const source: DebuffSource = {
      type: 'season',
      seasonId: KnownDebuffSource.BLIGHT,
    }

    this.debuffTiles(tileIds, source)
  }

  /**
   * Apply Mandate of Restriction - debuff a specific suit
   * @param tiles Array of all tiles
   * @param suit The suit to debuff
   */
  applyMandateRestriction(tiles: Tile[], suit: string): void {
    const source: DebuffSource = {
      type: 'mandate',
      mandateId: `${KnownDebuffSource.MANDATE_RESTRICTION}_${suit}`,
    }

    for (const tile of tiles) {
      if (tile.suit === suit) {
        this.debuffTile(tile.id, source)
      }
    }
  }

  // ===========================================================================
  // INTEGRATION WITH SCORING
  // ===========================================================================

  /**
   * Calculate effective tile points considering debuffs
   * Debuffed tiles contribute 0 base points
   * @param tile The tile to get points for
   * @param getBaseTilePoints Function to calculate base tile points
   * @returns The effective points (0 if debuffed)
   */
  getEffectiveTilePoints(
    tile: Tile,
    getBaseTilePoints: (tile: Tile) => number
  ): number {
    if (this.isTileDebuffed(tile.id)) {
      return 0
    }
    return getBaseTilePoints(tile)
  }

  /**
   * Check if a tile should trigger "On Scored" effects
   * Debuffed tiles do not trigger these effects
   * @param tileId The ID of the tile
   * @returns true if the tile can trigger scoring effects
   */
  canTriggerScoringEffects(tileId: string): boolean {
    return !this.isTileDebuffed(tileId)
  }

  /**
   * Check if a tile should trigger Tile Mark effects
   * Debuffed tiles do not trigger these effects
   * @param tileId The ID of the tile
   * @returns true if the tile can trigger mark effects
   */
  canTriggerTileMarkEffects(tileId: string): boolean {
    return !this.isTileDebuffed(tileId)
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Clear all debuffs (typically at round end)
   */
  clearAllDebuffs(): void {
    this.state.debuffedTileIds.clear()
    this.state.debuffedDecreeIds.clear()
    this.state.debuffSources.clear()
  }

  /**
   * Clear only round-scoped debuffs (from seasons and mandates)
   * Debuffs from stickers persist across rounds
   */
  clearRoundScopedDebuffs(): void {
    this.removeDebuffsBySource('mandate')
    this.removeDebuffsBySource('season')
  }

  /**
   * Get the current state (for serialization)
   */
  getState(): DebuffState {
    return {
      debuffedTileIds: new Set(this.state.debuffedTileIds),
      debuffedDecreeIds: new Set(this.state.debuffedDecreeIds),
      debuffSources: new Map(this.state.debuffSources),
    }
  }

  /**
   * Restore from a serialized state
   */
  setState(state: DebuffState): void {
    this.state = {
      debuffedTileIds: new Set(state.debuffedTileIds),
      debuffedDecreeIds: new Set(state.debuffedDecreeIds),
      debuffSources: new Map(state.debuffSources),
    }
  }

  /**
   * Serialize to JSON-compatible format
   */
  toJSON(): {
    debuffedTileIds: string[]
    debuffedDecreeIds: string[]
    debuffSources: Array<[string, DebuffSource]>
  } {
    return {
      debuffedTileIds: Array.from(this.state.debuffedTileIds),
      debuffedDecreeIds: Array.from(this.state.debuffedDecreeIds),
      debuffSources: Array.from(this.state.debuffSources.entries()),
    }
  }

  /**
   * Restore from JSON-compatible format
   */
  static fromJSON(data: {
    debuffedTileIds: string[]
    debuffedDecreeIds: string[]
    debuffSources: Array<[string, DebuffSource]>
  }): DebuffSystem {
    const system = new DebuffSystem()
    system.state = {
      debuffedTileIds: new Set(data.debuffedTileIds),
      debuffedDecreeIds: new Set(data.debuffedDecreeIds),
      debuffSources: new Map(data.debuffSources),
    }
    return system
  }
}
