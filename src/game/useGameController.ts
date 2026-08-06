/**
 * useGameController Hook
 *
 * React hook that provides reactive access to the GameOrchestrator.
 * Synchronizes orchestrator state with React component rendering.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tile } from '../core/Tile'
import { eventBus, GameEvent, GameEventData } from './EventBus'
import {
  GameOrchestrator,
  OrchestratorState,
  gameOrchestrator,
} from './GameOrchestrator'
import { PlayerAction, ActionResult } from './ActionProcessor'

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface GameController {
  // State (reactive)
  state: OrchestratorState
  handTiles: Tile[]
  selectedTileIds: string[]
  isRunActive: boolean
  phase: 'menu' | 'gameplay' | 'shop' | 'gameOver'

  // Progression
  currentAct: number
  currentRound: number
  score: number
  targetScore: number
  gold: number

  // Round resources
  handsRemaining: number
  discardsRemaining: number
  redrawsRemaining: number

  // Wall
  wallRemaining: number
  wallTiles: Tile[]
  deadWallRemaining: number

  // Consumables
  consumableCounts: { fateSeals: number; celestialOrbs: number; voidScripts: number }
  fateSeals: unknown[]
  celestialOrbs: unknown[]
  voidScripts: unknown[]

  // Actions
  startNewRun: (seed?: number, stake?: number) => void
  processAction: (action: PlayerAction) => ActionResult
  draw: () => ActionResult
  discard: (tileId: string) => ActionResult
  playHand: (tileIds?: string[]) => ActionResult
  redraw: (tileIds?: string[]) => ActionResult
  skipRound: () => ActionResult

  // Consumable actions
  useFateSeal: (sealId: string, targetTileIds?: string[]) => ActionResult
  useVoidScript: (scriptId: string, targetTileIds?: string[]) => ActionResult

  // Tile selection
  selectTile: (tileId: string) => void
  deselectTile: (tileId: string) => void
  toggleTileSelection: (tileId: string) => void
  clearSelection: () => void
  selectAllTiles: () => void
  isTileSelected: (tileId: string) => boolean

  // Shop
  exitShop: () => void
  purchaseItem: (itemId: string, cost: number) => boolean

  // Utilities
  getAvailableActions: () => PlayerAction['type'][]
  canPerformAction: (action: PlayerAction) => boolean
  resetGame: () => void
  endRun: () => void
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to access and control the game orchestrator
 */
