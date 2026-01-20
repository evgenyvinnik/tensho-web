/**
 * Event Bus for Tensho Mahjong Roguelike
 *
 * Provides a decoupled event system for communication between
 * game systems, components, and the orchestrator.
 *
 * Features:
 * - Type-safe event subscription and emission
 * - One-time event listeners
 * - Automatic cleanup helpers
 * - Event history for debugging
 */

// =============================================================================
// EVENT TYPES
// =============================================================================

/**
 * All game events that can be emitted
 */
export type GameEvent =
  // Game lifecycle
  | 'gameInitialized'
  | 'runStart'
  | 'runEnd'
  | 'gameOver'

  // Round/Act flow
  | 'actStart'
  | 'actComplete'
  | 'roundStart'
  | 'roundEnd'
  | 'roundSkipped'

  // Scoring
  | 'handPlayed'
  | 'scoreUpdate'
  | 'yakuScored'
  | 'yakumanScored'

  // Economy
  | 'goldChanged'
  | 'interestEarned'
  | 'itemPurchased'
  | 'itemSold'

  // Items
  | 'decreeAcquired'
  | 'decreeTriggered'
  | 'decreeDebuffed'
  | 'flowerCollected'
  | 'seasonActivated'
  | 'seasonCorrupted'
  | 'charterRedeemed'

  // Consumables
  | 'fateSealUsed'
  | 'celestialOrbUsed'
  | 'voidScriptUsed'

  // Shop
  | 'shopEntered'
  | 'shopRerolled'
  | 'shopExited'

  // Meta
  | 'achievementUnlocked'
  | 'itemDiscovered'
  | 'stakeUnlocked'

  // Save/Load
  | 'gameSaved'
  | 'gameLoaded'
  | 'autoSaveTriggered'

  // UI Events
  | 'phaseChanged'
  | 'screenTransition'

  // Tile Events
  | 'tileDrawn'
  | 'tileDiscarded'
  | 'tileSelected'
  | 'tileDeselected'
  | 'bonusTileDrawn'

  // Mandate Events
  | 'mandateActivated'
  | 'mandateDefeated'

  // Error/Debug
  | 'error'
  | 'debug'

/**
 * Event data types for type-safe event handling
 */
export interface GameEventData {
  // Game lifecycle
  gameInitialized: { timestamp: number }
  runStart: { seed: number; stake: number; wallVariant: string }
  runEnd: { victory: boolean; score: number; act: number; round: number }
  gameOver: { reason: 'victory' | 'defeat' | 'quit'; finalScore: number }

  // Round/Act flow
  actStart: { actNumber: number; baseTarget: number }
  actComplete: { actNumber: number; totalScore: number }
  roundStart: { actNumber: number; roundNumber: number; roundType: string; target: number }
  roundEnd: { won: boolean; score: number; target: number }
  roundSkipped: { roundType: string; omenTagGranted?: string }

  // Scoring
  handPlayed: { tiles: string[]; score: number; yakuIds: string[] }
  scoreUpdate: { previousScore: number; newScore: number; delta: number }
  yakuScored: { yakuId: string; yakuName: string; multiplier: number }
  yakumanScored: { yakuId: string; yakuName: string }

  // Economy
  goldChanged: { previousGold: number; newGold: number; delta: number; reason: string }
  interestEarned: { amount: number; goldHeld: number }
  itemPurchased: { itemType: string; itemId: string; cost: number }
  itemSold: { itemType: string; itemId: string; value: number }

  // Items
  decreeAcquired: { decreeId: string; decreeName: string; rarity: string }
  decreeTriggered: { decreeId: string; effect: string }
  decreeDebuffed: { decreeId: string; reason: string }
  flowerCollected: { flowerType: string; totalFlowers: number }
  seasonActivated: { seasonType: string; effect: string }
  seasonCorrupted: { corruptedType: string; effect: string }
  charterRedeemed: { charterId: string; charterName: string }

  // Consumables
  fateSealUsed: { sealId: string; effect: string }
  celestialOrbUsed: { orbId: string; yakuCategory: string; newLevel: number }
  voidScriptUsed: { scriptId: string; effect: string; downside: string }

