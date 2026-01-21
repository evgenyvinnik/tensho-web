/**
 * useScorePopups Hook
 *
 * Manages multiple score popups with automatic cleanup.
 */

import React, { useState, useCallback } from 'react'
import { ScorePopup } from './ScorePopup'
import type { ScorePopupProps } from './types'

export interface UseScorePopupsReturn {
  showPopup: (props: Omit<ScorePopupProps, 'onComplete'>) => void
  PopupContainer: React.FC
  activeCount: number
}

/**
 * Hook for managing multiple score popups
 */
export function useScorePopups(): UseScorePopupsReturn {
  const [popups, setPopups] = useState<Array<ScorePopupProps & { id: string }>>([])

  const showPopup = useCallback(
    (props: Omit<ScorePopupProps, 'onComplete'>) => {
      const id = `popup-${Date.now()}-${Math.random()}`
      setPopups((prev) => [...prev, { ...props, id }])
    },
    []
  )

  const handleComplete = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const PopupContainer: React.FC = () =>
    React.createElement(
      React.Fragment,
      null,
      popups.map((popup) =>
        React.createElement(ScorePopup, {
          key: popup.id,
          ...popup,
          onComplete: () => handleComplete(popup.id),
        })
      )
    )

  return {
    showPopup,
    PopupContainer,
    activeCount: popups.length,
  }
}

export default useScorePopups
