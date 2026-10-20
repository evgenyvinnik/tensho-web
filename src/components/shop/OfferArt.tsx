/**
 * A Tea House item's picture: its own art, or its family art with its emblem.
 * Shared by the shop's offers and the Blessing Pack choices.
 *
 * @module components/shop/OfferArt
 */

import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { BlessingPack, Decree } from '../../systems/types'
import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { getItemArt } from '../../utils/itemArt'
import { getDecreeScrollIllustration } from '../../utils/assets'
import { DecreeUniqueIcon } from '../ui/svg/DecreeIcons'
import { TileImage } from '../tiles/TileImage'
import type { TileSize } from '../../styles/theme'
import { DECREE_ICON_COLORS } from '../gameplay/gameplayTypes'
import { decreeModifierText } from '../../i18n/decreeModifiers'
import { StickerBadge } from '../ui/StickerBadge'

export function OfferArt({
  offering,
  large = false,
  tileSize = 'small',
  emblemSize,
  showStickers = false,
}: {
  offering: Pick<TeaHouseOffering, 'itemType' | 'item'>
  large?: boolean
  tileSize?: TileSize
  /** Pixel size of the emblem drawn over a family's shared art. */
  emblemSize?: number
  /** Pin a Decree's stickers to the corner; details panels list them instead. */
  showStickers?: boolean
}) {
  const size = large ? 'h-24 w-24' : 'h-full w-full'
  switch (offering.itemType) {
    case 'Decree': {
      const decree = offering.item as Decree
      const art = getItemArt('decrees', decree.id)
      return (
        <span className={`relative flex items-center justify-center ${size}`}>
          <img
            src={art.hasOwnArt ? art.src : getDecreeScrollIllustration(decree.rarity)}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="game-illustration absolute inset-0 h-full w-full object-contain"
          />
          {!art.hasOwnArt && (
            <span className="relative">
              <DecreeUniqueIcon
                decreeId={decree.id}
                size={emblemSize ?? (large ? 40 : 30)}
                color={DECREE_ICON_COLORS[decree.rarity]}
              />
            </span>
          )}
          {showStickers && <DecreeStickers decree={decree} />}
        </span>
      )
    }
    case 'Tile':
      return (
        <span className={`flex items-center justify-center ${size}`}>
          <TileImage tile={offering.item as Tile} size={tileSize} showTooltip={false} />
        </span>
      )
    default: {
      const kind =
        offering.itemType === 'FateSeal'
          ? 'seals'
          : offering.itemType === 'CelestialOrb'
            ? 'orbs'
            : offering.itemType === 'VoidScript'
              ? 'scripts'
              : offering.itemType === 'BlessingPack'
                ? 'packs'
                : 'charters'
      const id =
        offering.itemType === 'BlessingPack'
          ? (offering.item as BlessingPack).type
          : offering.item.id
      return (
        <img
          src={getItemArt(kind, id).src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`game-illustration object-contain ${size}`}
        />
      )
    }
  }
}

/** A Decree's stickers, pinned to the art's corner; the details name them. */
function DecreeStickers({ decree }: { decree: Decree }) {
  const { t, i18n } = useTranslation()
  const stickers = decreeModifierText(decree, t, i18n.language).filter(
    (entry) => entry.kind === 'sticker'
  )
  if (!stickers.length) return null
  return (
    <span
      data-offer-stickers
      aria-hidden="true"
      className="absolute right-0 top-0 flex flex-col items-end gap-0.5"
    >
      {stickers.map((entry) => (
        <StickerBadge
          key={entry.id}
          type={entry.id}
          value={entry.value}
          size={20}
        />
      ))}
    </span>
  )
}

export default OfferArt
