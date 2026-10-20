/**
 * The wall draw: tiles leave the Wall for the rack and the collection.
 *
 * The Wall rises above the rack. On a deal, every rack tile flies out of it
 * to its place, one after another; each Flower or Season drawn turns face up
 * above the Wall with its name, then flies into its collection token. The
 * Wall then tucks back into the wall chip. About two seconds in all.
 *
 * Uses the Web Animations API on the overlay's own elements and on the rack
 * tiles, so nothing is kept in React state; cancelling the returned
 * animations puts every element back where it belongs.
 *
 * @module animations/wallDraw
 */

/** The Wall appears. */
export const WALL_IN_MS = 300
/** One rack tile's flight from the Wall to its place. */
export const TILE_FLIGHT_MS = 460
/** Every rack tile leaves the Wall within this window. */
const DEAL_SPREAD_MS = 900
const DEAL_STAGGER_MS = 70
/** A bonus tile rises face up, waits to be read, then flies to the rail. */
export const FLORA_RISE_MS = 420
export const FLORA_HOLD_MS = 520
export const FLORA_FLY_MS = 420
const FLORA_GAP_MS = 170
/** The Wall tucks back into the wall chip. */
const WALL_OUT_MS = 340
/** Height over width of the Wall icon (illustrations/wall.webp). */
const WALL_ASPECT = 323 / 480
/** Reduced motion: drawn bonus tiles fade in place and stay this long. */
export const STILL_MS = 2000

export interface WallDrawTimeline {
  /** When each rack tile leaves the Wall. */
  rack: number[]
  /** When each bonus tile leaves the Wall. */
  flora: number[]
  /** When the Wall starts back to the wall chip. */
  wallOut: number
  end: number
}

/** When everything happens, in ms from the start. */
export function wallDrawTimeline(
  rackTiles: number,
  floraTiles: number
): WallDrawTimeline {
  const stagger =
    rackTiles > 1
      ? Math.min(DEAL_STAGGER_MS, DEAL_SPREAD_MS / (rackTiles - 1))
      : 0
  const rack = Array.from(
    { length: rackTiles },
    (_, i) => WALL_IN_MS + i * stagger
  )
  // Bonus tiles come off first: they are what the deal is announcing.
  const flora = Array.from(
    { length: floraTiles },
    (_, i) => WALL_IN_MS - 60 + i * FLORA_GAP_MS
  )
  const rackLanded = rackTiles ? rack[rackTiles - 1] + TILE_FLIGHT_MS : 0
  const floraLeft = floraTiles
    ? flora[floraTiles - 1] + FLORA_RISE_MS + FLORA_HOLD_MS
    : 0
  const wallOut = Math.max(WALL_IN_MS + 200, rackLanded - 120, floraLeft)
  return {
    rack,
    flora,
    wallOut,
    end: Math.max(wallOut + WALL_OUT_MS, floraLeft + FLORA_FLY_MS),
  }
}

interface Point {
  x: number
  y: number
}

const centre = (rect: DOMRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
})

/** Place an element (laid out at 0,0) with its centre on `at`. */
const place = (at: Point, size: { w: number; h: number }, extra = '') =>
  `translate(${at.x - size.w / 2}px, ${at.y - size.h / 2}px) ${extra}`.trim()

const canAnimate = (element: Element | null): element is HTMLElement =>
  !!element && typeof (element as HTMLElement).animate === 'function'

const find = (selector: string | undefined) =>
  selector ? document.querySelector(selector) : null

const visibleRect = (element: Element | null): DOMRect | null => {
  const rect = element?.getBoundingClientRect()
  return rect && rect.width > 0 && rect.height > 0 ? rect : null
}

export interface WallDrawStage {
  overlay: HTMLElement
  deal: boolean
  reducedMotion: boolean
}

export interface WallDrawPlayback {
  /** Cancel these when the draw ends or is skipped. */
  animations: Animation[]
  /** Pulses on the table that may finish after the draw; a skip cancels them. */
  afterglow: Animation[]
  duration: number
}

/**
 * Lay out and play the draw. The overlay holds `[data-wall-draw-wall]`, an
 * optional `[data-wall-draw-backdrop]`, and one `[data-flora-reveal]` per
 * bonus tile whose `data-target` names its collection token.
 */
