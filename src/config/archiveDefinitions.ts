/**
 * Archive of Hands (手牌録) Definitions for Tensho Mahjong Roguelike
 *
 * A comprehensive catalog of all discoverable items in the game.
 * Based on ARCHITECTURE.MD Section 29 - Archive of Hands.
 *
 * Total Collection: 352 unique items across 10 categories
 */

// =============================================================================
// ARCHIVE CATEGORY TYPES
// =============================================================================

/**
 * Archive categories matching the game's item types
 */
export type ArchiveCategory =
  | 'decrees' // 法令録 - All Decrees (Common through Legendary)
  | 'walls' // 山録 - Deck variants
  | 'charters' // 皇勅録 - Imperial Charters (base + upgraded)
  | 'consumables' // 消耗品録 - Fate Seals, Celestial Orbs, Void Scripts
  | 'tileMarks' // 牌印録 - Enhancement types
  | 'seals' // 封印録 - Gold, Red, Blue, Purple seals
  | 'editions' // 版録 - Base, Foil, Holo, Poly, Negative
  | 'packs' // 祝福袋録 - Blessing Pack variants
  | 'omens' // 兆符録 - Skip reward markers
  | 'mandates' // 局法録 - Round restrictions

/**
 * Subcategory for consumables
 */
export type ConsumableSubCategory = 'fateSeal' | 'celestialOrb' | 'voidScript'

/**
 * Archive category metadata
 */
export interface ArchiveCategoryDefinition {
  id: ArchiveCategory
  name: string
  japaneseName: string
  description: string
  expectedCount: number
  icon: string
}

/**
 * All archive category definitions
 */
export const ARCHIVE_CATEGORIES: Record<ArchiveCategory, ArchiveCategoryDefinition> = {
  decrees: {
    id: 'decrees',
    name: 'Decrees',
    japaneseName: '法令録',
    description: 'Rule-bending modifiers that persist across rounds',
    expectedCount: 150, // All Common through Legendary decrees
    icon: 'scroll',
  },
  walls: {
    id: 'walls',
    name: 'Walls',
    japaneseName: '山録',
    description: 'Deck variants with unique tile compositions',
    expectedCount: 15, // Deck variants excluding Challenge
    icon: 'wall',
  },
  charters: {
    id: 'charters',
    name: 'Imperial Charters',
    japaneseName: '皇勅録',
    description: 'Permanent upgrades purchased after defeating Boss Mandates',
    expectedCount: 32, // 16 base + 16 upgraded
    icon: 'certificate',
  },
  consumables: {
    id: 'consumables',
    name: 'Consumables',
    japaneseName: '消耗品録',
    description: 'Single-use items: Fate Seals, Celestial Orbs, Void Scripts',
    expectedCount: 55, // 22 Fate Seals + 13 Celestial Orbs + 20 Void Scripts
    icon: 'potion',
  },
  tileMarks: {
    id: 'tileMarks',
    name: 'Tile Marks',
    japaneseName: '牌印録',
    description: 'Enhancement types that modify tile behavior',
    expectedCount: 8, // Enhancement types
    icon: 'sparkle',
  },
  seals: {
    id: 'seals',
    name: 'Seals',
    japaneseName: '封印録',
    description: 'Special seals that add effects to tiles',
    expectedCount: 4, // Gold, Red, Blue, Purple
    icon: 'seal',
  },
  editions: {
    id: 'editions',
    name: 'Editions',
    japaneseName: '版録',
    description: 'Visual and gameplay variants of items',
    expectedCount: 5, // Base, Foil, Holo, Poly, Negative
    icon: 'shine',
  },
  packs: {
    id: 'packs',
    name: 'Blessing Packs',
    japaneseName: '祝福袋録',
    description: 'Booster packs containing mixed upgrades',
    expectedCount: 15, // Pack type/size variants
    icon: 'package',
  },
  omens: {
    id: 'omens',
    name: 'Omen Tags',
    japaneseName: '兆符録',
    description: 'One-time destiny modifiers from skipping rounds',
    expectedCount: 23, // Skip reward markers
    icon: 'tag',
  },
  mandates: {
    id: 'mandates',
    name: 'Mandates',
    japaneseName: '局法録',
    description: 'Boss round restrictions and challenges',
    expectedCount: 28, // 23 standard + 5 showdown mandates
    icon: 'challenge',
  },
}

/**
 * Calculate total expected items across all categories
 */
export function getTotalExpectedItems(): number {
  return Object.values(ARCHIVE_CATEGORIES).reduce((sum, cat) => sum + cat.expectedCount, 0)
}

// =============================================================================
// PRE-DISCOVERED ITEMS
// =============================================================================

/**
 * Items that are pre-discovered when starting a new profile
 */
export interface PreDiscoveredSet {
  category: ArchiveCategory
  itemIds: string[]
}

