/**
 * Blessing Pack System for Tensho Mahjong Roguelike
 *
 * Blessing Packs (祝福袋) are booster packs containing mixed upgrades.
 * Two packs appear per Tea House visit.
 *
 * Features:
 * - Pack generation favors player's dominant yaku style
 * - Skipping synergizes with certain Decrees
 * - Pack content weighted by current authority layer
 *
 * Pack Types:
 * - Arcana Pack (秘術袋): Fate Seals - Immediate use
 * - Celestial Pack (天球袋): Celestial Orbs - Immediate use
 * - Tile Pack (牌袋): Tiles with modifiers - Added to Wall
 * - Decree Pack (法令袋): Decree cards - Added to slots
 * - Void Pack (虚空袋): Void Scripts - Immediate use
 */

import { PackType, PackSize, BlessingPack, Decree, DecreeRarity } from './types'
import { ALL_DECREES } from './DecreeSystem'
import {
  PACK_TYPE_DEFINITIONS,
  PACK_SIZE_DEFINITIONS,
  PACK_SIZE_WEIGHTS,
  PACK_TYPE_WEIGHT_BY_SIZE,
  DEFAULT_CONTENT_RARITY_WEIGHTS,
  MEGA_CONTENT_RARITY_WEIGHTS,
  YakuStyle,
  getAdjustedPackTypeWeights,
  SKIP_SYNERGY_DECREES,
  ContentRarityWeights,
} from '../config/packDefinitions'
import { getFateSealsByRarity, FateSeal } from './FateSealSystem'
import { getCelestialOrbsByRarity, CelestialOrb } from './CelestialOrbSystem'
import { getVoidScriptsByRarity, VoidScript } from './VoidScriptSystem'
import { ConsumableRarity } from './ConsumableSystem'

// =============================================================================
// PACK CONTENT TYPES
// =============================================================================

/**
 * Generic pack content item
 */
export interface PackContent {
  id: string
  type: 'FateSeal' | 'CelestialOrb' | 'Tile' | 'Decree' | 'VoidScript'
  name: string
  description: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  data: unknown
}

/**
 * Pack offering with contents ready for selection
 */
export interface PackOffering {
  pack: BlessingPack
  contents: PackContent[]
  isOpened: boolean
  selectedIndices: number[]
  maxSelections: number
}

/**
 * Pack generation options
 */
export interface PackGenerationOptions {
  yakuStyle?: YakuStyle
  flowerCount?: number
  ownedDecreeIds?: string[]
  currentAct?: number
  excludeTypes?: PackType[]
}

// =============================================================================
// BLESSING PACK SYSTEM CLASS
// =============================================================================

/**
 * Manages blessing pack generation and opening
 */
export class BlessingPackSystem {
  private currentOfferings: PackOffering[] = []
  private skipCount: number = 0
  private totalPacksOpened: number = 0
  private packsPerVisit: number = 2

  constructor() {
    this.clear()
  }

  /**
   * Get the number of packs per Tea House visit
   */
  getPacksPerVisit(): number {
    return this.packsPerVisit
  }

  /**
   * Set the number of packs per visit (can be modified by charters)
   */
  setPacksPerVisit(count: number): void {
    this.packsPerVisit = count
  }

  /**
   * Generate pack offerings for a shop visit
   */
  generatePackOfferings(options: PackGenerationOptions = {}): PackOffering[] {
    this.currentOfferings = []

    for (let i = 0; i < this.packsPerVisit; i++) {
      const pack = this.generatePack(options)
      const contents = this.generatePackContents(pack, options)

      this.currentOfferings.push({
        pack,
        contents,
        isOpened: false,
        selectedIndices: [],
        maxSelections: pack.selectCount,
      })
    }

    return [...this.currentOfferings]
  }

