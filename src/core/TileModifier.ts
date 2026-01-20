/**
 * Tile Modifier System for Tensho Mahjong Roguelike
 *
 * Implements Balatro-style card modifiers adapted for Mahjong:
 * - Enhancements (Marks): Bonus, Mult, Wild, Glass, Steel, Stone, Gold, Lucky
 * - Seals: Gold, Red, Blue, Purple
 * - Editions: Base, Foil, Holographic, Polychrome, Negative
 *
 * Each tile can have ONE enhancement, ONE seal, and ONE edition.
 * Effects stack multiplicatively where appropriate.
 */

// =============================================================================
// ENHANCEMENT TYPES (Marks)
// =============================================================================

/**
 * Enhancement types that can be applied to tiles
 * Only ONE enhancement per tile
 */
export enum EnhancementType {
  None = 'none',
  Bonus = 'bonus', // +30 Chips when scored
  Mult = 'mult', // +4 Mult when scored
  Wild = 'wild', // Counts as every suit
  Glass = 'glass', // ×2 Mult when scored, 1/4 chance to shatter
  Steel = 'steel', // ×1.5 Mult while held in hand (not when played)
  Stone = 'stone', // +50 Chips, always scores (no rank/suit)
  Gold = 'gold', // ¥3 at end of round if in hand
  Lucky = 'lucky', // 1/5 chance for +20 Mult, 1/15 chance for ¥20
}

/**
 * Enhancement definition with effects
 */
export interface EnhancementDefinition {
  type: EnhancementType
  name: string
  japaneseName: string
  description: string
  chipBonus: number
  multBonus: number
  multMultiplier: number // Multiplicative mult (e.g., ×2 for Glass)
  goldBonus: number
  special: 'none' | 'wild' | 'shatter' | 'held' | 'always_scores' | 'lucky'
}

/**
 * Enhancement definitions
 */
export const ENHANCEMENT_DEFINITIONS: Record<EnhancementType, EnhancementDefinition> = {
  [EnhancementType.None]: {
    type: EnhancementType.None,
    name: 'None',
    japaneseName: '無',
    description: 'No enhancement',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 1,
    goldBonus: 0,
    special: 'none',
  },
  [EnhancementType.Bonus]: {
    type: EnhancementType.Bonus,
    name: 'Bonus Mark',
    japaneseName: '増印',
    description: '+30 Chips when this tile scores',
    chipBonus: 30,
    multBonus: 0,
    multMultiplier: 1,
    goldBonus: 0,
    special: 'none',
  },
  [EnhancementType.Mult]: {
    type: EnhancementType.Mult,
    name: 'Mult Mark',
    japaneseName: '倍印',
    description: '+4 Mult when this tile scores',
    chipBonus: 0,
    multBonus: 4,
    multMultiplier: 1,
    goldBonus: 0,
    special: 'none',
  },
  [EnhancementType.Wild]: {
    type: EnhancementType.Wild,
    name: 'Wild Mark',
    japaneseName: '萬能印',
    description: 'Counts as every suit simultaneously',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 1,
    goldBonus: 0,
    special: 'wild',
  },
  [EnhancementType.Glass]: {
    type: EnhancementType.Glass,
    name: 'Glass Mark',
    japaneseName: '硝子印',
    description: '×2 Mult when scored, 1/4 chance to shatter after',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 2,
    goldBonus: 0,
    special: 'shatter',
  },
  [EnhancementType.Steel]: {
    type: EnhancementType.Steel,
    name: 'Steel Mark',
    japaneseName: '鋼印',
    description: '×1.5 Mult while held in hand (not played)',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 1.5,
    goldBonus: 0,
    special: 'held',
  },
  [EnhancementType.Stone]: {
    type: EnhancementType.Stone,
    name: 'Stone Mark',
    japaneseName: '石印',
    description: '+50 Chips, always scores regardless of hand',
    chipBonus: 50,
    multBonus: 0,
    multMultiplier: 1,
    goldBonus: 0,
    special: 'always_scores',
  },
  [EnhancementType.Gold]: {
    type: EnhancementType.Gold,
    name: 'Gold Mark',
    japaneseName: '金印',
    description: 'Earn ¥3 at end of round if in hand',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 1,
    goldBonus: 3,
    special: 'none',
  },
  [EnhancementType.Lucky]: {
    type: EnhancementType.Lucky,
    name: 'Lucky Mark',
    japaneseName: '幸運印',
    description: '1/5 chance for +20 Mult, 1/15 chance for ¥20',
    chipBonus: 0,
    multBonus: 0, // Calculated randomly
    multMultiplier: 1,
    goldBonus: 0, // Calculated randomly
    special: 'lucky',
  },
}

