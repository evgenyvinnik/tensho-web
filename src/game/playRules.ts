/** Minimum number of tiles in an ordinary tactical play. */
export const MIN_TACTICAL_PLAY_TILES = 2

/**
 * Maximum number of tiles in a play that is not a complete Mahjong hand.
 * Six is enough for the largest poker-style patterns (Two Sequences, Three
 * Pairs, a Triplet and a Sequence) while keeping each choice a real choice.
 */
export const MAX_TACTICAL_PLAY_TILES = 6

/**
 * Turns per round. Play and REDRAW both spend one Turn: the single budget the
 * HUD shows as "Turns left".
 */
export const TURNS_PER_ROUND = 6

/**
 * A Small or Large round cleared with at least this many Turns to spare earns
 * that round's Omen.
 */
export const SWIFT_CLEAR_SPARE_TURNS = 2

/**
 * From this Act on, the last Turn of a round can be extended with Gold: one
 * more Turn, bought in an emergency. Act 1 has none, so a first run starts
 * exactly as before.
 */
export const EMERGENCY_TURN_FIRST_ACT = 2

/**
 * Emergency Turns are a rule of Red Stake (tier 2) and every Stake above it.
 * White Stake is untouched; on Red, the Small-round Gold the Stake withholds
 * is Gold that could have bought a rescue.
 */
export const EMERGENCY_TURN_FIRST_STAKE = 2

/**
 * When Gold is short, the emergency Turn can be earned by watching a
 * rewarded ad instead (if ads are configured; see src/ads/rewardedAds.ts),
 * this many times per Act.
 */
export const AD_TURNS_PER_ACT = 1

/** Gold per Act for the first emergency Turn bought in a round. */
export const EMERGENCY_TURN_COST_PER_ACT = 10

/**
 * Price of the next emergency Turn: it grows with the Act, and doubles with
 * each one already bought this round, so late-run Gold has a use without
 * any round becoming bottomless.
 */
export function emergencyTurnCost(
  actNumber: number,
  boughtThisRound: number
): number {
  return EMERGENCY_TURN_COST_PER_ACT * actNumber * 2 ** boughtThisRound
}

export function isTacticalPlaySize(tileCount: number): boolean {
  return (
    tileCount >= MIN_TACTICAL_PLAY_TILES &&
    tileCount <= MAX_TACTICAL_PLAY_TILES
  )
}
