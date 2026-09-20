import { useCallback, useEffect, useRef, useState } from 'react'
import { EMPTY_SCORE_EQUATION } from '../rules/ScoreEquation'
import { useGameEvent } from './useGameController'
import type { GameEventData } from './EventBus'

export function useScorePresentation() {
  const [equation, setEquation] = useState(EMPTY_SCORE_EQUATION)
  const [isAnimating, setIsAnimating] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  useGameEvent(
    'handPlayed',
    useCallback((data: GameEventData['handPlayed']) => {
      setEquation(data.equation)
      setIsAnimating(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setIsAnimating(false)
        timer.current = null
      }, 1500)
    }, [])
  )
  useGameEvent(
    'roundStart',
    useCallback(() => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      setEquation(EMPTY_SCORE_EQUATION)
      setIsAnimating(false)
    }, [])
  )
  return { equation, isAnimating }
}
