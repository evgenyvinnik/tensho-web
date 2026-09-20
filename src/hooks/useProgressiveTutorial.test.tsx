import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressiveHint } from '../config/progressiveTutorialHints'
import {
  PROGRESSIVE_HINTS_STORAGE_KEY,
  HINTS_DISABLED_STORAGE_KEY,
} from '../config/progressiveTutorialHints'
import { useProgressiveTutorial } from './useProgressiveTutorial'

const TEST_HINTS: ProgressiveHint[] = [
  {
    id: 'first',
    trigger: 'gameStart',
    arrowDirection: 'bottom',
    title: 'First',
    content: 'First hint',
    priority: 1,
  },
  {
    id: 'second',
    trigger: 'gameStart',
    arrowDirection: 'bottom',
    title: 'Second',
    content: 'Second hint',
    priority: 2,
  },
]

describe('useProgressiveTutorial', () => {
  beforeEach(() => {
    // The shared setup has a no-op storage stub; this suite needs real semantics.
    const values = new Map<string, string>()
    vi.spyOn(localStorage, 'getItem').mockImplementation(
      (key) => values.get(key) ?? null
    )
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      values.set(key, value)
    })
    vi.spyOn(localStorage, 'removeItem').mockImplementation((key) => {
      values.delete(key)
    })
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

    act(() => vi.advanceTimersByTime(60_000))
    expect(result.current.currentHint?.id).toBe('second')
    expect(vi.getTimerCount()).toBe(0)
    act(() => result.current.dismissHint())
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

  it('deduplicates batched triggers and rejects a stale callback after opt-out', () => {
    const { result } = renderHook(() => useProgressiveTutorial(TEST_HINTS))
    const staleTrigger = result.current.triggerHints
    act(() => {
      staleTrigger('gameStart')
      staleTrigger('gameStart')
    })
    expect(result.current.hintQueue).toHaveLength(2)
    act(() => result.current.disableHints())
    act(() => staleTrigger('gameStart'))
    expect(result.current.hintQueue).toHaveLength(0)
  })

  it('retires an accomplished lesson before any late trigger and preserves other queued lessons', () => {
    const hints: ProgressiveHint[] = [
      ...TEST_HINTS,
      { ...TEST_HINTS[0], id: 'scoring', trigger: 'firstHandPlayed' },
    ]
    const { result } = renderHook(() => useProgressiveTutorial(hints))
    act(() => {
      result.current.triggerHints('gameStart')
      result.current.triggerHints('firstHandPlayed')
      result.current.completeTrigger('gameStart')
      result.current.triggerHints('gameStart')
    })
    expect(result.current.hintQueue.map((hint) => hint.id)).toEqual(['scoring'])
    expect(result.current.hasHintBeenShown('first')).toBe(true)
  })

  it('updates visible copy on locale changes without restarting or duplicating the queue', () => {
    const { result, rerender } = renderHook(
      ({ hints }) => useProgressiveTutorial(hints),
      { initialProps: { hints: TEST_HINTS } }
    )
    act(() => result.current.triggerHints('gameStart'))
    rerender({
      hints: TEST_HINTS.map((hint) => ({
        ...hint,
        title: 'Translated ' + hint.title,
      })),
    })
    expect(result.current.currentHint?.title).toBe('Translated First')
    expect(result.current.hintQueue).toHaveLength(2)
  })

  it('puts core instructions ahead of queued bonus explanations', () => {
    const hints: ProgressiveHint[] = [
      { ...TEST_HINTS[0], id: 'bonus', trigger: 'flowerDrawn', priority: 1 },
      { ...TEST_HINTS[0], id: 'first-move', priority: 0 },
      {
        ...TEST_HINTS[0],
        id: 'scoring',
        trigger: 'firstHandPlayed',
        priority: 0,
      },
    ]
    const { result } = renderHook(() => useProgressiveTutorial(hints))
    act(() => {
      result.current.triggerHints('flowerDrawn')
      result.current.triggerHints('gameStart')
    })
    expect(result.current.currentHint?.id).toBe('first-move')
    act(() => {
      result.current.completeTrigger('gameStart')
      result.current.triggerHints('firstHandPlayed')
    })
    expect(result.current.hintQueue.map((hint) => hint.id)).toEqual([
      'scoring',
      'bonus',
    ])
  })

  it('retains acknowledged preferences across remount and allows an explicit tutorial reset', () => {
    const first = renderHook(() => useProgressiveTutorial(TEST_HINTS))
    act(() => first.result.current.triggerHints('gameStart'))
    act(() => first.result.current.dismissHint())
    first.unmount()
    const second = renderHook(() => useProgressiveTutorial(TEST_HINTS))
    act(() => second.result.current.triggerHints('gameStart'))
    expect(second.result.current.currentHint?.id).toBe('second')
    act(() => second.result.current.resetAllHints())
    expect(second.result.current.currentHint).toBeNull()
    act(() => second.result.current.triggerHints('gameStart'))
    expect(second.result.current.currentHint?.id).toBe('first')
  })

  it('keeps guidance usable when browser storage is unavailable', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useProgressiveTutorial(TEST_HINTS))
    act(() => result.current.triggerHints('gameStart'))
    expect(result.current.currentHint?.id).toBe('first')
    act(() => result.current.dismissHint())
    expect(result.current.currentHint?.id).toBe('second')
  })

  it('does not undo an opt-out when the separate lesson history is malformed', () => {
    localStorage.setItem(PROGRESSIVE_HINTS_STORAGE_KEY, 'malformed JSON')
    localStorage.setItem(HINTS_DISABLED_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useProgressiveTutorial(TEST_HINTS))
    act(() => result.current.triggerHints('gameStart'))
    expect(result.current.isDisabled).toBe(true)
    expect(result.current.currentHint).toBeNull()
    expect(localStorage.getItem(HINTS_DISABLED_STORAGE_KEY)).toBe('true')
  })
})
