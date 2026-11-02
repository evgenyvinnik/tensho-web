/**
 * Tile Editions for Tensho Mahjong Roguelike
 *
 * A special tile carries one Edition (Balatro's card enhancements, adapted):
 * Bonus, Mult, Wild, Glass, Steel, Stone, Gold and Lucky. Player-facing text
 * calls them Editions; in code they are still `EnhancementType`, and a Decree's
 * own Foil/Holographic/Polychrome/Negative finish is a separate thing
 * (`DecreeEdition`). Applying an Edition replaces whatever the tile carried.
 */

import { runRandom } from '../game/RunRandom'

// =============================================================================
// EDITION TYPES (EnhancementType)
// =============================================================================

/**
 * The Editions a tile can carry. A tile holds at most one.
 */
export enum EnhancementType {
  None = 'none',
  Bonus = 'bonus', // +30 Points per Act when scored
  Mult = 'mult', // +4 Mult when scored
  Wild = 'wild', // Counts as every suit
  Glass = 'glass', // Makes a Fate Seal when played, then 1 in 4 shatters
  Steel = 'steel', // Makes a Celestial Orb when played, then 1 in 4 rusts
  Stone = 'stone', // +100 Points, always scores (no rank/suit)
  Gold = 'gold', // +3 Gold each time it scores
  Lucky = 'lucky', // Rolls ×Mult and +Points at the start of each round
}

/** What a played tile makes before its Edition may break it. */
export type CreatedConsumable = 'none' | 'orb' | 'seal'

/** How an Edition can destroy its tile after the play. */
export type TileBreak = 'shattered' | 'rusted'

/**
 * Edition definition with effects
 */
export interface EnhancementDefinition {
  type: EnhancementType
  name: string
  japaneseName: string
  description: string
  /** Points when scored; the Bonus Edition pays this once per Act. */
  chipBonus: number
  multBonus: number
  /** Gold each time the tile scores. */
  goldBonus: number
  /** Made once when the tile is played. */
  creates: CreatedConsumable
  /** How the tile can break after it is played, and how likely that is. */
  breaks: TileBreak | null
  breakChance: number
  special: 'none' | 'wild' | 'always_scores' | 'lucky' | 'per_act'
}

/** Share of plays after which a Glass tile shatters or a Steel tile rusts. */
export const TILE_BREAK_CHANCE = 0.25

/** A Bonus Edition pays this many Points per Act. */
export const BONUS_POINTS_PER_ACT = 30

const NO_EFFECT = {
  chipBonus: 0,
  multBonus: 0,
  goldBonus: 0,
  creates: 'none',
  breaks: null,
  breakChance: 0,
  special: 'none',
} as const

/**
 * Edition definitions
 */
export const ENHANCEMENT_DEFINITIONS: Record<
  EnhancementType,
  EnhancementDefinition