// =============================================================================
// SEAL TYPES
// =============================================================================

/**
 * Seal types that can be applied to tiles
 * Only ONE seal per tile, stacks with enhancement
 */
export enum SealType {
  None = 'none',
  Gold = 'gold', // Earn ¥3 when played
  Red = 'red', // Retrigger this tile once
  Blue = 'blue', // Create Celestial Orb if in winning hand
  Purple = 'purple', // Create Fate Seal when discarded
}

/**
 * Seal definition with effects
 */
export interface SealDefinition {
  type: SealType
  name: string
  japaneseName: string
  description: string
  goldOnPlay: number
  retriggers: number
  createsConsumable: 'none' | 'orb' | 'seal'
  triggerOn: 'play' | 'discard' | 'win' | 'none'
}

/**
 * Seal definitions
 */
export const SEAL_DEFINITIONS: Record<SealType, SealDefinition> = {
  [SealType.None]: {
    type: SealType.None,
    name: 'None',
    japaneseName: '無',
    description: 'No seal',
    goldOnPlay: 0,
    retriggers: 0,
    createsConsumable: 'none',
    triggerOn: 'none',
  },
  [SealType.Gold]: {
    type: SealType.Gold,
    name: 'Gold Seal',
    japaneseName: '金封',
    description: 'Earn ¥3 when this tile is played',
    goldOnPlay: 3,
    retriggers: 0,
    createsConsumable: 'none',
    triggerOn: 'play',
  },
  [SealType.Red]: {
    type: SealType.Red,
    name: 'Red Seal',
    japaneseName: '紅封',
    description: 'Retrigger this tile once when scored',
    goldOnPlay: 0,
    retriggers: 1,
    createsConsumable: 'none',
    triggerOn: 'play',
  },
  [SealType.Blue]: {
    type: SealType.Blue,
    name: 'Blue Seal',
    japaneseName: '青封',
    description: 'Creates a Celestial Orb if in final winning hand',
    goldOnPlay: 0,
    retriggers: 0,
    createsConsumable: 'orb',
    triggerOn: 'win',
  },
  [SealType.Purple]: {
    type: SealType.Purple,
    name: 'Purple Seal',
    japaneseName: '紫封',
    description: 'Creates a Fate Seal when discarded',
    goldOnPlay: 0,
    retriggers: 0,
    createsConsumable: 'seal',
    triggerOn: 'discard',
  },
}

// =============================================================================
// EDITION TYPES
// =============================================================================

/**
 * Edition types that affect visual appearance and scoring
 * Only ONE edition per tile
 */
export enum EditionType {
  Base = 'base',
  Foil = 'foil', // +50 Chips
  Holographic = 'holographic', // +10 Mult
  Polychrome = 'polychrome', // ×1.5 Mult
  Negative = 'negative', // +1 Decree slot
}

/**
 * Edition definition with effects
 */
export interface EditionDefinition {
  type: EditionType
  name: string
  japaneseName: string
  description: string
  chipBonus: number
  multBonus: number
  multMultiplier: number
  special: 'none' | 'decree_slot'
  rarity: number // Higher = rarer (1-5)
}

/**
 * Edition definitions
 */
export const EDITION_DEFINITIONS: Record<EditionType, EditionDefinition> = {
  [EditionType.Base]: {
    type: EditionType.Base,
    name: 'Base',
    japaneseName: '通常',
    description: 'Standard tile',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 1,
    special: 'none',
    rarity: 1,
  },
  [EditionType.Foil]: {
    type: EditionType.Foil,
    name: 'Foil',
    japaneseName: '箔押',
    description: '+50 Chips',
    chipBonus: 50,
    multBonus: 0,
    multMultiplier: 1,
    special: 'none',
    rarity: 2,
  },
  [EditionType.Holographic]: {
    type: EditionType.Holographic,
    name: 'Holographic',
    japaneseName: '虹彩',
    description: '+10 Mult',
    chipBonus: 0,
    multBonus: 10,
    multMultiplier: 1,
    special: 'none',
    rarity: 3,
  },
  [EditionType.Polychrome]: {
    type: EditionType.Polychrome,
    name: 'Polychrome',
    japaneseName: '多彩',
    description: '×1.5 Mult',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 1.5,
    special: 'none',
    rarity: 4,
  },
  [EditionType.Negative]: {
    type: EditionType.Negative,
    name: 'Negative',
    japaneseName: '陰影',
    description: '+1 Decree slot',
    chipBonus: 0,
    multBonus: 0,
    multMultiplier: 1,
    special: 'decree_slot',
    rarity: 5,
  },
}

