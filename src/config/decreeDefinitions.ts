/**
 * Decree Definitions - Complete library of 150+ decrees
 *
 * Decrees are run-wide rule modifiers (equivalent to Balatro's Jokers).
 * Organized by rarity tier with mahjong-themed effects.
 */

import type {
  DecreeRarity,
  DecreeEffect,
  DecreeEffectType,
} from '../stores/decreeStore'
import { runRandom } from '../game/RunRandom'
import { ACHIEVEMENT_REWARD_DECREES } from './achievementRewardDecrees'

/**
 * Decree definition blueprint
 */
export interface DecreeDefinition {
  id: string
  name: string
  japaneseName: string
  description: string
  rarity: DecreeRarity
  effects: DecreeEffect[]
  baseSellValue: number
  unlockCondition?: string // Optional unlock requirement
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createEffect(
  type: DecreeEffectType,
  value: number,
  condition?: string
): DecreeEffect {
  return { type, value, condition }
}

// ============================================================================
// COMMON DECREES (Tier 1) - 40 decrees
// Simple, reliable effects with no conditions
// ============================================================================

export const COMMON_DECREES: DecreeDefinition[] = [
  // Basic Chip Decrees
  {
    id: 'decree-half-suited',
    name: 'Half Suited',
    japaneseName: '半着',
    description: '+20 Points',
    rarity: 'common',
    effects: [createEffect('additive_chips', 20)],
    baseSellValue: 1,
  },
  {
    id: 'decree-misty-jade',
    name: 'Misty Jade',
    japaneseName: '霧玉',
    description: '+30 Points',
    rarity: 'common',
    effects: [createEffect('additive_chips', 30)],
    baseSellValue: 2,
  },
  {
    id: 'decree-bamboo-scroll',
    name: 'Bamboo Scroll',
    japaneseName: '竹巻',
    description: '+40 Points',
    rarity: 'common',
    effects: [createEffect('additive_chips', 40)],
    baseSellValue: 2,
  },
  {
    id: 'decree-jade-tablet',
    name: 'Jade Tablet',
    japaneseName: '玉板',
    description: '+50 Points',
    rarity: 'common',
    effects: [createEffect('additive_chips', 50)],
    baseSellValue: 3,
  },
  {
    id: 'decree-polished-stone',
    name: 'Polished Stone',
    japaneseName: '磨石',
    description: '+60 Points',
    rarity: 'common',
    effects: [createEffect('additive_chips', 60)],
    baseSellValue: 3,
  },

  // Basic Mult Decrees
  {
    id: 'decree-gentle-breeze',
    name: 'Gentle Breeze',
    japaneseName: '微風',
    description: '+2 Mult',
    rarity: 'common',
    effects: [createEffect('additive_mult', 2)],
    baseSellValue: 1,
  },
  {
    id: 'decree-rising-sun',
    name: 'Rising Sun',
    japaneseName: '朝日',
    description: '+3 Mult',
    rarity: 'common',
    effects: [createEffect('additive_mult', 3)],
    baseSellValue: 2,
  },
  {
    id: 'decree-lunar-glow',
    name: 'Lunar Glow',
    japaneseName: '月光',
    description: '+4 Mult',
    rarity: 'common',
    effects: [createEffect('additive_mult', 4)],
    baseSellValue: 2,
  },
  {
    id: 'decree-crimson-banner',
    name: 'Crimson Banner',
    japaneseName: '紅旗',
    description: '+5 Mult',
    rarity: 'common',
    effects: [createEffect('additive_mult', 5)],
    baseSellValue: 3,
  },
  {
    id: 'decree-golden-seal',
    name: 'Golden Regalia',
    japaneseName: '金璽',
    description: '+6 Mult',
    rarity: 'common',
    effects: [createEffect('additive_mult', 6)],
    baseSellValue: 3,
  },

  // Suit-Focused Decrees
  {
    id: 'decree-manzu-master',
    name: 'Master of Characters',
    japaneseName: '萬子師',
    description: '+3 Mult if the play includes a Characters tile',
    rarity: 'common',
    effects: [createEffect('additive_mult', 3, 'if hand contains Manzu')],
    baseSellValue: 2,
  },
  {
    id: 'decree-pinzu-perfectionist',
    name: 'Perfectionist of Circles',
    japaneseName: '筒子匠',
    description: '+3 Mult if the play includes a Circles tile',
    rarity: 'common',
    effects: [createEffect('additive_mult', 3, 'if hand contains Pinzu')],
    baseSellValue: 2,
  },
  {
    id: 'decree-souzu-scholar',
    name: 'Scholar of Bamboo',
    japaneseName: '索子学',
    description: '+3 Mult if the play includes a Bamboo tile',
    rarity: 'common',
    effects: [createEffect('additive_mult', 3, 'if hand contains Souzu')],
    baseSellValue: 2,
  },
  {
    id: 'decree-wind-walker',
    name: 'Wind Walker',
    japaneseName: '風歩者',
    description: '+4 Mult if the play includes a Wind',
    rarity: 'common',
    effects: [createEffect('additive_mult', 4, 'if hand contains Wind')],
    baseSellValue: 2,
  },
  {
    id: 'decree-dragon-disciple',
    name: 'Dragon Disciple',
    japaneseName: '竜弟子',
    description: '+4 Mult if the play includes a Dragon',
    rarity: 'common',
    effects: [createEffect('additive_mult', 4, 'if hand contains Dragon')],
    baseSellValue: 2,
  },

  // Terminal/Simple Focused
  {
    id: 'decree-edge-runner',
    name: 'Edge Runner',
    japaneseName: '端走者',
    description: '+20 Points per Terminal (a 1 or 9) played',
    rarity: 'common',
    effects: [createEffect('additive_chips', 20, 'per Terminal tile')],
    baseSellValue: 2,
  },
  {
    id: 'decree-middle-way',
    name: 'Middle Way',
    japaneseName: '中道',
    description: '+10 Points per Simple (a 2–8 tile) played',
    rarity: 'common',
    effects: [createEffect('additive_chips', 10, 'per Simple tile')],
    baseSellValue: 2,
  },
  {
    id: 'decree-green-fortune',
    name: 'Green Fortune',
    japaneseName: '緑運',
    description:
      '+15 Points per all-green tile played: 2, 3, 4, 6 and 8 of Bamboo, and the Green Dragon',
    rarity: 'common',
    effects: [createEffect('additive_chips', 15, 'per green tile')],
    baseSellValue: 2,
  },

  // Gold Economy Decrees
  {
    id: 'decree-coin-collector',
    name: 'Coin Collector',
    japaneseName: '銭集',
    description: '+1 Gold at the end of each round',
    rarity: 'common',
    effects: [createEffect('gold_gain', 1)],
    baseSellValue: 2,
  },
  {
    id: 'decree-merchants-favor',
    name: "Merchant's Favor",
    japaneseName: '商人恩',
    description: '+2 Gold at the end of each round',
    rarity: 'common',
    effects: [createEffect('gold_gain', 2)],
    baseSellValue: 3,
  },
  {
    id: 'decree-lucky-coin',
    name: 'Lucky Coin',
    japaneseName: '幸運銭',
    description: '+3 Gold at the end of each round',
    rarity: 'common',
    effects: [createEffect('gold_gain', 3)],
    baseSellValue: 4,
  },

  // Structure-Focused Decrees
  {
    id: 'decree-pair-lover',
    name: 'Pair Lover',
    japaneseName: '対好者',
    description: '+30 Points if the play includes a pair',
    rarity: 'common',
    effects: [createEffect('additive_chips', 30, 'if hand contains pair')],
    baseSellValue: 2,
  },
  {
    id: 'decree-sequence-seeker',
    name: 'Sequence Seeker',
    japaneseName: '順子求',
    description: '+30 Points if the play includes a sequence',
    rarity: 'common',
    effects: [createEffect('additive_chips', 30, 'if hand contains sequence')],
    baseSellValue: 2,
  },
  {
    id: 'decree-triplet-tracker',
    name: 'Triplet Tracker',
    japaneseName: '刻子追',
    description: '+40 Points if the play includes a triplet',
    rarity: 'common',
    effects: [createEffect('additive_chips', 40, 'if hand contains triplet')],
    baseSellValue: 2,
  },

  // Flower/Season Synergy
  {
    id: 'decree-flower-friend',
    name: 'Flower Friend',
    japaneseName: '花友',
    description: '+10 Points per collected Flower',
    rarity: 'common',
    effects: [createEffect('additive_chips', 10, 'per Flower')],
    baseSellValue: 2,
  },
  {
    id: 'decree-seasonal-blessing',
    name: 'Seasonal Blessing',
    japaneseName: '季福',
    description: '+2 Mult per active Season',
    rarity: 'common',
    effects: [createEffect('additive_mult', 2, 'per active Season')],
    baseSellValue: 2,
  },

  // Hand Size/Draw
  {
    id: 'decree-wide-grip',
    name: 'Wide Grip',
    japaneseName: '広握',
    description: '+1 rack space',
    rarity: 'common',
    effects: [createEffect('hand_size', 1)],
    baseSellValue: 3,
  },
  {
    id: 'decree-second-chance',
    name: 'Second Chance',
    japaneseName: '再機会',
    description: '+1 free redraw per round',
    rarity: 'common',
    effects: [createEffect('discard_count', 1)],
    baseSellValue: 3,
  },

  // Mixed Effects
  {
    id: 'decree-balanced-path',
    name: 'Balanced Path',
    japaneseName: '均衡道',
    description: '+15 Points and +2 Mult',
    rarity: 'common',
    effects: [
      createEffect('additive_chips', 15),
      createEffect('additive_mult', 2),
    ],
    baseSellValue: 2,
  },
  {
    id: 'decree-modest-fortune',
    name: 'Modest Fortune',
    japaneseName: '謙運',
    description: '+20 Points, and +1 Gold at the end of each round',
    rarity: 'common',
    effects: [createEffect('additive_chips', 20), createEffect('gold_gain', 1)],
    baseSellValue: 2,
  },
  {
    id: 'decree-humble-power',
    name: 'Humble Power',
    japaneseName: '謙力',
    description: '+2 Mult, and +1 Gold at the end of each round',
    rarity: 'common',
    effects: [createEffect('additive_mult', 2), createEffect('gold_gain', 1)],
    baseSellValue: 2,
  },

  // Rank-Focused
  {
    id: 'decree-one-mastery',
    name: 'One Mastery',
    japaneseName: '壱極',
    description: '+25 Points per numbered 1 played',
    rarity: 'common',
    effects: [createEffect('additive_chips', 25, 'per 1-tile')],
    baseSellValue: 2,
  },
  {
    id: 'decree-nine-mastery',
    name: 'Nine Mastery',
    japaneseName: '九極',
    description: '+25 Points per numbered 9 played',
    rarity: 'common',
    effects: [createEffect('additive_chips', 25, 'per 9-tile')],
    baseSellValue: 2,
  },
  {
    id: 'decree-five-blessing',
    name: 'Five Blessing',
    japaneseName: '五福',
    description: '+35 Points per numbered 5 played',
    rarity: 'common',
    effects: [createEffect('additive_chips', 35, 'per 5-tile')],
    baseSellValue: 2,
  },

  // Simple Multipliers
  {
    id: 'decree-spark',
    name: 'Spark',
    japaneseName: '火花',
    description: '×1.2 Mult',
    rarity: 'common',
    effects: [createEffect('multiplicative_mult', 1.2)],
    baseSellValue: 3,
  },
  {
    id: 'decree-ember',
    name: 'Ember',
    japaneseName: '残火',
    description: '×1.3 Mult',
    rarity: 'common',
    effects: [createEffect('multiplicative_mult', 1.3)],
    baseSellValue: 4,
  },

  // Yaku Boosters
  {
    // Formerly Riichi Devotee; the pledge was retired, the id is kept.
    id: 'decree-riichi-devotee',
    name: 'Pair Devotee',
    japaneseName: '対子信者',
    description: '+4 Mult if the play includes two or more pairs',
    rarity: 'common',
    effects: [createEffect('additive_mult', 4, 'if 2+ pairs')],
    baseSellValue: 2,
  },
  {
    id: 'decree-tanyao-tactician',
    name: 'Simples Tactician',
    japaneseName: '断么戦術家',
    description:
      '+3 Mult when you score All Simples: a complete hand of only 2–8 tiles, with no 1s, 9s, Winds or Dragons',
    rarity: 'common',
    effects: [createEffect('additive_mult', 3, 'when scoring Tanyao')],
    baseSellValue: 2,
  },
  {
    id: 'decree-pinfu-purist',
    name: 'Sequence Purist',
    japaneseName: '平和純粋者',
    description:
      '+3 Mult when you score All Sequences: a complete hand of four sequences plus a pair that is not Dragons or East Wind',
    rarity: 'common',
    effects: [createEffect('additive_mult', 3, 'when scoring Pinfu')],
    baseSellValue: 2,
  },
]

// ============================================================================
// UNCOMMON DECREES (Tier 2) - 40 decrees
// Conditional effects with stronger bonuses
// ============================================================================

export const UNCOMMON_DECREES: DecreeDefinition[] = [
  ...ACHIEVEMENT_REWARD_DECREES.filter((decree) => decree.rarity === 'uncommon'),
  // Suit Specialists
  {
    id: 'decree-manzu-emperor',
    name: 'Emperor of Characters',
    japaneseName: '萬子皇帝',
    description: '+8 Mult if at least half the played tiles are Characters',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 8, 'if hand is half Manzu')],
    baseSellValue: 4,
  },
  {
    id: 'decree-pinzu-princess',
    name: 'Princess of Circles',
    japaneseName: '筒子姫',
    description: '+8 Mult if at least half the played tiles are Circles',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 8, 'if hand is half Pinzu')],
    baseSellValue: 4,
  },
  {
    id: 'decree-souzu-sage',
    name: 'Sage of Bamboo',
    japaneseName: '索子賢者',
    description: '+8 Mult if at least half the played tiles are Bamboo',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 8, 'if hand is half Souzu')],
    baseSellValue: 4,
  },

  // Conditional Multipliers
  {
    id: 'decree-flush-fever',
    name: 'Flush Fever',
    japaneseName: '一色熱',
    description:
      '×1.5 Mult if every numbered tile played is from one suit (Winds and Dragons allowed)',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.5, 'if single suit')],
    baseSellValue: 5,
  },
  {
    id: 'decree-honor-guard',
    name: 'Honor Guard',
    japaneseName: '字牌守護',
    description:
      '×1.5 Mult if the play includes 3 or more Honors (Winds or Dragons)',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.5, 'if 3+ Honors')],
    baseSellValue: 5,
  },
  {
    id: 'decree-terminal-tide',
    name: 'Terminal Tide',
    japaneseName: '端牌潮流',
    description:
      '×1.5 Mult if the play includes 4 or more Terminals (1s or 9s)',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.5, 'if 4+ Terminals')],
    baseSellValue: 5,
  },

  // Sequence Synergies
  {
    id: 'decree-straight-arrow',
    name: 'Straight Arrow',
    japaneseName: '直矢',
    description: '+80 Points if the play includes 3 or more sequences',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 80, 'if 3 sequences')],
    baseSellValue: 4,
  },
  {
    id: 'decree-run-master',
    name: 'Run Master',
    japaneseName: '連続師',
    description: '+6 Mult per sequence played',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 6, 'per sequence')],
    baseSellValue: 4,
  },

  // Triplet Synergies
  {
    id: 'decree-triple-threat',
    name: 'Triple Threat',
    japaneseName: '三重脅威',
    description: '+80 Points if the play includes 2 or more triplets',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 80, 'if 2+ triplets')],
    baseSellValue: 4,
  },
  {
    id: 'decree-triplet-thunder',
    name: 'Triplet Thunder',
    japaneseName: '刻子雷',
    description: '+8 Mult per triplet played',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 8, 'per triplet')],
    baseSellValue: 4,
  },

  // Retrigger Effects
  {
    id: 'decree-echo-stone',
    name: 'Echo Stone',
    japaneseName: '反響石',
    description: 'The first scoring tile scores twice',
    rarity: 'uncommon',
    effects: [createEffect('retrigger', 1, 'first scoring tile')],
    baseSellValue: 5,
  },
  {
    id: 'decree-mirror-shard',
    name: 'Mirror Shard',
    japaneseName: '鏡片',
    description: 'The last scoring tile scores twice',
    rarity: 'uncommon',
    effects: [createEffect('retrigger', 1, 'last scoring tile')],
    baseSellValue: 5,
  },
  {
    id: 'decree-dragon-echo',
    name: 'Dragon Echo',
    japaneseName: '竜響',
    description: 'Every Dragon played scores twice',
    rarity: 'uncommon',
    effects: [createEffect('retrigger', 1, 'all Dragon tiles')],
    baseSellValue: 5,
  },
  {
    id: 'decree-wind-echo',
    name: 'Wind Echo',
    japaneseName: '風響',
    description: 'Every Wind played scores twice',
    rarity: 'uncommon',
    effects: [createEffect('retrigger', 1, 'all Wind tiles')],
    baseSellValue: 5,
  },

  // Gold Scaling
  {
    id: 'decree-golden-ratio',
    name: 'Golden Ratio',
    japaneseName: '黄金比',
    description: '+1 Mult per 5 Gold you hold (max +10)',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 1, 'per ¥5 (max +10)')],
    baseSellValue: 4,
  },
  {
    id: 'decree-treasure-hunter',
    name: 'Treasure Hunter',
    japaneseName: '宝探し',
    description:
      'When you win a round, +1 Gold for each different suit left on your rack. Winds and Dragons count as separate suits.',
    rarity: 'uncommon',
    effects: [createEffect('gold_gain', 1, 'per unique suit')],
    baseSellValue: 4,
  },
  {
    id: 'decree-tax-collector',
    name: 'Tax Collector',
    japaneseName: '徴税官',
    description: '+4 Gold at the end of each round',
    rarity: 'uncommon',
    effects: [createEffect('gold_gain', 4)],
    baseSellValue: 5,
  },

  // Flower Power
  {
    id: 'decree-garden-keeper',
    name: 'Garden Keeper',
    japaneseName: '庭師',
    description: '+4 Mult per collected Flower',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 4, 'per Flower')],
    baseSellValue: 4,
  },
  {
    id: 'decree-blossom-storm',
    name: 'Blossom Storm',
    japaneseName: '花嵐',
    description: '×1.2 Mult per collected Flower',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.2, 'per Flower')],
    baseSellValue: 5,
  },
  {
    id: 'decree-seasonal-wind',
    name: 'Seasonal Wind',
    japaneseName: '季節風',
    description: '+50 Points per active Season',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 50, 'per Season')],
    baseSellValue: 4,
  },

  // Round-Based
  {
    id: 'decree-slow-burn',
    name: 'Slow Burn',
    japaneseName: '遅火',
    description: '+2 Mult per round completed this run',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 2, 'per round this run')],
    baseSellValue: 4,
  },
  {
    id: 'decree-momentum',
    name: 'Momentum',
    japaneseName: '勢い',
    description: '+15 Points for each earlier play this round',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 15, 'per hand this round')],
    baseSellValue: 4,
  },
  {
    id: 'decree-crescendo',
    name: 'Crescendo',
    japaneseName: '漸強',
    description: '×1.1 Mult for each earlier play this round',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.1, 'per hand this round')],
    baseSellValue: 5,
  },

  // Discard Synergy
  {
    id: 'decree-waste-not',
    name: 'Waste Not',
    japaneseName: '無駄無',
    description: '+5 Mult if you have not used REDRAW this round',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 5, 'if no discards used')],
    baseSellValue: 4,
  },
  {
    id: 'decree-recycler',
    name: 'Recycler',
    japaneseName: '再利用者',
    description: '+10 Points per tile redrawn this round',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 10, 'per discard used')],
    baseSellValue: 4,
  },

  // Yaku Specialists
  {
    id: 'decree-yakuhai-zealot',
    name: 'Value Zealot',
    japaneseName: '役牌狂信者',
    description:
      '×1.5 Mult when you score Value Tiles: a complete hand with a triplet or quad of Dragons or East Wind',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.5, 'when scoring Yakuhai')],
    baseSellValue: 5,
  },
  {
    id: 'decree-toitoi-titan',
    name: 'Triplet Titan',
    japaneseName: '対々巨人',
    description:
      '×1.5 Mult when you score All Triplets: a complete hand of four triplets or quads plus a pair',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.5, 'when scoring Toitoi')],
    baseSellValue: 5,
  },
  {
    id: 'decree-ittsu-initiate',
    name: 'Ninefold Initiate',
    japaneseName: '一通入門',
    description:
      '×1.5 Mult when you score a 1–9 Straight: a complete hand holding 1-2-3, 4-5-6 and 7-8-9 of one suit',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.5, 'when scoring Ittsu')],
    baseSellValue: 5,
  },
  {
    id: 'decree-chinitsu-champion',
    name: 'Full Flush Champion',
    japaneseName: '清一色王者',
    description:
      '×2 Mult when you score a Full Flush: a complete hand of one suit only, with no Winds or Dragons',
    rarity: 'uncommon',
    effects: [
      createEffect('multiplicative_mult', 2.0, 'when scoring Chinitsu'),
    ],
    baseSellValue: 6,
  },

  // Act Scaling
  {
    id: 'decree-veteran',
    name: 'Veteran',
    japaneseName: '古参',
    description: '+30 Points per completed Act',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 30, 'per Act completed')],
    baseSellValue: 4,
  },
  {
    id: 'decree-experience',
    name: 'Experience',
    japaneseName: '経験',
    description: '×1.1 Mult per completed Act',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.1, 'per Act completed')],
    baseSellValue: 4,
  },

  // Enhanced Basics
  {
    id: 'decree-greater-jade',
    name: 'Greater Jade',
    japaneseName: '大玉',
    description: '+80 Points',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 80)],
    baseSellValue: 4,
  },
  {
    id: 'decree-blazing-banner',
    name: 'Blazing Banner',
    japaneseName: '烈火旗',
    description: '+10 Mult',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 10)],
    baseSellValue: 4,
  },
  {
    id: 'decree-flame',
    name: 'Flame',
    japaneseName: '炎',
    description: '×1.5 Mult',
    rarity: 'uncommon',
    effects: [createEffect('multiplicative_mult', 1.5)],
    baseSellValue: 5,
  },

  // Combo Effects
  {
    id: 'decree-wind-dragon',
    name: 'Wind and Dragon',
    japaneseName: '風竜',
    description: '+5 Mult if the play includes both a Wind and a Dragon',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 5, 'if Wind and Dragon')],
    baseSellValue: 4,
  },
  {
    id: 'decree-all-suits',
    name: 'All Suits',
    japaneseName: '三色揃',
    description: '+8 Mult if the play includes Characters, Circles and Bamboo',
    rarity: 'uncommon',
    effects: [createEffect('additive_mult', 8, 'if all 3 suits')],
    baseSellValue: 4,
  },
  {
    id: 'decree-bookends',
    name: 'Bookends',
    japaneseName: '端揃',
    description: '+60 Points if the play includes both a 1 and a 9',
    rarity: 'uncommon',
    effects: [createEffect('additive_chips', 60, 'if has 1 and 9')],
    baseSellValue: 4,
  },

  // Hand Management
  {
    id: 'decree-expansive-grip',
    name: 'Expansive Grip',
    japaneseName: '拡張握',
    description: '+2 rack spaces',
    rarity: 'uncommon',
    effects: [createEffect('hand_size', 2)],
    baseSellValue: 5,
  },
  {
    id: 'decree-careful-player',
    name: 'Careful Player',
    japaneseName: '慎重者',
    description: '+2 free redraws per round',
    rarity: 'uncommon',
    effects: [createEffect('discard_count', 2)],
    baseSellValue: 5,
  },
]

