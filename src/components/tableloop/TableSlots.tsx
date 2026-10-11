/**
 * TableSlots
 *
 * The persistent table: four meld slots and one pair slot, always in the same
 * order. Everything a player commits stays visible here for the whole round,
 * which is the point of experiment E01.
 *
 * @module components/tableloop/TableSlots
 */

import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { TileImage } from '../tiles/TileImage'
import { PAIR_SLOT_INDEX, type TableSlot } from '../../tableloop/types'
import { tileSizes, type TileSize } from '../../styles/theme'
import { fitSlotTileSize, SLOT_TILE_OVERLAP } from './slotTileSize'

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
  /** Largest tile size a slot may use; each slot shrinks from it to fit. */
  maxTileSize?: TileSize
  onPlace: (slotIndex: number) => void
  onRevise: (slotIndex: number) => void
}

function SlotTiles({
  tiles,
  size,
  width,
}: {
  tiles: readonly Tile[]
  size: TileSize
  width: number
}) {
  // A quad in a narrow slot overlaps further rather than spilling out.
  const tileWidth = tileSizes[size].width
  const overlap =
    tiles.length > 1 && width > 0
      ? Math.max(
          SLOT_TILE_OVERLAP,
          Math.ceil((tiles.length * tileWidth - width) / (tiles.length - 1))
        )
      : SLOT_TILE_OVERLAP
  return (
    <div className="flex items-end justify-center">
      {tiles.map((tile, index) => (
        <span key={tile.id} style={{ marginLeft: index ? -overlap : 0 }}>
          <TileImage tile={tile} size={size} />
        </span>
      ))}
    </div>
  )
}

/** Tile-shaped outlines that show how many tiles an empty slot takes. */
function SlotGhosts({ count, size }: { count: number; size: TileSize }) {
  const { width, height } = tileSizes[size]
  return (
    <div aria-hidden="true" className="flex items-end justify-center gap-1">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="rounded-md border border-dashed border-[var(--color-beige-white)]/25 bg-white/[0.04]"
          style={{ width: width * 0.8, height: height * 0.8 }}
        />
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
  maxTileSize = 'small',
  onPlace,
  onRevise,
}: TableSlotsProps) {
  const { t } = useTranslation()
  // Every meld slot shares one width; measure it so tiles never spill out.
  const gridRef = useRef<HTMLDivElement>(null)
  const [slotWidth, setSlotWidth] = useState(0)
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const measure = () => {
      const slot = grid.firstElementChild as HTMLElement | null
      if (!slot) return
      const style = getComputedStyle(slot)
      setSlotWidth(
        slot.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight)
      )
    }
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(grid)
    return () => observer?.disconnect()
  }, [])
  const canPlace = new Set(placeable)
  const canRevise = new Set(revisable)
  const lit = new Set(highlighted)

  return (
    <div
      ref={gridRef}
      data-testid="table-slots"
      className="grid shrink-0 grid-cols-2 items-stretch gap-1.5 px-2 py-1 sm:grid-cols-5 sm:gap-2 sm:px-3"
    >
      {slots.map((slot) => {
        const isPair = slot.index === PAIR_SLOT_INDEX
        const interactive =
          canPlace.has(slot.index) || canRevise.has(slot.index)
        const forecast = forecasts?.get(slot.index)
        const multCost = multCosts?.get(slot.index) ?? 0
        const tileCount = slot.group?.tiles.length ?? (isPair ? 2 : 3)
        const tileSize = fitSlotTileSize(tileCount, slotWidth, maxTileSize)

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
              relative flex min-h-[76px] min-w-0 scroll-my-2 flex-col items-center justify-center gap-0.5
              rounded-xl border-2 px-1.5 py-1.5 transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-golden-yellow)]
              focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark-forest)]
              ${isPair ? 'col-span-2 sm:col-span-1' : ''}
              ${slot.group || interactive ? 'border-solid' : 'border-dashed'}
              ${
                lit.has(slot.index)
                  ? 'border-[var(--color-golden-yellow)] bg-[var(--color-golden-yellow)]/15'
                  : interactive
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_16px_rgba(52,211,153,0.35)]'
                    : slot.group
                      ? 'border-[var(--color-metallic-gold)]/55 bg-[var(--color-dark-forest)]/80'
                      : 'border-[var(--color-metallic-gold)]/40 bg-black/30'
              }
            `}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-metallic-gold)] sm:text-[11px]">
              {isPair
                ? t('tableLoop.slot.pairShort', 'Pair')
                : t('tableLoop.slot.meldShort', 'Meld')}
            </span>

            {slot.group ? (
              <SlotTiles
                tiles={slot.group.tiles}
                size={tileSize}
                width={slotWidth}
              />
            ) : (
              <>
                <SlotGhosts count={isPair ? 2 : 3} size={tileSize} />
                <span className="text-[11px] text-[var(--color-beige-white)]/60 sm:text-xs">
                  {isPair
                    ? t('tableLoop.slot.emptyPair', 'two alike')
                    : t('tableLoop.slot.emptyMeld', 'run or set')}
                </span>
              </>
            )}

            {forecast !== undefined && (
              <span className="text-xs font-bold tabular-nums text-[var(--color-golden-yellow)] sm:text-sm">
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
