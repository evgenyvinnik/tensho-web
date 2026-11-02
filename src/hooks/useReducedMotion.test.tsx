import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useSystemReducedMotion } from './useReducedMotion'

afterEach(() => {
  vi.restoreAllMocks()
})

/** A system preference that can change while the hook watches it. */
function mockSystemPreference(initial: boolean) {
  let matches = initial
  let beforeSubscribe: (() => void) | null = null
  type Listener = (event: { matches: boolean }) => void
  const listeners = new Set<Listener>()
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return matches
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_type: string, listener: Listener) => {
          beforeSubscribe?.()
          beforeSubscribe = null
          listeners.add(listener)
        },
        removeEventListener: (_type: string, listener: Listener) =>
          listeners.delete(listener),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  )
  return {
    set(value: boolean) {
      matches = value
      listeners.forEach((listener) => listener({ matches }))
    },
    /** Change after the first render but before anyone listens: no event. */
    changeBeforeSubscribing(value: boolean) {
      beforeSubscribe = () => {
        matches = value
      }
    },
  }
}

it('follows the system preference as it changes', () => {
  const system = mockSystemPreference(false)
  const { result } = renderHook(() => useSystemReducedMotion())
  expect(result.current).toBe(false)
  act(() => system.set(true))
  expect(result.current).toBe(true)
  act(() => system.set(false))
  expect(result.current).toBe(false)
})

it('keeps a change made between the first render and subscribing', () => {
  const system = mockSystemPreference(false)
  system.changeBeforeSubscribing(true)
  const { result } = renderHook(() => useSystemReducedMotion())
  expect(result.current).toBe(true)
})
