/**
 * EditionList: every Edition a tile can carry, each pictured on a tile with
 * the name and effect its own tile details show. Phones have no hover, so the
 * guide and the codex list them here.
 *
 * @module components/tiles/EditionList
 */

import { useTranslation } from 'react-i18next'
import { Tile, TileSuit } from '../../core/Tile'
import { getAllEnhancements } from '../../core/TileModifier'
import { TileImage } from './TileImage'

const EDITIONS = getAllEnhancements()

export function EditionList({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <ul
      data-guide-special-group="editions"
      className={`grid gap-1.5 sm:grid-cols-2 ${className}`}
    >
      {EDITIONS.map((id) => (
        <li
          key={id}
          data-guide-special={`tileMarks.${id}`}
          className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2"
        >
          <span aria-hidden="true" className="shrink-0">
            <TileImage
              tile={
                new Tile(TileSuit.Pinzu, 5, `guide-tileMarks-${id}`, false, {
                  enhancement: id,
                })
              }
              size="small"
              showTooltip={false}
            />
          </span>
          <span className="min-w-0 text-[13px] leading-snug text-[var(--color-beige-white)]/90">
            <strong className="block text-sm text-[var(--color-golden-yellow)]">
              {t(`tileMarks.items.${id}.name`)}
            </strong>
            {t(`tileMarks.items.${id}.description`)}
          </span>
        </li>
      ))}
    </ul>
  )
}