export function useGameController(
  orchestrator: GameOrchestrator = gameOrchestrator
): GameController {
  // Force re-render trigger
  const [, setTick] = useState(0)

  // Get current state
  const state = orchestrator.getState()

  // Subscribe to events that should trigger re-renders
  useEffect(() => {
    const rerenderEvents: GameEvent[] = [
      'runStart',
      'runEnd',
      'roundStart',
      'roundEnd',
      'handPlayed',
      'scoreUpdate',
      'goldChanged',
      'tileDrawn',
      'tileDiscarded',
      'tileSelected',
      'tileDeselected',
      'bonusTileDrawn',
      'phaseChanged',
      'flowerCollected',
      'seasonActivated',
      'decreeAcquired',
      'shopEntered',
      'shopExited',
      'gameOver',
    ]

    const unsubscribers: Array<() => void> = []

    for (const event of rerenderEvents) {
      const unsub = eventBus.on(event, () => {
        setTick((t) => t + 1)
      })
      unsubscribers.push(unsub)
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub()
      }
    }
  }, [orchestrator])

  // Memoized hand tiles
  const handTiles = useMemo(() => orchestrator.getHandTiles(), [state.handTiles])

  // Memoized selected IDs
  const selectedTileIds = useMemo(
    () => orchestrator.getSelectedTileIds(),
    [state.selectedTileIds]
  )

  // Actions
  const startNewRun = useCallback(
    (seed?: number, stake?: number) => {
      orchestrator.startNewRun(seed, stake)
    },
    [orchestrator]
  )

  const processAction = useCallback(
    (action: PlayerAction) => {
      return orchestrator.processAction(action)
    },
    [orchestrator]
  )

  const draw = useCallback(() => {
    return orchestrator.processAction({ type: 'draw' })
  }, [orchestrator])

  const discard = useCallback(
    (tileId: string) => {
      return orchestrator.processAction({ type: 'discard', tileId })
    },
    [orchestrator]
  )

  const playHand = useCallback(
    (tileIds?: string[]) => {
      const ids = tileIds ?? orchestrator.getSelectedTileIds()
      console.log('[useGameController.playHand] Called with', ids.length, 'tile IDs:', ids)
      console.log('[useGameController.playHand] Current state - score:', orchestrator.getState().score, 'handsRemaining:', orchestrator.getState().handsRemaining)
      const result = orchestrator.processAction({ type: 'play', tileIds: ids })
      console.log('[useGameController.playHand] Result:', result)
      console.log('[useGameController.playHand] After state - score:', orchestrator.getState().score, 'handsRemaining:', orchestrator.getState().handsRemaining)
      return result
    },
    [orchestrator]
  )

  const redraw = useCallback(
    (tileIds?: string[]) => {
      const ids = tileIds ?? orchestrator.getSelectedTileIds()
      return orchestrator.processAction({ type: 'redraw', tileIds: ids })
    },
    [orchestrator]
  )

  const skipRound = useCallback(() => {
    return orchestrator.processAction({ type: 'skip' })
  }, [orchestrator])

  // Consumable actions
  const useFateSeal = useCallback(
    (sealId: string, targetTileIds?: string[]) => {
      const targets = targetTileIds ?? orchestrator.getSelectedTileIds()
      return orchestrator.processAction({ type: 'useSeal', sealId, targets })
    },
    [orchestrator]
  )

  const useVoidScript = useCallback(
    (scriptId: string, targetTileIds?: string[]) => {
      const targets = targetTileIds ?? orchestrator.getSelectedTileIds()
      return orchestrator.processAction({ type: 'useScript', scriptId, targets })
    },
    [orchestrator]
  )

  // Tile selection
  const selectTile = useCallback(
    (tileId: string) => {
      orchestrator.selectTile(tileId)
      setTick((t) => t + 1)
    },
    [orchestrator]
  )

  const deselectTile = useCallback(
    (tileId: string) => {
      orchestrator.deselectTile(tileId)
      setTick((t) => t + 1)
    },
    [orchestrator]
  )

  const toggleTileSelection = useCallback(
    (tileId: string) => {
      orchestrator.toggleTileSelection(tileId)
      setTick((t) => t + 1)
    },
    [orchestrator]
  )

  const clearSelection = useCallback(() => {
    orchestrator.clearSelection()
    setTick((t) => t + 1)
  }, [orchestrator])

  const selectAllTiles = useCallback(() => {
    orchestrator.selectAllTiles()
    setTick((t) => t + 1)
  }, [orchestrator])

  const isTileSelected = useCallback(
    (tileId: string) => {
      return state.selectedTileIds.has(tileId)
    },
    [state.selectedTileIds]
  )

  // Shop actions
  const exitShop = useCallback(() => {
    orchestrator.exitShop()
  }, [orchestrator])

  const purchaseItem = useCallback(
    (itemId: string, cost: number) => {
      return orchestrator.purchaseItem(itemId, cost)
    },
    [orchestrator]
  )

  // Utilities
  const getAvailableActions = useCallback(() => {
    return orchestrator.getAvailableActions()
  }, [orchestrator])

  const canPerformAction = useCallback(
    (action: PlayerAction) => {
      return orchestrator.canPerformAction(action)
    },
    [orchestrator]
  )

  const resetGame = useCallback(() => {
    orchestrator.resetGame()
  }, [orchestrator])

  const endRun = useCallback(() => {
    orchestrator.resetGame()
  }, [orchestrator])

  return {
    // State
    state,
    handTiles,
    selectedTileIds,
    isRunActive: state.isRunActive,
    phase: state.phase,

    // Progression
    currentAct: state.currentAct,
    currentRound: state.currentRound,
    score: state.score,
    targetScore: state.targetScore,
    gold: state.gold,

    // Round resources
    handsRemaining: state.handsRemaining,
    discardsRemaining: state.discardsRemaining,
    redrawsRemaining: state.redrawsRemaining,

    // Wall
    wallRemaining: state.wall.length - state.drawIndex,
    wallTiles: state.wall.slice(state.drawIndex),
    deadWallRemaining: state.deadWall.length,

    // Consumables
    consumableCounts: orchestrator.getConsumableCounts(),
    fateSeals: orchestrator.getFateSeals(),
    celestialOrbs: orchestrator.getCelestialOrbs(),
    voidScripts: orchestrator.getVoidScripts(),

    // Actions
    startNewRun,
    processAction,
    draw,
    discard,
    playHand,
    redraw,
    skipRound,

    // Consumable actions
    useFateSeal,
    useVoidScript,

    // Tile selection
    selectTile,
    deselectTile,
    toggleTileSelection,
    clearSelection,
    selectAllTiles,
    isTileSelected,

    // Shop
    exitShop,
    purchaseItem,

    // Utilities
    getAvailableActions,
    canPerformAction,
    resetGame,
    endRun,
  }
}

// =============================================================================
// EVENT SUBSCRIPTION HOOK
// =============================================================================

/**
 * Hook to subscribe to specific game events
 */
export function useGameEvent<T extends GameEvent>(
  event: T,
  callback: (data: GameEventData[T]) => void
): void {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, callback)
    return unsubscribe
  }, [event, callback])
}

/**
 * Hook to subscribe to multiple game events
 */
export function useGameEvents(
  subscriptions: Partial<{
    [K in GameEvent]: (data: GameEventData[K]) => void
  }>
): void {
  useEffect(() => {
    const unsubscribers: Array<() => void> = []

    for (const [event, callback] of Object.entries(subscriptions)) {
      if (callback) {
        const unsub = eventBus.on(
          event as GameEvent,
          callback as (data: unknown) => void
        )
        unsubscribers.push(unsub)
      }
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub()
      }
    }
  }, [subscriptions])
}