/**
 * Pre-discovered items on a new profile
 */
export const PRE_DISCOVERED_ITEMS: PreDiscoveredSet[] = [
  {
    category: 'decrees',
    itemIds: [
      // Starter Decrees
      'river_tax',
      'extended_hand_grant',
      'tanyao_dispensation',
      'moonlit_seal',
      'pure_suit_asceticism',
    ],
  },
  {
    category: 'walls',
    itemIds: [
      'green_felt', // Default Wall (starting deck)
    ],
  },
  {
    category: 'tileMarks',
    itemIds: [
      // All basic tile marks are discovered from the start
      'bonus',
      'mult',
      'wild',
      'glass',
      'steel',
      'stone',
      'gold',
      'lucky',
    ],
  },
  {
    category: 'seals',
    itemIds: [
      // All seals are discovered from the start
      'gold',
      'red',
      'blue',
      'purple',
    ],
  },
  {
    category: 'editions',
    itemIds: [
      // Base edition is always known
      'base',
    ],
  },
]

/**
 * Get all pre-discovered item IDs as a flat set
 */
export function getPreDiscoveredItemIds(): Set<string> {
  const ids = new Set<string>()
  for (const set of PRE_DISCOVERED_ITEMS) {
    for (const id of set.itemIds) {
      ids.add(`${set.category}:${id}`)
    }
  }
  return ids
}

// =============================================================================
// WALL DEFINITIONS
// =============================================================================

/**
 * Wall variant definitions
 */
export interface WallDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  unlockCondition?: string
}

/**
 * All wall variants
 */
export const WALL_DEFINITIONS: WallDefinition[] = [
  {
    id: 'green_felt',
    name: 'Green Felt',
    japaneseName: '緑卓',
    description: 'Standard starting wall with 136 tiles',
  },
  {
    id: 'red_wall',
    name: 'Red Wall',
    japaneseName: '紅山',
    description: 'Wall with enhanced red dora tiles',
    unlockCondition: 'Win on White Stake',
  },
  {
    id: 'blue_wall',
    name: 'Blue Wall',
    japaneseName: '藍山',
    description: 'Wall focused on Pinzu suit tiles',
    unlockCondition: 'Win on Red Stake',
  },
  {
    id: 'black_wall',
    name: 'Black Wall',
    japaneseName: '黒山',
    description: 'Wall with enhanced honor tiles',
    unlockCondition: 'Win on Orange Stake',
  },
  {
    id: 'gold_wall',
    name: 'Gold Wall',
    japaneseName: '金山',
    description: 'Wall with gold-enhanced tiles',
    unlockCondition: 'Win on Gold Stake',
  },
  {
    id: 'crimson_wall',
    name: 'Crimson Wall',
    japaneseName: '深紅山',
    description: 'Wall with powerful dragon tiles',
    unlockCondition: 'Win on Red Stake+',
  },
  {
    id: 'obsidian_wall',
    name: 'Obsidian Wall',
    japaneseName: '黒曜山',
    description: 'Wall with wind-enhanced tiles',
    unlockCondition: 'Win on Black Stake+',
  },
  {
    id: 'jade_wall',
    name: 'Jade Wall',
    japaneseName: '翡翠山',
    description: 'Wall focused on bamboo suit tiles',
    unlockCondition: 'Discover all consumables',
  },
  {
    id: 'ivory_wall',
    name: 'Ivory Wall',
    japaneseName: '象牙山',
    description: 'Wall with terminal-focused composition',
    unlockCondition: 'Discover all decrees',
  },
  {
    id: 'bamboo_wall',
    name: 'Bamboo Wall',
    japaneseName: '竹山',
    description: 'Wall with Souzu-dominant composition',
    unlockCondition: 'Score 1 million points in a single hand',
  },
  {
    id: 'cherry_wall',
    name: 'Cherry Wall',
    japaneseName: '桜山',
    description: 'Wall with flower-enhanced tiles',
    unlockCondition: 'Collect all flowers in a single run',
  },
  {
    id: 'moon_wall',
    name: 'Moon Wall',
    japaneseName: '月山',
    description: 'Wall with season-enhanced tiles',
    unlockCondition: 'Complete 4 seasons in a single run',
  },
  {
    id: 'star_wall',
    name: 'Star Wall',
    japaneseName: '星山',
    description: 'Wall with celestial bonuses',
    unlockCondition: 'Use 50 Celestial Orbs total',
  },
  {
    id: 'void_wall',
    name: 'Void Wall',
    japaneseName: '虚山',
    description: 'Wall with void-touched tiles',
    unlockCondition: 'Use 30 Void Scripts total',
  },
  {
    id: 'imperial_wall',
    name: 'Imperial Wall',
    japaneseName: '帝山',
    description: 'Wall with royal composition',
    unlockCondition: 'Purchase all Imperial Charters',
  },
]

