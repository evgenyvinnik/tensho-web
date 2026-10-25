import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NATIVE_STORAGE_BACKUP_KEY,
  NATIVE_STORAGE_MARKER,
  restoreNativeStorage,
  snapshotStorage,
  startNativeStorageBackup,
} from './nativeStorageBackup'

// The shared setup's localStorage is a no-op; these tests need one that keeps.
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    clear: () => data.clear(),
  }
}

function preferences(backup: string | null = null) {
  return {
    get: vi.fn(async () => ({ value: backup })),
    set: vi.fn(async () => {}),
  }
}

let localStorage: Storage
beforeEach(() => {
  localStorage = memoryStorage()
})
afterEach(() => vi.useRealTimers())

describe('restoreNativeStorage', () => {
  it('leaves marked storage alone without reading the backup', async () => {
    const native = preferences('{"tensho-settings":"old"}')
    localStorage.setItem('tensho-settings', 'current')
    expect(await restoreNativeStorage(localStorage, native, false)).toBe(false)
    expect(native.get).not.toHaveBeenCalled()
    expect(localStorage.getItem('tensho-settings')).toBe('current')
  })

  it('marks a fresh install that has nothing to restore', async () => {
    expect(await restoreNativeStorage(localStorage, preferences(), true)).toBe(
      false
    )
    expect(localStorage.getItem(NATIVE_STORAGE_MARKER)).toBe('1')
  })

  it('writes back storage the OS cleared, dropping startup defaults', async () => {
    const backup = JSON.stringify({
      'tensho-progression': '{"state":{"runs":12}}',
      [NATIVE_STORAGE_MARKER]: '1',
    })
    localStorage.setItem('tensho-settings', 'default written at startup')
    expect(
      await restoreNativeStorage(localStorage, preferences(backup), true)
    ).toBe(true)
    expect(localStorage.getItem('tensho-progression')).toBe(
      '{"state":{"runs":12}}'
    )
    expect(localStorage.getItem('tensho-settings')).toBeNull()
    expect(localStorage.getItem(NATIVE_STORAGE_MARKER)).toBe('1')
  })
})

describe('startNativeStorageBackup', () => {
  it('mirrors storage at once and again only after it changes', () => {
    vi.useFakeTimers()
    const native = preferences()
    localStorage.setItem('b', '2')
    localStorage.setItem('a', '1')
    const stop = startNativeStorageBackup(localStorage, native, 1000)
    expect(native.set).toHaveBeenCalledExactlyOnceWith({
      key: NATIVE_STORAGE_BACKUP_KEY,
      value: '{"a":"1","b":"2"}',
    })
    vi.advanceTimersByTime(1000)
    expect(native.set).toHaveBeenCalledTimes(1)
    localStorage.setItem('a', '3')
    vi.advanceTimersByTime(1000)
    expect(native.set).toHaveBeenLastCalledWith({
      key: NATIVE_STORAGE_BACKUP_KEY,
      value: snapshotStorage(localStorage),
    })
    stop()
    localStorage.setItem('a', '4')
    vi.advanceTimersByTime(1000)
    expect(native.set).toHaveBeenCalledTimes(2)
  })

  it('mirrors when the app leaves the foreground', () => {
    const native = preferences()
    const stop = startNativeStorageBackup(localStorage, native, 60_000)
    localStorage.setItem('tensho-archive', 'checkpoint')
    window.dispatchEvent(new Event('pagehide'))
    expect(native.set).toHaveBeenCalledTimes(2)
    stop()
  })

  it('retries a write that failed', async () => {
    vi.useFakeTimers()
    const native = preferences()
    native.set.mockRejectedValueOnce(new Error('disk full'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const stop = startNativeStorageBackup(localStorage, native, 1000)
    await vi.advanceTimersByTimeAsync(1000)
    expect(native.set).toHaveBeenCalledTimes(2)
    stop()
  })
})
