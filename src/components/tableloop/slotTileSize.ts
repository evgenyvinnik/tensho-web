/**
 * Slot tile sizing for the Table Loop board.
 *
 * Each table slot holds up to four tiles in a column whose width depends on
 * the screen, so a slot picks the largest tile size at which its tiles fit
 * instead of assuming one size for every device.
 *
 * @module components/tableloop/slotTileSize
 */

import { tileSizes, type TileSize } from '../../styles/theme'

const SIZES_LARGEST_FIRST: TileSize[] = [
  'xlarge',
  'large',
  'regular',
  'medium',
  'compact',
  'small',
]
/** How far neighbouring tiles in a slot tuck under each other. */
export const SLOT_TILE_OVERLAP = 4

/**
 * The largest size, no larger than `max`, at which `count` tiles fit `width`.
 * An unmeasured slot (width 0) keeps `max`.
 */
export function fitSlotTileSize(
  count: number,
  width: number,
  max: TileSize
): TileSize {
  if (width <= 0) return max
  for (const size of SIZES_LARGEST_FIRST.slice(
    SIZES_LARGEST_FIRST.indexOf(max)
  )) {
    const needed =
      count * tileSizes[size].width - Math.max(0, count - 1) * SLOT_TILE_OVERLAP
    if (needed <= width) return size
  }
  return 'small'
}