  // Shop
  shopEntered: { isAfterBoss: boolean; gold: number }
  shopRerolled: { cost: number; newRerollCost: number }
  shopExited: { goldSpent: number; itemsPurchased: number }

  // Meta
  achievementUnlocked: { achievementId: string; achievementName: string }
  itemDiscovered: { itemType: string; itemId: string }
  stakeUnlocked: { stakeLevel: number; stakeName: string }

  // Save/Load
  gameSaved: { timestamp: number; slotId?: string }
  gameLoaded: { timestamp: number; slotId?: string }
  autoSaveTriggered: { timestamp: number }

  // UI Events
  phaseChanged: { previousPhase: string; newPhase: string }
  screenTransition: { from: string; to: string }

  // Tile Events
  tileDrawn: { tileId: string; tilesRemaining: number }
  tileDiscarded: { tileId: string; toDeadPool: boolean }
  tileSelected: { tileId: string; selectedCount: number }
  tileDeselected: { tileId: string; selectedCount: number }
  bonusTileDrawn: { tileId: string; tileType: 'flower' | 'season'; replacementDrawn: boolean }

  // Mandate Events
  mandateActivated: { mandateId: string; mandateName: string; effect: string }
  mandateDefeated: { mandateId: string }

  // Error/Debug
  error: { code: string; message: string; context?: Record<string, unknown> }
  debug: { message: string; data?: Record<string, unknown> }
}

// =============================================================================
// EVENT CALLBACK TYPES
// =============================================================================

/**
 * Type-safe event callback
 */
export type EventCallback<T extends GameEvent> = (data: GameEventData[T]) => void

/**
 * Generic event callback for internal use
 */
type GenericCallback = (data: unknown) => void

/**
 * Listener entry with metadata
 */
interface ListenerEntry {
  callback: GenericCallback
  once: boolean
  id: number
}

// =============================================================================
// EVENT BUS CLASS
// =============================================================================

/**
 * Centralized event bus for game-wide communication
 */
export class EventBus {
  private listeners: Map<string, ListenerEntry[]> = new Map()
  private listenerId: number = 0
  private eventHistory: Array<{ event: GameEvent; data: unknown; timestamp: number }> = []
  private historyEnabled: boolean = false
  private historyMaxSize: number = 100

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  on<T extends GameEvent>(event: T, callback: EventCallback<T>): () => void {
    const id = ++this.listenerId
    const entry: ListenerEntry = {
      callback: callback as GenericCallback,
      once: false,
      id,
    }

    const existing = this.listeners.get(event) ?? []
    existing.push(entry)
    this.listeners.set(event, existing)

    // Return unsubscribe function
    return () => this.removeListener(event, id)
  }

  /**
   * Subscribe to an event for a single occurrence
   * @returns Unsubscribe function
   */
  once<T extends GameEvent>(event: T, callback: EventCallback<T>): () => void {
    const id = ++this.listenerId
    const entry: ListenerEntry = {
      callback: callback as GenericCallback,
      once: true,
      id,
    }

    const existing = this.listeners.get(event) ?? []
    existing.push(entry)
    this.listeners.set(event, existing)

    return () => this.removeListener(event, id)
  }

