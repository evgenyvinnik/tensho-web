/**
 * useGameController Hook
 *
 * React hook that provides reactive access to the GameOrchestrator.
 * Synchronizes orchestrator state with React component rendering.
 */

import { useState, useEffect, useCallback } from 'react'
import { Tile } from '../core/Tile'
import { eventBus, GameEvent, GameEventData } from './EventBus'
import {
  GameOrchestrator,
  OrchestratorState,
  gameOrchestrator,
} from './GameOrchestrator'
import { PlayerAction, ActionResult } from './ActionProcessor'
import type { ScoreBreakdown } from '../rules/ScoringEngine'
import type { Decree, ImperialCharter } from '../systems/types'
import type { FateSeal } from '../systems/FateSealSystem'
import type { CelestialOrb } from '../systems/CelestialOrbSystem'
import type { VoidScript } from '../systems/VoidScriptSystem'
import type { TeaHouseVisitModifiers } from '../systems/TeaHouseSystem'

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

export interface GameController {
  // State (reactive)
  state: OrchestratorState
  handTiles: Tile[]
  selectedTileIds: string[]
  faceDownTileIds: string[]
  lockedTileIds: string[]
  debuffedTileIds: string[]
  disabledDecreeIds: string[]
  decreesFaceDown: boolean
  decreeDisplayOrderIds: string[]
  isRunActive: boolean
  phase: 'menu' | 'gameplay' | 'shop' | 'gameOver'

  // Progression
  currentAct: number
  currentRound: number
  score: number
  runScore: number
  hasWonRun: boolean
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
  fateSeals: FateSeal[]
  celestialOrbs: CelestialOrb[]
  voidScripts: VoidScript[]

  // Actions
  startNewRun: (seed?: number, stake?: number, wallVariant?: string) => void
  processAction: (action: PlayerAction) => ActionResult
  draw: () => ActionResult
  discard: (tileId: string) => ActionResult
  playHand: (tileIds?: string[]) => ActionResult
  redraw: (tileIds?: string[]) => ActionResult
  skipRound: () => ActionResult
  sellDecree: (decreeId: string) => ActionResult

  // Consumable actions
  useFateSeal: (sealId: string, targetTileIds?: string[]) => ActionResult
  useCelestialOrb: (orbId: string) => ActionResult
  useVoidScript: (scriptId: string, targetTileIds?: string[]) => ActionResult

  // Tile selection
  selectTile: (tileId: string) => void
  deselectTile: (tileId: string) => void
  toggleTileSelection: (tileId: string) => void
  clearSelection: () => void
  selectAllTiles: () => void
  isTileSelected: (tileId: string) => boolean

  // Shop
  prepareShopVisit: () => TeaHouseVisitModifiers
  continueEndless: () => boolean
  exitShop: () => void
  purchaseItem: (itemId: string, cost: number, itemType?: string) => boolean
  addDecree: (
    decree: Decree,
    source?: 'purchase' | 'pack_open' | 'generated'
  ) => boolean
  canAddDecree: (decree: Decree) => boolean
  addImperialCharter: (charter: ImperialCharter) => boolean
  canAddImperialCharter: (charter: ImperialCharter) => boolean
  addFateSeal: (
    seal: FateSeal,
    source?: 'purchase' | 'pack_open' | 'generated'
  ) => boolean
  addCelestialOrb: (
    orb: CelestialOrb,
    source?: 'purchase' | 'pack_open' | 'generated'
  ) => boolean
  addVoidScript: (
    script: VoidScript,
    source?: 'purchase' | 'pack_open' | 'generated'
  ) => boolean
  addTileToWall: (tile: Tile) => boolean
  canAddConsumable: () => boolean
  canRerollBossMandate: () => boolean
  rerollBossMandate: () => ActionResult
  canUseDeadWallWrit: (tileId?: string) => boolean
  useDeadWallWrit: (tileId: string) => ActionResult

  // Utilities
  getAvailableActions: () => PlayerAction['type'][]
  canPerformAction: (action: PlayerAction) => boolean
  isCompleteHand: (tileIds: string[]) => boolean
  previewScore: (tileIds: string[]) => ScoreBreakdown | null
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
      'itemSold',
      'charterRedeemed',
      'consumableAcquired',
      'fateSealUsed',
      'celestialOrbUsed',
      'voidScriptUsed',
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

  // The orchestrator mutates round collections in place. Read fresh snapshots
  // on every event-driven render so React never displays a stale hand/selection.
  const handTiles = orchestrator.getHandTiles()
  const selectedTileIds = orchestrator.getSelectedTileIds()

