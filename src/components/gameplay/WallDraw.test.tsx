import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WallDraw } from './WallDraw'
import {
  useFloraRevealQueue,
  type WallDrawEntry,
} from '../../game/floraRevealQueue'
import { gameOrchestrator } from '../../game/GameOrchestrator'
import { STILL_MS, wallDrawTimeline } from '../../animations/wallDraw'
import { TileSuit } from '../../core/Tile'
import { getTileImagePath } from '../../utils/assets'
import i18n, { changeLanguage } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import type { SeasonTile } from '../../systems/types'

const season: SeasonTile = {
  id: 'season-1',
  type: 'Autumn',
  effect: { type: 'yaku_modifier', value: 1.2, description: '' },
  isCorrupted: false,
}

const queue = (...entries: WallDrawEntry[]) =>
  useFloraRevealQueue.setState({ queue: entries })

interface Recorded {
  element: Element
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  cancel: ReturnType<typeof vi.fn>
}
let recorded: Recorded[] = []

beforeEach(() => {
  vi.useFakeTimers()
  gameOrchestrator.startNewRun(7)
  recorded = []
  // jsdom neither lays out nor animates: give every element a box and record
  // each animation instead.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(100, 600, 40, 56)
  )
  HTMLElement.prototype.animate = function (
    this: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ) {
    const cancel = vi.fn()
    recorded.push({ element: this, keyframes, options, cancel })
    return { cancel } as unknown as Animation
  } as typeof HTMLElement.prototype.animate
})