// ============================================================================
// RARE DECREES (Tier 3) - 35 decrees
// Powerful effects with significant impact
// ============================================================================

export const RARE_DECREES: DecreeDefinition[] = [
  ...ACHIEVEMENT_REWARD_DECREES.filter((decree) => decree.rarity === 'rare'),
  // Powerful Multipliers
  {
    id: 'decree-inferno',
    name: 'Inferno',
    japaneseName: '業火',
    description: '×2 Mult',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.0)],
    baseSellValue: 7,
  },
  {
    id: 'decree-supernova',
    name: 'Supernova',
    japaneseName: '超新星',
    description:
      '×2.5 Mult if this play brings the round score to at least twice the target, before Supernova and Perfectionist bonuses.',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.5, 'if 2x over target')],
    baseSellValue: 7,
  },
  {
    id: 'decree-perfectionist',
    name: 'Perfectionist',
    japaneseName: '完璧主義',
    description:
      '×3.0 Mult if the first play clears the round, before Supernova and Perfectionist bonuses.',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 3.0, 'if first hand wins')],
    baseSellValue: 8,
  },

  // Scaling Effects
  {
    id: 'decree-compound-interest',
    name: 'Compound Interest',
    japaneseName: '複利',
    description: '+2 Mult per 10 Gold you hold',
    rarity: 'rare',
    effects: [createEffect('additive_mult', 2, 'per ¥10')],
    baseSellValue: 6,
  },
  {
    id: 'decree-wealth-engine',
    name: 'Wealth Engine',
    japaneseName: '富の機関',
    description: '+1 Gold per Decree owned at the end of each round',
    rarity: 'rare',
    effects: [createEffect('gold_gain', 1, 'per Decree owned')],
    baseSellValue: 6,
  },
  {
    id: 'decree-perpetual-motion',
    name: 'Perpetual Motion',
    japaneseName: '永久機関',
    description: '+2 Mult for each earlier play this run',
    rarity: 'rare',
    effects: [createEffect('additive_mult', 2, 'per hand this run')],
    baseSellValue: 7,
  },

  // Multi-Retrigger
  {
    id: 'decree-triple-echo',
    name: 'Triple Echo',
    japaneseName: '三重響',
    description: 'Every scoring tile scores twice',
    rarity: 'rare',
    effects: [createEffect('retrigger', 1, 'all scoring tiles')],
    baseSellValue: 8,
  },
  {
    id: 'decree-terminal-resonance',
    name: 'Terminal Resonance',
    japaneseName: '端牌共鳴',
    description: 'Every Terminal (1 or 9) played scores three times',
    rarity: 'rare',
    effects: [createEffect('retrigger', 2, 'Terminal tiles')],
    baseSellValue: 7,
  },
  {
    id: 'decree-honor-resonance',
    name: 'Honor Resonance',
    japaneseName: '字牌共鳴',
    description: 'Every Honor (Wind or Dragon) played scores three times',
    rarity: 'rare',
    effects: [createEffect('retrigger', 2, 'Honor tiles')],
    baseSellValue: 7,
  },

  // Suit Mastery
  {
    id: 'decree-manzu-monarch',
    name: 'Monarch of Characters',
    japaneseName: '萬子王',
    description: '×2 Mult if every played tile is Characters',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.0, 'if all Manzu')],
    baseSellValue: 7,
  },
  {
    id: 'decree-pinzu-potentate',
    name: 'Potentate of Circles',
    japaneseName: '筒子君主',
    description: '×2 Mult if every played tile is Circles',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.0, 'if all Pinzu')],
    baseSellValue: 7,
  },
  {
    id: 'decree-souzu-sovereign',
    name: 'Sovereign of Bamboo',
    japaneseName: '索子主権',
    description: '×2 Mult if every played tile is Bamboo',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.0, 'if all Souzu')],
    baseSellValue: 7,
  },

  // Flora Mastery
  {
    id: 'decree-flower-emperor',
    name: 'Flower Emperor',
    japaneseName: '花帝',
    description: '×1.5 Mult per collected Flower',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 1.5, 'per Flower')],
    baseSellValue: 7,
  },
  {
    id: 'decree-season-lord',
    name: 'Season Lord',
    japaneseName: '季節主',
    description: '+10 Mult per active Season',
    rarity: 'rare',
    effects: [createEffect('additive_mult', 10, 'per Season')],
    baseSellValue: 6,
  },
  {
    id: 'decree-nature-bond',
    name: 'Nature Bond',
    japaneseName: '自然絆',
    description: '+3 Mult per Flower, +30 Points per Season',
    rarity: 'rare',
    effects: [
      createEffect('additive_mult', 3, 'per Flower'),
      createEffect('additive_chips', 30, 'per Season'),
    ],
    baseSellValue: 6,
  },

  // Yaku Mastery
  {
    id: 'decree-honitsu-herald',
    name: 'Half Flush Herald',
    japaneseName: '混一色先駆',
    description:
      '×2 Mult when you score a Half Flush: a complete hand of one suit plus Winds or Dragons',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.0, 'when scoring Honitsu')],
    baseSellValue: 7,
  },
  {
    id: 'decree-sanshoku-sage',
    name: 'Triple Sequence Sage',
    japaneseName: '三色賢者',
    description:
      '×2 Mult when you score a Mixed Triple Sequence: a complete hand with the same sequence in all three suits',
    rarity: 'rare',
    effects: [
      createEffect('multiplicative_mult', 2.0, 'when scoring Sanshoku'),
    ],
    baseSellValue: 7,
  },
  {
    id: 'decree-chanta-champion',
    name: 'Outside Hand Champion',
    japaneseName: '全帯幺王者',
    description:
      '×2 Mult when you score an Outside Hand: a complete hand with at least one sequence, where every group and the pair includes a 1, 9, Wind or Dragon. A Pure Outside Hand (the same, but with no Winds or Dragons, so every group and the pair includes a 1 or 9) also counts.',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.0, 'when scoring Chanta')],
    baseSellValue: 7,
  },

  // Boss Synergy
  {
    id: 'decree-mandate-breaker',
    name: 'Mandate Breaker',
    japaneseName: '令破壊者',
    description: 'During Boss rounds: +15 Mult and ×1.5 Mult',
    rarity: 'rare',
    effects: [
      createEffect('additive_mult', 15, 'during Boss rounds'),
      createEffect('multiplicative_mult', 1.5, 'during Boss rounds'),
    ],
    baseSellValue: 6,
  },
  {
    id: 'decree-boss-slayer',
    name: 'Boss Slayer',
    japaneseName: '親衛殺し',
    description: '×2 Mult during Boss rounds',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 2.0, 'during Boss rounds')],
    baseSellValue: 7,
  },

  // Multi-Effect Combos
  {
    id: 'decree-fortune-and-glory',
    name: 'Fortune and Glory',
    japaneseName: '運と栄光',
    description: '+60 Points and +8 Mult, and +3 Gold at the end of each round',
    rarity: 'rare',
    effects: [
      createEffect('additive_chips', 60),
      createEffect('additive_mult', 8),
      createEffect('gold_gain', 3),
    ],
    baseSellValue: 6,
  },
  {
    id: 'decree-emperors-blessing',
    name: "Emperor's Blessing",
    japaneseName: '皇帝祝福',
    description: '+100 Points and +10 Mult',
    rarity: 'rare',
    effects: [
      createEffect('additive_chips', 100),
      createEffect('additive_mult', 10),
    ],
    baseSellValue: 6,
  },
  {
    id: 'decree-golden-age',
    name: 'Golden Age',
    japaneseName: '黄金時代',
    description: '+8 Gold at the end of each round',
    rarity: 'rare',
    effects: [createEffect('gold_gain', 8)],
    baseSellValue: 7,
  },

  // Special Mechanics
  {
    id: 'decree-blueprint',
    name: 'Blueprint',
    japaneseName: '設計図',
    description: 'Copies the effect of the Decree to its right',
    rarity: 'rare',
    effects: [createEffect('special', 0, 'copies Decree to right')],
    baseSellValue: 8,
    unlockCondition: 'Win a run',
  },
  {
    id: 'decree-photograph',
    name: 'Photograph',
    japaneseName: '写真',
    description: '×2 Mult if the play includes an Honor (a Wind or Dragon)',
    rarity: 'rare',
    effects: [
      createEffect('multiplicative_mult', 2.0, 'if hand contains Honor'),
    ],
    baseSellValue: 7,
  },
  {
    id: 'decree-ancient-scroll',
    name: 'Ancient Scroll',
    japaneseName: '古代巻物',
    description: '+150 Points; −2 rack spaces',
    rarity: 'rare',
    effects: [
      createEffect('additive_chips', 150),
      createEffect('hand_size', -2),
    ],
    baseSellValue: 5,
  },
  {
    id: 'decree-sacrifice',
    name: 'Sacrifice',
    japaneseName: '犠牲',
    description: '×3 Mult; −1 Turn per round',
    rarity: 'rare',
    effects: [
      createEffect('multiplicative_mult', 3.0),
      createEffect('discard_count', -1),
    ],
    baseSellValue: 6,
  },

  // Tile Transformation
  {
    id: 'decree-transmuter',
    name: 'Transmuter',
    japaneseName: '変成者',
    description: 'Played 2–8 tiles score as Terminals (1s and 9s)',
    rarity: 'rare',
    effects: [createEffect('tile_transform', 0, 'Simples become Terminals')],
    baseSellValue: 6,
  },
  {
    id: 'decree-harmonizer',
    name: 'Harmonizer',
    japaneseName: '調和者',
    description:
      'Sequences may mix suits (for example, 1 of Characters, 2 of Circles, 3 of Bamboo)',
    rarity: 'rare',
    effects: [createEffect('special', 0, 'suits match for sequences')],
    baseSellValue: 7,
  },

  // Late Game Power
  {
    id: 'decree-final-act',
    name: 'Final Act',
    japaneseName: '終幕',
    description: '×1.5 Mult per Act past Act 4',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 1.5, 'per Act beyond 4')],
    baseSellValue: 7,
  },
  {
    id: 'decree-endless-journey',
    name: 'Endless Journey',
    japaneseName: '無限旅',
    description: '×1.2 Mult per completed Act',
    rarity: 'rare',
    effects: [createEffect('multiplicative_mult', 1.2, 'per Act completed')],
    baseSellValue: 6,
  },

  // Hand Management (Enhanced)
  {
    id: 'decree-master-grip',
    name: 'Master Grip',
    japaneseName: '達人握',
    description: '+3 rack spaces',
    rarity: 'rare',
    effects: [createEffect('hand_size', 3)],
    baseSellValue: 7,
  },
  {
    id: 'decree-infinite-patience',
    name: 'Infinite Patience',
    japaneseName: '無限忍耐',
    description: '+3 free redraws per round',
    rarity: 'rare',
    effects: [createEffect('discard_count', 3)],
    baseSellValue: 7,
  },
]

