/**
 * Progressive Tutorial Hook
 *
 * Manages the progressive hint system that shows tutorial tips
 * contextually as the player encounters each game mechanic.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ProgressiveHint,
  TutorialTrigger,
  getHintsForTrigger,
  PROGRESSIVE_HINTS_STORAGE_KEY,
  HINTS_DISABLED_STORAGE_KEY,
} from '../config/progressiveTutorialHints'

/**
 * Get shown hints from localStorage
 */
function getShownHints(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem(PROGRESSIVE_HINTS_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

/**
 * Save shown hints to localStorage
 */
function saveShownHints(hints: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PROGRESSIVE_HINTS_STORAGE_KEY, JSON.stringify([...hints]))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if hints are disabled
 */
function areHintsDisabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(HINTS_DISABLED_STORAGE_KEY) === 'true'
}

/**
 * Progressive tutorial hook state
 */
interface UseProgressiveTutorialReturn {
  /** Currently displayed hint, or null if none */
  currentHint: ProgressiveHint | null
  /** Queue of pending hints for current trigger */
  hintQueue: ProgressiveHint[]
  /** Whether hints are globally disabled */
  isDisabled: boolean
  /** Trigger hints for a specific game event */
  triggerHints: (trigger: TutorialTrigger) => void
  /** Dismiss the current hint */
  dismissHint: () => void
  /** Disable all future hints */
  disableHints: () => void
  /** Enable hints again */
  enableHints: () => void
  /** Reset all shown hints (for settings) */
  resetAllHints: () => void
  /** Check if a specific hint has been shown */
  hasHintBeenShown: (hintId: string) => boolean
}

/**
 * Hook for managing progressive tutorial hints
 */
export function useProgressiveTutorial(
  allHints: ProgressiveHint[]
): UseProgressiveTutorialReturn {
  const [shownHints, setShownHints] = useState<Set<string>>(() => getShownHints())
  const [currentHint, setCurrentHint] = useState<ProgressiveHint | null>(null)
  const [hintQueue, setHintQueue] = useState<ProgressiveHint[]>([])
  const [isDisabled, setIsDisabled] = useState(() => areHintsDisabled())

  // Auto-dismiss timer ref
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear auto-dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current)
      }
    }
  }, [])

  // Internal dismiss function - defined before the effect that uses it
  const dismissHintInternal = useCallback(() => {
    if (currentHint) {
      // Mark as shown
      const newShownHints = new Set(shownHints)
      newShownHints.add(currentHint.id)
      setShownHints(newShownHints)
      saveShownHints(newShownHints)

      // Show next hint from queue or clear
      setHintQueue((queue) => {
        const nextQueue = queue.slice(1)
        if (nextQueue.length > 0) {
          setCurrentHint(nextQueue[0])
        } else {
          setCurrentHint(null)
        }
        return nextQueue
      })
    }
  }, [currentHint, shownHints])

  // Set up auto-dismiss when hint changes
  useEffect(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
    }

    if (currentHint) {
      const dismissTime = currentHint.autoDismissMs ?? 8000
      autoDismissTimerRef.current = setTimeout(() => {
        dismissHintInternal()
      }, dismissTime)
    }
  }, [currentHint, dismissHintInternal])

  // Trigger hints for a specific game event
  const triggerHints = useCallback(
    (trigger: TutorialTrigger) => {
      if (isDisabled) return

      // Get hints for this trigger that haven't been shown
      const availableHints = getHintsForTrigger(allHints, trigger).filter(
        (hint) =>
          !shownHints.has(hint.id) &&
          currentHint?.id !== hint.id &&
          !hintQueue.some((queuedHint) => queuedHint.id === hint.id)
      )

      if (availableHints.length === 0) return

      // If there's already a hint showing, add to queue
      if (currentHint) {
        setHintQueue((queue) => [...queue, ...availableHints])
      } else {
        // Start showing hints
        setCurrentHint(availableHints[0])
        setHintQueue(availableHints)
      }
    },
    [allHints, shownHints, isDisabled, currentHint, hintQueue]
  )

  // Dismiss the current hint
  const dismissHint = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
    }
    dismissHintInternal()
  }, [dismissHintInternal])

  // Disable all future hints
  const disableHints = useCallback(() => {
    setIsDisabled(true)
    setCurrentHint(null)
    setHintQueue([])
    if (typeof window !== 'undefined') {
      localStorage.setItem(HINTS_DISABLED_STORAGE_KEY, 'true')
    }
  }, [])

  // Enable hints again
  const enableHints = useCallback(() => {
    setIsDisabled(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HINTS_DISABLED_STORAGE_KEY)
    }
  }, [])

  // Reset all shown hints
  const resetAllHints = useCallback(() => {
    setShownHints(new Set())
    setCurrentHint(null)
    setHintQueue([])
    setIsDisabled(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROGRESSIVE_HINTS_STORAGE_KEY)
      localStorage.removeItem(HINTS_DISABLED_STORAGE_KEY)
    }
  }, [])

  // Check if a specific hint has been shown
  const hasHintBeenShown = useCallback(
    (hintId: string) => {
      return shownHints.has(hintId)
    },
    [shownHints]
  )

  return useMemo(
    () => ({
      currentHint,
      hintQueue,
      isDisabled,
      triggerHints,
      dismissHint,
      disableHints,
      enableHints,
      resetAllHints,
      hasHintBeenShown,
    }),
    [
      currentHint,
      hintQueue,
      isDisabled,
      triggerHints,
      dismissHint,
      disableHints,
      enableHints,
      resetAllHints,
      hasHintBeenShown,
    ]
  )
}
