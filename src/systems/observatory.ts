import {
  mapYakuIdToCategory,
  type CelestialOrb,
  type YakuCategory,
} from './CelestialOrbSystem'

/**
 * Count each physical held Orb once, after Boss filtering and Yaku ascension.
 * A tactical play passes its pattern families as `playFamilies`.
 */
export function observatoryMultiplier(
  orbs: readonly CelestialOrb[],
  scoredYakuIds: readonly string[],
  perOrb: number,
  playFamilies: readonly YakuCategory[] = []
): number {
  if (perOrb === 1 || scoredYakuIds.length + playFamilies.length === 0)
    return 1
  const families = new Set<YakuCategory | null>([
    ...scoredYakuIds.map(mapYakuIdToCategory),
    ...playFamilies,
  ])
  const matching = orbs.filter(
    (orb) =>
      !orb.isUsed &&
      (orb.effect.targetYaku === 'All' || families.has(orb.effect.targetYaku))
  )
  return perOrb ** matching.length
}
