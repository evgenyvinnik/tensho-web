/**
 * DoomFire
 *
 * A short burst of pixel fire behind a big score. Adapted from the Doom fire
 * algorithm (https://github.com/filipedeschamps/doom-fire-algorithm,
 * Copyright (c) 2019 Filipe Deschamps, MIT License): a small grid of heat
 * values, a bottom row that feeds it, and each cell cooling as it rises with
 * a little random drift.
 *
 * Bounded on purpose: one small canvas (scaled up with crisp pixels), a fixed
 * grid, a burn of at most a couple of seconds, no work while the page is
 * hidden, and nothing at all with reduced motion (a static glow instead). Its
 * randomness is `Math.random`, never the run's seeded random stream, so a fire
 * can never change a game. It never takes pointer input.
 *
 * @module components/effects/DoomFire
 */

import { useEffect, useRef } from 'react'

/** The classic 37-step palette, black through red and orange to white. */
const PALETTE: readonly [number, number, number][] = [
  [7, 7, 7], [31, 7, 7], [47, 15, 7], [71, 15, 7], [87, 23, 7], [103, 31, 7],
  [119, 31, 7], [143, 39, 7], [159, 47, 7], [175, 63, 7], [191, 71, 7],
  [199, 71, 7], [223, 79, 7], [223, 87, 7], [223, 87, 7], [215, 95, 7],
  [215, 95, 7], [215, 103, 15], [207, 111, 15], [207, 119, 15],
  [207, 127, 15], [207, 135, 23], [199, 135, 23], [199, 143, 23],
  [199, 151, 31], [191, 159, 31], [191, 159, 31], [191, 167, 39],
  [191, 167, 39], [191, 175, 47], [183, 175, 47], [183, 183, 47],
  [183, 183, 55], [207, 207, 111], [223, 223, 159], [239, 239, 199],
  [255, 255, 255],
]
const MAX_HEAT = PALETTE.length - 1
const WIDTH = 72
const HEIGHT = 36
const FRAME_MS = 1000 / 30

export interface DoomFireProps {
  /**
   * 0 for no fire, 1 for the biggest. Each new value of `burst` lights the
   * fire at this intensity.
   */
  intensity: number
  /** Changes for every new celebration; equal values never relight. */
  burst: number
  /** Static glow instead of animation. */
  reducedMotion?: boolean
  className?: string
}

export function DoomFire({
  intensity,
  burst,
  reducedMotion = false,
  className = '',
}: DoomFireProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reducedMotion || burst === 0 || intensity <= 0) return
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const heat = new Uint8Array(WIDTH * HEIGHT)
    const image = context.createImageData(WIDTH, HEIGHT)
    const sourceHeat = Math.round(MAX_HEAT * Math.min(1, 0.45 + intensity))
    // Bigger scores burn longer; the source then dies and the fire cools.
    const burnMs = 500 + 1300 * Math.min(1, intensity)
    const started = performance.now()
    let last = 0
    let frame = 0

    const setSource = (value: number) => {
      const row = (HEIGHT - 1) * WIDTH
      for (let x = 0; x < WIDTH; x++) heat[row + x] = value
    }
    const spread = () => {
      for (let x = 0; x < WIDTH; x++)
        for (let y = 1; y < HEIGHT; y++) {
          const source = y * WIDTH + x
          const value = heat[source]
          if (value === 0) {
            heat[source - WIDTH] = 0
            continue
          }
          const drift = Math.floor(Math.random() * 3)
          const target = Math.max(0, source - drift + 1 - WIDTH)
          heat[target] = Math.max(0, value - (drift & 1))
        }
    }
    const paint = () => {
      let alive = false
      for (let i = 0; i < heat.length; i++) {
        const [r, g, b] = PALETTE[heat[i]]
        const offset = i * 4
        image.data[offset] = r
        image.data[offset + 1] = g
        image.data[offset + 2] = b
        // Cold cells are transparent so the table shows through.
        image.data[offset + 3] = heat[i] === 0 ? 0 : Math.min(255, heat[i] * 9)
        if (heat[i] > 0) alive = true
      }
      context.putImageData(image, 0, 0)
      return alive
    }

    setSource(sourceHeat)
    const tick = (now: number) => {
      if (document.visibilityState === 'hidden') {
        // Do no work in the background; the burst is over by return.
        heat.fill(0)
        paint()
        return
      }
      frame = requestAnimationFrame(tick)
      if (now - last < FRAME_MS) return
      last = now
      if (now - started > burnMs) setSource(0)
      spread()
      if (!paint() && now - started > burnMs) cancelAnimationFrame(frame)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      heat.fill(0)
      context.clearRect(0, 0, WIDTH, HEIGHT)
    }
  }, [burst, intensity, reducedMotion])

  if (reducedMotion)
    return burst !== 0 && intensity > 0 ? (
      <div
        aria-hidden="true"
        data-doom-fire="static"
        className={`pointer-events-none ${className}`}
        style={{
          background: `radial-gradient(ellipse at 50% 100%, rgba(255,140,30,${0.25 + 0.35 * Math.min(1, intensity)}) 0%, transparent 70%)`,
        }}
      />
    ) : null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-doom-fire="animated"
      width={WIDTH}
      height={HEIGHT}
      className={`pointer-events-none ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

/**
 * How big a play is, from 0 (routine) to 1 (spectacular). Judged against the
 * round, not a fixed number: clearing a quarter of the target is noteworthy
 * in Act 1 and Act 8 alike, and clearing it several times over is an inferno.
 */
export function scoreSignificance(score: number, target: number): number {
  if (target <= 0 || score <= 0) return 0
  const share = score / target
  if (share < 0.25) return 0
  // A quarter of the target → 0.15, the whole target → 0.6, triple → 1.
  if (share < 1) return 0.15 + (0.45 * (share - 0.25)) / 0.75
  return Math.min(1, 0.6 + (0.4 * (share - 1)) / 2)
}

export default DoomFire
