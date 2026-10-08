import { mapYakuIdToCategory, type CelestialOrb } from './CelestialOrbSystem'

/** Count each physical held Orb once, after Boss filtering and Yaku ascension. */
export function observatoryMultiplier(
  orbs: readonly CelestialOrb[],
  scoredYakuIds: readonly string[],
  perOrb: number
): number {
  if (perOrb === 1 || scoredYakuIds.length === 0) return 1
  const families = new Set(scoredYakuIds.map(mapYakuIdToCategory))
  const matching = orbs.filter(
    (orb) =>
      !orb.isUsed &&
      (orb.effect.targetYaku === 'All' || families.has(orb.effect.targetYaku))
  )
  return perOrb ** matching.length
}
