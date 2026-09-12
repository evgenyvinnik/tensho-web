import type { Tile } from '../core/Tile'
import {
  areFlowersDisabled,
  getBaseScoreModifier,
  getDecreeSlotModifier,
  getFlowerRateModifier,
  getShopDiscountModifier,
  getScoreTargetModifier,
  getTableStyleById,
  getYakumanMultiplierModifier,
  grantsRegionalMandate,
  hasEarlyCorruptedSeasons,
} from '../config/tableStyleDefinitions'
import type { ActiveTableModifiers } from '../systems/TableStyleSystem'

/** Resolve once at run start; changing menu preferences cannot change a live run. */
export function resolveTableRules(requestedId: string): {
  id: string
  modifiers: Readonly<ActiveTableModifiers>
} {
  const id = getTableStyleById(requestedId)?.id ?? 'green_felt'
  return {
    id,
    modifiers: Object.freeze({
      decreeSlotModifier: getDecreeSlotModifier(id),
      flowerRateMultiplier: 1 + getFlowerRateModifier(id) / 100,
      shopDiscountPercent: getShopDiscountModifier(id),
      baseScoreMultiplier: 1 + getBaseScoreModifier(id) / 100,
      yakumanMultiplierBonus: getYakumanMultiplierModifier(id),
      scoreTargetMultiplier: 1 + getScoreTargetModifier(id) / 100,
      flowersDisabled: areFlowersDisabled(id),
      earlyCorruptedSeasons: hasEarlyCorruptedSeasons(id),
      grantRegionalMandate: grantsRegionalMandate(id),
    }),
  }
}

/**
 * Weighted draws without replacement: Bamboo raises each Flower's draw weight
 * by 25%. No physical tiles are created, destroyed or allowed to score twice.
 * The four Flowers remain four Flowers; the modifier makes them arrive sooner.
 */
export function flowerWeightedWall(
  tiles: readonly Tile[],
  weight: number,
  random: () => number
): Tile[] {
  const remaining = [...tiles]
  const result: Tile[] = []
  while (remaining.length) {
    const total = remaining.reduce(
      (sum, tile) => sum + (tile.isFlower ? weight : 1),
      0
    )
    let roll = random() * total
    let index = remaining.length - 1
    for (let i = 0; i < remaining.length; i++) {
      roll -= remaining[i].isFlower ? weight : 1
      if (roll < 0) {
        index = i
        break
      }
    }
    result.push(remaining.splice(index, 1)[0])
  }
  return result
}
