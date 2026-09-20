import { useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tile } from '../../core/Tile'
import { tileRewardText } from '../../i18n/tileRewardText'
import { TileImage } from '../tiles/TileImage'
import { TableDecreeArt } from './TableDecreeArt'

export function RiverRow({
  tiles,
  selectedTile,
  merchantOwned,
  swapsRemaining,
  onSwap,
}: {
  tiles: readonly Tile[]
  selectedTile: Tile | null
  merchantOwned: boolean
  swapsRemaining: number
  onSwap: (tileId: string) => boolean
}) {
  const { t } = useTranslation()
  const instructionId = useId()
  const statusRef = useRef<HTMLParagraphElement>(null)
  if (tiles.length === 0) return null
  const available = merchantOwned && swapsRemaining > 0
  const ready = available && selectedTile !== null
  const givenName = selectedTile ? tileRewardText(selectedTile, t).name : ''

  return (
    <section
      data-testid="river-row"
      aria-label={t('tableLoop.river.title')}
      className="mx-3 mb-2 min-w-0 rounded-lg border border-[var(--color-metallic-gold)]/30 bg-black/20 p-2"
    >
      <div className="mb-1 flex items-center gap-2">
        {merchantOwned && (
          <TableDecreeArt id="river_merchant" className="h-12 w-10" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xs font-bold text-[var(--color-golden-yellow)]">
            {merchantOwned
              ? t('tableLoop.decrees.river_merchant.name')
              : t('tableLoop.river.title')}
          </h2>
          {merchantOwned && (
            <p
              id={instructionId}
              ref={statusRef}
              role="status"
              tabIndex={-1}
              data-testid="river-swap-instruction"
              className="text-xs leading-relaxed text-[var(--color-beige-white)] focus:outline-none [overflow-wrap:anywhere]"
            >
              {!available
                ? t('tableLoop.river.used')
                : ready
                  ? t('tableLoop.river.ready', { tile: givenName })
                  : t('tableLoop.river.choose')}
            </p>
          )}
        </div>
      </div>
      <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto p-1">
        {tiles.map((tile) => {
          const name = tileRewardText(tile, t).name
          return (
            <button
              key={tile.id}
              type="button"
              data-testid={`river-tile-${tile.id}`}
              disabled={!ready}
              aria-label={
                ready
                  ? t('tableLoop.river.swapLabel', {
                      give: givenName,
                      take: name,
                    })
                  : name
              }
              aria-describedby={merchantOwned ? instructionId : undefined}
              onClick={() => {
                if (onSwap(tile.id))
                  statusRef.current?.focus({ preventScroll: true })
              }}
              className="flex min-h-11 min-w-11 items-center justify-center rounded border border-transparent enabled:border-emerald-400/60 enabled:bg-emerald-500/10 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)]"
            >
              <TileImage tile={tile} size="small" showTooltip={false} />
            </button>
          )
        })}
      </div>
    </section>
  )
}
