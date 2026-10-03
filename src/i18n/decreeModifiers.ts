import type { TFunction } from 'i18next'
import type { Decree } from '../systems/types'
import { canReceiveEternal, getDecreeStickers } from '../systems/decreeStickers'

export type DecreeModifierSource = Pick<
  Decree,
  'edition' | 'sticker' | 'stickers' | 'isDebuffed'
> &
  Partial<Pick<Decree, 'effect' | 'extraEffects'>>

/** Text describes the actual offered/owned copy, never a guessed default timer. */
export function decreeModifierText(
  decree: DecreeModifierSource,
  t: TFunction,
  language: string
) {
  const entries: {
    kind: 'edition' | 'sticker'
    id: string
    name: string
    description: string
    badge?: string
  }[] = []
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 2 })
  if (decree.edition) {
    const key = decree.edition.toLowerCase()
    entries.push({
      kind: 'edition',
      id: decree.edition,
      name: t(`editions.items.${key}.name`),
      description: t(`editions.items.${key}.description`),
    })
  }
  for (const sticker of getDecreeStickers(decree)) {
    const key = sticker.type.toLowerCase()
    let description = t(`decreeModifiers.${key}Description`)
    let badge = '∞'
    if (
      sticker.type === 'Eternal' &&
      decree.effect &&
      !canReceiveEternal({
        effect: decree.effect,
        extraEffects: decree.extraEffects,
      })
    ) {
      description += ` ${t('decreeModifiers.eternalConflictDescription')}`
    } else if (sticker.type === 'Rental') {
      description = t('decreeModifiers.rentalDescription', {
        amount: number.format(sticker.goldPerRound ?? 3),
      })
      badge = '¥'
    } else if (sticker.type === 'Perishable') {
      badge =
        sticker.roundsRemaining === undefined
          ? 'P'
          : number.format(Math.max(0, sticker.roundsRemaining))
      if (decree.isDebuffed) description = t('decreeModifiers.expired')
      else if (sticker.roundsRemaining !== undefined)
        description += ` ${t('decreeModifiers.remaining', { remaining: badge })}`
    }
    entries.push({
      kind: 'sticker',
      id: sticker.type,
      name: t(`decreeModifiers.${key}Name`),
      description,
      badge,
    })
  }
  return entries
}