  /**
   * Generate a single blessing pack
   */
  private generatePack(options: PackGenerationOptions = {}): BlessingPack {
    // First determine the pack size
    const size = this.selectPackSize()

    // Then determine the pack type based on size weights
    const type = this.selectPackType(size, options)

    const sizeInfo = PACK_SIZE_DEFINITIONS[size]

    return {
      id: `pack-${type}-${size}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      size,
      cost: sizeInfo.cost,
      choiceCount: sizeInfo.choiceCount,
      selectCount: sizeInfo.selectCount,
    }
  }

  /**
   * Select pack size based on weights
   */
  private selectPackSize(): PackSize {
    return this.selectWeightedRandom(PACK_SIZE_WEIGHTS) as PackSize
  }

  /**
   * Select pack type based on size and yaku style
   */
  private selectPackType(size: PackSize, options: PackGenerationOptions = {}): PackType {
    let weights = { ...PACK_TYPE_WEIGHT_BY_SIZE[size] }

    // Apply yaku style bias if provided
    if (options.yakuStyle) {
      weights = getAdjustedPackTypeWeights(weights, options.yakuStyle)
    }

    // Filter out excluded types
    if (options.excludeTypes) {
      for (const excludeType of options.excludeTypes) {
        delete weights[excludeType]
      }
    }

    return this.selectWeightedRandom(weights) as PackType
  }

  /**
   * Generate contents for a pack
   */
  private generatePackContents(
    pack: BlessingPack,
    options: PackGenerationOptions = {}
  ): PackContent[] {
    const contents: PackContent[] = []
    const rarityWeights =
      pack.size === 'Mega' ? MEGA_CONTENT_RARITY_WEIGHTS : DEFAULT_CONTENT_RARITY_WEIGHTS

    for (let i = 0; i < pack.choiceCount; i++) {
      const content = this.generateSingleContent(pack.type, rarityWeights, options, contents)
      if (content) {
        contents.push(content)
      }
    }

    return contents
  }

  /**
   * Generate a single content item
   */
  private generateSingleContent(
    packType: PackType,
    rarityWeights: ContentRarityWeights,
    options: PackGenerationOptions,
    existingContents: PackContent[]
  ): PackContent | null {
    const rarity = this.selectWeightedRandom(rarityWeights) as keyof ContentRarityWeights

    switch (packType) {
      case 'Arcana':
        return this.generateFateSealContent(rarity, existingContents)
      case 'Celestial':
        return this.generateCelestialOrbContent(rarity, existingContents)
      case 'Tile':
        return this.generateTileContent(rarity, existingContents)
      case 'Decree':
        return this.generateDecreeContent(rarity, options.ownedDecreeIds || [], existingContents)
      case 'Void':
        return this.generateVoidScriptContent(rarity, existingContents)
      default:
        return null
    }
  }

  /**
   * Generate a Fate Seal content item
   */
  private generateFateSealContent(
    rarity: keyof ContentRarityWeights,
    existingContents: PackContent[]
  ): PackContent {
    // Map content rarity to consumable rarity
    const consumableRarity = this.mapToConsumableRarity(rarity)
    const fateSeals = getFateSealsByRarity(consumableRarity)
    const existingIds = new Set(existingContents.map((c) => c.id))

    // Filter out already-present seals
    const available = fateSeals.filter((seal) => !existingIds.has(seal.id))
    const selected = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : fateSeals[0]

    if (!selected) {
      // Fallback if no seals of this rarity
      const allSeals = getFateSealsByRarity('Common')
      const fallback = allSeals[Math.floor(Math.random() * allSeals.length)]
      return {
        id: `fate-seal-${fallback.id}-${Date.now()}`,
        type: 'FateSeal',
        name: fallback.name,
        description: fallback.description,
        rarity,
        data: fallback,
      }
    }

    return {
      id: `fate-seal-${selected.id}-${Date.now()}`,
      type: 'FateSeal',
      name: selected.name,
      description: selected.description,
      rarity,
      data: selected,
    }
  }

  /**
   * Map content rarity to consumable rarity
   */
  private mapToConsumableRarity(rarity: keyof ContentRarityWeights): ConsumableRarity {
    switch (rarity) {
      case 'common':
        return 'Common'
      case 'uncommon':
        return 'Uncommon'
      case 'rare':
        return 'Rare'
      case 'legendary':
        return 'Legendary'
      default:
        return 'Common'
    }
  }

  /**
   * Generate a Celestial Orb content item
   */
  private generateCelestialOrbContent(
    rarity: keyof ContentRarityWeights,
    existingContents: PackContent[]
  ): PackContent {
    const consumableRarity = this.mapToConsumableRarity(rarity)
    const orbs = getCelestialOrbsByRarity(consumableRarity)
    const existingIds = new Set(existingContents.map((c) => c.id))
    const available = orbs.filter((orb) => !existingIds.has(orb.id))
    const selected = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : orbs[0]

    if (!selected) {
      // Fallback if no orbs of this rarity
      const allOrbs = getCelestialOrbsByRarity('Common')
      const fallback = allOrbs[Math.floor(Math.random() * allOrbs.length)]
      return {
        id: `celestial-orb-${fallback.id}-${Date.now()}`,
        type: 'CelestialOrb',
        name: fallback.name,
        description: fallback.description,
        rarity,
        data: fallback,
      }
    }

    return {
      id: `celestial-orb-${selected.id}-${Date.now()}`,
      type: 'CelestialOrb',
      name: selected.name,
      description: selected.description,
      rarity,
      data: selected,
    }
  }

  /**
   * Generate a Tile content item
   */
  private generateTileContent(
    rarity: keyof ContentRarityWeights,
    existingContents: PackContent[]
  ): PackContent {
    const tiles = this.getModifiedTilesByRarity(rarity)
    const existingIds = new Set(existingContents.map((c) => c.id))
    const available = tiles.filter((tile) => !existingIds.has(tile.id))
    const selected = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : tiles[0]

    return {
      id: `tile-${selected.id}-${Date.now()}`,
      type: 'Tile',
      name: selected.name,
      description: selected.description,
      rarity,
      data: selected,
    }
  }

  /**
   * Get placeholder modified tiles by rarity
   */
  private getModifiedTilesByRarity(
    rarity: keyof ContentRarityWeights
  ): { id: string; name: string; description: string; modifier: string }[] {
    const tiles: Record<keyof ContentRarityWeights, { id: string; name: string; description: string; modifier: string }[]> = {
      common: [
        { id: 'bonus_tile', name: 'Bonus Tile', description: 'A random tile with +10 base points.', modifier: 'bonus' },
        { id: 'lucky_tile', name: 'Lucky Tile', description: 'A random tile that grants +2 Gold when scored.', modifier: 'gold' },
      ],
      uncommon: [
        { id: 'lacquered_tile', name: 'Lacquered Tile', description: 'A tile with +5% score per meld containing it.', modifier: 'lacquered' },
        { id: 'jade_tile', name: 'Jade Tile', description: 'A tile that counts as honor for yaku checks.', modifier: 'jade' },
      ],
      rare: [
        { id: 'foil_tile', name: 'Foil Tile', description: 'A tile with Foil edition (+50 base points).', modifier: 'foil' },
        { id: 'holographic_tile', name: 'Holographic Tile', description: 'A tile with Holographic edition (+10 Mult).', modifier: 'holographic' },
      ],
      legendary: [
        { id: 'polychrome_tile', name: 'Polychrome Tile', description: 'A tile with Polychrome edition (x1.5 Mult).', modifier: 'polychrome' },
        { id: 'negative_tile', name: 'Negative Tile', description: 'A tile with Negative edition (+1 Decree slot).', modifier: 'negative' },
      ],
    }

    return tiles[rarity] || tiles.common
  }

  /**
   * Generate a Decree content item
   */
  private generateDecreeContent(
    rarity: keyof ContentRarityWeights,
    ownedDecreeIds: string[],
    existingContents: PackContent[]
  ): PackContent {
    // Map content rarity to decree rarity
    const decreeRarity = this.mapToDecreeRarity(rarity)

    // Get available decrees
    const existingIds = new Set(existingContents.filter((c) => c.type === 'Decree').map((c) => (c.data as Decree).id))
    const excludeIds = new Set([...ownedDecreeIds, ...Array.from(existingIds)])

    let candidates = ALL_DECREES.filter(
      (d) => d.rarity === decreeRarity && !excludeIds.has(d.id)
    )

    // Fallback if no candidates
    if (candidates.length === 0) {
      candidates = ALL_DECREES.filter((d) => !excludeIds.has(d.id))
    }

    if (candidates.length === 0) {
      // All decrees owned, return a duplicate
      candidates = ALL_DECREES.filter((d) => d.rarity === decreeRarity)
    }

    const selected = candidates[Math.floor(Math.random() * candidates.length)]

    return {
      id: `decree-${selected.id}-${Date.now()}`,
      type: 'Decree',
      name: selected.name,
      description: selected.description,
      rarity,
      data: selected,
    }
  }

  /**
   * Map content rarity to decree rarity
   */
  private mapToDecreeRarity(rarity: keyof ContentRarityWeights): DecreeRarity {
    switch (rarity) {
      case 'common':
        return 'LocalEdict'
      case 'uncommon':
        return 'RegionalMandate'
      case 'rare':
        return 'ImperialDecree'
      case 'legendary':
        return 'HeavenlyOrdinance'
      default:
        return 'LocalEdict'
    }
  }

  /**
   * Generate a Void Script content item
   */
  private generateVoidScriptContent(
    rarity: keyof ContentRarityWeights,
    existingContents: PackContent[]
  ): PackContent {
    const consumableRarity = this.mapToConsumableRarity(rarity)
    const scripts = getVoidScriptsByRarity(consumableRarity)
    const existingIds = new Set(existingContents.map((c) => c.id))
    const available = scripts.filter((script) => !existingIds.has(script.id))
    const selected = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : scripts[0]

    if (!selected) {
      // Fallback if no scripts of this rarity
      const allScripts = getVoidScriptsByRarity('Common')
      const fallback = allScripts[Math.floor(Math.random() * allScripts.length)]
      return {
        id: `void-script-${fallback.id}-${Date.now()}`,
        type: 'VoidScript',
        name: fallback.name,
        description: fallback.description,
        rarity,
        data: fallback,
      }
    }

    return {
      id: `void-script-${selected.id}-${Date.now()}`,
      type: 'VoidScript',
      name: selected.name,
      description: selected.description,
      rarity,
      data: selected,
    }
  }

  /**
   * Open a pack and reveal its contents
   */
  openPack(packId: string): PackOffering | null {
    const offering = this.currentOfferings.find((o) => o.pack.id === packId)
    if (!offering || offering.isOpened) {
      return null
    }

    offering.isOpened = true
    this.totalPacksOpened++

    return { ...offering }
  }

  /**
   * Select content from an opened pack
   */
  selectContent(packId: string, contentIndex: number): boolean {
    const offering = this.currentOfferings.find((o) => o.pack.id === packId)
    if (!offering || !offering.isOpened) {
      return false
    }

    if (offering.selectedIndices.length >= offering.maxSelections) {
      return false
    }

    if (contentIndex < 0 || contentIndex >= offering.contents.length) {
      return false
    }

    if (offering.selectedIndices.includes(contentIndex)) {
      return false
    }

    offering.selectedIndices.push(contentIndex)
    return true
  }

  /**
   * Deselect content from an opened pack
   */
  deselectContent(packId: string, contentIndex: number): boolean {
    const offering = this.currentOfferings.find((o) => o.pack.id === packId)
    if (!offering || !offering.isOpened) {
      return false
    }

    const index = offering.selectedIndices.indexOf(contentIndex)
    if (index === -1) {
      return false
    }

    offering.selectedIndices.splice(index, 1)
    return true
  }

  /**
   * Confirm pack selection and get selected contents
   */
  confirmSelection(packId: string): PackContent[] {
    const offering = this.currentOfferings.find((o) => o.pack.id === packId)
    if (!offering || !offering.isOpened) {
      return []
    }

    return offering.selectedIndices.map((i) => offering.contents[i])
  }

  /**
   * Skip pack selection (for synergy with certain decrees)
   */
  skipPack(packId: string): void {
    const offering = this.currentOfferings.find((o) => o.pack.id === packId)
    if (offering && offering.isOpened) {
      this.skipCount++
      // Clear any partial selections
      offering.selectedIndices = []
    }
  }

  /**
   * Get skip synergy bonuses for owned decrees
   */
  getSkipBonuses(ownedDecreeIds: string[]): {
    totalMultBonus: number
    totalGoldBonus: number
    totalScalingBonus: number
  } {
    let totalMultBonus = 0
    let totalGoldBonus = 0
    let totalScalingBonus = 0

    for (const synergy of SKIP_SYNERGY_DECREES) {
      if (ownedDecreeIds.includes(synergy.decreeId)) {
        switch (synergy.bonusType) {
          case 'mult':
            totalMultBonus += synergy.bonusValue * this.skipCount
            break
          case 'gold':
            totalGoldBonus += synergy.bonusValue * this.skipCount
            break
          case 'scaling':
            totalScalingBonus += synergy.bonusValue * this.skipCount
            break
        }
      }
    }

    return { totalMultBonus, totalGoldBonus, totalScalingBonus }
  }

  /**
   * Get current pack offerings
   */
  getCurrentOfferings(): PackOffering[] {
    return [...this.currentOfferings]
  }

  /**
   * Get total packs opened this run
   */
  getTotalPacksOpened(): number {
    return this.totalPacksOpened
  }

  /**
   * Get total skips this run
   */
  getSkipCount(): number {
    return this.skipCount
  }

  /**
   * Clear all pack state
   */
  clear(): void {
    this.currentOfferings = []
    this.skipCount = 0
    this.totalPacksOpened = 0
    this.packsPerVisit = 2
  }

  /**
   * Helper: Select a random item based on weights
   */
  private selectWeightedRandom(weights: Record<string, number>): string {
    const entries = Object.entries(weights)
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0)
    let random = Math.random() * totalWeight

    for (const [key, weight] of entries) {
      random -= weight
      if (random <= 0) {
        return key
      }
    }

    return entries[0][0]
  }

  /**
   * Serialize pack system state
   */
  toState(): {
    currentOfferings: PackOffering[]
    skipCount: number
    totalPacksOpened: number
    packsPerVisit: number
  } {
    return {
      currentOfferings: this.currentOfferings.map((o) => ({
        ...o,
        contents: [...o.contents],
        selectedIndices: [...o.selectedIndices],
      })),
      skipCount: this.skipCount,
      totalPacksOpened: this.totalPacksOpened,
      packsPerVisit: this.packsPerVisit,
    }
  }

  /**
   * Restore from serialized state
   */
  static fromState(state: {
    currentOfferings: PackOffering[]
    skipCount: number
    totalPacksOpened: number
    packsPerVisit: number
  }): BlessingPackSystem {
    const system = new BlessingPackSystem()
    system.currentOfferings = state.currentOfferings.map((o) => ({
      ...o,
      contents: [...o.contents],
      selectedIndices: [...o.selectedIndices],
    }))
    system.skipCount = state.skipCount
    system.totalPacksOpened = state.totalPacksOpened
    system.packsPerVisit = state.packsPerVisit
    return system
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get pack type info for display
 */
export function getPackTypeInfo(type: PackType): {
  name: string
  japaneseName: string
  description: string
  contentType: 'immediate' | 'added_to_wall' | 'added_to_slots'
} {
  return PACK_TYPE_DEFINITIONS[type]
}

/**
 * Get pack size info for display
 */
export function getPackSizeInfo(size: PackSize): {
  name: string
  cost: number
  choiceCount: number
  selectCount: number
  description: string
} {
  return PACK_SIZE_DEFINITIONS[size]
}

/**
 * Calculate if player can afford a pack
 */
export function canAffordPack(pack: BlessingPack, gold: number, discount: number = 0): boolean {
  const effectiveCost = Math.max(1, Math.floor(pack.cost * (1 - discount / 100)))
  return gold >= effectiveCost
}

/**
 * Get the effective cost of a pack with discount
 */
export function getPackEffectiveCost(pack: BlessingPack, discount: number = 0): number {
  return Math.max(1, Math.floor(pack.cost * (1 - discount / 100)))
}
