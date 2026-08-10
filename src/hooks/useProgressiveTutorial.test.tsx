import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressiveHint } from '../config/progressiveTutorialHints'
import { PROGRESSIVE_HINTS_STORAGE_KEY } from '../config/progressiveTutorialHints'
import { useProgressiveTutorial } from './useProgressiveTutorial'

const TEST_HINTS: ProgressiveHint[] = [
  {
    id: 'first',
    trigger: 'gameStart',
    arrowDirection: 'bottom',
    title: 'First',
    content: 'First hint',
    priority: 1,
    autoDismissMs: 1_000,
  },
  {
    id: 'second',
    trigger: 'gameStart',
    arrowDirection: 'bottom',
    title: 'Second',
    content: 'Second hint',
    priority: 2,
    autoDismissMs: 1_000,
  },
]

describe('useProgressiveTutorial', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('deduplicates queued hints and advances without blocking gameplay', () => {
    const setItem = vi.spyOn(window.localStorage, 'setItem')
    const { result } = renderHook(() => useProgressiveTutorial(TEST_HINTS))

    act(() => result.current.triggerHints('gameStart'))
    expect(result.current.currentHint?.id).toBe('first')
    expect(result.current.hintQueue.map((hint) => hint.id)).toEqual([
      'first',
      'second',
    ])

    act(() => result.current.triggerHints('gameStart'))
    expect(result.current.hintQueue).toHaveLength(2)

    act(() => result.current.dismissHint())
    expect(result.current.currentHint?.id).toBe('second')
    expect(setItem).toHaveBeenCalledWith(
      PROGRESSIVE_HINTS_STORAGE_KEY,
      JSON.stringify(['first'])
    )

    act(() => vi.advanceTimersByTime(1_000))
    expect(result.current.currentHint).toBeNull()
    expect(setItem).toHaveBeenLastCalledWith(
      PROGRESSIVE_HINTS_STORAGE_KEY,
      JSON.stringify(['first', 'second'])
    )
  })

  it('stops presenting hints immediately when tips are disabled', () => {
    const { result } = renderHook(() => useProgressiveTutorial(TEST_HINTS))

    act(() => result.current.triggerHints('gameStart'))
    act(() => result.current.disableHints())
    expect(result.current.currentHint).toBeNull()
    expect(result.current.hintQueue).toEqual([])

    act(() => result.current.triggerHints('gameStart'))
    expect(result.current.currentHint).toBeNull()
  })
})