// =============================================================================
// TILE MODIFIER COMPOSITE
// =============================================================================

/**
 * Complete modifier state for a tile
 */
export interface TileModifiers {
  enhancement: EnhancementType
  seal: SealType
  edition: EditionType
}

/**
 * Default (no modifiers) state
 */
export const DEFAULT_MODIFIERS: TileModifiers = {
  enhancement: EnhancementType.None,
  seal: SealType.None,
  edition: EditionType.Base,
}

/**
 * Check if tile has any modifiers
 */
export function hasModifiers(modifiers: TileModifiers): boolean {
  return (
    modifiers.enhancement !== EnhancementType.None ||
    modifiers.seal !== SealType.None ||
    modifiers.edition !== EditionType.Base
  )
}

/**
 * Calculate total chip bonus from all modifiers
 */
export function calculateModifierChips(modifiers: TileModifiers): number {
  const enhancement = ENHANCEMENT_DEFINITIONS[modifiers.enhancement]
  const edition = EDITION_DEFINITIONS[modifiers.edition]
  return enhancement.chipBonus + edition.chipBonus
}

/**
 * Calculate total additive mult bonus from all modifiers
 */
export function calculateModifierMult(modifiers: TileModifiers): number {
  const enhancement = ENHANCEMENT_DEFINITIONS[modifiers.enhancement]
  const edition = EDITION_DEFINITIONS[modifiers.edition]
  return enhancement.multBonus + edition.multBonus
}

/**
 * Calculate total multiplicative mult from all modifiers
 */
export function calculateModifierMultiplier(modifiers: TileModifiers): number {
  const enhancement = ENHANCEMENT_DEFINITIONS[modifiers.enhancement]
  const edition = EDITION_DEFINITIONS[modifiers.edition]
  return enhancement.multMultiplier * edition.multMultiplier
}

/**
 * Get number of retriggers from seal
 */
export function getRetriggers(modifiers: TileModifiers): number {
  return SEAL_DEFINITIONS[modifiers.seal].retriggers
}

/**
 * Check if tile is wild (counts as every suit)
 */
export function isWild(modifiers: TileModifiers): boolean {
  return modifiers.enhancement === EnhancementType.Wild
}

/**
 * Check if tile always scores (Stone)
 */
export function alwaysScores(modifiers: TileModifiers): boolean {
  return modifiers.enhancement === EnhancementType.Stone
}

/**
 * Check if tile can shatter (Glass)
 */
export function canShatter(modifiers: TileModifiers): boolean {
  return modifiers.enhancement === EnhancementType.Glass
}

/**
 * Check if tile has held effect (Steel)
 */
export function hasHeldEffect(modifiers: TileModifiers): boolean {
  return modifiers.enhancement === EnhancementType.Steel
}

/**
 * Check if tile has lucky effect
 */
export function isLucky(modifiers: TileModifiers): boolean {
  return modifiers.enhancement === EnhancementType.Lucky
}

/**
 * Roll lucky effect and return bonus mult/gold
 */
export function rollLuckyEffect(): { multBonus: number; goldBonus: number } {
  const roll = Math.random()

  // 1/5 chance for +20 Mult
  if (roll < 0.2) {
    return { multBonus: 20, goldBonus: 0 }
  }

  // 1/15 chance for ¥20 (approximately 6.67%)
  if (roll < 0.2 + 1 / 15) {
    return { multBonus: 0, goldBonus: 20 }
  }

  return { multBonus: 0, goldBonus: 0 }
}

/**
 * Roll shatter chance for Glass tiles
 * @returns true if tile shatters
 */
export function rollShatter(): boolean {
  return Math.random() < 0.25 // 1/4 chance
}

// =============================================================================
// MODIFIER APPLICATION RESULT
// =============================================================================

/**
 * Result of applying modifiers to scoring
 */
export interface ModifierScoringResult {
  chipBonus: number
  multBonus: number
  multMultiplier: number
  goldBonus: number
  retriggers: number
  shattered: boolean
  createdConsumable: 'none' | 'orb' | 'seal'
}

