import type { PreferencesPlugin } from '@capacitor/preferences'

/**
 * iOS may clear a WebView's localStorage when the device runs low on space.
 * The iOS app mirrors all of it into Preferences (UserDefaults), which lasts
 * until the app is deleted, and writes it back before the game reads a save.
 */
export const NATIVE_STORAGE_BACKUP_KEY = 'tensho-local-storage'
/** Lives in localStorage; resetting progress removes named keys, never this. */
export const NATIVE_STORAGE_MARKER = 'tensho-native-storage'
export const NATIVE_STORAGE_BACKUP_INTERVAL_MS = 15_000

/** Every entry, in key order, so an unchanged storage serializes identically. */
export function snapshotStorage(storage: Storage): string {
  const entries: [string, string][] = []
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    const value = key === null ? null : storage.getItem(key)
    if (key !== null && value !== null) entries.push([key, value])
  }
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return JSON.stringify(Object.fromEntries(entries))
}

/**
 * `unmarked` is read before any store touches storage: a missing marker
 * means a fresh install or storage the OS cleared. True when the backup was
 * written back, and the page must reload so every store hydrates from it.
 */
export async function restoreNativeStorage(
  storage: Storage,
  preferences: Pick<PreferencesPlugin, 'get'>,
  unmarked: boolean
): Promise<boolean> {
  if (!unmarked) return false
  const { value } = await preferences.get({ key: NATIVE_STORAGE_BACKUP_KEY })
  if (value === null) {
    storage.setItem(NATIVE_STORAGE_MARKER, '1')
    return false
  }
  const entries = JSON.parse(value) as Record<string, string>
  // Startup may already have written defaults into the empty storage.
  storage.clear()
  for (const [key, item] of Object.entries(entries)) storage.setItem(key, item)
  storage.setItem(NATIVE_STORAGE_MARKER, '1')
  return true
}

/** Mirrors storage now, on an interval and on backgrounding. Returns a stop. */
export function startNativeStorageBackup(
  storage: Storage,
  preferences: Pick<PreferencesPlugin, 'set'>,
  intervalMs = NATIVE_STORAGE_BACKUP_INTERVAL_MS
): () => void {
  let mirrored: string | null = null
  const backup = () => {
    const value = snapshotStorage(storage)
    if (value === mirrored) return
    mirrored = value
    preferences
      .set({ key: NATIVE_STORAGE_BACKUP_KEY, value })
      .catch((error: unknown) => {
        if (mirrored === value) mirrored = null
        console.warn('Native save backup failed', error)
      })
  }
  const hidden = () => {
    if (document.visibilityState === 'hidden') backup()
  }
  backup()
  const timer = window.setInterval(backup, intervalMs)
  document.addEventListener('visibilitychange', hidden)
  window.addEventListener('pagehide', backup)
  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', hidden)
    window.removeEventListener('pagehide', backup)
  }
}
