/**
 * Tile flights between the rack and the felt.
 *
 * A tile that moves to another zone is a new element there, so it is
 * animated FLIP-style: the tap snapshots where every tile is
 * (`recordTilePositions`), and after the move each zone plays its tiles from
 * the snapshot to their new place. The tapped tile flies between rack and
 * felt; its neighbours slide to close or open the gap.
 *
 * Uses the Web Animations API on the tiles' own elements, so nothing is kept
 * in React state and nothing runs when motion is reduced.
 *
 * `useKeepInPlace` holds the rack still under the player's thumb: when the
 * felt above it grows or shrinks on a screen short enough to scroll, the
 * board scrolls by the same amount, so the next tap lands where it aims.
 *
 * @module animations/useTileFlights
 */

import { useLayoutEffect, type RefObject } from 'react'

const TILE = '[data-play-tile]'
const RACK = '[data-play-zone="hand"]'
/** A snapshot older than this belongs to a move that never happened. */
const SNAPSHOT_TTL_MS = 1000

const FLIGHT: KeyframeAnimationOptions = {
  duration: 280,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
}

let snapshot: {
  at: number
  rects: Map<string, DOMRect>
  rackTop: number | null
} | null = null

/** Remember where every tile (and the rack) is, just before a tap moves one. */
export function recordTilePositions(): void {
  const rects = new Map<string, DOMRect>()
  for (const element of document.querySelectorAll<HTMLElement>(TILE)) {
    const id = element.dataset.playTile
    if (id) rects.set(id, element.getBoundingClientRect())
  }
  const rack = document.querySelector(RACK)
  snapshot = {
    at: Date.now(),
    rects,
    rackTop: rack ? rack.getBoundingClientRect().top : null,
  }
}

const fresh = () =>
  snapshot && Date.now() - snapshot.at <= SNAPSHOT_TTL_MS ? snapshot : null

function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY
    if (
      (overflow === 'auto' || overflow === 'scroll') &&
      node.scrollHeight > node.clientHeight
    )
      return node
  }
  return null
}

/**
 * After a tap changes `key`, scroll so `rack` sits where it sat when the tap
 * was made. Must run before the zones' flights measure where tiles landed,
 * so call it from a component rendered ahead of them.
 */
export function useKeepInPlace(
  rack: RefObject<HTMLElement | null>,
  key: string
): void {
  useLayoutEffect(() => {
    const element = rack.current
    const before = fresh()
    if (!element || before?.rackTop == null) return
    const shift = element.getBoundingClientRect().top - before.rackTop
    if (Math.abs(shift) < 1) return
    const scroller = scrollParent(element)
    if (scroller) scroller.scrollTop += shift
  }, [rack, key])
}

/**
 * Play the tiles inside `container` from their snapshot positions whenever
 * `key` (the zone's tiles, in order) changes.
 */
export function useTileFlights(
  container: RefObject<HTMLElement | null>,
  key: string,
  reducedMotion: boolean
): void {
  useLayoutEffect(() => {
    const root = container.current
    const before = fresh()
    if (!root || !before || reducedMotion) return
    for (const element of root.querySelectorAll<HTMLElement>(TILE)) {
      const from = before.rects.get(element.dataset.playTile ?? '')
      if (!from || typeof element.animate !== 'function') continue
      const to = element.getBoundingClientRect()
      if (to.width === 0) continue
      const dx = from.left + from.width / 2 - (to.left + to.width / 2)
      const dy = from.top + from.height / 2 - (to.top + to.height / 2)
      const scale = from.width / to.width
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(scale - 1) < 0.01)
        continue
      element.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          { transform: 'none' },
        ],
        FLIGHT
      )
    }
  }, [container, key, reducedMotion])
}
