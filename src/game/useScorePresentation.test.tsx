import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { eventBus } from './EventBus'
import { useScorePresentation } from './useScorePresentation'
import {
  EMPTY_SCORE_EQUATION,
  settleScoreEquation,
} from '../rules/ScoreEquation'

afterEach(() => {
  cleanup()
  eventBus.clear()
  vi.useRealTimers()
})

function paid(points: number, multiplier: number, total: number) {
  const equation = settleScoreEquation(points, multiplier, total)
  act(() =>
    eventBus.emit('handPlayed', {
      tiles: [],
      yakuIds: [],
      score: total,
      equation,
    })
  )
  return equation
}

it('takes an atomic payment, ignores later Yaku reveals, and replaces the previous play including zero', () => {
  vi.useFakeTimers()
  const { result } = renderHook(useScorePresentation)
  expect(result.current.equation).toBe(EMPTY_SCORE_EQUATION)
  const complete = paid(225, 2.6, 585)
  act(() =>
    eventBus.emit('yakuScored', {
      yakuId: 'reveal',
      yakuName: 'Reveal',
      multiplier: 2.6,
    })
  )
  expect(result.current.equation).toBe(complete)
  const partial = paid(45, 1, 45)
  expect(result.current.equation).toBe(partial)
  const zero = paid(45, 1, 0)
  expect(result.current.equation).toBe(zero)
  expect(result.current.equation.adjustment).toBe(-45)
})

it('restarts the animation window for a new play and clears it on round start and unmount', () => {
  vi.useFakeTimers()
  const { result, unmount } = renderHook(useScorePresentation)
  paid(225, 2.6, 585)
  act(() => vi.advanceTimersByTime(1000))
  paid(45, 1, 45)
  act(() => vi.advanceTimersByTime(500))
  expect(result.current.isAnimating).toBe(true)
  act(() => vi.advanceTimersByTime(1000))
  expect(result.current.isAnimating).toBe(false)
  paid(45, 1, 0)
  act(() =>
    eventBus.emit('roundStart', {
      actNumber: 1,
      roundNumber: 2,
      roundType: 'small',
      target: 1000,
    })
  )
  expect(result.current).toEqual({
    equation: EMPTY_SCORE_EQUATION,
    isAnimating: false,
  })
  expect(vi.getTimerCount()).toBe(0)
  paid(45, 1, 45)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