  // Actions
  const startNewRun = useCallback(
    (seed?: number, stake?: number, wallVariant?: string) => {
      orchestrator.startNewRun(seed, stake, wallVariant)
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
      return orchestrator.processAction({ type: 'play', tileIds: ids })
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

  const sellDecree = useCallback(
    (decreeId: string) => orchestrator.sellDecree(decreeId),
    [orchestrator]
  )

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

  const useCelestialOrb = useCallback(
    (orbId: string) => orchestrator.processAction({ type: 'useOrb', orbId }),
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
      return orchestrator.getSelectedTileIds().includes(tileId)
    },
    [orchestrator]
  )

  // Shop actions
  const exitShop = useCallback(() => {
    orchestrator.exitShop()
  }, [orchestrator])

  const continueEndless = useCallback(
    () => orchestrator.continueEndless(),
    [orchestrator]
  )

  const purchaseItem = useCallback(
    (itemId: string, cost: number, itemType?: string) => {
      return orchestrator.purchaseItem(itemId, cost, itemType)
    },
    [orchestrator]
  )

  const addDecree = useCallback(
    (decree: Decree, source?: 'purchase' | 'pack_open' | 'generated') =>
      orchestrator.addDecree(decree, source),
    [orchestrator]
  )
  const canAddDecree = useCallback((decree: Decree) => orchestrator.canAddDecree(decree), [orchestrator])
  const addImperialCharter = useCallback((charter: ImperialCharter) => orchestrator.addImperialCharter(charter), [orchestrator])
  const canAddImperialCharter = useCallback((charter: ImperialCharter) => orchestrator.canAddImperialCharter(charter), [orchestrator])
  const addFateSeal = useCallback(
    (seal: FateSeal, source?: 'purchase' | 'pack_open' | 'generated') =>
      orchestrator.addFateSeal(seal, source),
    [orchestrator]
  )
  const addCelestialOrb = useCallback(
    (orb: CelestialOrb, source?: 'purchase' | 'pack_open' | 'generated') =>
      orchestrator.addCelestialOrb(orb, source),
    [orchestrator]
  )
  const addVoidScript = useCallback(
    (script: VoidScript, source?: 'purchase' | 'pack_open' | 'generated') =>
      orchestrator.addVoidScript(script, source),
    [orchestrator]
  )
  const prepareShopVisit = useCallback(
    () => orchestrator.prepareShopVisit(),
    [orchestrator]
  )
  const addTileToWall = useCallback((tile: Tile) => orchestrator.addTileToWall(tile), [orchestrator])
  const canAddConsumable = useCallback(() => orchestrator.canAddConsumable(), [orchestrator])
  const canRerollBossMandate = useCallback(
    () => orchestrator.canRerollBossMandate(),
    [orchestrator]
  )
  const rerollBossMandate = useCallback(() => {
    const result = orchestrator.rerollBossMandate()
    if (result.success) setTick((tick) => tick + 1)
    return result
  }, [orchestrator])
  const canUseDeadWallWrit = useCallback(
    (tileId?: string) => orchestrator.canUseDeadWallWrit(tileId),
    [orchestrator]
  )
  const useDeadWallWrit = useCallback(
    (tileId: string) => orchestrator.useDeadWallWrit(tileId),
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

  const previewScore = useCallback(
    (tileIds: string[]) => orchestrator.previewScore(tileIds),
    [orchestrator]
  )

  const isCompleteHand = useCallback(
    (tileIds: string[]) => orchestrator.isCompleteHand(tileIds),
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
    faceDownTileIds: orchestrator.getFaceDownTileIds(),
    lockedTileIds: state.mandateEffectSystem.getLockedTileIds(),
    debuffedTileIds: Array.from(state.debuffSystem.getDebuffedTileIds()),
    disabledDecreeIds: state.mandateEffectSystem.getDisabledDecreeIds(),
    decreesFaceDown: state.mandateEffectSystem.areDecreesShuffled(),
    decreeDisplayOrderIds: state.mandateEffectSystem.getShuffledDecreeIds(),
    isRunActive: state.isRunActive,
    phase: state.phase,

    // Progression
    currentAct: state.currentAct,
    currentRound: state.currentRound,
    score: state.score,
    runScore: state.runScore,
    hasWonRun: state.hasWonRun,
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
    sellDecree,

    // Consumable actions
    useFateSeal,
    useCelestialOrb,
    useVoidScript,

    // Tile selection
    selectTile,
    deselectTile,
    toggleTileSelection,
    clearSelection,
    selectAllTiles,
    isTileSelected,

    // Shop
    prepareShopVisit,
    continueEndless,
    exitShop,
    purchaseItem,
    addDecree,
    canAddDecree,
    addImperialCharter,
    canAddImperialCharter,
    addFateSeal,
    addCelestialOrb,
    addVoidScript,
    addTileToWall,
    canAddConsumable,
    canRerollBossMandate,
    rerollBossMandate,
    canUseDeadWallWrit,
    useDeadWallWrit,

    // Utilities
    getAvailableActions,
    canPerformAction,
    isCompleteHand,
    previewScore,
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