// ============================================================================
// LEGENDARY DECREES (Tier 4) - 25 decrees
// Very powerful, often unique effects
// ============================================================================

export const LEGENDARY_DECREES: DecreeDefinition[] = [
  // Ultimate Multipliers
  {
    id: 'decree-divine-flame',
    name: 'Divine Flame',
    japaneseName: '神炎',
    description: '×3 Mult',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 3.0)],
    baseSellValue: 10,
  },
  {
    id: 'decree-heavens-wrath',
    name: "Heaven's Wrath",
    japaneseName: '天罰',
    description:
      '×4 Mult if the play has no 2–8 tiles (only 1s, 9s, Winds and Dragons)',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 4.0, 'if no Simples')],
    baseSellValue: 10,
  },
  {
    id: 'decree-void-blessing',
    name: 'Void Blessing',
    japaneseName: '虚空祝福',
    description: '×5 Mult if every played tile is a Wind or Dragon',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 5.0, 'if all Honors')],
    baseSellValue: 12,
  },

  // Full Retriggers
  {
    id: 'decree-eternal-echo',
    name: 'Eternal Echo',
    japaneseName: '永遠響',
    description: 'Every scoring tile scores three times',
    rarity: 'legendary',
    effects: [createEffect('retrigger', 2, 'all scoring tiles')],
    baseSellValue: 12,
  },
  {
    id: 'decree-dragon-king',
    name: 'Dragon King',
    japaneseName: '竜王',
    description: 'Every Dragon played scores four times',
    rarity: 'legendary',
    effects: [createEffect('retrigger', 3, 'Dragon tiles')],
    baseSellValue: 10,
  },

  // Yaku Enhancement
  {
    id: 'decree-yaku-amplifier',
    name: 'Yaku Amplifier',
    japaneseName: '役増幅器',
    description:
      'When a complete hand scores Yaku, its combined Yaku multiplier is multiplied by 1.5',
    rarity: 'legendary',
    effects: [createEffect('special', 1.5, 'all Yaku ×1.5')],
    baseSellValue: 12,
  },
  {
    id: 'decree-yakuman-seeker',
    name: 'Yakuman Seeker',
    japaneseName: '役満求道者',
    description:
      '×5 Mult when you score a Yakuman, a top-tier hand such as Big Three Dragons or Thirteen Orphans',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 5.0, 'when scoring Yakuman')],
    baseSellValue: 12,
  },

  // Flora Ultimate
  {
    id: 'decree-four-seasons-master',
    name: 'Four Seasons Master',
    japaneseName: '四季達人',
    description: '×2 Mult per active Season',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 2.0, 'per Season')],
    baseSellValue: 12,
  },
  {
    id: 'decree-eternal-garden',
    name: 'Eternal Garden',
    japaneseName: '永遠庭園',
    description: '+10 Mult per Flower. Drought cannot suppress your Flowers.',
    rarity: 'legendary',
    effects: [
      createEffect('additive_mult', 10, 'per Flower'),
      createEffect('special', 0, 'Flowers protected'),
    ],
    baseSellValue: 12,
  },

  // Economy Ultimate
  {
    id: 'decree-midas-touch',
    name: 'Midas Touch',
    japaneseName: '黄金の手',
    description: '+10 Gold at the end of each round',
    rarity: 'legendary',
    effects: [createEffect('gold_gain', 10)],
    baseSellValue: 12,
  },
  {
    id: 'decree-infinite-wealth',
    name: 'Infinite Wealth',
    japaneseName: '無限財宝',
    description: '×1.1 Mult per 10 Gold you hold',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 1.1, 'per ¥10')],
    baseSellValue: 10,
  },

  // Copy Effects
  {
    id: 'decree-brainstorm',
    name: 'Brainstorm',
    japaneseName: '脳嵐',
    description: 'Copies the effect of your leftmost Decree',
    rarity: 'legendary',
    effects: [createEffect('special', 0, 'copies leftmost Decree')],
    baseSellValue: 10,
    unlockCondition: 'Win with 5 Decrees',
  },
  {
    id: 'decree-doppelganger',
    name: 'Doppelganger',
    japaneseName: '分身',
    description:
      'Copies one random non-copy Decree, chosen on acquisition and each round. The target stays fixed for the round.',
    rarity: 'legendary',
    effects: [createEffect('special', 0, 'copies random Decree')],
    baseSellValue: 12,
  },

  // Suit Ultimate
  {
    id: 'decree-manzu-god',
    name: 'God of Characters',
    japaneseName: '萬子神',
    description: '×3 Mult if every played tile is Characters',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 3.0, 'if all Manzu')],
    baseSellValue: 10,
  },
  {
    id: 'decree-pinzu-god',
    name: 'God of Circles',
    japaneseName: '筒子神',
    description: '×3 Mult if every played tile is Circles',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 3.0, 'if all Pinzu')],
    baseSellValue: 10,
  },
  {
    id: 'decree-souzu-god',
    name: 'God of Bamboo',
    japaneseName: '索子神',
    description: '×3 Mult if every played tile is Bamboo',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 3.0, 'if all Souzu')],
    baseSellValue: 10,
  },

  // Special Mechanics
  {
    id: 'decree-glass-cannon',
    name: 'Glass Cannon',
    japaneseName: '硝子砲',
    description: '×6 Mult. Destroyed if you lose a Boss round.',
    rarity: 'legendary',
    effects: [
      createEffect('multiplicative_mult', 6.0),
      createEffect('special', 0, 'destroyed on boss loss'),
    ],
    baseSellValue: 8,
  },
  {
    id: 'decree-phoenix',
    name: 'Phoenix',
    japaneseName: '鳳凰',
    description:
      'If you would lose a round, you clear it instead. This Decree is then destroyed.',
    rarity: 'legendary',
    effects: [createEffect('special', 0, 'prevents one loss')],
    baseSellValue: 15,
  },
  {
    id: 'decree-time-lord',
    name: 'Time Lord',
    japaneseName: '時の主',
    description: '+1 Turn per round',
    rarity: 'legendary',
    effects: [createEffect('special', 1, 'extra hand')],
    baseSellValue: 12,
  },

  // Score Scaling
  {
    id: 'decree-exponential',
    name: 'Exponential',
    japaneseName: '指数的',
    description: '×1.3 Mult per 100 base Points in the play',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 1.3, 'per 100 base chips')],
    baseSellValue: 10,
  },
  {
    id: 'decree-chain-reaction',
    name: 'Chain Reaction',
    japaneseName: '連鎖反応',
    description: '×1.5 Mult per Yaku in the scored hand',
    rarity: 'legendary',
    effects: [createEffect('multiplicative_mult', 1.5, 'per Yaku this hand')],
    baseSellValue: 10,
  },

  // Mega Basics
  {
    id: 'decree-cosmic-jade',
    name: 'Cosmic Jade',
    japaneseName: '宇宙玉',
    description: '+200 Points and ×1.5 Mult',
    rarity: 'legendary',
    effects: [
      createEffect('additive_chips', 200),
      createEffect('multiplicative_mult', 1.5),
    ],
    baseSellValue: 10,
  },
  {
    id: 'decree-solar-banner',
    name: 'Solar Banner',
    japaneseName: '太陽旗',
    description: '+25 Mult and ×2 Mult',
    rarity: 'legendary',
    effects: [
      createEffect('additive_mult', 25),
      createEffect('multiplicative_mult', 2.0),
    ],
    baseSellValue: 10,
  },
  {
    id: 'decree-universal-grip',
    name: 'Universal Grip',
    japaneseName: '万能握',
    description: '+4 rack spaces',
    rarity: 'legendary',
    effects: [createEffect('hand_size', 4)],
    baseSellValue: 12,
  },
]

