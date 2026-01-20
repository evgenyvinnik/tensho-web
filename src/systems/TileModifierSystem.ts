/**
 * Tile Modifier System for Tensho Mahjong Roguelike
 *
 * Manages the application and lifecycle of tile modifiers.
 * Handles:
 * - Applying/removing enhancements, seals, and editions
 * - Glass tile shattering
 * - Consumable creation from seals
 * - Modifier scoring calculations
 */

import { Tile, EnhancementType, SealType, EditionType } from '../core/Tile'
import {
  TileModifiers,
  calculateModifierEffects,
  ModifierScoringResult,
  getRandomEnhancement,
  getRandomSeal,
  getRandomEdition,
  ENHANCEMENT_DEFINITIONS,
  SEAL_DEFINITIONS,
  EDITION_DEFINITIONS,
} from '../core/TileModifier'
import { eventBus } from '../game/EventBus'

// =============================================================================
// TILE MODIFIER STORE
// =============================================================================

/**
 * Store for managing tile modifiers across the game
 * Uses a Map to track modifiers by tile ID since Tile is immutable
 */
export interface TileModifierStore {
  /** Map of tile ID to modifiers */
  modifiers: Map<string, TileModifiers>

  /** Tiles that have shattered (removed from play) */
  shatteredTileIds: Set<string>

  /** Consumables created by seals */
  pendingConsumables: Array<{ type: 'orb' | 'seal'; tileId: string }>
}

/**
 * Create initial modifier store
 */
export function createModifierStore(): TileModifierStore {
  return {
    modifiers: new Map(),
    shatteredTileIds: new Set(),
    pendingConsumables: [],
  }
}

// =============================================================================
// TILE MODIFIER SYSTEM
// =============================================================================

/**
 * TileModifierSystem manages all tile modifier operations
 */
export class TileModifierSystem {
  private store: TileModifierStore

  constructor() {
    this.store = createModifierStore()
  }

  // ===========================================================================
  // STATE ACCESS
  // ===========================================================================

  /**
   * Get modifiers for a tile
   */
  getModifiers(tileId: string): TileModifiers | undefined {
    return this.store.modifiers.get(tileId)
  }

  /**
   * Check if a tile has shattered
   */
  isShattered(tileId: string): boolean {
    return this.store.shatteredTileIds.has(tileId)
  }

  /**
   * Get pending consumables and clear the queue
   */
  consumePendingConsumables(): Array<{ type: 'orb' | 'seal'; tileId: string }> {
    const consumables = [...this.store.pendingConsumables]
    this.store.pendingConsumables = []
    return consumables
  }

  /**
   * Get all tiles with a specific enhancement
   */
  getTilesWithEnhancement(enhancement: EnhancementType): string[] {
    const result: string[] = []
    for (const [tileId, mods] of this.store.modifiers) {
      if (mods.enhancement === enhancement) {
        result.push(tileId)
      }
    }
    return result
  }

  /**
   * Get all tiles with a specific seal
   */
  getTilesWithSeal(seal: SealType): string[] {
    const result: string[] = []
    for (const [tileId, mods] of this.store.modifiers) {
      if (mods.seal === seal) {
        result.push(tileId)
      }
    }
    return result
  }

  /**
   * Get all tiles with a specific edition
   */
  getTilesWithEdition(edition: EditionType): string[] {
    const result: string[] = []
    for (const [tileId, mods] of this.store.modifiers) {
      if (mods.edition === edition) {
        result.push(tileId)
      }
    }
    return result
  }

  // ===========================================================================
  // MODIFIER APPLICATION
  // ===========================================================================

  /**
   * Apply an enhancement to a tile
   */
  applyEnhancement(tile: Tile, enhancement: EnhancementType): Tile {
    const currentMods = this.store.modifiers.get(tile.id) || { ...tile.modifiers }
    const newMods: TileModifiers = { ...currentMods, enhancement }
    this.store.modifiers.set(tile.id, newMods)

    eventBus.emit('tileModified' as any, {
      tileId: tile.id,
      modifierType: 'enhancement',
      value: enhancement,
    })

    return tile.withEnhancement(enhancement)
  }

