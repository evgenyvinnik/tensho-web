import type { DetectedYaku } from './YakuDetector'

/** Keep physical pattern IDs/Orb families; promote only surviving native tier 3.
 * Nexus cannot turn a basic pattern into an ascension candidate. No catalog
 * objects are mutated, and repeated/copy effects cannot promote twice.
 */
export function ascendYaku(
  yaku: DetectedYaku,
  enabled: boolean,
  effectiveTier: number
): DetectedYaku {
  if (!enabled || yaku.definition.tier !== 3 || effectiveTier !== 3) return yaku
  return {
    ...yaku,
    definition: {
      ...yaku.definition,
      tier: 4,
      multiplier: 4,
      ascended: true,
    },
  }
}
