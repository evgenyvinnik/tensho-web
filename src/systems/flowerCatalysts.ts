import type { Decree, DecreeEffect } from './types'

/** Yaku mutation means changing Yaku rules/multipliers, not merely rewarding
 * a hand that happens to contain one. Catalog categories are presentational.
 */
export function acceptsFlowerCatalyst(decree: Decree): boolean {
  const changesYaku = (effect: DecreeEffect): boolean =>
    effect.type === 'yaku_modifier' ||
    (effect.type === 'rule_modification' &&
      effect.ruleId === 'tanyao_terminals') ||
    (effect.type === 'conditional' && changesYaku(effect.effect))
  return [decree.effect, ...(decree.extraEffects ?? [])].some(changesYaku)
}
