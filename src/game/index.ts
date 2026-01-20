/**
 * Game Layer - Central exports for game orchestration
 *
 * This module provides the game loop, action processing, and event handling.
 */

// Event Bus
export {
  EventBus,
  ScopedEventBus,
  eventBus,
  createEventSubscription,
  waitForEvent,
  emitSequence,
} from './EventBus'
export type { GameEvent, GameEventData, EventCallback } from './EventBus'

// Action Processor
export {
  ActionProcessor,
  createActionProcessor,
} from './ActionProcessor'
export type {
  PlayerAction,
  DrawAction,
  DiscardAction,
  PlayAction,
  RedrawAction,
  UseSealAction,
  UseScriptAction,
  SkipAction,
  Effect,
  BaseEffect,
  TileAddedEffect,
  TileRemovedEffect,
  ScoreAddedEffect,
  GoldChangedEffect,
  BonusTileDrawnEffect,
  RoundStateChangedEffect,
  YakuDetectedEffect,
  ValidationResult,
  ActionResult,
  GameStateSnapshot,
  MandateRestrictions,
} from './ActionProcessor'

// Game Orchestrator
export {
  GameOrchestrator,
  gameOrchestrator,
} from './GameOrchestrator'
export type { OrchestratorState } from './GameOrchestrator'

// React Hooks
export {
  useGameController,
  useGameEvent,
  useGameEvents,
} from './useGameController'
export type { GameController } from './useGameController'