/**
 * Calculate scoring effects from modifiers
 * @param modifiers The tile's modifiers
 * @param context 'played' | 'held' | 'discarded' | 'won'
 * @returns Scoring result with all bonuses
 */
export function calculateModifierEffects(
  modifiers: TileModifiers,
  context: 'played' | 'held' | 'discarded' | 'won'
): ModifierScoringResult {
  const enhancement = ENHANCEMENT_DEFINITIONS[modifiers.enhancement]
  const seal = SEAL_DEFINITIONS[modifiers.seal]
  const edition = EDITION_DEFINITIONS[modifiers.edition]

  let chipBonus = 0
  let multBonus = 0
  let multMultiplier = 1
  let goldBonus = 0
  let retriggers = 0
  let shattered = false
  let createdConsumable: 'none' | 'orb' | 'seal' = 'none'

  // Apply enhancement effects based on context
  if (context === 'played') {
    // Enhancements that work when played/scored
    if (enhancement.special !== 'held') {
      chipBonus += enhancement.chipBonus
      multBonus += enhancement.multBonus
      multMultiplier *= enhancement.multMultiplier
    }

    // Lucky effect
    if (enhancement.special === 'lucky') {
      const lucky = rollLuckyEffect()
      multBonus += lucky.multBonus
      goldBonus += lucky.goldBonus
    }

    // Shatter check for Glass
    if (enhancement.special === 'shatter') {
      shattered = rollShatter()
    }

    // Edition bonuses when played
    chipBonus += edition.chipBonus
    multBonus += edition.multBonus
    multMultiplier *= edition.multMultiplier
  }

  // Steel effect only applies when held
  if (context === 'held' && enhancement.special === 'held') {
    multMultiplier *= enhancement.multMultiplier
  }

  // Gold Mark gold at end of round (counted in 'held' context)
  if (context === 'held' && modifiers.enhancement === EnhancementType.Gold) {
    goldBonus += enhancement.goldBonus
  }

  // Seal effects
  if (seal.triggerOn === 'play' && context === 'played') {
    goldBonus += seal.goldOnPlay
    retriggers += seal.retriggers
  }

  if (seal.triggerOn === 'discard' && context === 'discarded') {
    createdConsumable = seal.createsConsumable
  }

  if (seal.triggerOn === 'win' && context === 'won') {
    createdConsumable = seal.createsConsumable
  }

  return {
    chipBonus,
    multBonus,
    multMultiplier,
    goldBonus,
    retriggers,
    shattered,
    createdConsumable,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all enhancement types (excluding None)
 */
export function getAllEnhancements(): EnhancementType[] {
  return Object.values(EnhancementType).filter((e) => e !== EnhancementType.None)
}

/**
 * Get all seal types (excluding None)
 */
export function getAllSeals(): SealType[] {
  return Object.values(SealType).filter((s) => s !== SealType.None)
}

/**
 * Get all edition types (excluding Base)
 */
export function getSpecialEditions(): EditionType[] {
  return Object.values(EditionType).filter((e) => e !== EditionType.Base)
}

/**
 * Get random enhancement
 */
export function getRandomEnhancement(): EnhancementType {
  const enhancements = getAllEnhancements()
  return enhancements[Math.floor(Math.random() * enhancements.length)]
}

/**
 * Get random seal
 */
export function getRandomSeal(): SealType {
  const seals = getAllSeals()
  return seals[Math.floor(Math.random() * seals.length)]
}

/**
 * Get random edition based on rarity weights
 */
export function getRandomEdition(): EditionType {
  const editions = getSpecialEditions()
  const weights = editions.map((e) => 1 / EDITION_DEFINITIONS[e].rarity)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  let roll = Math.random() * totalWeight
  for (let i = 0; i < editions.length; i++) {
    roll -= weights[i]
    if (roll <= 0) {
      return editions[i]
    }
  }

  return EditionType.Foil // Fallback
}

/**
 * Create modifier display string
 */
export function formatModifiers(modifiers: TileModifiers): string {
  const parts: string[] = []

  if (modifiers.edition !== EditionType.Base) {
    parts.push(EDITION_DEFINITIONS[modifiers.edition].name)
  }

  if (modifiers.enhancement !== EnhancementType.None) {
    parts.push(ENHANCEMENT_DEFINITIONS[modifiers.enhancement].name)
  }

  if (modifiers.seal !== SealType.None) {
    parts.push(SEAL_DEFINITIONS[modifiers.seal].name)
  }

  return parts.length > 0 ? parts.join(' ') : 'Base'
}