  /**
   * Apply a seal to a tile
   */
  applySeal(tile: Tile, seal: SealType): Tile {
    const currentMods = this.store.modifiers.get(tile.id) || { ...tile.modifiers }
    const newMods: TileModifiers = { ...currentMods, seal }
    this.store.modifiers.set(tile.id, newMods)

    eventBus.emit('tileModified' as any, {
      tileId: tile.id,
      modifierType: 'seal',
      value: seal,
    })

    return tile.withSeal(seal)
  }

  /**
   * Apply an edition to a tile
   */
  applyEdition(tile: Tile, edition: EditionType): Tile {
    const currentMods = this.store.modifiers.get(tile.id) || { ...tile.modifiers }
    const newMods: TileModifiers = { ...currentMods, edition }
    this.store.modifiers.set(tile.id, newMods)

    eventBus.emit('tileModified' as any, {
      tileId: tile.id,
      modifierType: 'edition',
      value: edition,
    })

    return tile.withEdition(edition)
  }

  /**
   * Apply a random enhancement to a tile
   */
  applyRandomEnhancement(tile: Tile): Tile {
    const enhancement = getRandomEnhancement()
    return this.applyEnhancement(tile, enhancement)
  }

  /**
   * Apply a random seal to a tile
   */
  applyRandomSeal(tile: Tile): Tile {
    const seal = getRandomSeal()
    return this.applySeal(tile, seal)
  }

  /**
   * Apply a random edition to a tile
   */
  applyRandomEdition(tile: Tile): Tile {
    const edition = getRandomEdition()
    return this.applyEdition(tile, edition)
  }

  /**
   * Remove all modifiers from a tile
   */
  clearModifiers(tile: Tile): Tile {
    this.store.modifiers.delete(tile.id)

    eventBus.emit('tileModified' as any, {
      tileId: tile.id,
      modifierType: 'cleared',
      value: null,
    })

    return tile.withoutModifiers()
  }

  // ===========================================================================
  // SCORING INTEGRATION
  // ===========================================================================

  /**
   * Calculate modifier effects when a tile is played/scored
   */
  onTilePlayed(tile: Tile): ModifierScoringResult {
    const result = calculateModifierEffects(tile.modifiers, 'played')

    // Handle shattering for Glass tiles
    if (result.shattered) {
      this.shatterTile(tile)
    }

    return result
  }

  /**
   * Calculate modifier effects for tiles held in hand
   */
  onTileHeld(tile: Tile): ModifierScoringResult {
    return calculateModifierEffects(tile.modifiers, 'held')
  }

  /**
   * Calculate modifier effects when a tile is discarded
   */
  onTileDiscarded(tile: Tile): ModifierScoringResult {
    const result = calculateModifierEffects(tile.modifiers, 'discarded')

    // Handle consumable creation
    if (result.createdConsumable !== 'none') {
      this.store.pendingConsumables.push({
        type: result.createdConsumable,
        tileId: tile.id,
      })

      eventBus.emit('consumableCreated' as any, {
        type: result.createdConsumable,
        source: 'seal',
        tileId: tile.id,
      })
    }

    return result
  }

  /**
   * Calculate modifier effects for winning hand tiles
   */
  onTileWon(tile: Tile): ModifierScoringResult {
    const result = calculateModifierEffects(tile.modifiers, 'won')

    // Handle consumable creation
    if (result.createdConsumable !== 'none') {
      this.store.pendingConsumables.push({
        type: result.createdConsumable,
        tileId: tile.id,
      })

      eventBus.emit('consumableCreated' as any, {
        type: result.createdConsumable,
        source: 'seal',
        tileId: tile.id,
      })
    }

    return result
  }

  /**
   * Process retriggers for a tile (Red Seal)
   */
  getRetriggerCount(tile: Tile): number {
    return tile.retriggers
  }

  // ===========================================================================
  // TILE LIFECYCLE
  // ===========================================================================

  /**
   * Mark a tile as shattered (Glass mark effect)
   */
  shatterTile(tile: Tile): void {
    this.store.shatteredTileIds.add(tile.id)

    eventBus.emit('tileShattered' as any, {
      tileId: tile.id,
      tileName: tile.toString(),
    })
  }

