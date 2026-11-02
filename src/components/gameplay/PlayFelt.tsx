/**
 * PlayFelt: the tiles you are about to play, laid out on the table above the
 * rack in the order you picked them. A tap on the rack flies a tile here; a
 * tap here flies it back. Play hand and REDRAW act on exactly these tiles.
 *
 * Takes no room while nothing is selected. Each tile's place in the rack stays
 * empty while it is here, so the rack never shifts under the next tap.
 *
 * @module components/gameplay/PlayFelt
 */

import { useRef, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { AnimatedTile } from '../tiles/AnimatedTile'
import { tileSizes, type TileSize } from '../../styles/theme'
import { tileName } from '../../i18n/tileText'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import {
  recordTilePositions,
  useTileFlights,
} from '../../animations/useTileFlights'
import { moveTileFocus } from '../../gameplay/tileKeyboard'

export interface PlayFeltProps {
  /** Selected tiles, in the order they were picked. */
  tiles: Tile[]
  faceDownIds?: ReadonlySet<string>
  lockedIds?: ReadonlySet<string>
  debuffedIds?: ReadonlySet<string>
  /** The click is passed on so the rack can keep keyboard focus in place. */
  onToggle: (tile: Tile, event: MouseEvent<HTMLButtonElement>) => void
  /** The rack's tile size, so a tile looks the same on either side. */
  size: TileSize
  disabled?: boolean
}

export function PlayFelt({
  tiles,
  faceDownIds = new Set(),
  lockedIds = new Set(),
  debuffedIds = new Set(),
  onToggle,
  size,
  disabled = false,
}: PlayFeltProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const dimensions = tileSizes[size]
  useTileFlights(ref, tiles.map((tile) => tile.id).join(' '), reducedMotion)

  if (tiles.length === 0) return null
  return (
    <div
      ref={ref}
      data-play-zone="felt"
      role="group"
      aria-label={t('gameplay.feltTiles', 'Tiles to play')}
      className="flex w-full flex-wrap items-end justify-center gap-1 px-2 py-2"
    >
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          data-play-tile={tile.id}
          data-own-sound
          aria-pressed={true}
          disabled={disabled}
          aria-label={tileName(tile, t, faceDownIds.has(tile.id))}
          onClick={(event) => {
            recordTilePositions()
            onToggle(tile, event)
          }}
          onKeyDown={moveTileFocus}
          className="relative flex shrink-0 items-end justify-center rounded drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          style={{
            width: Math.max(44, dimensions.width),
            minHeight: Math.max(44, dimensions.height),
          }}
        >
          <AnimatedTile
            tile={tile}
            size={size}
            faceDown={faceDownIds.has(tile.id)}
            locked={lockedIds.has(tile.id)}
            debuffed={debuffedIds.has(tile.id)}
            disabled={disabled}
          />
        </button>
      ))}
    </div>
  )
}

export default PlayFelt