> = {
  [EnhancementType.None]: {
    ...NO_EFFECT,
    type: EnhancementType.None,
    name: 'None',
    japaneseName: '無',
    description: 'No Edition',
  },
  [EnhancementType.Bonus]: {
    ...NO_EFFECT,
    type: EnhancementType.Bonus,
    name: 'Bonus Edition',
    japaneseName: '加点紋',
    description: '+30 Points per Act when this tile scores',
    chipBonus: BONUS_POINTS_PER_ACT,
    special: 'per_act',
  },
  [EnhancementType.Mult]: {
    ...NO_EFFECT,
    type: EnhancementType.Mult,
    name: 'Mult Edition',
    japaneseName: '倍率紋',
    description: '+4 Mult when this tile scores',
    multBonus: 4,
  },
  [EnhancementType.Wild]: {
    ...NO_EFFECT,
    type: EnhancementType.Wild,
    name: 'Wild Edition',
    japaneseName: '万能紋',
    description: 'Counts as every suit simultaneously',
    special: 'wild',
  },
  [EnhancementType.Glass]: {
    ...NO_EFFECT,
    type: EnhancementType.Glass,
    name: 'Glass Edition',
    japaneseName: '硝子紋',
    description:
      'Creates a random Fate Seal when played, then has a 1 in 4 chance to shatter',
    creates: 'seal',
    breaks: 'shattered',
    breakChance: TILE_BREAK_CHANCE,
  },
  [EnhancementType.Steel]: {
    ...NO_EFFECT,
    type: EnhancementType.Steel,
    name: 'Steel Edition',
    japaneseName: '鋼紋',
    description:
      'Creates a random Celestial Orb when played, then has a 1 in 4 chance to rust away',
    creates: 'orb',
    breaks: 'rusted',
    breakChance: TILE_BREAK_CHANCE,
  },
  [EnhancementType.Stone]: {
    ...NO_EFFECT,
    type: EnhancementType.Stone,
    name: 'Stone Edition',
    japaneseName: '石紋',
    description: '+100 Points, always scores regardless of hand',
    // Double a Wind tile's 50: a Stone gives up grouping for a sure payout.
    chipBonus: 100,
    special: 'always_scores',
  },
  [EnhancementType.Gold]: {
    ...NO_EFFECT,
    type: EnhancementType.Gold,
    name: 'Gold Edition',
    japaneseName: '金紋',
    description: '+3 Gold each time this tile scores',
    goldBonus: 3,
  },
  [EnhancementType.Lucky]: {
    ...NO_EFFECT,
    type: EnhancementType.Lucky,
    name: 'Lucky Edition',
    japaneseName: '幸運紋',
    description:
      'Each round rolls ×1.25 to ×2 Mult and +20 to +100 Points, paid when this tile scores',
    special: 'lucky',
  },
}

// =============================================================================
// TILE MODIFIER STATE
// =============================================================================

/**
 * A tile's Edition. Older saves also carried a Stamp (`seal`) and a tile
 * Edition (`edition`); `migrateClassicSnapshot` folds those into this.
 */
export interface TileModifiers {
  enhancement: EnhancementType
}

/**
 * Default (no Edition) state
 */
export const DEFAULT_MODIFIERS: TileModifiers = {
  enhancement: EnhancementType.None,
}

/**
 * Check if tile has an Edition
 */
export function hasModifiers(modifiers: TileModifiers): boolean {
  return modifiers.enhancement !== EnhancementType.None
}

/** Keep only the fields a tile may hold. */
export function singleModifier(modifiers: TileModifiers): TileModifiers {
  return { enhancement: modifiers.enhancement ?? EnhancementType.None }
}

/** Apply a change to a tile's Edition. */
export function changeModifiers(
  current: TileModifiers,
  change: Partial<TileModifiers>
): TileModifiers {
  return singleModifier({ ...current, ...change })
}

/** Points a Bonus Edition pays in `act`. */
export function bonusEditionPoints(act: number): number {
  return BONUS_POINTS_PER_ACT * Math.max(1, Math.floor(act))
}

/**
 * Points an Edition adds when its tile scores. The Bonus Edition grows with
 * the Act; outside a run (rewards, catalog) it shows its Act 1 value.
 */
export function calculateModifierChips(
  modifiers: TileModifiers,
  act = 1
): number {
  const enhancement = ENHANCEMENT_DEFINITIONS[modifiers.enhancement]
  return enhancement.special === 'per_act'
    ? bonusEditionPoints(act)
    : enhancement.chipBonus
}

/**
 * Additive Mult an Edition adds when its tile scores
 */
