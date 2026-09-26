import type { ClassicRunSnapshot } from './ClassicRunSnapshot'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { choice, count, id, object, positive } from './snapshotValidation'

export const CLASSIC_SAVE_KEY = 'tensho-classic-run-v1'
export const CLASSIC_SAVE_LOCK = 'tensho-classic-run-write'
/** A bounded local record, not an unlimited archive of every Endless run. */
export const MAX_CLASSIC_SAVE_LENGTH = 2_000_000

export interface ClassicSavedRun {
  format: 1
  runId: string
  owner: string
  revision: number
  createdAt: number
  updatedAt: number
  snapshot: ClassicRunSnapshot
}
export type ClassicSaveRead =
  | { kind: 'empty'; raw: null }
  | { kind: 'ready'; raw: string; saved: ClassicSavedRun }
  | { kind: 'invalid'; raw: string }
  | { kind: 'unavailable' }
export type ClassicSaveFailure =
  | 'conflict'
  | 'invalid'
  | 'unavailable'
  | 'cancelled'
export type ClassicSaveResult =
  | { ok: true; raw: string; saved: ClassicSavedRun }
  | { ok: false; reason: ClassicSaveFailure }
export type ClassicSaveLease = Pick<
  ClassicSavedRun,
  'owner' | 'runId' | 'revision'
>
export type ExclusiveSave = <T>(operation: () => T) => Promise<T>

/** Reads are non-destructive, including unsupported versions and invalid JSON. */
export function parseClassicSavedRun(raw: string): ClassicSavedRun {
  if (raw.length > MAX_CLASSIC_SAVE_LENGTH)
    throw new Error('Classic save is too large')
  const value: unknown = JSON.parse(raw)
  object({
    format: choice([1]),
    runId: id,
    owner: id,
    revision: positive,
    createdAt: count,
    updatedAt: count,
    snapshot: (snapshot) => {
      parseClassicRunSnapshot(snapshot)
    },
  })(value, 'save')
  const saved = value as ClassicSavedRun
  if (saved.updatedAt < saved.createdAt)
    throw new Error('Invalid Classic save timestamps')
  return saved
}

interface SaveOptions {
  storage?: () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  exclusive?: ExclusiveSave
  token?: () => string
  now?: () => number
}

/**
 * One-key durable checkpoints. Every writer/claim takes the same origin-wide
 * Web Lock, then compares the exact observed revision. No unsafe unlocked
 * fallback: unsupported locking is reported as unavailable to the UI.
 * This does not make unrelated profile-store writes crash-atomic with the run.
 */
export class ClassicSaveRepository {
  private readonly storage: NonNullable<SaveOptions['storage']>
  private readonly exclusive: ExclusiveSave
  private readonly token: () => string
  private readonly now: () => number
  private generation = 0

  constructor(options: SaveOptions = {}) {
    this.storage = options.storage ?? (() => window.localStorage)
    this.exclusive =
      options.exclusive ??
      ((operation) => {
        if (!globalThis.navigator?.locks)
          return Promise.reject(new Error('Save locking unavailable'))
        return navigator.locks.request(
          CLASSIC_SAVE_LOCK,
          { mode: 'exclusive' },
          operation
        )
      })
    this.token = options.token ?? (() => crypto.randomUUID())
    this.now = options.now ?? (() => Date.now())
  }

  read(): ClassicSaveRead {
    let raw: string | null
    try {
      raw = this.storage().getItem(CLASSIC_SAVE_KEY)
    } catch {
      return { kind: 'unavailable' }
    }
    if (raw === null) return { kind: 'empty', raw }
    try {
      return { kind: 'ready', raw, saved: parseClassicSavedRun(raw) }
    } catch {
      return { kind: 'invalid', raw }
    }
  }

  /** Invalidate queued writes before an explicit progress reset or disposal. */
  cancelPending(): void {
    this.generation++
  }

