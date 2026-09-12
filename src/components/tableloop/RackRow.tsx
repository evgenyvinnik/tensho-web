/**
 * RackRow
 *
 * The playable rack. Each tile is a real toggle button: reachable by keyboard,
 * announced with its own name and pressed state, and given a visible focus
 * ring. Section 9 of `docs/GAMEPLAY_EXPERIMENTS.md` asks for the whole run to
 * be walkable with taps *and* keyboard controls, and section 7 asks for tap and
 * keyboard focus rather than hover.
 *
 * @module components/tableloop/RackRow
 */

import { useTranslation } from 'react-i18next'
import { useState, useId } from 'react'
import { Tile } from '../../core/Tile'
import { TileImage } from '../tiles/TileImage'

export interface RackRowProps {
  tiles: readonly Tile[]
  selectedIds: readonly string[]
  onToggle: (tileId: string) => void
  /** Disables the whole rack while a round is settling. */
  disabled?: boolean
}

export function RackRow({
  tiles,
  selectedIds,
  onToggle,
  disabled = false,
}: RackRowProps) {
  const { t } = useTranslation()
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const detailsPrefix = useId()
  const selected = new Set(selectedIds)

  return (
    <div
      data-testid="table-loop-rack"
      role="group"
      aria-label={t('tableLoop.rack.label', 'Your rack')}
      className="px-2 pb-1"
    >
      <div className="flex flex-wrap justify-center gap-1">
        {tiles.map((tile) => {
          const isSelected = selected.has(tile.id)
          return (
            <button
              key={tile.id}
              type="button"
              data-testid={`rack-tile-${tile.id}`}
              aria-pressed={isSelected}
              aria-label={tile.displayName}
              aria-describedby={
                focusedId === tile.id
                  ? `${detailsPrefix}-${tile.id}`
                  : undefined
              }
              disabled={disabled}
              onClick={() => onToggle(tile.id)}
              onFocus={() => setFocusedId(tile.id)}
              onBlur={() => setFocusedId(null)}
              className={`flex items-center justify-center rounded transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark-forest)] disabled:opacity-50 ${
                isSelected
                  ? '-translate-y-1.5 ring-2 ring-[var(--color-golden-yellow)]'
                  : ''
              }`}
            >
              <TileImage
                tile={tile}
                size="medium"
                detailsVisible={focusedId === tile.id}
                tooltipId={`${detailsPrefix}-${tile.id}`}
                allowHover={focusedId === null || focusedId === tile.id}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default RackRow
