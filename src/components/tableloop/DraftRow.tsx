/**
 * DraftRow
 *
 * Experiment E06: three face-up tiles, one of which a placement's replacement
 * may come from. Only the claimed offer is replaced, so the two you passed on
 * stay visible and remain a plan for the next placement.
 *
 * It is a run variant rather than part of the base loop, because the
 * experiments document asks for it to be compared against the persistent-table
 * loop rather than folded into it.
 *
 * @module components/tableloop/DraftRow
 */

import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { TileImage } from '../tiles/TileImage'

export interface DraftRowProps {
  tiles: readonly Tile[]
  /** True while a placement's replacement is the player's to choose. */
  claimable: boolean
  onClaim: (tileId: string) => void
  onPass: () => void
}

export function DraftRow({ tiles, claimable, onClaim, onPass }: DraftRowProps) {
  const { t } = useTranslation()
  if (tiles.length === 0) return null

  return (
    <div
      data-testid="draft-row"
      className={`mx-3 mb-1 rounded-lg border px-2 py-1.5 transition-colors ${
        claimable
          ? 'border-emerald-400/70 bg-emerald-500/10'
          : 'border-[var(--color-metallic-gold)]/20 bg-black/20'
      }`}
    >
      <p
        role={claimable ? 'status' : undefined}
        aria-live={claimable ? 'polite' : undefined}
        className="mb-1 text-[10px] uppercase tracking-widest text-[var(--color-beige-white)]/45"
      >
        {claimable
          ? t('tableLoop.draft.claimable', 'Offers — take one for this refill')
          : t('tableLoop.draft.title', 'Offers')}
      </p>

      <div className="flex items-center gap-1.5">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            data-testid={`draft-tile-${tile.id}`}
            disabled={!claimable}
            aria-label={tile.displayName}
            onClick={() => onClaim(tile.id)}
            className={`rounded transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)] ${
              claimable ? 'hover:-translate-y-1' : 'opacity-45'
            }`}
          >
            <TileImage tile={tile} size="small" />
          </button>
        ))}

        {claimable && (
          <button
            type="button"
            data-testid="draft-pass"
            onClick={onPass}
            className="ml-auto rounded-md border border-[var(--color-metallic-gold)]/35 px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--color-beige-white)]/70 hover:text-[var(--color-beige-white)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]"
          >
            {t('tableLoop.draft.pass', 'From the wall')}
          </button>
        )}
      </div>
    </div>
  )
}

export default DraftRow