  private async locked<T>(
    operation: () => T
  ): Promise<T | { ok: false; reason: 'cancelled' | 'unavailable' }> {
    const generation = this.generation
    try {
      return await this.exclusive(() =>
        generation === this.generation
          ? operation()
          : { ok: false as const, reason: 'cancelled' as const }
      )
    } catch {
      return { ok: false, reason: 'unavailable' }
    }
  }

  private write(saved: ClassicSavedRun): ClassicSaveResult {
    let raw: string
    try {
      raw = JSON.stringify(saved)
      parseClassicSavedRun(raw)
    } catch {
      return { ok: false, reason: 'invalid' }
    }
    // setItem is atomic for this key: quota/privacy failure leaves the previous
    // value intact. Never remove the previous record before trying this write.
    this.storage().setItem(CLASSIC_SAVE_KEY, raw)
    return { ok: true, raw, saved: structuredClone(saved) }
  }

  /** Explicit new-run/replacement intent. Even damaged records require the exact observation. */
  async replace(
    expectedRaw: string | null,
    snapshot: ClassicRunSnapshot
  ): Promise<ClassicSaveResult> {
    // Capture call-time data, not a mutable engine object that can change while
    // waiting for another tab's write lock.
    let detached: ClassicRunSnapshot
    try {
      detached = parseClassicRunSnapshot(snapshot)
    } catch {
      return { ok: false, reason: 'invalid' }
    }
    return this.locked(() => {
      if (this.storage().getItem(CLASSIC_SAVE_KEY) !== expectedRaw)
        return { ok: false, reason: 'conflict' }
      const timestamp = this.now()
      return this.write({
        format: 1,
        runId: this.token(),
        owner: this.token(),
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        snapshot: detached,
      })
    })
  }

  /** A user-approved Resume transfers the write lease; older tabs become read-only. */
  async claim(expectedRaw: string): Promise<ClassicSaveResult> {
    return this.locked(() => {
      const current = this.read()
      if (current.kind === 'unavailable')
        return { ok: false, reason: 'unavailable' }
      if (current.raw !== expectedRaw) return { ok: false, reason: 'conflict' }
      if (current.kind !== 'ready') return { ok: false, reason: 'invalid' }
      return this.write({
        ...current.saved,
        owner: this.token(),
        revision: current.saved.revision + 1,
        updatedAt: Math.max(current.saved.updatedAt, this.now()),
      })
    })
  }

  /** Only the owner of this precise checkpoint may replace it with a later one. */
  async save(
    lease: ClassicSaveLease,
    snapshot: ClassicRunSnapshot
  ): Promise<ClassicSaveResult> {
    let detached: ClassicRunSnapshot
    try {
      detached = parseClassicRunSnapshot(snapshot)
    } catch {
      return { ok: false, reason: 'invalid' }
    }
    const expected = { ...lease }
    return this.locked(() => {
      const current = this.read()
      if (current.kind === 'unavailable')
        return { ok: false, reason: 'unavailable' }
      if (
        current.kind !== 'ready' ||
        current.saved.owner !== expected.owner ||
        current.saved.runId !== expected.runId ||
        current.saved.revision !== expected.revision
      )
        return { ok: false, reason: 'conflict' }
      return this.write({
        ...current.saved,
        snapshot: detached,
        revision: current.saved.revision + 1,
        updatedAt: Math.max(current.saved.updatedAt, this.now()),
      })
    })
  }

  /** Only after confirmation. A foreign update between the prompt and click is retained. */
  async clear(
    expectedRaw: string
  ): Promise<{ ok: true } | { ok: false; reason: ClassicSaveFailure }> {
    return this.locked(() => {
      if (this.storage().getItem(CLASSIC_SAVE_KEY) !== expectedRaw)
        return { ok: false, reason: 'conflict' }
      this.storage().removeItem(CLASSIC_SAVE_KEY)
      return { ok: true }
    })
  }
}
