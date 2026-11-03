import type { Decree, DecreeEffect } from './types'

/** Rules that change how Decrees count a play's tiles and groups. */
const HAND_RULE_IDS: ReadonlySet<string> = new Set([
  'tanyao_terminals',
  'phantom_pair',
])

/** A hand-rule mutation changes how plays are counted or how Yaku score, not
 * merely rewarding a play that happens to qualify. Catalog categories are
 * presentational.
 */
export function acceptsFlowerCatalyst(decree: Decree): boolean {
  const changesRules = (effect: DecreeEffect): boolean =>
    effect.type === 'yaku_modifier' ||
    (effect.type === 'rule_modification' && HAND_RULE_IDS.has(effect.ruleId)) ||
    (effect.type === 'conditional' && changesRules(effect.effect))
  return [decree.effect, ...(decree.extraEffects ?? [])].some(changesRules)
}
