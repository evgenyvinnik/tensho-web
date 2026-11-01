import {
  NATIVE_STORAGE_MARKER,
  restoreNativeStorage,
  startNativeStorageBackup,
} from './nativeStorageBackup'

/** The iOS app's web layer (`vite build --mode native`), never the website. */
export const IS_NATIVE_APP = import.meta.env.MODE === 'native'

// main.tsx imports this module first, so no store has written yet.
const unmarked =
  IS_NATIVE_APP && window.localStorage.getItem(NATIVE_STORAGE_MARKER) === null

async function prepareNativeStorage(): Promise<void> {
  // Loaded only in the app; the website bundle never includes Capacitor.
  const { Preferences } = await import('@capacitor/preferences')
  const storage = window.localStorage
  if (await restoreNativeStorage(storage, Preferences, unmarked)) {
    window.location.reload()
    // Never render the empty profile that is about to be replaced.
    return new Promise<void>(() => {})
  }
  startNativeStorageBackup(storage, Preferences)
}

/**
 * Resolves once saves are safe to read. Without a working backup the game
 * still starts on whatever localStorage holds, and nothing is mirrored over
 * a backup that could not be read.
 */
export const nativeStorageReady: Promise<void> = IS_NATIVE_APP
  ? prepareNativeStorage().catch((error: unknown) =>
      console.warn('Native save backup unavailable', error)
    )
  : Promise.resolve()
