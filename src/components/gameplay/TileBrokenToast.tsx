/**
 * TileBrokenToast: the Glass tiles a play shattered and the Steel tiles that
 * rusted away, shown under the header after the play.
 *
 * The tiles have already left the run when this shows. It names each one with
 * its picture, leaves by itself, and tapping it dismisses it sooner.
 *
 * @module components/gameplay/TileBrokenToast
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tile } from '../../core/Tile'
import type { TileBreak } from '../../core/TileModifier'
import { tileName } from '../../i18n/tileText'
import { TileImage } from '../tiles/TileImage'

const SHOW_MS = 3500

export interface TileBrokenToastProps {
  tiles: readonly { tile: Tile; breaks: TileBreak }[]
  top: number
  onDone: () => void
}

export function TileBrokenToast({ tiles, top, onDone }: TileBrokenToastProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(onDone, SHOW_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <button
      type="button"
      role="status"
      data-tiles-broken={tiles.map(({ breaks }) => breaks).join(' ')}
      onClick={onDone}
      className="cash-out-toast-enter fixed left-3 z-40 flex max-w-[calc(100vw-24px)] flex-col gap-1 rounded-xl border border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)]/95 px-3 py-2 text-left text-sm text-[var(--color-beige-white)] shadow-xl"
      style={{ top }}
    >
      {tiles.map(({ tile, breaks }) => (
        <span key={tile.id} className="flex items-center gap-2">
          <span aria-hidden="true" className="shrink-0">
            <TileImage tile={tile} size="small" showTooltip={false} />
          </span>
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {t(`tileBroken.${breaks}`, {
              tile: tileName(tile, t),
            })}
          </span>
        </span>
      ))}
    </button>
  )
}

export default TileBrokenToast
