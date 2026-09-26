import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useTutorial } from './Tutorial'

const key = 'tensho_tutorial_completed'
let values: Map<string, string>
let storageDescriptor: PropertyDescriptor

beforeEach(() => {
  storageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')!
  values = new Map([['tensho-table-loop-v1', 'keep this run']])
  vi.spyOn(localStorage, 'getItem').mockImplementation(
    (name) => values.get(name) ?? null
  )
  vi.spyOn(localStorage, 'setItem').mockImplementation((name, value) => {
    values.set(name, value)
  })
  vi.spyOn(localStorage, 'removeItem').mockImplementation((name) => {
    values.delete(name)
  })
})
afterEach(() => {
  Object.defineProperty(window, 'localStorage', storageDescriptor)
  vi.restoreAllMocks()
})

it('keeps tutorial controls usable when the storage getter is denied', () => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Storage denied', 'SecurityError')
    },
  })
  const { result } = renderHook(useTutorial)
  expect(result.current.hasCompleted).toBe(false)
  act(() => result.current.open())
  expect(result.current.isOpen).toBe(true)
  act(() => result.current.complete())
  expect(result.current.hasCompleted).toBe(true)
  act(() => result.current.reset())
  expect(result.current.hasCompleted).toBe(false)
  act(() => result.current.close())
  expect(result.current.isOpen).toBe(false)
  expect(values.get('tensho-table-loop-v1')).toBe('keep this run')
})

it('keeps completion in memory through failed writes and retries after recovery', () => {
  const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
    throw new DOMException('Full', 'QuotaExceededError')
  })
  const { result } = renderHook(useTutorial)
  act(() => result.current.complete())
  expect(result.current.hasCompleted).toBe(true)
  expect(values.has(key)).toBe(false)
  act(() => result.current.complete())
  expect(write).toHaveBeenCalledTimes(2)
  expect(values.get(key)).toBe('true')
  const restored = renderHook(useTutorial)
  expect(restored.result.current.hasCompleted).toBe(true)
})

it('keeps reset usable through a failed removal without touching run data', () => {
  values.set(key, 'true')
  const remove = vi.spyOn(localStorage, 'removeItem').mockImplementationOnce(() => {
    throw new DOMException('Storage denied', 'SecurityError')
  })
  const { result } = renderHook(useTutorial)
  act(() => result.current.reset())
  expect(result.current.hasCompleted).toBe(false)
  expect(values.get(key)).toBe('true')
  act(() => result.current.reset())
  expect(remove).toHaveBeenCalledTimes(2)
  expect(values.has(key)).toBe(false)
  expect(values.get('tensho-table-loop-v1')).toBe('keep this run')
})
