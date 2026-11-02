import type { CelestialOrb, YakuCategory } from './CelestialOrbSystem'

/**
 * Observatory: each held, unused Orb whose family the play scored multiplies
 * its Mult by `perOrb` (the Black Hole matches any scored family). Each
 * physical Orb counts once, however many times its family paid.
 */
export function observatoryMultiplier(
  orbs: readonly CelestialOrb[],
  perOrb: number,
  scoredFamilies: Iterable<YakuCategory>
): number {
  const families = new Set(scoredFamilies)
  if (perOrb === 1 || families.size === 0) return 1
  const matching = orbs.filter(
    (orb) =>
      !orb.isUsed &&
      (orb.effect.targetYaku === 'All' || families.has(orb.effect.targetYaku))
  )
  return perOrb ** matching.length
}
