import { useEffect, useState } from 'react'
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useScorePopups, useScreenShake, VFXProvider } from './useVFX'
import { eventBus } from '../game/EventBus'
import { vfxSystem } from '../systems/VFXSystem'
import { useSettingsStore } from '../stores/settingsStore'

afterEach(() => {
  vfxSystem.destroy()
  vi.restoreAllMocks()
})

it('clears transient scoring text when leaving gameplay for a new phase', () => {
  const { result, unmount } = renderHook(() => useScorePopups())
  act(() =>
    result.current.showPopup({
      value: 500,
      label: 'Round Complete!',
      position: { x: 0.5, y: 0.5 },
    })
  )
  expect(result.current.popups).toHaveLength(1)
  act(() =>
    eventBus.emit('phaseChanged', {
      previousPhase: 'gameplay',
      newPhase: 'gameOver',
    })
  )
  expect(result.current.popups).toHaveLength(0)
  // New phase effects can still appear normally; the renderer is not disabled.
  act(() =>
    result.current.showPopup({
      value: 10,
      label: 'Reward',
      position: { x: 0.5, y: 0.5 },
    })
  )
  expect(result.current.popups).toHaveLength(1)
  unmount()
})

it('does not shake when the operating system requests reduced motion', () => {
  useSettingsStore.setState({ reducedMotion: false })
  const media = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...media(query),
    matches: query === '(prefers-reduced-motion: reduce)',
  }))
  const request = vi.spyOn(window, 'requestAnimationFrame')
  const { result } = renderHook(() => useScreenShake())
  act(() => result.current.shake('medium'))
  expect(request).not.toHaveBeenCalled()
  expect(result.current.shakeOffset).toEqual({ x: 0, y: 0 })
})

it.each(['setting', 'phase'] as const)(
  'cancels an active shake on a %s change',
  (cause) => {
    useSettingsStore.setState({ reducedMotion: false })
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const cancel = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {})
    const { result } = renderHook(() => useScreenShake())
    const start = performance.now()
    act(() => result.current.shake('medium'))
    act(() => frames.shift()!(start + 16))
    expect(result.current.shakeOffset.x).not.toBe(0)
    act(() => {
      if (cause === 'setting')
        useSettingsStore.setState({ reducedMotion: true })
      else
        eventBus.emit('phaseChanged', {
          previousPhase: 'gameplay',
          newPhase: 'shop',
        })
    })
    expect(result.current.shakeOffset).toEqual({ x: 0, y: 0 })
    expect(cancel).toHaveBeenCalled()
    act(() => frames.shift()!(start + 32))
    expect(result.current.shakeOffset).toEqual({ x: 0, y: 0 })
  }
)

it('keeps game controls, focus, and local state mounted throughout screen shake', () => {
  useSettingsStore.setState({ reducedMotion: false })
  const frames: FrameRequestCallback[] = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback)
    return frames.length
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  const mounted = vi.fn()
  const unmounted = vi.fn()
  function GameControl() {
    const [value, setValue] = useState('')
    useEffect(() => {
      mounted()
      return unmounted
    }, [])
    return (
      <input
        aria-label="Plan"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    )
  }
  const result = render(
    <VFXProvider>
      <GameControl />
    </VFXProvider>
  )
  const input = screen.getByRole('textbox', { name: 'Plan' })
  fireEvent.change(input, { target: { value: 'keep my pair' } })
  input.focus()
  const start = performance.now()
  act(() => vfxSystem.shake('medium'))
  for (const elapsed of [16, 32, 300]) {
    const callback = frames.shift()
    expect(callback).toBeDefined()
    act(() => callback!(start + elapsed))
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveFocus()
    expect(input).toHaveValue('keep my pair')
    expect(mounted).toHaveBeenCalledTimes(1)
    expect(unmounted).not.toHaveBeenCalled()
  }
  result.unmount()
  expect(unmounted).toHaveBeenCalledTimes(1)
})
