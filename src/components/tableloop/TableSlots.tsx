/**
 * TableSlots
 *
 * The persistent table: four meld slots and one pair slot, always in the same
 * order. Everything a player commits stays visible here for the whole round,
 * which is the point of experiment E01.
 *
 * @module components/tableloop/TableSlots
 */

import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { TileImage } from '../tiles/TileImage'
import { PAIR_SLOT_INDEX, type TableSlot } from '../../tableloop/types'

export interface TableSlotsProps {
  slots: readonly TableSlot[]
  /** Slots the current selection could be placed into. */
  placeable: readonly number[]
  /** Slots the current selection could replace. */
  revisable: readonly number[]
  /** Slots the last resolution wants highlighted. */
  highlighted?: readonly number[]
  /** Forecast for each slot the selection fits, keyed by slot index. */
  forecasts?: ReadonlyMap<number, number>
  /** Standing multiplier each slot would cost, keyed by slot index. */
  multCosts?: ReadonlyMap<number, number>
  onPlace: (slotIndex: number) => void
  onRevise: (slotIndex: number) => void
}

function SlotTiles({ tiles }: { tiles: readonly Tile[] }) {
  return (
    <div className="flex items-end justify-center -space-x-2">
      {tiles.map((tile) => (
        <TileImage key={tile.id} tile={tile} size="small" />
      ))}
    </div>
  )
}

export function TableSlots({
  slots,
  placeable,
  revisable,
  highlighted = [],
  forecasts,
  multCosts,
  onPlace,
  onRevise,
}: TableSlotsProps) {
  const { t } = useTranslation()
  const canPlace = new Set(placeable)
  const canRevise = new Set(revisable)
  const lit = new Set(highlighted)

  return (
    <div
      data-testid="table-slots"
      className="grid shrink-0 grid-cols-2 items-stretch gap-1.5 px-3 py-1 sm:grid-cols-5"
    >
      {slots.map((slot) => {
        const isPair = slot.index === PAIR_SLOT_INDEX
        const interactive =
          canPlace.has(slot.index) || canRevise.has(slot.index)
        const forecast = forecasts?.get(slot.index)
        const multCost = multCosts?.get(slot.index) ?? 0

        return (
          <button
            key={slot.index}
            type="button"
            data-testid={`table-slot-${slot.index}`}
            disabled={!interactive}
            onClick={() =>
              canPlace.has(slot.index)
                ? onPlace(slot.index)
                : onRevise(slot.index)
            }
            aria-label={[
              isPair
                ? t('tableLoop.slot.pair', 'Pair slot')
                : t('tableLoop.slot.meld', 'Meld slot {{number}}', {
                    number: slot.index + 1,
                  }),
              slot.group
                ? t('tableLoop.slot.filled', 'holds a {{type}}', {
                    type: t(`melds.${slot.group.type}`, slot.group.type),
                  })
                : t('tableLoop.slot.empty', 'empty'),
              forecast !== undefined
                ? t('tableLoop.slot.forecast', 'would score {{total}}', {
                    total: forecast,
                  })
                : null,
              multCost > 0
                ? t('tableLoop.slot.multCost', 'and cost {{mult}} Mult', {
                    mult: multCost.toFixed(1),
                  })
                : null,
            ]
              .filter(Boolean)
              .join(', ')}
            className={`
              relative flex min-h-[76px] min-w-0 flex-col items-center justify-center
              rounded-lg border-2 px-1.5 py-1 transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]
              focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark-forest)]
              ${isPair ? 'col-span-2 border-dashed sm:col-span-1' : 'border-solid'}
              ${
                lit.has(slot.index)
                  ? 'border-[var(--color-golden-yellow)] bg-[var(--color-golden-yellow)]/15'
                  : interactive
                    ? 'border-emerald-400/80 bg-emerald-500/10'
                    : slot.group
                      ? 'border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/60'
                      : 'border-[var(--color-metallic-gold)]/20 bg-black/20'
              }
            `}
          >
            <span className="mb-0.5 text-[9px] uppercase tracking-widest text-[var(--color-beige-white)]/45">
              {isPair
                ? t('tableLoop.slot.pairShort', 'Pair')
                : t('tableLoop.slot.meldShort', 'Meld')}
            </span>

            {slot.group ? (
              <SlotTiles tiles={slot.group.tiles} />
            ) : (
              <span className="text-[10px] text-[var(--color-beige-white)]/35">
                {isPair
                  ? t('tableLoop.slot.emptyPair', 'two alike')
                  : t('tableLoop.slot.emptyMeld', 'run or set')}
              </span>
            )}

            {forecast !== undefined && (
              <span className="mt-0.5 text-[11px] font-bold tabular-nums text-[var(--color-golden-yellow)]">
                +{forecast.toLocaleString()}
              </span>
            )}

            {multCost > 0 && (
              <span
                data-testid={`slot-mult-cost-${slot.index}`}
                className="text-[10px] font-bold tabular-nums text-rose-300"
              >
                −{multCost.toFixed(1)}x
              </span>
            )}

            {canRevise.has(slot.index) && !canPlace.has(slot.index) && (
              <span className="mt-0.5 text-[9px] uppercase tracking-wider text-amber-300/80">
                {t('tableLoop.slot.replace', 'Replace')}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default TableSlots