// ============================================================================
// MYTHIC DECREES (Tier 5) - 15 decrees
// Game-changing, run-defining effects
// ============================================================================

export const MYTHIC_DECREES: DecreeDefinition[] = [
  // Ultimate Power
  {
    id: 'decree-heavenly-ordinance',
    name: 'Heavenly Ordinance',
    japaneseName: '天命',
    description: '×5 Mult',
    rarity: 'mythic',
    effects: [createEffect('multiplicative_mult', 5.0)],
    baseSellValue: 20,
    unlockCondition: 'Score a Yakuman',
  },
  {
    id: 'decree-celestial-throne',
    name: 'Celestial Throne',
    japaneseName: '天座',
    description: '×10 Mult; −2 rack spaces and −1 Turn per round',
    rarity: 'mythic',
    effects: [
      createEffect('multiplicative_mult', 10.0),
      createEffect('hand_size', -2),
      createEffect('discard_count', -1),
    ],
    baseSellValue: 15,
  },
  {
    id: 'decree-void-emperor',
    name: 'Void Emperor',
    japaneseName: '虚帝',
    description: '×8 Mult if your previous play scored 0',
    rarity: 'mythic',
    effects: [createEffect('multiplicative_mult', 8.0, 'if last hand was 0')],
    baseSellValue: 18,
  },

  // Ultimate Retriggers
  {
    id: 'decree-infinite-loop',
    name: 'Infinite Loop',
    japaneseName: '無限回廊',
    description: 'Every scoring tile scores four times',
    rarity: 'mythic',
    effects: [createEffect('retrigger', 3, 'all scoring tiles')],
    baseSellValue: 20,
  },
  {
    id: 'decree-echo-dimension',
    name: 'Echo Dimension',
    japaneseName: '響次元',
    description:
      'Doubles the extra scorings your other Decrees grant (a tile that scores twice scores three times)',
    rarity: 'mythic',
    effects: [createEffect('special', 2, 'double retriggers')],
    baseSellValue: 18,
  },

  // Ultimate Copy
  {
    id: 'decree-clone-army',
    name: 'Clone Army',
    japaneseName: '複製軍',
    description: 'Copies the effects of all your other Decrees',
    rarity: 'mythic',
    effects: [createEffect('special', 0, 'copies all Decrees')],
    baseSellValue: 25,
    unlockCondition: 'Win on Gold Stake',
  },

  // Ultimate Flora
  {
    id: 'decree-world-tree',
    name: 'World Tree',
    japaneseName: '世界樹',
    description: '×2 Mult per Flower and ×1.5 Mult per active Season',
    rarity: 'mythic',
    effects: [
      createEffect('multiplicative_mult', 2.0, 'per Flower'),
      createEffect('multiplicative_mult', 1.5, 'per Season'),
    ],
    baseSellValue: 20,
  },

  // Ultimate Economy
  {
    id: 'decree-philosophers-stone',
    name: "Philosopher's Stone",
    japaneseName: '賢者の石',
    description:
      'Doubles the Gold you earn from plays, REDRAW, items and round payouts (not from selling Decrees or from Omens)',
    rarity: 'mythic',
    effects: [createEffect('special', 2, 'double gold gain')],
    baseSellValue: 20,
  },
  {
    id: 'decree-dragon-hoard',
    name: 'Dragon Hoard',
    japaneseName: '竜の宝庫',
    description: '×1.2 Mult per 10 Gold you hold',
    rarity: 'mythic',
    effects: [createEffect('multiplicative_mult', 1.2, 'per ¥10')],
    baseSellValue: 18,
  },

  // Yaku Ultimate
  {
    id: 'decree-yaku-nexus',
    name: 'Yaku Nexus',
    japaneseName: '役結節',
    description:
      'Every Yaku scores as if it were one tier higher (a Tier 1 ×1.3 becomes ×1.6)',
    rarity: 'mythic',
    effects: [createEffect('special', 1, '+1 Yaku tier')],
    baseSellValue: 20,
  },
  {
    id: 'decree-yakuman-blessing',
    name: 'Yakuman Blessing',
    japaneseName: '役満祝福',
    description:
      '×10 Mult when you score a Yakuman, a top-tier hand such as Big Three Dragons or Thirteen Orphans',
    rarity: 'mythic',
    effects: [
      createEffect('multiplicative_mult', 10.0, 'when scoring Yakuman'),
    ],
    baseSellValue: 25,
    unlockCondition: 'Score 3 Yakuman in one run',
  },

  // Ultimate Special
  {
    id: 'decree-reality-warp',
    name: 'Reality Warp',
    japaneseName: '現実歪曲',
    description: 'Any 14 tiles you select can form a complete hand',
    rarity: 'mythic',
    effects: [createEffect('special', 0, 'tiles are wild')],
    baseSellValue: 25,
  },
  {
    id: 'decree-time-master',
    name: 'Time Master',
    japaneseName: '時の支配者',
    description: '+2 Turns per round',
    rarity: 'mythic',
    effects: [createEffect('special', 2, 'extra hands')],
    baseSellValue: 20,
  },
  {
    id: 'decree-immortal-decree',
    name: 'Immortal Decree',
    japaneseName: '不死勅令',
    description:
      'Whenever you would lose a round, you clear it instead. After the first rescue, your scores are halved for the rest of the run, even if you sell this Decree.',
    rarity: 'mythic',
    effects: [createEffect('special', 0, 'cannot lose')],
    baseSellValue: 15,
  },
  {
    id: 'decree-omega',
    name: 'Omega',
    japaneseName: '終極',
    description: '+500 Points, +50 Mult and ×2 Mult',
    rarity: 'mythic',
    effects: [
      createEffect('additive_chips', 500),
      createEffect('additive_mult', 50),
      createEffect('multiplicative_mult', 2.0),
    ],
    baseSellValue: 30,
    unlockCondition: 'Complete Act 8 in optional Endless',
  },
]

