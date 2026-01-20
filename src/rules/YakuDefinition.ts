/**
 * Yaku Definition System for Tensho Mahjong Roguelike
 *
 * Yaku are scoring patterns that multiply the base score.
 * Organized by tier (1-4) with corresponding multipliers.
 */

import { Tile, TileSuit, DragonType, WindType } from '../core/Tile'
import { Meld, MeldType } from '../core/Meld'
import { ParsedHand, WaitType } from '../core/Hand'

export enum YakuTier {
  Tier1 = 1, // Basic yaku
  Tier2 = 2, // Intermediate yaku
  Tier3 = 3, // Advanced yaku
  Tier4 = 4, // Yakuman (limit hands)
}

export interface YakuDefinition {
  id: string
  name: string
  japaneseName: string
  tier: YakuTier
  multiplier: number // Added to multiplier total
  requiresConcealed: boolean
  openMultiplier?: number // Reduced multiplier when open
  description: string
}

/**
 * All Yaku definitions for Tensho
 */
export const YAKU_DEFINITIONS: YakuDefinition[] = [
  // === TIER 1 (Basic) ===
  {
    id: 'riichi',
    name: 'Riichi',
    japaneseName: '立直',
    tier: YakuTier.Tier1,
    multiplier: 1.2,
    requiresConcealed: true,
    description: 'Declared ready with concealed hand',
  },
  {
    id: 'tanyao',
    name: 'Tanyao',
    japaneseName: '断幺九',
    tier: YakuTier.Tier1,
    multiplier: 1.3,
    requiresConcealed: false,
    description: 'All simples (no terminals or honors)',
  },
  {
    id: 'pinfu',
    name: 'Pinfu',
    japaneseName: '平和',
    tier: YakuTier.Tier1,
    multiplier: 1.3,
    requiresConcealed: true,
    description: 'All sequences, no points pair, two-sided wait',
  },
  {
    id: 'yakuhai_dragon',
    name: 'Dragon Yakuhai',
    japaneseName: '役牌',
    tier: YakuTier.Tier1,
    multiplier: 1.2,
    requiresConcealed: false,
    description: 'Triplet of dragons',
  },
  {
    id: 'yakuhai_wind',
    name: 'Wind Yakuhai',
    japaneseName: '役牌',
    tier: YakuTier.Tier1,
    multiplier: 1.2,
    requiresConcealed: false,
    description: 'Triplet of seat/round wind',
  },
  {
    id: 'menzen_tsumo',
    name: 'Menzen Tsumo',
    japaneseName: '門前清自摸和',
    tier: YakuTier.Tier1,
    multiplier: 1.3,
    requiresConcealed: true,
    description: 'Self-draw win with concealed hand',
  },
  {
    id: 'ippatsu',
    name: 'Ippatsu',
    japaneseName: '一発',
    tier: YakuTier.Tier1,
    multiplier: 1.2,
    requiresConcealed: true,
    description: 'Win within one turn of riichi',
  },

  // === TIER 2 (Intermediate) ===
  {
    id: 'iipeikou',
    name: 'Iipeikou',
    japaneseName: '一盃口',
    tier: YakuTier.Tier2,
    multiplier: 1.6,
    requiresConcealed: true,
    description: 'Two identical sequences',
  },
  {
    id: 'sanshoku_doujun',
    name: 'Sanshoku Doujun',
    japaneseName: '三色同順',
    tier: YakuTier.Tier2,
    multiplier: 1.8,
    openMultiplier: 1.5,
    requiresConcealed: false,
    description: 'Same sequence in all three suits',
  },
  {
    id: 'ittsu',
    name: 'Ittsu',
    japaneseName: '一気通貫',
    tier: YakuTier.Tier2,
    multiplier: 2.0,
    openMultiplier: 1.6,
    requiresConcealed: false,
    description: 'Straight 1-9 in one suit',
  },
  {
    id: 'toitoi',
    name: 'Toitoi',
    japaneseName: '対々和',
    tier: YakuTier.Tier2,
    multiplier: 2.0,
    requiresConcealed: false,
    description: 'All triplets',
  },
  {
    id: 'chanta',
    name: 'Chanta',
    japaneseName: '混全帯幺九',
    tier: YakuTier.Tier2,
    multiplier: 1.8,
    openMultiplier: 1.5,
    requiresConcealed: false,
    description: 'All groups contain terminals or honors',
  },
  {
    id: 'honroutou',
    name: 'Honroutou',
    japaneseName: '混老頭',
    tier: YakuTier.Tier2,
    multiplier: 2.2,
    requiresConcealed: false,
    description: 'Only terminals and honors',
  },
  {
    id: 'sanankou',
    name: 'Sanankou',
    japaneseName: '三暗刻',
    tier: YakuTier.Tier2,
    multiplier: 2.0,
    requiresConcealed: false,
    description: 'Three concealed triplets',
  },
  {
    id: 'sanshoku_doukou',
    name: 'Sanshoku Doukou',
    japaneseName: '三色同刻',
    tier: YakuTier.Tier2,
    multiplier: 2.0,
    requiresConcealed: false,
    description: 'Same triplet in all three suits',
  },
  {
    id: 'shousangen',
    name: 'Shousangen',
    japaneseName: '小三元',
    tier: YakuTier.Tier2,
    multiplier: 2.0,
    requiresConcealed: false,
    description: 'Two dragon triplets, one dragon pair',
  },

  // === TIER 3 (Advanced) ===
  {
    id: 'honitsu',
    name: 'Honitsu',
    japaneseName: '混一色',
    tier: YakuTier.Tier3,
    multiplier: 2.5,
    openMultiplier: 2.0,
    requiresConcealed: false,
    description: 'One suit plus honors',
  },
  {
    id: 'chinitsu',
    name: 'Chinitsu',
    japaneseName: '清一色',
    tier: YakuTier.Tier3,
    multiplier: 3.0,
    openMultiplier: 2.5,
    requiresConcealed: false,
    description: 'Single suit only',
  },
  {
    id: 'ryanpeikou',
    name: 'Ryanpeikou',
    japaneseName: '二盃口',
    tier: YakuTier.Tier3,
    multiplier: 3.2,
    requiresConcealed: true,
    description: 'Two pairs of identical sequences',
  },
  {
    id: 'junchan',
    name: 'Junchan',
    japaneseName: '純全帯幺九',
    tier: YakuTier.Tier3,
    multiplier: 2.8,
    openMultiplier: 2.2,
    requiresConcealed: false,
    description: 'All groups contain terminals (no honors)',
  },
  {
    id: 'chiitoitsu',
    name: 'Chiitoitsu',
    japaneseName: '七対子',
    tier: YakuTier.Tier3,
    multiplier: 2.6,
    requiresConcealed: true,
    description: 'Seven pairs',
  },

  // === TIER 4 (Yakuman) ===
  {
    id: 'kokushi',
    name: 'Kokushi Musou',
    japaneseName: '国士無双',
    tier: YakuTier.Tier4,
    multiplier: 5.0,
    requiresConcealed: true,
    description: 'Thirteen orphans',
  },
  {
    id: 'suuankou',
    name: 'Suu Ankou',
    japaneseName: '四暗刻',
    tier: YakuTier.Tier4,
    multiplier: 4.5,
    requiresConcealed: true,
    description: 'Four concealed triplets',
  },
  {
    id: 'daisangen',
    name: 'Dai San Gen',
    japaneseName: '大三元',
    tier: YakuTier.Tier4,
    multiplier: 4.0,
    requiresConcealed: false,
    description: 'Three dragon triplets',
  },
  {
    id: 'chinroutou',
    name: 'Chinroutou',
    japaneseName: '清老頭',
    tier: YakuTier.Tier4,
    multiplier: 4.2,
    requiresConcealed: false,
    description: 'Only terminal tiles',
  },
  {
    id: 'chuuren',
    name: 'Chuuren Poutou',
    japaneseName: '九蓮宝燈',
    tier: YakuTier.Tier4,
    multiplier: 5.5,
    requiresConcealed: true,
    description: 'Nine gates (1112345678999 + any)',
  },
  {
    id: 'tsuuiisou',
    name: 'Tsuuiisou',
    japaneseName: '字一色',
    tier: YakuTier.Tier4,
    multiplier: 4.5,
    requiresConcealed: false,
    description: 'All honors',
  },
  {
    id: 'shousuushii',
    name: 'Shousuushii',
    japaneseName: '小四喜',
    tier: YakuTier.Tier4,
    multiplier: 4.5,
    requiresConcealed: false,
    description: 'Three wind triplets, one wind pair',
  },
  {
    id: 'daisuushii',
    name: 'Daisuushii',
    japaneseName: '大四喜',
    tier: YakuTier.Tier4,
    multiplier: 5.0,
    requiresConcealed: false,
    description: 'Four wind triplets',
  },
  {
    id: 'ryuuiisou',
    name: 'Ryuuiisou',
    japaneseName: '緑一色',
    tier: YakuTier.Tier4,
    multiplier: 4.5,
    requiresConcealed: false,
    description: 'All green (23468s, green dragon)',
  },
  {
    id: 'suukantsu',
    name: 'Suukantsu',
    japaneseName: '四槓子',
    tier: YakuTier.Tier4,
    multiplier: 5.0,
    requiresConcealed: false,
    description: 'Four quads',
  },
]

/**
 * Get yaku definition by ID
 */
export function getYakuById(id: string): YakuDefinition | undefined {
  return YAKU_DEFINITIONS.find((y) => y.id === id)
}

/**
 * Get all yaku of a specific tier
 */
export function getYakuByTier(tier: YakuTier): YakuDefinition[] {
  return YAKU_DEFINITIONS.filter((y) => y.tier === tier)
}

/**
 * Detected yaku with context
 */
export interface DetectedYaku {
  definition: YakuDefinition
  multiplier: number // Actual multiplier (may be reduced if open)
  count: number // For stackable yaku
}

/**
 * Context for yaku detection
 */
export interface YakuContext {
  parsedHand: ParsedHand
  isRiichi: boolean
  isTsumo: boolean
  isIppatsu: boolean
  seatWind: WindType
  roundWind: WindType
}
