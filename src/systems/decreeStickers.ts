import type { Decree, Sticker, StickerType } from './types'

type StickerSource = Pick<Decree, 'sticker' | 'stickers'>

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
