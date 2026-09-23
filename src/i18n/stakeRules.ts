import type { TFunction } from 'i18next'
import {
  calculateCombinedModifiers,
  STICKER_DEFINITIONS,
} from '../config/stakeDefinitions'

export const STAKE_NAME_KEYS = [
  'white',
  'red',
  'green',
  'black',
  'blue',
  'purple',
  'orange',
  'gold',
] as const

/** Describe the same cumulative modifiers used by RoundManager and the shop. */
export function getStakeRules(
  t: TFunction,
  language: string,
  tier: number
): string[] {
  const modifiers = calculateCombinedModifiers(tier)
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 2 })
  const percent = new Intl.NumberFormat(language, {
    style: 'percent',
    maximumFractionDigits: 1,
  })
  const rules: string[] = []
  if (modifiers.noSmallRoundReward)
    rules.push(t('stakes.rules.noSmallRoundReward'))
  if (modifiers.scoreScaling !== 1)
    rules.push(
      t('stakes.rules.scoreScaling', {
        multiplier: number.format(modifiers.scoreScaling),
      })
    )
  if (modifiers.redrawPenalty)
    rules.push(
      t('stakes.rules.redrawPenalty', {
        amount: number.format(modifiers.redrawPenalty),
      })
    )
  if (modifiers.eternalChance)
    rules.push(
      t('stakes.rules.eternalChance', {
        chance: percent.format(modifiers.eternalChance),
      })
    )
  if (modifiers.perishableChance)
    rules.push(
      t('stakes.rules.perishableChance', {
        chance: percent.format(modifiers.perishableChance),
        rounds: number.format(STICKER_DEFINITIONS.Perishable.roundsToDebuff!),
      })
    )
  if (modifiers.rentalChance)
    rules.push(
      t('stakes.rules.rentalChance', {
        chance: percent.format(modifiers.rentalChance),
        price: number.format(STICKER_DEFINITIONS.Rental.purchaseCost!),
        fee: number.format(STICKER_DEFINITIONS.Rental.goldPerRound!),
      })
    )
  return rules.length ? rules : [t('stakes.rules.base')]
}
