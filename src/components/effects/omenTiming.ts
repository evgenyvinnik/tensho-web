/**
 * When an Omen does its work, in the player's terms, and whether it is left
 * on the table's rail until then. Omens are earned at a round's end, so the
 * next shop is the Tea House visit that opens right after.
 *
 * @module components/effects/omenTiming
 */

import type { OmenDefinition } from '../../config/omenDefinitions'

/** When an Omen does its work, in the player's terms. */
export type OmenTiming =
  | 'shop'
  | 'round'
  | 'hand'
  | 'voidScript'
  | 'now'
  | 'run'
  | 'nextOmen'

export function omenTiming(omen: OmenDefinition): OmenTiming {
  if (omen.effect.type === 'copy_next_omen') return 'nextOmen'
  switch (omen.trigger) {
    // Earned at the round's end, so the next shop is the visit it opens.
    case 'OnNextShop':
      return 'shop'
    case 'OnNextRound':
      return 'round'
    case 'OnNextHand':
      return 'hand'
    case 'OnNextVoidScript':
      return 'voidScript'
    case 'OnAcquire':
      return 'now'
    default:
      return 'run'
  }
}

/** Whether the Omen is left on the table's rail after this, and how. */
export function omenRailNote(timing: OmenTiming): 'waits' | 'stays' | null {
  if (timing === 'shop' || timing === 'now') return null
  return timing === 'run' ? 'stays' : 'waits'
}
