import type { DecreeDefinition } from './decreeDefinitions'

/** Achievement rewards retain the IDs already recorded in profile unlocks. */
export const ACHIEVEMENT_REWARD_DECREES: DecreeDefinition[] = [
  {
    id: 'stage_master',
    name: 'Stage Master',
    japaneseName: '舞台師',
    description: '+25 Points and +1 Mult per completed Act',
    rarity: 'uncommon',
    effects: [
      { type: 'additive_chips', value: 25, condition: 'per Act completed' },
      { type: 'additive_mult', value: 1, condition: 'per Act completed' },
    ],
    baseSellValue: 3,
    unlockCondition: 'Reach Act 4',
  },
  {
    id: 'flower_pot',
    name: 'Flower Pot',
    japaneseName: '花瓶',
    description: '×3 Mult while owning all four distinct Flower variants',
    rarity: 'rare',
    effects: [
      {
        type: 'multiplicative_mult',
        value: 3,
        condition: 'if all four Flower variants',
      },
    ],
    baseSellValue: 4,
    unlockCondition: 'Reach Act 8 in optional Endless',
  },
  {
    id: 'satellite',
    name: 'Satellite',
    japaneseName: '衛星',
    description:
      'At the end of each won round, +1 Gold for each hand family you have raised above level 1 with Orbs.',
    rarity: 'rare',
    effects: [
      { type: 'gold_gain', value: 1, condition: 'per upgraded Orb family' },
    ],
    baseSellValue: 4,
    unlockCondition: 'Have 400+ gold in one run',
  },
  {
    id: 'swift_andy',
    name: 'Swift Andy',
    japaneseName: '迅速',
    description: '+2 free redraws each round; −2 rack spaces.',
    rarity: 'uncommon',
    effects: [
      { type: 'discard_count', value: 2 },
      { type: 'hand_size', value: -2 },
    ],
    baseSellValue: 3,
    unlockCondition: 'Win using 48 paid Turns or fewer',
  },
  {
    id: 'lucky_sixes',
    name: 'Lucky Sixes',
    japaneseName: '六福',
    description: '+6 Mult per numbered 6 played. Stones do not count.',
    rarity: 'uncommon',
    effects: [
      {
        type: 'additive_mult',
        value: 6,
        condition: 'per natural suited 6-tile',
      },
    ],
    baseSellValue: 3,
    unlockCondition: 'Score 10,000 points in one hand',
  },
  {
    id: 'the_idol',
    name: 'The Idol',
    japaneseName: '偶像',
    description:
      '×3 Mult when you play at least two tiles and all of them are the same printed tile. Stones break it; Wild tiles keep their printed face.',
    rarity: 'rare',
    effects: [
      {
        type: 'multiplicative_mult',
        value: 3,
        condition: 'if identical natural faces',
      },
    ],
    baseSellValue: 4,
    unlockCondition: 'Score 1,000,000 points in one hand',
  },
  {
    id: 'stuntman',
    name: 'Stuntman',
    japaneseName: '替え玉',
    description: '+250 Points; −3 rack spaces.',
    rarity: 'rare',
    effects: [
      { type: 'additive_chips', value: 250 },
      { type: 'hand_size', value: -3 },
    ],
    baseSellValue: 4,
    unlockCondition: 'Score 100,000,000 points in one hand',
  },
  {
    id: 'cartomancer',
    name: 'Cartomancer',
    japaneseName: '符術師',
    description: 'Guarantees 1 free Fate Seal offer on entering each Tea House',
    rarity: 'rare',
    effects: [
      { type: 'special', value: 1, condition: 'free Fate Seal on shop entry' },
    ],
    baseSellValue: 4,
    unlockCondition: 'Discover every Fate Seal',
  },
  {
    id: 'astronomer',
    name: 'Astronomer',
    japaneseName: '天文家',
    description:
      'Guarantees 1 free Celestial Orb offer on entering each Tea House',
    rarity: 'rare',
    effects: [
      {
        type: 'special',
        value: 1,
        condition: 'free Celestial Orb on shop entry',
      },
    ],
    baseSellValue: 4,
    unlockCondition: 'Discover every Celestial Orb',
  },
]