export function playWallDraw({
  overlay,
  deal,
  reducedMotion,
}: WallDrawStage): WallDrawPlayback {
  const floraCards = [
    ...overlay.querySelectorAll<HTMLElement>('[data-flora-reveal]'),
  ]
  const rackTiles =
    deal && !reducedMotion
      ? [
          ...document.querySelectorAll<HTMLElement>(
            '[data-play-zone="hand"] [data-play-tile]'
          ),
        ].filter((tile) => visibleRect(tile))
      : []
  const timeline = wallDrawTimeline(rackTiles.length, floraCards.length)
  const animations: Animation[] = []
  const afterglow: Animation[] = []
  const run = (
    element: Element | null,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    into = animations
  ) => {
    if (!canAnimate(element)) return
    into.push(element.animate(keyframes, options))
  }

  // Where the Wall stands: centred over the rack, inside the board.
  const viewport = { w: window.innerWidth, h: window.innerHeight }
  const rack = visibleRect(document.querySelector('[data-hand-rack]'))
  const board = visibleRect(document.querySelector('[data-gameplay-scroll]'))
  const wallWidth = Math.round(Math.min(200, Math.max(120, viewport.w * 0.34)))
  const wallSize = { w: wallWidth, h: Math.round(wallWidth * WALL_ASPECT) }
  const top = (board?.top ?? 0) + wallSize.h / 2 + 8
  const wallAt: Point = {
    x: rack ? centre(rack).x : viewport.w / 2,
    y: Math.max(top, rack ? rack.top - wallSize.h / 2 - 20 : viewport.h * 0.5),
  }

  // Bonus tiles turn face up in a row above the Wall.
  const card = floraCards[0]?.getBoundingClientRect()
  const cardSize = { w: card?.width || 64, h: card?.height || 110 }
  const showcaseY = reducedMotion
    ? viewport.h * 0.45
    : Math.max(
        cardSize.h / 2 + 8,
        wallAt.y - wallSize.h / 2 - cardSize.h / 2 - 6
      )
  // Far enough apart that the longest name never covers its neighbour's.
  const widest = Math.max(
    cardSize.w + 6,
    ...floraCards.map(
      (element) =>
        element.querySelector<HTMLElement>('[data-flora-reveal-name]')
          ?.offsetWidth ?? 0
    )
  )
  const spacing = Math.min(
    widest + 10,
    (viewport.w - 16) / Math.max(1, floraCards.length)
  )
  const showcase = (index: number): Point => ({
    x:
      (reducedMotion ? viewport.w / 2 : wallAt.x) +
      (index - (floraCards.length - 1) / 2) * spacing,
    y: showcaseY,
  })

  if (reducedMotion) {
    // No flights: the drawn bonus tiles fade in where they can be read.
    floraCards.forEach((element, index) => {
      element.style.transform = place(showcase(index), cardSize)
      run(
        element,
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { opacity: 1, offset: 0.88 },
          { opacity: 0 },
        ],
        { duration: STILL_MS, fill: 'both' }
      )
    })
    return {
      animations,
      afterglow,
      duration: floraCards.length ? STILL_MS : 0,
    }
  }

  const total = timeline.end
  const at = (ms: number) => Math.min(1, Math.max(0, ms / total))

  // A soft shade behind the Wall so the draw reads over any felt.
  const backdrop = overlay.querySelector<HTMLElement>(
    '[data-wall-draw-backdrop]'
  )
  if (backdrop)
    backdrop.style.background = `radial-gradient(circle at ${wallAt.x}px ${wallAt.y - wallSize.h / 2}px, rgba(0,0,0,0.42), rgba(0,0,0,0) ${Math.max(220, wallSize.w * 1.6)}px)`
  run(
    backdrop,
    [
      { opacity: 0 },
      { opacity: 1, offset: at(WALL_IN_MS) },
      { opacity: 1, offset: at(timeline.wallOut) },
      { opacity: 0 },
    ],
    { duration: total, fill: 'both' }
  )

  // The Wall: rises, gives up its tiles, then tucks into the wall chip.
  const wall = overlay.querySelector<HTMLElement>('[data-wall-draw-wall]')
  if (wall) {
    wall.style.width = `${wallSize.w}px`
    wall.style.height = `${wallSize.h}px`
  }
  const chip = visibleRect(document.querySelector('[data-wall-chip]'))
  const home = chip ? centre(chip) : wallAt
  const homeScale = chip ? Math.min(1, (chip.height * 0.8) / wallSize.h) : 0.4
  const settled = place(wallAt, wallSize, 'scale(1)')
  run(
    wall,
    [
      {
        transform: place(wallAt, wallSize, 'translateY(24px) scale(0.55)'),
        opacity: 0,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      { transform: settled, opacity: 1, offset: at(WALL_IN_MS) },
      {
        transform: place(wallAt, wallSize, 'rotate(-1.5deg) scale(1.02)'),
        offset: at(WALL_IN_MS + (timeline.wallOut - WALL_IN_MS) / 3),
      },
      {
        transform: place(wallAt, wallSize, 'rotate(1.2deg) scale(1.02)'),
        offset: at(WALL_IN_MS + ((timeline.wallOut - WALL_IN_MS) * 2) / 3),
      },
      {
        transform: settled,
        opacity: 1,
        offset: at(timeline.wallOut),
        easing: 'cubic-bezier(0.55, 0, 0.75, 0.3)',
      },
      { transform: place(home, wallSize, `scale(${homeScale})`), opacity: 0 },
    ],
    { duration: total, fill: 'both' }
  )
  run(
    document.querySelector('[data-wall-chip]'),
    [
      { transform: 'none' },
      { transform: 'scale(1.18)', offset: 0.4 },
      { transform: 'none' },
    ],
    { duration: 360, delay: timeline.wallOut + WALL_OUT_MS - 80 },
    afterglow
  )

  // The hand: each tile flies from the Wall to its place in the rack, on an
  // arc, appearing as it leaves the Wall.
  rackTiles.forEach((tile, index) => {
    const to = centre(tile.getBoundingClientRect())
    const dx = wallAt.x - to.x
    const dy = wallAt.y - to.y
    run(
      tile,
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(0.35)`,
          opacity: 0,
        },
        { opacity: 1, offset: 0.18 },
        {
          transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 36}px) scale(0.9)`,
          offset: 0.55,
        },
        { transform: 'none', opacity: 1 },
      ],
      {
        duration: TILE_FLIGHT_MS,
        delay: timeline.rack[index],
        easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)',
        fill: 'backwards',
      }
    )
  })

  // Bonus tiles: out of the Wall face down, turned face up with their name,
  // then into their collection token, which answers with a pulse.
  floraCards.forEach((element, index) => {
    const start = timeline.flora[index]
    const shown = start + FLORA_RISE_MS
    const leaves = shown + FLORA_HOLD_MS
    const lands = leaves + FLORA_FLY_MS
    const span = lands - start
    const step = (ms: number) => (ms - start) / span
    const token =
      visibleRect(find(element.dataset.target)) ??
      visibleRect(document.querySelector('[data-collectible-rail]'))
    const target = token ? centre(token) : home
    const landScale = token ? Math.min(1, token.height / cardSize.h) : 0.3
    const up = showcase(index)
    run(
      element,
      [
        {
          transform: place(wallAt, cardSize, 'scale(0.4)'),
          opacity: 0,
          easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.25)',
        },
        { opacity: 1, offset: 0.08 },
        { transform: place(up, cardSize, 'scale(1.12)'), offset: step(shown) },
        {
          transform: place(up, cardSize, 'scale(1)'),
          opacity: 1,
          offset: step(leaves),
          easing: 'cubic-bezier(0.5, 0, 0.75, 0.6)',
        },
        {
          transform: place(target, cardSize, `scale(${landScale})`),
          opacity: 0.2,
        },
      ],
      { duration: span, delay: start, fill: 'both' }
    )
    run(
      element.querySelector('[data-flora-reveal-flip]'),
      [
        { transform: 'perspective(600px) rotateY(180deg)' },
        { transform: 'perspective(600px) rotateY(180deg)', offset: 0.25 },
        { transform: 'perspective(600px) rotateY(0deg)' },
      ],
      {
        duration: FLORA_RISE_MS,
        delay: start,
        easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)',
        fill: 'both',
      }
    )
    const glow = [
      { opacity: 0 },
      { opacity: 1, offset: step(shown - 80) },
      { opacity: 1, offset: step(leaves) },
      { opacity: 0, offset: step(leaves + 140) },
      { opacity: 0 },
    ]
    run(element.querySelector('[data-flora-reveal-glow]'), glow, {
      duration: span,
      delay: start,
      fill: 'both',
    })
    run(element.querySelector('[data-flora-reveal-name]'), glow, {
      duration: span,
      delay: start,
      fill: 'both',
    })
    run(
      element.querySelector('[data-flora-reveal-rays]'),
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(120deg)' }],
      { duration: span, delay: start, fill: 'both' }
    )
    // On the way it becomes the collection token it is about to join.
    run(
      element.querySelector('[data-flora-reveal-art]'),
      [
        { opacity: 0 },
        { opacity: 0, offset: step(leaves) },
        { opacity: 1, offset: step(leaves + FLORA_FLY_MS * 0.6) },
        { opacity: 1 },
      ],
      { duration: span, delay: start, fill: 'both' }
    )
    // Its token waits, dimmed, and lights up as the tile lands in it.
    const settle = lands + 360
    const waiting = { opacity: 0.3, transform: 'scale(0.85)', filter: 'none' }
    run(
      find(element.dataset.target),
      [
        waiting,
        { ...waiting, offset: (lands - 60) / settle },
        {
          opacity: 1,
          transform: 'scale(1.3)',
          filter: 'drop-shadow(0 0 10px rgba(255, 213, 79, 0.95))',
          offset: (lands + 110) / settle,
        },
        { opacity: 1, transform: 'none', filter: 'none' },
      ],
      { duration: settle },
      afterglow
    )
  })

  return { animations, afterglow, duration: total }
}
