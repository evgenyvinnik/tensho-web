import type { TFunction } from 'i18next'
import type { Decree, StickerType } from '../systems/types'
import { canReceiveEternal, getDecreeStickers } from '../systems/decreeStickers'

export type DecreeModifierSource = Pick<
  Decree,
  'edition' | 'sticker' | 'stickers' | 'isDebuffed'
> &
  Partial<Pick<Decree, 'effect' | 'extraEffects'>>

export type DecreeModifierEntry =
  | { kind: 'edition'; id: string; name: string; description: string }
  | {
      kind: 'sticker'
      id: StickerType
      name: string
      description: string
      /** Live number drawn beside the sticker's emblem: rounds left or fee. */
      value?: string
    }

/** Text describes the actual offered/owned copy, never a guessed default timer. */
export function decreeModifierText(
  decree: DecreeModifierSource,
  t: TFunction,
  language: string
) {
  const entries: DecreeModifierEntry[] = []
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
    let value: string | undefined
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
      value = number.format(sticker.goldPerRound ?? 3)
      description = t('decreeModifiers.rentalDescription', { amount: value })
    } else if (sticker.type === 'Perishable') {
      if (sticker.roundsRemaining !== undefined)
        value = number.format(Math.max(0, sticker.roundsRemaining))
      if (decree.isDebuffed) description = t('decreeModifiers.expired')
      else if (value !== undefined)
        description += ` ${t('decreeModifiers.remaining', { remaining: value })}`
    }
    entries.push({
      kind: 'sticker',
      id: sticker.type,
      name: t(`decreeModifiers.${key}Name`),
      description,
      value,
    })
  }
  return entries
}