afterEach(async () => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate
  await act(async () => {
    useFloraRevealQueue.setState({ queue: [] })
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

/** A rack like HandRack's, for the deal to fill. */
function Table({ paused = false }: { paused?: boolean }) {
  return (
    <>
      <div data-play-zone="hand">
        <div data-hand-rack>
          {['a', 'b', 'c'].map((id) => (
            <button key={id} type="button" data-play-tile={id} />
          ))}
        </div>
      </div>
      <button type="button" data-wall-chip />
      <button type="button" data-flora-flower="Plum" />
      <WallDraw flora={gameOrchestrator.getFloraState()} paused={paused} />
    </>
  )
}

describe('WallDraw', () => {
  it('deals the hand out of the Wall and flies each bonus tile to its token', () => {
    queue(
      { kind: 'flower', flower: 'Plum', key: 1 },
      { kind: 'season', season, key: 2 },
      { kind: 'deal', key: 3 }
    )
    render(<Table />)

    const overlay = document.querySelector('[data-wall-draw="deal"]')!
    expect(overlay).toBeInTheDocument()
    expect(overlay.querySelector('[data-wall-draw-wall]')).toBeInTheDocument()
    // Each drawn bonus tile shows its own face and name, and says so.
    const flower = overlay.querySelector('[data-flora-reveal="flower"]')!
    expect(flower).toHaveAttribute('data-target', '[data-flora-flower="Plum"]')
    expect(flower.querySelector('img')).toHaveAttribute(
      'src',
      getTileImagePath(TileSuit.Flower, 1)
    )
    expect(flower).toHaveTextContent(i18n.t('flora.plum'))
    const autumn = overlay.querySelector('[data-flora-reveal="season"]')!
    expect(autumn).toHaveAttribute(
      'data-target',
      '[data-flora-season="season-1"]'
    )
    expect(autumn.querySelector('img')).toHaveAttribute(
      'src',
      getTileImagePath(TileSuit.Season, 3)
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      i18n.t('floraReveal.flowerTitle', { name: i18n.t('flora.plum') })
    )

    // Every rack tile leaves the Wall in turn and is hidden until it does.
    const tiles = recorded.filter((a) => a.element.matches('[data-play-tile]'))
    expect(tiles.map((a) => a.element.getAttribute('data-play-tile'))).toEqual([
      'a',
      'b',
      'c',
    ])
    expect(tiles.every((a) => a.options.fill === 'backwards')).toBe(true)
    expect(tiles.map((a) => a.options.delay)).toEqual(
      wallDrawTimeline(3, 2).rack
    )
    expect(tiles[0].keyframes[0]).toMatchObject({ opacity: 0 })
    expect(tiles[0].keyframes.at(-1)).toMatchObject({ transform: 'none' })
    // The Flower's token stays unseen until its tile lands, then holds lit
    // past the draw's end, when the rail shows it; the chip takes the Wall.
    const token = recorded.find((a) =>
      a.element.matches('[data-flora-flower="Plum"]')
    )!
    expect(token.keyframes[0]).toMatchObject({ opacity: 0 })
    expect(token.keyframes.at(-1)).toMatchObject({
      opacity: 1,
      visibility: 'visible',
    })
    expect(token.options.duration).toBeGreaterThan(wallDrawTimeline(3, 2).end)
    expect(recorded.some((a) => a.element.matches('[data-wall-chip]'))).toBe(
      true
    )

    // It ends by itself and is never shown again.
    act(() => vi.advanceTimersByTime(wallDrawTimeline(3, 2).end))
    expect(document.querySelector('[data-wall-draw]')).not.toBeInTheDocument()
    expect(useFloraRevealQueue.getState().queue).toEqual([])
  })

  it('skips to the end on a tap, putting every tile in place', () => {
    queue({ kind: 'deal', key: 1 })
    render(<Table />)
    expect(recorded.length).toBeGreaterThan(0)
    fireEvent.pointerDown(document.querySelector('[data-wall-draw]')!)
    expect(document.querySelector('[data-wall-draw]')).not.toBeInTheDocument()
    expect(recorded.every((a) => a.cancel.mock.calls.length === 1)).toBe(true)
    expect(useFloraRevealQueue.getState().queue).toEqual([])
  })

  it('shows a bonus tile drawn mid-round without dealing the rack again', () => {
    queue({ kind: 'flower', flower: 'Plum', key: 1 })
    render(<Table />)
    expect(
      document.querySelector('[data-wall-draw="bonus"]')
    ).toBeInTheDocument()
    expect(recorded.some((a) => a.element.matches('[data-play-tile]'))).toBe(
      false
    )
  })

  it('waits while paused, keeping the draw', () => {
    queue({ kind: 'deal', key: 1 })
    const { rerender } = render(<Table paused />)
    expect(document.querySelector('[data-wall-draw]')).not.toBeInTheDocument()
    expect(useFloraRevealQueue.getState().queue).toHaveLength(1)
    rerender(<Table />)
    expect(document.querySelector('[data-wall-draw]')).toBeInTheDocument()
  })

  it('under reduced motion, skips the deal and shows a drawn tile in place', () => {
    useSettingsStore.setState({ reducedMotion: true })
    queue({ kind: 'deal', key: 1 })
    render(<Table />)
    act(() => vi.advanceTimersByTime(0))
    expect(useFloraRevealQueue.getState().queue).toEqual([])
    expect(recorded).toEqual([])

    act(() => queue({ kind: 'flower', flower: 'Plum', key: 2 }))
    expect(
      document.querySelector('[data-wall-draw-wall]')
    ).not.toBeInTheDocument()
    const name = document.querySelector('[data-flora-reveal-name]')!
    expect(name).toHaveTextContent(i18n.t('flora.plum'))
    expect(name).not.toHaveClass('opacity-0')
    // Only fades: nothing moves.
    expect(
      recorded.every((a) => a.keyframes.every((frame) => !frame.transform))
    ).toBe(true)
    act(() => vi.advanceTimersByTime(STILL_MS))
    expect(useFloraRevealQueue.getState().queue).toEqual([])
  })
})

describe('wallDrawTimeline', () => {
  it('deals a full hand in about two seconds', () => {
    for (const flora of [0, 1, 3]) {
      const { end } = wallDrawTimeline(14, flora)
      expect(end).toBeGreaterThanOrEqual(1600)
      expect(end).toBeLessThanOrEqual(2200)
    }
  })

  it('draws bonus tiles first and lands the hand before the Wall leaves', () => {
    const timeline = wallDrawTimeline(14, 2)
    expect(timeline.flora[0]).toBeLessThan(timeline.rack[0])
    expect(timeline.rack).toEqual([...timeline.rack].sort((a, b) => a - b))
    expect(timeline.wallOut).toBeGreaterThan(timeline.rack[13])
    expect(timeline.end).toBeGreaterThan(timeline.wallOut)
  })
})
