import type { GameOrchestrator } from './GameOrchestrator'
import { eventBus, type GameEvent } from './EventBus'
import { restoreMetaProgressionRunContext } from './RunMetaContext'
import {
  ClassicSaveRepository,
  type ClassicSaveRead,
  type ClassicSaveLease,
  type ClassicSaveFailure,
  type ClassicSaveResult,
} from './classicSavedRun'

export interface ClassicPersistenceState {
  disk: ClassicSaveRead
  status: 'idle' | 'saving' | 'saved' | ClassicSaveFailure
  unsaved: boolean
  ownershipLost: boolean
}

// Checkpoint after domain notifications, including shop transactions, have
// finished. No periodic timer and no snapshot inside a hand's scoring events.
const CHECKPOINT_EVENTS: GameEvent[] = [
  'roundStart',
  'roundEnd',
  'roundSkipped',
  'handPlayed',
  'scoreUpdate',
  'goldChanged',
  'itemPurchased',
  'itemSold',
  'decreeAcquired',
  'buildProgressChanged',
  'flowerCollected',
  'seasonActivated',
  'seasonCorrupted',
  'charterRedeemed',
  'packOpened',
  'consumableAcquired',
  'fateSealUsed',
  'celestialOrbUsed',
  'voidScriptUsed',
  'shopUpdated',
  'shopExited',
  'phaseChanged',
  'tileDrawn',
  'tileDiscarded',
  'tileSelected',
  'tileDeselected',
  'tileModified',
  'tileShattered',
  'markDecayed',
  'consumableCreated',
  'mandateActivated',
  'mandateDefeated',
  'runEnd',
  'gameOver',
]

/**
 * Application persistence coordinator. Construct once for the application
 * engine, not once per routed screen. Constructing/refreshing never loads a
 * run or overwrites a record; those require explicit resume/new-run intent.
 */
export class ClassicRunPersistence {
  private state: ClassicPersistenceState
  private readonly listeners = new Set<() => void>()
  private readonly unsubscribers: (() => void)[]
  private lease: ClassicSaveLease | null = null
  private lastSnapshot = ''
  private dirty = false
  private queued = false
  private running: Promise<void> | null = null
  private epoch = 0
  private controlling = false
  private disposed = false
  private replacementIntent: { expectedRaw: string | null } | null = null

  constructor(
    private readonly game: GameOrchestrator,
    private readonly repository = new ClassicSaveRepository(),
    private readonly refreshProfile: () => void = () => {}
  ) {
    this.state = {
      disk: repository.read(),
      status: 'idle',
      unsaved: false,
      ownershipLost: false,
    }
    this.unsubscribers = CHECKPOINT_EVENTS.map((event) =>
      eventBus.on(event, () => this.changed())
    )
    this.unsubscribers.push(
      eventBus.on('runStart', () => {
        // Starting a different run cannot reuse the preceding run's write lease.
        this.invalidate()
        this.lease = null
        this.replacementIntent = null
        this.dirty = true
        this.update({ status: 'idle', unsaved: true, ownershipLost: false })
      })
    )
  }

