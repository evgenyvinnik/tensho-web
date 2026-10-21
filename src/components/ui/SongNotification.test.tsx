import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SongNotification } from './SongNotification'
import { useSettingsStore } from '../../stores/settingsStore'

const animation = vi.hoisted(() => ({
  rests: [] as Array<() => void>,
  immediate: [] as boolean[],
}))
// Deliberately never finish springs automatically: a hidden/background tab
// cannot make removal or dismissal depend on animation-frame delivery.
vi.mock('@react-spring/web', () => ({
  animated: { div: 'div' },
  useSpring: (config: {
    onRest: () => void
    immediate: boolean
    opacity: number
  }) => {
    animation.rests.push(config.onRest)
    animation.immediate.push(config.immediate)
    return {
      opacity: config.opacity,
      y: { to: () => '' },
      x: { to: () => '' },
      scale: { get: () => 1 },
    }
  },
}))

beforeEach(() => {
  vi.useFakeTimers()
  animation.rests.length = 0
  animation.immediate.length = 0
  useSettingsStore.setState({ reducedMotion: false })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('removes an expired song even if animation completion never arrives', () => {
  const dismissed = vi.fn()
  render(<SongNotification track="dragonDance" onDismiss={dismissed} />)
  act(() => vi.advanceTimersByTime(3999))
  expect(screen.getByText('Dragon Dance')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(501))
  expect(screen.queryByText('Dragon Dance')).toBeNull()
  expect(dismissed).toHaveBeenCalledOnce()
})

it.each(['app', 'system'])(
  'honors %s reduced motion and removes without an exit animation',
  (source) => {
    if (source === 'app') useSettingsStore.setState({ reducedMotion: true })
    else
      vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: () => true,
      }))
    const dismissed = vi.fn()
    render(<SongNotification track="dragonDance" onDismiss={dismissed} />)
    expect(animation.immediate.every(Boolean)).toBe(true)
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.queryByText('Dragon Dance')).toBeNull()
    expect(dismissed).toHaveBeenCalledOnce()
  }
)

it('does not let an old timer or spring dismiss a replacement song', () => {
  const dismissed = vi.fn()
  const view = render(
    <SongNotification track="dragonDance" onDismiss={dismissed} />
  )
  act(() => vi.advanceTimersByTime(3500))
  const oldRests = [...animation.rests]
  view.rerender(<SongNotification track="lotusPond" onDismiss={dismissed} />)
  act(() => {
    vi.advanceTimersByTime(1000)
    oldRests.forEach((rest) => rest())
  })
  expect(screen.getByText('Lotus Pond')).toBeInTheDocument()
  expect(dismissed).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(3500))
  expect(screen.queryByText('Lotus Pond')).toBeNull()
  expect(dismissed).toHaveBeenCalledOnce()
})

it('clears explicitly cancelled tracks and unmounts without late callbacks', () => {
  const dismissed = vi.fn()
  const view = render(
    <SongNotification track="dragonDance" onDismiss={dismissed} />
  )
  view.rerender(<SongNotification track={null} onDismiss={dismissed} />)
  expect(screen.queryByText('Dragon Dance')).toBeNull()
  view.unmount()
  act(() => vi.advanceTimersByTime(10_000))
  expect(dismissed).not.toHaveBeenCalled()
})

it('notifies once when both responsive springs complete', () => {
  const dismissed = vi.fn()
  render(<SongNotification track="dragonDance" onDismiss={dismissed} />)
  act(() => vi.advanceTimersByTime(4000))
  act(() => animation.rests.slice(-2).forEach((rest) => rest()))
  act(() => vi.advanceTimersByTime(1000))
  expect(dismissed).toHaveBeenCalledOnce()
  expect(screen.queryByText('Dragon Dance')).toBeNull()
})

it('finishes an exiting notification when reduced motion is enabled live', () => {
  const dismissed = vi.fn()
  render(<SongNotification track="dragonDance" onDismiss={dismissed} />)
  act(() => vi.advanceTimersByTime(4000))
  act(() => useSettingsStore.setState({ reducedMotion: true }))
  expect(screen.queryByText('Dragon Dance')).toBeNull()
  expect(dismissed).toHaveBeenCalledOnce()
})

it('uses the latest callback without restarting the display deadline', () => {
  const original = vi.fn()
  const latest = vi.fn()
  const view = render(
    <SongNotification track="dragonDance" onDismiss={original} />
  )
  act(() => vi.advanceTimersByTime(3500))
  view.rerender(<SongNotification track="dragonDance" onDismiss={latest} />)
  act(() => vi.advanceTimersByTime(1000))
  expect(original).not.toHaveBeenCalled()
  expect(latest).toHaveBeenCalledOnce()
  expect(screen.queryByText('Dragon Dance')).toBeNull()
})
