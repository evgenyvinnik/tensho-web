import type { Decree, Sticker, StickerType } from './types'

type StickerSource = Pick<Decree, 'sticker' | 'stickers'>

/** Self-selling/consumed powers cannot be made permanently unspendable. */
export function canReceiveEternal(
  decree: Pick<Decree, 'effect' | 'extraEffects'>
): boolean {
  return ![decree.effect, ...(decree.extraEffects ?? [])].some(
    (effect) =>
      effect.type === 'rule_modification' &&
      effect.ruleId === 'prevent_loss' &&
      effect.modification.consumedOnUse === true
  )
}

/** Read legacy saves without migrating them or duplicating modifier effects. */
export function getDecreeStickers(decree: StickerSource): readonly Sticker[] {
  return decree.stickers ?? (decree.sticker ? [decree.sticker] : [])
}

export function hasDecreeSticker(
  decree: StickerSource,
  type: StickerType
): boolean {
  return getDecreeStickers(decree).some((sticker) => sticker.type === type)
}
