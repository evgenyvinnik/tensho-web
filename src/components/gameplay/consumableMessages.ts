/**
 * Player-facing reasons for a consumable the engine refuses.
 *
 * The item rail and the target dialog explain the same refusals, so they
 * share one translation of the engine's messages.
 *
 * @module components/gameplay/consumableMessages
 */

import type { TFunction } from 'i18next'

/** The engine's refusal in the player's language, or as written. */
export function consumableMessage(message: string, t: TFunction): string {
  if (message === 'Choose a suited tile of a different suit')
    return t('consumableUse.errorSuit')
  if (message === 'Choose a suited tile whose new rank is between 1 and 9')
    return t('consumableUse.errorRank')
  if (
    message === 'Choose a tile that is not already this honor or a Stone tile'
  )
    return t('consumableUse.errorHonor')
  if (message.includes('max level')) return t('consumableUse.errorMaxLevel')
  if (message.startsWith('No room for')) return t('consumableUse.errorNoRoom')
  if (message.startsWith('No Decrees to'))
    return t('consumableUse.errorNoDecrees')
  if (message === 'No Fate Seal or Celestial Orb has been used this run')
    return t('consumableUse.errorNoPrevious', {
      seals: t('consumableUse.fateSeals'),
      orbs: t('consumableUse.celestialOrbs'),
    })
  if (message === 'No gold can be generated')
    return t('consumableUse.errorNoGold')
  return message
}
