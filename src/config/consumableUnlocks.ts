/** Profile gates for the secret consumables authored in ITEM_LIBRARIES.md. */
export type ConsumableUnlockResolver = (id: string) => boolean

export const CONSUMABLE_UNLOCK_CONDITIONS: Record<string, string> = {
  seal_of_the_immortal: 'Score a Yakuman',
  seal_of_the_void: 'Score all 21 Yaku types in a single run',
  planet_x_orb: 'Score Seven Pairs',
  ceres_orb: 'Score Chanta',
  eris_orb: 'Score Kokushi',
  black_hole_orb: 'Discover all 12 other Celestial Orbs',
}

// Kept lightweight for the profile/menu bundle; catalog parity is tested.
// These are the live detector's families, not the older YakuDefinition draft.
export const RUN_YAKU_IDS = [
  'riichi',
  'tanyao',
  'pinfu',
  'yakuhai',
  'menzen_tsumo',
  'iipeikou',
  'sanshoku_doujun',
  'ittsu',
  'toitoi',
  'chanta',
  'honroutou',
  'honitsu',
  'chinitsu',
  'ryanpeikou',
  'junchan',
  'seven_pairs',
  'kokushi',
  'suu_ankou',
  'dai_sangen',
  'chinroutou',
  'chuuren_poutou',
] as const

export const BLACK_HOLE_PREREQUISITES = [
  'pluto_orb',
  'mercury_orb',
  'uranus_orb',
  'venus_orb',
  'saturn_orb',
  'jupiter_orb',
  'earth_orb',
  'mars_orb',
  'neptune_orb',
  'planet_x_orb',
  'ceres_orb',
  'eris_orb',
] as const

export function getConsumableUnlockCondition(id: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(CONSUMABLE_UNLOCK_CONDITIONS, id)
    ? CONSUMABLE_UNLOCK_CONDITIONS[id]
    : undefined
}

export function isConsumableAvailable(
  id: string,
  isUnlocked: ConsumableUnlockResolver = () => false
): boolean {
  return !getConsumableUnlockCondition(id) || isUnlocked(id)
}