export function calculateModifierMult(modifiers: TileModifiers): number {
  return ENHANCEMENT_DEFINITIONS[modifiers.enhancement].multBonus
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
 * Check if tile can break after a play (Glass shatters, Steel rusts)
 */
export function canShatter(modifiers: TileModifiers): boolean {
  return ENHANCEMENT_DEFINITIONS[modifiers.enhancement].breaks !== null
}

/**
 * Check if tile has the Lucky Edition
 */
export function isLucky(modifiers: TileModifiers): boolean {
  return modifiers.enhancement === EnhancementType.Lucky
}

// =============================================================================
// LUCKY ROLLS
// =============================================================================

/** What one Lucky tile pays this round. */
export interface LuckyRoll {
  multiplier: number
  points: number
}

export const LUCKY_MULTIPLIERS = [1.25, 1.5, 1.75, 2] as const
export const LUCKY_POINTS = [20, 30, 40, 50, 60, 70, 80, 90, 100] as const

/** The lowest roll, paid when a tile has none (catalog, rewards). */
export const LUCKY_FLOOR: LuckyRoll = {
  multiplier: LUCKY_MULTIPLIERS[0],
  points: LUCKY_POINTS[0],
}

/**
 * One Lucky tile's roll for a round. The orchestrator rolls every Lucky tile
 * from the run's stream when a round starts (and a tile made Lucky later right
 * after the action that made it), then saves the rolls, so the table, the
 * preview and the paid score read the same values and a seed replays them.
 */
export function rollLucky(
  draw: () => number = () => runRandom.next('modifiers')
): LuckyRoll {
  return {
    multiplier:
      LUCKY_MULTIPLIERS[Math.floor(draw() * LUCKY_MULTIPLIERS.length)],
    points: LUCKY_POINTS[Math.floor(draw() * LUCKY_POINTS.length)],
  }
}

/**
 * Roll whether a played Glass or Steel tile breaks
 * @returns true if the tile breaks
 */
export function rollBreak(chance: number): boolean {
  return chance > 0 && runRandom.next('modifiers') < chance
}

// =============================================================================
// MODIFIER APPLICATION RESULT
// =============================================================================

/**
 * What a played tile's Edition does
 */
export interface ModifierScoringResult {
  chipBonus: number
  multBonus: number
  multMultiplier: number
  goldBonus: number
  /** How the tile broke after the play, if it did. */
  broke: TileBreak | null
  createdConsumable: CreatedConsumable
}

/** The round a play belongs to, for Editions that read it. */
export interface EditionRound {
  /** The Act being played (Bonus Edition). */
  act?: number
  /** This round's roll per Lucky tile id (Lucky Edition). */
  luckyRolls?: Readonly<Record<string, LuckyRoll>>
}

/**
 * The effects of a played tile's Edition.
 * @param modifiers The tile's modifiers
 * @param tileId The tile, for its Lucky roll
 * @param options `deterministic` never breaks a tile: score previews use it so
 *   the number shown before a play never depends on a roll the real play makes.
 */
export function calculateModifierEffects(
  modifiers: TileModifiers,
  tileId: string,
  options: EditionRound & { deterministic?: boolean } = {}
): ModifierScoringResult {
  const enhancement = ENHANCEMENT_DEFINITIONS[modifiers.enhancement]
  const lucky =
    enhancement.special === 'lucky'
      ? (options.luckyRolls?.[tileId] ?? LUCKY_FLOOR)
      : null
  return {
    chipBonus:
      calculateModifierChips(modifiers, options.act) + (lucky?.points ?? 0),
    multBonus: enhancement.multBonus,
    multMultiplier: lucky?.multiplier ?? 1,
    goldBonus: enhancement.goldBonus,
    broke:
      !options.deterministic && rollBreak(enhancement.breakChance)
        ? enhancement.breaks
        : null,
    createdConsumable: enhancement.creates,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all Edition types (excluding None)
 */
export function getAllEnhancements(): EnhancementType[] {
  return Object.values(EnhancementType).filter(
    (e) => e !== EnhancementType.None
  )
}

/**
 * Get random Edition
 */
export function getRandomEnhancement(): EnhancementType {
  const enhancements = getAllEnhancements()
  return enhancements[
    Math.floor(runRandom.next('modifiers') * enhancements.length)
  ]
}

/**
 * Create modifier display string
 */
export function formatModifiers(modifiers: TileModifiers): string {
  return modifiers.enhancement === EnhancementType.None
    ? 'Base'
    : ENHANCEMENT_DEFINITIONS[modifiers.enhancement].name
}
