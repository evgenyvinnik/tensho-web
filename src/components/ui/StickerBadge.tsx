/**
 * StickerBadge: a Decree sticker's painted emblem.
 *
 * The art carries no numbers. A Perishable's remaining rounds and a Rental's
 * per-round fee are drawn beside it as live text from the actual copy, so the
 * badge never shows a guessed default. Decorative: the sticker's name and
 * rules are read from the surrounding label or details list.
 *
 * @module components/ui/StickerBadge
 */

import type { StickerType } from '../../systems/types'
import { getStickerArt } from '../../utils/itemArt'

export function StickerBadge({
  type,
  value,
  size = 16,
  title,
}: {
  type: StickerType
  /** Rounds left or fee; omitted for Eternal and in name lists. */
  value?: string
  /** Emblem edge in CSS pixels. */
  size?: number
  title?: string
}) {
  return (
    <span
      data-sticker-badge={type}
      title={title}
      className={`inline-flex shrink-0 items-center rounded-full bg-[#14251d]/90 shadow ring-1 ring-amber-200/60 ${
        value === undefined ? '' : 'pr-1'
      }`}
    >
      <img
        src={getStickerArt(type)}
        alt=""
        aria-hidden="true"
        draggable={false}
        width={size}
        height={size}
        className="shrink-0 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]"
        style={{ width: size, height: size }}
      />
      {value !== undefined && (
        <span
          className="font-black leading-none tabular-nums text-amber-100"
          style={{ fontSize: Math.max(9, Math.round(size * 0.6)) }}
        >
          {value}
        </span>
      )}
    </span>
  )
}

export default StickerBadge
