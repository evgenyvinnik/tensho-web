/**
 * What a Boss Mandate does to you, in a few words: "Rack −1", "1 Play only",
 * "No REDRAW". The full rule text lives in the Mandate's description; this is
 * the compact consequence shown beside its icon in the round header.
 */

import type { MandateEffectType } from '../config/mandateDefinitions'
import type { PlayPatternId } from '../rules/PlayPattern'

export interface MandateConsequence {
  /** i18n key under `mandateConsequence`. */
  key:
    | MandateEffectType
    | 'single_play_pattern_locked'
    | 'most_played_pattern_named'
  /** Interpolation values for the key. */
  values: Record<string, string | number>
}

const SUIT_KEYS: Record<string, string> = {
  manzu: 'tiles.manzu',
  pinzu: 'tiles.pinzu',
  souzu: 'tiles.souzu',
  dragon: 'tiles.dragons',
  honor: 'tiles.honors',
}

export function mandateConsequence(
  effect: {
    type: MandateEffectType
    value?: number | string
    target?: string
  },
  /**
   * The hand type the Boss names: The Mouth's, once the round's first play
   * sets it, or The Ox's most-played one.
   */
  lockedPattern?: PlayPatternId | null
): MandateConsequence {
  const count = typeof effect.value === 'number' ? effect.value : 1
  if (effect.type === 'single_play_pattern' && lockedPattern)
    return {
      key: 'single_play_pattern_locked',
      values: { patternKey: `patterns.${lockedPattern}.name` },
    }
  if (effect.type === 'most_played_pattern_zeroes_gold' && lockedPattern)
    return {
      key: 'most_played_pattern_named',
      values: { patternKey: `patterns.${lockedPattern}.name` },
    }
  return {
    key: effect.type,
    values: {
      count,
      value: count,
      ...(effect.target ? { targetKey: SUIT_KEYS[effect.target] ?? '' } : {}),
    },
  }
}
