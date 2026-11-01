/**
 * Keyboard movement among the table's tile buttons.
 *
 * A tile that changes zone is a new button in the other zone, and the one
 * that was focused leaves the DOM, so without help focus would fall back to
 * the page and a keyboard or screen-reader player would lose their place
 * after every tile. `focusAfterMove` picks where focus goes instead: the next
 * tile in the same zone (so Enter, Enter, Enter picks a run of tiles), and,
 * when the zone empties, the moved tile in its new zone.
 *
 * `tileInDirection` lets the arrow keys walk the tiles: Left/Right and
 * Home/End stay in the zone, in reading order; Up/Down go to the nearest tile
 * on the row above or below, which crosses between the felt and the rack.
 *
 * @module gameplay/tileKeyboard
 */

export type TileZone = 'hand' | 'felt'

export interface TileFocusTarget {
  zone: TileZone
  id: string
}

const ZONES = '[data-play-zone="hand"], [data-play-zone="felt"]'
const TILE_BUTTON = 'button[data-play-tile]:not(:disabled)'

const zoneOf = (element: Element): HTMLElement | null =>
  element.closest<HTMLElement>(ZONES)

const tilesIn = (root: ParentNode): HTMLButtonElement[] => [
  ...root.querySelectorAll<HTMLButtonElement>(TILE_BUTTON),
]

/**
 * Whether a click on `button` came from the keyboard or assistive
 * technology (or a pointer while a keyboard focus ring was showing), so focus
 * should follow it. Plain taps and mouse clicks leave focus alone.
 */
export function keyboardActivation(
  event: { detail: number },
  button: Element
): boolean {
  if (event.detail === 0) return true
  try {
    return button.matches(':focus-visible')
  } catch {
    return false
  }
}

/** Where focus should land once `button`'s tile leaves its zone. */
export function focusAfterMove(
  button: HTMLButtonElement
): TileFocusTarget | null {
  const zone = zoneOf(button)
  const zoneName = zone?.dataset.playZone as TileZone | undefined
  const id = button.dataset.playTile
  if (!zone || !zoneName || !id) return null
  const tiles = tilesIn(zone)
  const index = tiles.indexOf(button)
  const neighbour = tiles[index + 1] ?? tiles[index - 1]
  if (neighbour?.dataset.playTile)
    return { zone: zoneName, id: neighbour.dataset.playTile }
  return { zone: zoneName === 'hand' ? 'felt' : 'hand', id }
}

/** Focus a tile's button; false when it is not on the table (or disabled). */
export function focusTile(
  target: TileFocusTarget,
  root: ParentNode = document
): boolean {
  const button = root.querySelector<HTMLButtonElement>(
    `[data-play-zone="${target.zone}"] button[data-play-tile="${CSS.escape(
      target.id
    )}"]:not(:disabled)`
  )
  if (!button) return false
  button.focus()
  return document.activeElement === button
}

const centre = (element: Element) => {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    height: rect.height,
  }
}

/**
 * The tile an arrow, Home or End key moves to from `current`, or null when
 * the key is not a movement key or there is nowhere to go.
 */
export function tileInDirection(
  current: HTMLButtonElement,
  key: string,
  root: ParentNode = document
): HTMLButtonElement | null {
  const zone = zoneOf(current)
  if (!zone) return null
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const tiles = tilesIn(zone)
    const index = tiles.indexOf(current)
    return tiles[index + (key === 'ArrowRight' ? 1 : -1)] ?? null
  }
  if (key === 'Home' || key === 'End') {
    const tiles = tilesIn(zone)
    const target = key === 'Home' ? tiles[0] : tiles[tiles.length - 1]
    return target && target !== current ? target : null
  }
  if (key !== 'ArrowUp' && key !== 'ArrowDown') return null

  // The nearest row above or below, across both zones, then the tile on it
  // closest to the current one horizontally.
  const from = centre(current)
  const direction = key === 'ArrowDown' ? 1 : -1
  const candidates = [...root.querySelectorAll<HTMLButtonElement>(ZONES)]
    .flatMap((element) => tilesIn(element))
    .map((tile) => ({ tile, at: centre(tile) }))
    .filter(
      ({ tile, at }) =>
        tile !== current && (at.y - from.y) * direction > from.height / 2
    )
  if (candidates.length === 0) return null
  let rowY = candidates[0].at.y
  for (const { at } of candidates)
    if (Math.abs(at.y - from.y) < Math.abs(rowY - from.y)) rowY = at.y
  const row = candidates.filter(
    ({ at }) => Math.abs(at.y - rowY) < from.height / 2
  )
  return row.reduce((best, entry) =>
    Math.abs(entry.at.x - from.x) < Math.abs(best.at.x - from.x) ? entry : best
  ).tile
}

/**
 * Keydown handler for a tile button: moves focus with the arrow keys, Home
 * and End. Keys with a modifier are left to the browser.
 */
export function moveTileFocus(event: {
  key: string
  currentTarget: HTMLButtonElement
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  preventDefault: () => void
}): void {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const target = tileInDirection(event.currentTarget, event.key)
  if (!target) return
  event.preventDefault()
  target.focus()
}