// =============================================================================
// TILE MARK DEFINITIONS
// =============================================================================

/**
 * Tile enhancement/mark definitions
 */
export interface TileMarkDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  effect: string
}

/**
 * All tile mark types
 */
export const TILE_MARK_DEFINITIONS: TileMarkDefinition[] = [
  {
    id: 'bonus',
    name: 'Bonus Mark',
    japaneseName: '点印',
    description: 'Tile scores extra points',
    effect: '+30 Chips when scored',
  },
  {
    id: 'mult',
    name: 'Mult Mark',
    japaneseName: '倍印',
    description: 'Tile adds multiplier',
    effect: '+4 Mult when scored',
  },
  {
    id: 'wild',
    name: 'Wild Mark',
    japaneseName: '万印',
    description: 'Tile can act as any suit',
    effect: 'Counts as any suit for yaku',
  },
  {
    id: 'glass',
    name: 'Glass Mark',
    japaneseName: '硝印',
    description: 'Fragile but powerful',
    effect: 'x2 Mult when scored, 25% chance to shatter',
  },
  {
    id: 'steel',
    name: 'Steel Mark',
    japaneseName: '鋼印',
    description: 'Bonus when held',
    effect: 'x1.5 Mult while held in hand',
  },
  {
    id: 'stone',
    name: 'Stone Mark',
    japaneseName: '石印',
    description: 'Always contributes',
    effect: '+50 Chips, always scores even if not in winning hand',
  },
  {
    id: 'gold',
    name: 'Gold Mark',
    japaneseName: '金印',
    description: 'Generates gold',
    effect: '+3 Gold when held at round end',
  },
  {
    id: 'lucky',
    name: 'Lucky Mark',
    japaneseName: '運印',
    description: 'Random bonus chance',
    effect: '1 in 5 chance for +20 Mult when scored',
  },
]

// =============================================================================
// SEAL DEFINITIONS
// =============================================================================

/**
 * Tile seal definitions
 */
export interface SealDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  effect: string
  color: string
}

/**
 * All seal types
 */
export const SEAL_DEFINITIONS_ARCHIVE: SealDefinition[] = [
  {
    id: 'gold',
    name: 'Gold Seal',
    japaneseName: '金封',
    description: 'Earns gold when played',
    effect: '+3 Gold when scored in hand',
    color: '#FFD700',
  },
  {
    id: 'red',
    name: 'Red Seal',
    japaneseName: '赤封',
    description: 'Tile triggers twice',
    effect: 'Retriggers once when scored',
    color: '#FF4444',
  },
  {
    id: 'blue',
    name: 'Blue Seal',
    japaneseName: '青封',
    description: 'Creates Celestial Orb',
    effect: 'Creates Celestial Orb for final hand yaku',
    color: '#4444FF',
  },
  {
    id: 'purple',
    name: 'Purple Seal',
    japaneseName: '紫封',
    description: 'Creates Fate Seal on discard',
    effect: 'Creates random Fate Seal when discarded',
    color: '#8844FF',
  },
]

// =============================================================================
// EDITION DEFINITIONS
// =============================================================================

/**
 * Edition type definitions
 */
export interface EditionDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  effect: string
  visualStyle: string
}

/**
 * All edition types
 */
export const EDITION_DEFINITIONS_ARCHIVE: EditionDefinition[] = [
  {
    id: 'base',
    name: 'Base',
    japaneseName: '通常',
    description: 'Standard appearance',
    effect: 'No additional effect',
    visualStyle: 'normal',
  },
  {
    id: 'foil',
    name: 'Foil',
    japaneseName: '箔押',
    description: 'Shimmering metallic finish',
    effect: '+50 Chips when scored',
    visualStyle: 'foil_shimmer',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    japaneseName: '虹彩',
    description: 'Rainbow holographic effect',
    effect: '+10 Mult when scored',
    visualStyle: 'rainbow_shift',
  },
  {
    id: 'polychrome',
    name: 'Polychrome',
    japaneseName: '極彩',
    description: 'Prismatic color shifting',
    effect: 'x1.5 Mult when scored',
    visualStyle: 'color_shift',
  },
  {
    id: 'negative',
    name: 'Negative',
    japaneseName: '陰影',
    description: 'Inverted colors, transcendent',
    effect: '+1 Decree slot when applied to Decree',
    visualStyle: 'inverted',
  },
]

// =============================================================================
// PACK VARIANT DEFINITIONS
// =============================================================================

/**
 * Pack variant definitions (type + size combinations)
 */
export interface PackVariantDefinition {
  id: string
  name: string
  japaneseName: string
  type: string
  size: string
  description: string
}

/**
 * All pack variants (5 types x 3 sizes = 15 variants)
 */