  getSnapshot = (): ClassicPersistenceState => this.state
  /** Refresh cross-tab profile caches before an explicitly requested run transition. */
  prepareProfile(): boolean {
    try {
      this.refreshProfile()
      return true
    } catch {
      this.update({ status: 'unavailable' })
      return false
    }
  }
  get hasLocalRun(): boolean {
    return this.game.getState().phase !== 'menu' && !this.state.ownershipLost
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  private update(patch: Partial<ClassicPersistenceState>): void {
    // A transient read/claim failure must not unpause an obsolete table.
    // Only a successful claim/replacement or explicit reset restores ownership.
    if (patch.status === 'conflict') patch.ownershipLost = true
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((listener) => listener())
  }
  private invalidate(): void {
    this.epoch++
    this.repository.cancelPending()
  }

  /** Called on a storage event or menu entry; a foreign write revokes our lease. */
  refresh(): void {
    const disk = this.repository.read()
    // An unreadable store is not evidence that another tab took ownership.
    // Retain the lease so a later Retry can still save against its exact revision.
    if (disk.kind === 'unavailable') {
      this.update({ disk, status: 'unavailable' })
      return
    }
    const foreign =
      this.lease &&
      (disk.kind !== 'ready' ||
        disk.saved.owner !== this.lease.owner ||
        disk.saved.runId !== this.lease.runId ||
        disk.saved.revision !== this.lease.revision)
    if (foreign) {
      this.invalidate()
      this.lease = null
    }
    this.update({
      disk,
      ...(foreign ? { status: 'conflict' as const, unsaved: true } : {}),
    })
  }

  private changed(): void {
    if (this.disposed || this.game.getState().phase === 'menu') return
    this.dirty = true
    this.update({ unsaved: true })
    if (this.controlling || !this.lease || this.queued) return
    this.queued = true
    queueMicrotask(() => {
      this.queued = false
      if (!this.disposed && !this.controlling) void this.flush()
    })
  }

  private finishControl(): void {
    this.controlling = false
    if (this.dirty && this.lease && !this.disposed) this.changed()
  }

  /** Also used before route changes/visibility loss, and by an explicit Retry. */
  async flush(): Promise<void> {
    if (this.disposed || this.controlling || !this.lease) return
    // Selection-only APIs without events are captured by an explicit flush too.
    this.dirty = true
    if (this.running) return this.running
    const epoch = this.epoch
    const operation = this.pump(epoch)
    this.running = operation
    try {
      await operation
    } finally {
      if (this.running === operation) this.running = null
    }
  }

  private async pump(epoch: number): Promise<void> {
    while (
      this.dirty &&
      this.lease &&
      !this.disposed &&
      !this.controlling &&
      epoch === this.epoch
    ) {
      if (this.game.getState().phase === 'menu') return
      this.dirty = false
      let snapshot
      let serialized: string
      try {
        snapshot = this.game.captureRun()
        serialized = JSON.stringify(snapshot)
      } catch {
        this.dirty = true
        this.update({ status: 'invalid', unsaved: true })
        return
      }
      if (serialized === this.lastSnapshot) {
        this.update({ status: 'saved', unsaved: false })
        return
      }
      this.update({ status: 'saving', unsaved: true })
      const result = await this.repository.save(this.lease, snapshot)
      if (epoch !== this.epoch || this.disposed) return
      if (!result.ok) {
        this.dirty = true
        if (result.reason === 'conflict') this.lease = null
        this.update({
          status: result.reason,
          unsaved: true,
          disk: this.repository.read(),
        })
        return
      }
      this.accept(result, serialized)
    }
  }

  private accept(
    result: Extract<ClassicSaveResult, { ok: true }>,
    serialized = JSON.stringify(result.saved.snapshot)
  ): void {
    this.lease = {
      owner: result.saved.owner,
      runId: result.saved.runId,
      revision: result.saved.revision,
    }
    this.lastSnapshot = serialized
    this.update({
      disk: { kind: 'ready', raw: result.raw, saved: result.saved },
      status: this.dirty ? 'saving' : 'saved',
      unsaved: this.dirty,
      ownershipLost: false,
    })
  }

  /** Call only after an explicitly requested new run has finished starting. */
  async saveNewRun(expectedRaw: string | null): Promise<boolean> {
    if (this.disposed || this.controlling) return false
    this.controlling = true
    this.replacementIntent = { expectedRaw }
    this.invalidate()
    const epoch = this.epoch
    this.lease = null
    this.dirty = false
    this.update({ status: 'saving', unsaved: true })
    try {
      const snapshot = this.game.captureRun()
      const result = await this.repository.replace(expectedRaw, snapshot)
      if (epoch !== this.epoch || this.disposed) return false
      if (!result.ok) {
        this.dirty = true
        this.update({
          status: result.reason,
          unsaved: true,
          disk: this.repository.read(),
        })
        return false
      }
      this.accept(result)
      this.replacementIntent = null
      return true
    } catch {
      this.dirty = true
      this.update({ status: 'invalid', unsaved: true })
      return false
    } finally {
      this.finishControl()
    }
  }

  /** Retry the original replacement intent, never permission to overwrite a newer record. */
  async retrySave(): Promise<boolean> {
    if (this.replacementIntent)
      return this.saveNewRun(this.replacementIntent.expectedRaw)
    await this.flush()
    return this.state.status === 'saved' && !this.state.unsaved
  }

  /** Resume stages the engine once; it never replays a domain action or award. */
  async resume(expectedRaw: string): Promise<boolean> {
    if (this.disposed || this.controlling) return false
    this.controlling = true
    this.replacementIntent = null
    this.invalidate()
    this.lease = null
    const epoch = this.epoch
    this.update({ status: 'saving' })
    try {
      const result = await this.repository.claim(expectedRaw)
      if (epoch !== this.epoch || this.disposed) return false
      if (!result.ok) {
        this.update({ status: result.reason, disk: this.repository.read() })
        return false
      }
      if (!this.prepareProfile()) {
        this.update({ ownershipLost: true, disk: this.repository.read() })
        return false
      }
      this.game.restoreRun(result.saved.snapshot)
      this.dirty = false
      this.accept(result, JSON.stringify(this.game.captureRun()))
      return true
    } catch {
      this.lease = null
      this.update({ status: 'invalid', disk: this.repository.read() })
      return false
    } finally {
      this.finishControl()
    }
  }

  /** Explicit abandon/delete only. A failed delete preserves the live run. */
  async discard(expectedRaw: string): Promise<boolean> {
    if (this.disposed || this.controlling) return false
    this.controlling = true
    this.invalidate()
    const epoch = this.epoch
    try {
      const result = await this.repository.clear(expectedRaw)
      if (epoch !== this.epoch || this.disposed) return false
      if (!result.ok) {
        this.update({ status: result.reason, disk: this.repository.read() })
        return false
      }
      this.lease = null
      this.dirty = false
      this.lastSnapshot = ''
      this.replacementIntent = null
      this.game.resetGame()
      restoreMetaProgressionRunContext(null)
      this.update({
        disk: { kind: 'empty', raw: null },
        status: 'idle',
        unsaved: false,
        ownershipLost: false,
      })
      return true
    } finally {
      this.finishControl()
    }
  }

  /** Reset All Progress calls this only after its durable removals succeeded. */
  forgetAfterReset(): void {
    this.invalidate()
    this.lease = null
    this.dirty = false
    this.lastSnapshot = ''
    this.replacementIntent = null
    this.update({
      disk: this.repository.read(),
      status: 'idle',
      unsaved: false,
      ownershipLost: false,
    })
  }

  dispose(): void {
    this.disposed = true
    this.invalidate()
    this.unsubscribers.forEach((stop) => stop())
    this.listeners.clear()
  }
}
