import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import {
  CLASSIC_SAVE_KEY,
  MAX_CLASSIC_SAVE_LENGTH,
  ClassicSaveRepository,
  parseClassicSavedRun,
  type ExclusiveSave,
  type ClassicSaveResult,
} from './classicSavedRun'

function snapshot() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  return game.captureRun()
}
function successful(result: ClassicSaveResult) {
  if (!result.ok) throw new Error(`Save failed: ${result.reason}`)
  return result
}
function fixture(
  initial: string | null = null,
  exclusiveOverride?: ExclusiveSave
) {
  const data = new Map<string, string>([
    ['unrelated-project-data', 'untouched'],
  ])
  if (initial !== null) data.set(CLASSIC_SAVE_KEY, initial)
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key)
    }),
  }
  let tail = Promise.resolve()
  const exclusive: ExclusiveSave =
    exclusiveOverride ??
    ((operation) => {
      const result = tail.then(operation)
      tail = result.then(
        () => undefined,
        () => undefined
      )
      return result
    })
  let token = 0
  const now = vi.fn(() => 1_000)
  const make = () =>
    new ClassicSaveRepository({
      storage: () => storage,
      exclusive,
      token: () => `test-token-${++token}`,
      now,
    })
  return { data, storage, now, make, repository: make() }
}
afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
  vi.restoreAllMocks()
})

it('stores and parses the complete authoritative checkpoint in one key', async () => {
  const f = fixture()
  expect(f.repository.read()).toEqual({ kind: 'empty', raw: null })
  const saved = snapshot()
  const result = successful(await f.repository.replace(null, saved))
  expect(result.saved.revision).toBe(1)
  expect(parseClassicSavedRun(result.raw).snapshot).toEqual(
    JSON.parse(JSON.stringify(saved))
  )
  expect(f.repository.read()).toEqual({
    kind: 'ready',
    raw: result.raw,
    saved: JSON.parse(result.raw),
  })
  expect(f.data.get('unrelated-project-data')).toBe('untouched')
})

it.each([
  '{broken',
  '{}',
  'null',
  '{"format":99}',
  'x'.repeat(MAX_CLASSIC_SAVE_LENGTH + 1),
])('retains invalid or unsupported data on read (%#)', (raw) => {
  const f = fixture(raw)
  expect(f.repository.read()).toEqual({ kind: 'invalid', raw })
  expect(f.storage.setItem).not.toHaveBeenCalled()
  expect(f.storage.removeItem).not.toHaveBeenCalled()
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe(raw)
})

it('requires explicit exact-record replacement even for a corrupt save', async () => {
  const f = fixture('damaged')
  expect(await f.repository.replace(null, snapshot())).toEqual({
    ok: false,
    reason: 'conflict',
  })
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe('damaged')
  expect((await f.repository.replace('damaged', snapshot())).ok).toBe(true)
})

it('keeps the prior checkpoint after quota, read-access or deletion failure', async () => {
  const f = fixture()
  const first = successful(await f.repository.replace(null, snapshot()))
  f.storage.setItem.mockImplementationOnce(() => {
    throw new DOMException('Quota exceeded', 'QuotaExceededError')
  })
  expect(await f.repository.save(first.saved, snapshot())).toEqual({
    ok: false,
    reason: 'unavailable',
  })
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe(first.raw)
  f.storage.getItem.mockImplementationOnce(() => {
    throw new DOMException('Denied', 'SecurityError')
  })
  expect(f.repository.read()).toEqual({ kind: 'unavailable' })
  f.storage.removeItem.mockImplementationOnce(() => {
    throw new DOMException('Denied', 'SecurityError')
  })
  expect(await f.repository.clear(first.raw)).toEqual({
    ok: false,
    reason: 'unavailable',
  })
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe(first.raw)
})

it('reports unavailable storage getters and lock support without falling back to an unlocked write', async () => {
  const unavailable = new ClassicSaveRepository({
    storage: () => {
      throw new Error('No access')
    },
    exclusive: async (operation) => operation(),
  })
  expect(unavailable.read()).toEqual({ kind: 'unavailable' })
  expect(await unavailable.replace(null, snapshot())).toEqual({
    ok: false,
    reason: 'unavailable',
  })
  const f = fixture(null, () => Promise.reject(new Error('No locks')))
  expect(await f.repository.replace(null, snapshot())).toEqual({
    ok: false,
    reason: 'unavailable',
  })
  expect(f.storage.setItem).not.toHaveBeenCalled()
})

