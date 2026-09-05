/**
 * SelectionStrip
 *
 * Shows the tiles you have picked, at a readable size, together with what they
 * form. Section 7 of `docs/GAMEPLAY_EXPERIMENTS.md` asks for selected tiles to
 * be shown separately rather than read off the rack, and for the current
 * combination to be prioritised over secondary inventories.
 *
 * It also carries the polite live region for the selection, so a screen reader
 * hears "Sequence, 3·4·5 索" as the group comes together.
 *
 * @module components/tableloop/SelectionStrip
 */

import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { MeldType } from '../../core/Meld'
import { TileImage } from '../tiles/TileImage'
import { describeGroup } from '../../tableloop/scoring'

export interface SelectionStripProps {
  tiles: readonly Tile[]
  /** The group the selection forms, or null when it forms none. */
  groupType: MeldType | null
  /** Best forecast among the slots this selection fits, if any. */
  bestForecast: number | null
  onClear: () => void
}

export function SelectionStrip({
  tiles,
  groupType,
  bestForecast,
  onClear,
}: SelectionStripProps) {
  const { t } = useTranslation()
  if (tiles.length === 0) return null

  const identity = groupType
    ? `${t(`melds.${groupType}`, groupType)} · ${describeGroup(tiles)}`
    : t('tableLoop.selection.noGroup', 'Not a group yet · {{tiles}}', {
        tiles: describeGroup(tiles),
      })

  return (
    <div
      data-testid="selection-strip"
      className="mx-3 mb-1 flex items-center gap-2 rounded-lg border border-[var(--color-metallic-gold)]/30 bg-black/25 px-2 py-1.5"
    >
      <div className="flex flex-shrink-0 gap-0.5">
        {tiles.map((tile) => (
          <TileImage key={tile.id} tile={tile} size="small" />
        ))}
      </div>

      <p
        role="status"
        aria-live="polite"
        className="min-w-0 flex-1 truncate text-xs text-[var(--color-beige-white)]/80"
      >
        {identity}
        {bestForecast !== null && (
          <span className="ml-1.5 font-bold tabular-nums text-[var(--color-golden-yellow)]">
            +{bestForecast.toLocaleString()}
          </span>
        )}
      </p>

      <button
        type="button"
        onClick={onClear}
        className="flex-shrink-0 rounded px-1.5 py-1 text-[10px] uppercase tracking-wider text-[var(--color-beige-white)]/50 hover:text-[var(--color-beige-white)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
      >
        {t('tableLoop.action.clear', 'Clear')}
      </button>
    </div>
  )
}

export default SelectionStrip
