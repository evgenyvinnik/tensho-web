/**
 * useNoLoneTile
 *
 * A wrapped rack must never leave one tile alone on its last row; honours
 * sort last, so the stray is usually a Dragon. When it would, the tile (or
 * group) before it comes down to keep it company: every earlier row stays as
 * it was, the last row holds at least two tiles, and no row is added.
 *
 * Flexbox has no forced line break, so the neighbour is pushed down by a
 * start margin just too wide for the row it leaves, and the last tile gets
 * the same margin at its end so the new last row stays centred.
 */

import { useLayoutEffect, useRef, type RefObject } from 'react'

const TILE = '[data-play-tile], [data-rack-slot]'

export interface RackItem {
  /** Outer width, margins included, in CSS pixels. */
  width: number
  /** Tiles it holds: 1 for a tile, the group's size, 0 for a suit spacer. */
  tiles: number
}

export interface LoneTileFix {
  /** Index of the item that moves down beside the lone tile. */
  index: number
  /** Extra margin before that item, and after the last item. */
  margin: number
}

/** The margins a fix has put on the rack's elements. */
interface Styled {
  neighbour: HTMLElement
  last: HTMLElement
  margin: number
}

interface Line {
  start: number
  end: number
  width: number
}

/** The lines a wrapping flex row of shrink-0 items lays out at `width`. */
function wrap(items: readonly RackItem[], gap: number, width: number): Line[] {
  const lines: Line[] = []
  items.forEach((item, index) => {
    const line = lines[lines.length - 1]
    if (line && line.width + gap + item.width <= width) {
      line.end = index + 1
      line.width += gap + item.width
    } else lines.push({ start: index, end: index + 1, width: item.width })
  })
  return lines
}

const span = (
  items: readonly RackItem[],
  gap: number,
  start: number,
  end: number
) =>
  items
    .slice(start, end)
    .reduce((sum, item, i) => sum + item.width + (i > 0 ? gap : 0), 0)

/**
 * How to keep the last row from holding a single tile, or null when it
 * already holds more (or there is one row, or the move would not fit).
 */
export function loneTileFix(
  items: readonly RackItem[],
  gap: number,
  available: number
): LoneTileFix | null {
  if (available <= 0) return null
  const lines = wrap(items, gap, available)
  if (lines.length < 2) return null
  const last = lines[lines.length - 1]
  const tiles = items
    .slice(last.start, last.end)
    .reduce((sum, item) => sum + item.tiles, 0)
  if (tiles !== 1) return null
  // The nearest tile or group before the last row; a suit spacer rides along.
  let index = last.start - 1
  while (index >= 0 && items[index].tiles === 0) index--
  const previous = lines[lines.length - 2]
  if (index <= previous.start) return null
  const room =
    available -
    span(items, gap, previous.start, index) -
    gap -
    items[index].width
  const margin = Math.max(0, room) + 1
  if (span(items, gap, index, items.length) + 2 * margin > available)
    return null
  return { index, margin }
}

/**
 * Keep `rack` (a wrapping flex row) from ending on a lone tile, measuring the
 * room `frame` gives it. Styles the elements directly, before the rack's
 * flights measure where tiles land, so call it ahead of `useTileFlights`.
 * `key` must change whenever the rack's elements might: a picked tile's slot
 * is a new element.
 */
export function useNoLoneTile(
  frame: RefObject<HTMLElement | null>,
  rack: RefObject<HTMLElement | null>,
  key: string
): void {
  const styled = useRef<Styled | null>(null)
  useLayoutEffect(() => {
    const outer = frame.current
    const row = rack.current
    if (!outer || !row) return
    // The fix changes the rack's height, so it triggers the observer below.
    // Clearing it and measuring again from there dropped it, and the rack
    // flipped between the two layouts every frame on 320px phones. Measuring
    // past our own margins gives the same fix whether or not it is applied,
    // and an unchanged fix writes nothing.
    const fit = () => {
      const applied = styled.current
      const children = [...row.children] as HTMLElement[]
      const margins = children.map((child) => {
        const style = getComputedStyle(child)
        return {
          left:
            (parseFloat(style.marginLeft) || 0) -
            (child === applied?.neighbour ? applied.margin : 0),
          right:
            (parseFloat(style.marginRight) || 0) -
            (child === applied?.last ? applied.margin : 0),
        }
      })
      // Layout widths, not bounding boxes: a tile in flight is transformed.
      const items = children.map((child, index) => ({
        width: child.offsetWidth + margins[index].left + margins[index].right,
        tiles: child.matches(TILE) ? 1 : child.querySelectorAll(TILE).length,
      }))
      const frameStyle = getComputedStyle(outer)
      const available =
        outer.clientWidth -
        (parseFloat(frameStyle.paddingLeft) || 0) -
        (parseFloat(frameStyle.paddingRight) || 0)
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0
      const fix = loneTileFix(items, gap, available)
      const lastIndex = children.length - 1
      const neighbour = fix ? children[fix.index] : undefined
      const last = fix ? children[lastIndex] : undefined
      if (
        applied?.neighbour === neighbour &&
        applied?.last === last &&
        applied?.margin === fix?.margin
      )
        return
      if (applied) {
        applied.neighbour.style.marginLeft = ''
        applied.last.style.marginRight = ''
      }
      styled.current = null
      if (!fix || !neighbour || !last) return
      neighbour.style.marginLeft = `${margins[fix.index].left + fix.margin}px`
      last.style.marginRight = `${margins[lastIndex].right + fix.margin}px`
      styled.current = { neighbour, last, margin: fix.margin }
    }
    fit()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit)
    observer?.observe(outer)
    return () => observer?.disconnect()
  }, [frame, rack, key])
}