it('a resumed tab acquires the lease and prevents the previous tab from overwriting it', async () => {
  const f = fixture()
  const firstTab = f.repository
  const secondTab = f.make()
  const first = successful(await firstTab.replace(null, snapshot()))
  const claimed = successful(await secondTab.claim(first.raw))
  expect(claimed.saved.runId).toBe(first.saved.runId)
  expect(claimed.saved.owner).not.toBe(first.saved.owner)
  expect(claimed.saved.revision).toBe(2)
  expect(await firstTab.save(first.saved, snapshot())).toEqual({
    ok: false,
    reason: 'conflict',
  })
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe(claimed.raw)
  const next = successful(await secondTab.save(claimed.saved, snapshot()))
  expect(next.saved.revision).toBe(3)
  expect(await firstTab.clear(first.raw)).toEqual({
    ok: false,
    reason: 'conflict',
  })
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe(next.raw)
})

it('serializes concurrent new-run attempts; only one replaces the observed record', async () => {
  const f = fixture()
  const saved = snapshot()
  const [a, b] = await Promise.all([
    f.repository.replace(null, saved),
    f.make().replace(null, saved),
  ])
  expect(a.ok).toBe(true)
  expect(b).toEqual({ ok: false, reason: 'conflict' })
  expect(f.storage.setItem).toHaveBeenCalledOnce()
})

it('serializes simultaneous updates with the same revision instead of silently losing one', async () => {
  const f = fixture()
  const saved = snapshot()
  const first = successful(await f.repository.replace(null, saved))
  const [a, b] = await Promise.all([
    f.repository.save(first.saved, saved),
    f.make().save(first.saved, saved),
  ])
  expect(a.ok).toBe(true)
  expect(b).toEqual({ ok: false, reason: 'conflict' })
})

it('does not let an old Resume prompt claim newer progress', async () => {
  const f = fixture()
  const first = successful(await f.repository.replace(null, snapshot()))
  const next = successful(await f.repository.save(first.saved, snapshot()))
  expect(await f.make().claim(first.raw)).toEqual({
    ok: false,
    reason: 'conflict',
  })
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe(next.raw)
})

it('rejects malformed updates before requesting the storage write', async () => {
  const f = fixture()
  const saved = snapshot()
  const first = successful(await f.repository.replace(null, saved))
  saved.state.handsRemaining = -1
  expect(await f.repository.save(first.saved, saved)).toEqual({
    ok: false,
    reason: 'invalid',
  })
  expect(await f.repository.replace(first.raw, saved)).toEqual({
    ok: false,
    reason: 'invalid',
  })
  expect(f.data.get(CLASSIC_SAVE_KEY)).toBe(first.raw)
  expect(f.storage.setItem).toHaveBeenCalledOnce()
})

it('captures call-time snapshot data while waiting for the lock', async () => {
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  const f = fixture(null, async (operation) => {
    await wait
    return operation()
  })
  const saved = snapshot()
  const gold = saved.state.gold
  const pending = f.repository.replace(null, saved)
  saved.state.gold += 100
  release()
  const result = successful(await pending)
  expect(result.saved.snapshot.state.gold).toBe(gold)
})

it('cancels queued writes before reset/disposal so they cannot resurrect removed progress', async () => {
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  const f = fixture(null, async (operation) => {
    await wait
    return operation()
  })
  const pending = f.repository.replace(null, snapshot())
  f.repository.cancelPending()
  release()
  expect(await pending).toEqual({ ok: false, reason: 'cancelled' })
  expect(f.storage.setItem).not.toHaveBeenCalled()
  expect(f.repository.read()).toEqual({ kind: 'empty', raw: null })
})

it('retains monotonic timestamps if the system clock moves backward', async () => {
  const f = fixture()
  const first = successful(await f.repository.replace(null, snapshot()))
  f.now.mockReturnValue(900)
  const next = successful(await f.repository.save(first.saved, snapshot()))
  expect(next.saved.updatedAt).toBe(1_000)
  expect(() => parseClassicSavedRun(next.raw)).not.toThrow()
})

it('clears only the confirmed Classic record and leaves other origin data alone', async () => {
  const f = fixture()
  const saved = successful(await f.repository.replace(null, snapshot()))
  expect(await f.repository.clear(saved.raw)).toEqual({ ok: true })
  expect(f.repository.read()).toEqual({ kind: 'empty', raw: null })
  expect(f.data.get('unrelated-project-data')).toBe('untouched')
})