  /**
   * Unsubscribe from an event using the callback reference
   */
  off<T extends GameEvent>(event: T, callback: EventCallback<T>): void {
    const entries = this.listeners.get(event)
    if (!entries) return

    const filtered = entries.filter((entry) => entry.callback !== callback)
    if (filtered.length === 0) {
      this.listeners.delete(event)
    } else {
      this.listeners.set(event, filtered)
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T extends GameEvent>(event: T, data: GameEventData[T]): void {
    // Record in history if enabled
    if (this.historyEnabled) {
      this.eventHistory.push({
        event,
        data,
        timestamp: Date.now(),
      })

      // Trim history if too large
      if (this.eventHistory.length > this.historyMaxSize) {
        this.eventHistory.shift()
      }
    }

    const entries = this.listeners.get(event)
    if (!entries || entries.length === 0) return

    // Copy to avoid mutation during iteration
    const toCall = [...entries]

    // Remove one-time listeners
    const remaining = entries.filter((entry) => !entry.once)
    if (remaining.length === 0) {
      this.listeners.delete(event)
    } else {
      this.listeners.set(event, remaining)
    }

    // Call all callbacks
    for (const entry of toCall) {
      try {
        entry.callback(data)
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error)
      }
    }
  }

  /**
   * Remove a specific listener by ID
   */
  private removeListener(event: string, id: number): void {
    const entries = this.listeners.get(event)
    if (!entries) return

    const filtered = entries.filter((entry) => entry.id !== id)
    if (filtered.length === 0) {
      this.listeners.delete(event)
    } else {
      this.listeners.set(event, filtered)
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: GameEvent): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Clear all listeners and reset state
   */
  clear(): void {
    this.listeners.clear()
    this.eventHistory = []
    this.listenerId = 0
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: GameEvent): number {
    return this.listeners.get(event)?.length ?? 0
  }

  /**
   * Check if an event has any listeners
   */
  hasListeners(event: GameEvent): boolean {
    return this.listenerCount(event) > 0
  }

  /**
   * Enable event history for debugging
   */
  enableHistory(maxSize: number = 100): void {
    this.historyEnabled = true
    this.historyMaxSize = maxSize
  }

  /**
   * Disable event history
   */
  disableHistory(): void {
    this.historyEnabled = false
    this.eventHistory = []
  }

  /**
   * Get event history
   */
  getHistory(): Array<{ event: GameEvent; data: unknown; timestamp: number }> {
    return [...this.eventHistory]
  }

  /**
   * Get events of a specific type from history
   */
  getHistoryByEvent(event: GameEvent): Array<{ data: unknown; timestamp: number }> {
    return this.eventHistory
      .filter((entry) => entry.event === event)
      .map(({ data, timestamp }) => ({ data, timestamp }))
  }

  /**
   * Create a scoped event emitter for a specific system
   */
  createScope(prefix: string): ScopedEventBus {
    return new ScopedEventBus(this, prefix)
  }
}

// =============================================================================
// SCOPED EVENT BUS
// =============================================================================

/**
 * A scoped event bus that prefixes all debug logs with a system name
 */
export class ScopedEventBus {
  constructor(
    private parent: EventBus,
    private scope: string
  ) {}

  on<T extends GameEvent>(event: T, callback: EventCallback<T>): () => void {
    return this.parent.on(event, callback)
  }

  once<T extends GameEvent>(event: T, callback: EventCallback<T>): () => void {
    return this.parent.once(event, callback)
  }

  off<T extends GameEvent>(event: T, callback: EventCallback<T>): void {
    this.parent.off(event, callback)
  }

  emit<T extends GameEvent>(event: T, data: GameEventData[T]): void {
    this.parent.emit(event, data)
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.parent.emit('debug', {
      message: `[${this.scope}] ${message}`,
      data,
    })
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global event bus instance
 */
export const eventBus = new EventBus()

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a subscription that automatically cleans up on component unmount
 * Useful for React components
 */
export function createEventSubscription(): {
  subscribe: <T extends GameEvent>(event: T, callback: EventCallback<T>) => void
  unsubscribeAll: () => void
} {
  const unsubscribers: Array<() => void> = []

  return {
    subscribe: <T extends GameEvent>(event: T, callback: EventCallback<T>) => {
      const unsubscribe = eventBus.on(event, callback)
      unsubscribers.push(unsubscribe)
    },
    unsubscribeAll: () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe()
      }
      unsubscribers.length = 0
    },
  }
}

/**
 * Wait for a specific event to occur (Promise-based)
 */
export function waitForEvent<T extends GameEvent>(
  event: T,
  timeout?: number
): Promise<GameEventData[T]> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const unsubscribe = eventBus.once(event, (data) => {
      if (timeoutId) clearTimeout(timeoutId)
      resolve(data)
    })

    if (timeout) {
      timeoutId = setTimeout(() => {
        unsubscribe()
        reject(new Error(`Timeout waiting for event: ${event}`))
      }, timeout)
    }
  })
}

/**
 * Emit multiple events in sequence
 */
export function emitSequence(
  events: Array<{ event: GameEvent; data: GameEventData[GameEvent] }>
): void {
  for (const { event, data } of events) {
    eventBus.emit(event, data as GameEventData[typeof event])
  }
}