// ============================================================================
// COMPLETE DECREE LIBRARY
// ============================================================================

export const ALL_DECREES: DecreeDefinition[] = [
  ...COMMON_DECREES,
  ...UNCOMMON_DECREES,
  ...RARE_DECREES,
  ...LEGENDARY_DECREES,
  ...MYTHIC_DECREES,
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get decree by ID
 */
export function getDecreeDefinitionById(
  id: string
): DecreeDefinition | undefined {
  return ALL_DECREES.find((d) => d.id === id)
}

/**
 * Get decrees by rarity
 */
export function getDecreesByRarity(rarity: DecreeRarity): DecreeDefinition[] {
  return ALL_DECREES.filter((d) => d.rarity === rarity)
}

/**
 * Get unlocked decrees (no unlock condition or condition met)
 */
export function getUnlockedDecrees(
  unlockedConditions: Set<string> = new Set()
): DecreeDefinition[] {
  return ALL_DECREES.filter(
    (d) => !d.unlockCondition || unlockedConditions.has(d.unlockCondition)
  )
}

/**
 * Get random decree by rarity
 */
export function getRandomDecreeByRarity(
  rarity: DecreeRarity,
  excludeIds: Set<string> = new Set()
): DecreeDefinition | undefined {
  const available = getDecreesByRarity(rarity).filter(
    (d) => !excludeIds.has(d.id)
  )
  if (available.length === 0) return undefined
  return available[Math.floor(runRandom.next('decrees') * available.length)]
}

/**
 * Get shop appearance weights by rarity
 */
export const DECREE_SHOP_WEIGHTS: Record<DecreeRarity, number> = {
  common: 0.45,
  uncommon: 0.3,
  rare: 0.18,
  legendary: 0.06,
  mythic: 0.01,
}

/**
 * Get base cost by rarity
 */
export const DECREE_BASE_COSTS: Record<DecreeRarity, number> = {
  common: 4,
  uncommon: 6,
  rare: 8,
  legendary: 10,
  mythic: 15,
}

/**
 * Calculate actual shop cost with modifiers
 */
export function calculateDecreeCost(
  definition: DecreeDefinition,
  discountPercent: number = 0
): number {
  const baseCost = DECREE_BASE_COSTS[definition.rarity]
  const discountedCost = baseCost * (1 - discountPercent / 100)
  return Math.max(1, Math.round(discountedCost))
}

// Statistics
export const DECREE_STATS = {
  total: ALL_DECREES.length,
  byRarity: {
    common: COMMON_DECREES.length,
    uncommon: UNCOMMON_DECREES.length,
    rare: RARE_DECREES.length,
    legendary: LEGENDARY_DECREES.length,
    mythic: MYTHIC_DECREES.length,
  },
}
