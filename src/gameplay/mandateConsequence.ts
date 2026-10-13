/**
 * What a Boss Mandate does to you, in a few words: "Rack −1", "1 Play only",
 * "No REDRAW". The full rule text lives in the Mandate's description; this is
 * the compact consequence shown beside its icon in the round header.
 */

import type { MandateEffectType } from '../config/mandateDefinitions'

export interface MandateConsequence {
  /** i18n key under `mandateConsequence`. */
  key: MandateEffectType
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

export function mandateConsequence(effect: {
  type: MandateEffectType
  value?: number | string
  target?: string
}): MandateConsequence {
  const count = typeof effect.value === 'number' ? effect.value : 1
  return {
    key: effect.type,
    values: {
      count,
      value: count,
      ...(effect.target ? { targetKey: SUIT_KEYS[effect.target] ?? '' } : {}),
    },
  }
}