  /**
   * Calculate total gold from Gold Mark tiles at round end
   */
  calculateGoldMarkBonus(heldTiles: Tile[]): number {
    let totalGold = 0

    for (const tile of heldTiles) {
      if (tile.enhancement === EnhancementType.Gold) {
        totalGold += ENHANCEMENT_DEFINITIONS[EnhancementType.Gold].goldBonus
      }
    }

    return totalGold
  }

  /**
   * Calculate total Negative edition decree slots
   */
  countNegativeEditions(tiles: Tile[]): number {
    let count = 0
    for (const tile of tiles) {
      if (tile.edition === EditionType.Negative) {
        count++
      }
    }
    return count
  }

  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  /**
   * Score multiple tiles with modifiers
   * Returns total chips, mult, and multiplier from all tiles
   */
  scoreTilesWithModifiers(
    tiles: Tile[],
    context: 'played' | 'held'
  ): {
    totalChips: number
    totalMult: number
    totalMultiplier: number
    totalGold: number
    shatteredTileIds: string[]
    consumables: Array<{ type: 'orb' | 'seal'; tileId: string }>
  } {
    let totalChips = 0
    let totalMult = 0
    let totalMultiplier = 1
    let totalGold = 0
    const shatteredTileIds: string[] = []
    const consumables: Array<{ type: 'orb' | 'seal'; tileId: string }> = []

    for (const tile of tiles) {
      // Skip shattered tiles
      if (this.isShattered(tile.id)) continue

      const result = context === 'played' ? this.onTilePlayed(tile) : this.onTileHeld(tile)

      // Handle retriggers (Red Seal)
      const retriggers = this.getRetriggerCount(tile)
      const triggerCount = 1 + retriggers

      for (let i = 0; i < triggerCount; i++) {
        totalChips += result.chipBonus
        totalMult += result.multBonus
        totalMultiplier *= result.multMultiplier
        totalGold += result.goldBonus
      }

      if (result.shattered) {
        shatteredTileIds.push(tile.id)
      }

      if (result.createdConsumable !== 'none') {
        consumables.push({
          type: result.createdConsumable,
          tileId: tile.id,
        })
      }
    }

    return {
      totalChips,
      totalMult,
      totalMultiplier,
      totalGold,
      shatteredTileIds,
      consumables,
    }
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize store for saving
   */
  serialize(): object {
    return {
      modifiers: Array.from(this.store.modifiers.entries()),
      shatteredTileIds: Array.from(this.store.shatteredTileIds),
      pendingConsumables: this.store.pendingConsumables,
    }
  }

  /**
   * Deserialize store from saved data
   */
  deserialize(data: any): void {
    if (data.modifiers) {
      this.store.modifiers = new Map(data.modifiers)
    }
    if (data.shatteredTileIds) {
      this.store.shatteredTileIds = new Set(data.shatteredTileIds)
    }
    if (data.pendingConsumables) {
      this.store.pendingConsumables = data.pendingConsumables
    }
  }

  /**
   * Reset system state
   */
  reset(): void {
    this.store = createModifierStore()
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global tile modifier system instance
 */
export const tileModifierSystem = new TileModifierSystem()

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get modifier summary for display
 */
export function getModifierSummary(tile: Tile): string[] {
  const parts: string[] = []

  if (tile.enhancement !== EnhancementType.None) {
    const def = ENHANCEMENT_DEFINITIONS[tile.enhancement]
    parts.push(`${def.name}: ${def.description}`)
  }

  if (tile.seal !== SealType.None) {
    const def = SEAL_DEFINITIONS[tile.seal]
    parts.push(`${def.name}: ${def.description}`)
  }

  if (tile.edition !== EditionType.Base) {
    const def = EDITION_DEFINITIONS[tile.edition]
    parts.push(`${def.name}: ${def.description}`)
  }

  return parts
}

/**
 * Check if any tile in array has modifiers
 */
export function anyTileHasModifiers(tiles: Tile[]): boolean {
  return tiles.some((tile) => tile.hasModifiers)
}

/**
 * Count tiles with modifiers
 */
export function countModifiedTiles(tiles: Tile[]): number {
  return tiles.filter((tile) => tile.hasModifiers).length
}

/**
 * Get total additional decree slots from Negative editions
 */
export function getExtraDecreeSlots(tiles: Tile[]): number {
  return tiles.filter((tile) => tile.edition === EditionType.Negative).length
}
