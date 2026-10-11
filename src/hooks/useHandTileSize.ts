/**
 * useHandTileSize
 *
 * Picks the largest tile size at which the whole rack fits the space it is
 * actually given. Viewport breakpoints alone cannot do this: a 16-tile rack on
 * a laptop that is wide but short needs smaller tiles than the same rack on a
 * tall tablet, and grouped racks lose width to the gaps between groups.
 */

import { useLayoutEffect, useState, type RefObject } from 'react'
import { tileSizes, type TileSize } from '../styles/theme'

/** Largest first. `small` is skipped: its touch target is no narrower. */
const CANDIDATES: TileSize[] = [
  'xlarge',
  'large',
  'regular',
  'medium',
  'compact',
]
const MIN_TARGET = 44
const TILE_GAP = 4
const GROUP_GAP = 12
const ROW_GAP = 6
// Two readable label lines plus border/padding, independent of translated width.
const LABEL_HEIGHT = 30
/**
 * Share of the viewport height the rack's tile rows may occupy. Small enough
 * that a laptop keeps a 14–16 tile rack on one row instead of two large ones.
 */
const HEIGHT_SHARE = 0.28
const MAX_ROWS = 3

export interface HandFit {
  /** Inner width of the rack, in CSS pixels. */
  availableWidth: number
  viewportHeight: number
  tileCount: number
  /** Number of labelled groups (including the loose cluster), if grouped. */
  groupCount?: number
}

export function fitHandTileSize({
  availableWidth,
  viewportHeight,
  tileCount,
  groupCount = 0,
}: HandFit): TileSize {
  if (availableWidth <= 0 || tileCount <= 0) return 'medium'
  const budget = viewportHeight * HEIGHT_SHARE
  const label = groupCount > 0 ? LABEL_HEIGHT : 0
  const extraGaps = Math.max(0, groupCount - 1) * (GROUP_GAP - TILE_GAP)

  for (const size of CANDIDATES) {
    const tile = tileSizes[size]
    const slot = Math.max(MIN_TARGET, tile.width) + TILE_GAP
    const perRow = Math.max(1, Math.floor((availableWidth + TILE_GAP) / slot))
    // Wider gaps between groups cost space wherever the rows break, so count
    // them as fractional tiles rather than charging them all to one row.
    const rows = Math.ceil((tileCount + extraGaps / slot) / perRow)
    const height = rows * (Math.max(MIN_TARGET, tile.height) + ROW_GAP + label)
    if (rows <= MAX_ROWS && height <= budget) return size
  }
  return 'compact'
}

/**
 * Measure `ref` and refit whenever it, the viewport, or the rack changes.
 */
export function useHandTileSize(
  ref: RefObject<HTMLElement | null>,
  tileCount: number,
  groupCount = 0,
  /** Horizontal padding between `ref` and the rack's tiles. */
  inset = 0,
  enabled = true
): TileSize {
  const [size, setSize] = useState<TileSize>('medium')

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || !enabled) return
    const refit = () =>
      setSize(
        fitHandTileSize({
          availableWidth: element.clientWidth - inset,
          viewportHeight: window.innerHeight,
          tileCount,
          groupCount,
        })
      )
    refit()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refit)
    observer?.observe(element)
    window.addEventListener('resize', refit)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', refit)
    }
  }, [ref, tileCount, groupCount, inset, enabled])

  return size
}