export const PACK_VARIANT_DEFINITIONS: PackVariantDefinition[] = [
  // Arcana Packs
  {
    id: 'arcana_normal',
    name: 'Arcana Pack',
    japaneseName: '秘術袋',
    type: 'Arcana',
    size: 'Normal',
    description: 'Choose 1 from 3 Fate Seals',
  },
  {
    id: 'arcana_jumbo',
    name: 'Jumbo Arcana Pack',
    japaneseName: '大秘術袋',
    type: 'Arcana',
    size: 'Jumbo',
    description: 'Choose 1 from 5 Fate Seals',
  },
  {
    id: 'arcana_mega',
    name: 'Mega Arcana Pack',
    japaneseName: '特大秘術袋',
    type: 'Arcana',
    size: 'Mega',
    description: 'Choose 2 from 5 Fate Seals',
  },
  // Celestial Packs
  {
    id: 'celestial_normal',
    name: 'Celestial Pack',
    japaneseName: '天球袋',
    type: 'Celestial',
    size: 'Normal',
    description: 'Choose 1 from 3 Celestial Orbs',
  },
  {
    id: 'celestial_jumbo',
    name: 'Jumbo Celestial Pack',
    japaneseName: '大天球袋',
    type: 'Celestial',
    size: 'Jumbo',
    description: 'Choose 1 from 5 Celestial Orbs',
  },
  {
    id: 'celestial_mega',
    name: 'Mega Celestial Pack',
    japaneseName: '特大天球袋',
    type: 'Celestial',
    size: 'Mega',
    description: 'Choose 2 from 5 Celestial Orbs',
  },
  // Tile Packs
  {
    id: 'tile_normal',
    name: 'Tile Pack',
    japaneseName: '牌袋',
    type: 'Tile',
    size: 'Normal',
    description: 'Choose 1 from 3 modified tiles',
  },
  {
    id: 'tile_jumbo',
    name: 'Jumbo Tile Pack',
    japaneseName: '大牌袋',
    type: 'Tile',
    size: 'Jumbo',
    description: 'Choose 1 from 5 modified tiles',
  },
  {
    id: 'tile_mega',
    name: 'Mega Tile Pack',
    japaneseName: '特大牌袋',
    type: 'Tile',
    size: 'Mega',
    description: 'Choose 2 from 5 modified tiles',
  },
  // Decree Packs
  {
    id: 'decree_normal',
    name: 'Decree Pack',
    japaneseName: '法令袋',
    type: 'Decree',
    size: 'Normal',
    description: 'Choose 1 from 3 Decrees',
  },
  {
    id: 'decree_jumbo',
    name: 'Jumbo Decree Pack',
    japaneseName: '大法令袋',
    type: 'Decree',
    size: 'Jumbo',
    description: 'Choose 1 from 5 Decrees',
  },
  {
    id: 'decree_mega',
    name: 'Mega Decree Pack',
    japaneseName: '特大法令袋',
    type: 'Decree',
    size: 'Mega',
    description: 'Choose 2 from 5 Decrees',
  },
  // Void Packs
  {
    id: 'void_normal',
    name: 'Void Pack',
    japaneseName: '虚空袋',
    type: 'Void',
    size: 'Normal',
    description: 'Choose 1 from 3 Void Scripts',
  },
  {
    id: 'void_jumbo',
    name: 'Jumbo Void Pack',
    japaneseName: '大虚空袋',
    type: 'Void',
    size: 'Jumbo',
    description: 'Choose 1 from 5 Void Scripts',
  },
  {
    id: 'void_mega',
    name: 'Mega Void Pack',
    japaneseName: '特大虚空袋',
    type: 'Void',
    size: 'Mega',
    description: 'Choose 2 from 5 Void Scripts',
  },
]

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get archive category by ID
 */
export function getArchiveCategory(id: ArchiveCategory): ArchiveCategoryDefinition {
  return ARCHIVE_CATEGORIES[id]
}

/**
 * Get all archive categories as array
 */
export function getAllArchiveCategories(): ArchiveCategoryDefinition[] {
  return Object.values(ARCHIVE_CATEGORIES)
}

/**
 * Create a composite key for archive entries
 */
export function createArchiveKey(category: ArchiveCategory, itemId: string): string {
  return `${category}:${itemId}`
}

/**
 * Parse a composite archive key
 */
export function parseArchiveKey(key: string): { category: ArchiveCategory; itemId: string } | null {
  const [category, itemId] = key.split(':')
  if (!category || !itemId) return null
  return { category: category as ArchiveCategory, itemId }
}

/**
 * Check if an item is pre-discovered
 */
export function isPreDiscovered(category: ArchiveCategory, itemId: string): boolean {
  const set = PRE_DISCOVERED_ITEMS.find((s) => s.category === category)
  return set?.itemIds.includes(itemId) ?? false
}
