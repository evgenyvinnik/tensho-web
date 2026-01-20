/**
 * Game Tutorial Hook
 *
 * Hook to manage in-game tutorial state.
 */

import { useState, useCallback } from 'react'
import { GameTutorialStep } from './types'

/**
 * Hook to manage in-game tutorial state
 */
export function useGameTutorial(steps: GameTutorialStep[]) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tensho_game_tutorial_completed') === 'true'
    }
    return false
  })

  const start = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  const skip = useCallback(() => {
    setIsActive(false)
    setCurrentStep(0)
  }, [])

  const complete = useCallback(() => {
    setIsActive(false)
    setHasCompleted(true)
    setCurrentStep(0)
    if (typeof window !== 'undefined') {
      localStorage.setItem('tensho_game_tutorial_completed', 'true')
    }
  }, [])

  const reset = useCallback(() => {
    setHasCompleted(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tensho_game_tutorial_completed')
    }
  }, [])

  // Trigger step complete from external action
  const completeCurrentStep = useCallback(() => {
    if (isActive && steps[currentStep]?.waitForAction) {
      if (currentStep === steps.length - 1) {
        complete()
      } else {
        nextStep()
      }
    }
  }, [isActive, currentStep, steps, complete, nextStep])

  return {
    isActive,
    currentStep,
    hasCompleted,
    start,
    nextStep,
    skip,
    complete,
    reset,
    completeCurrentStep,
  }
}
