import { lazy, type ComponentType } from 'react'
import { prepareForReload } from '../pwa/reloadGuards'
import { APP_VERSION } from '../utils/version'

export type RecoveryResult =
  | 'reloading'
  | 'save'
  | 'session'
  | 'already'
  | 'navigated'

export interface RecoveryEnvironment {
  version: string
  url: () => string
  session: () => Pick<Storage, 'getItem' | 'setItem'>
  prepare: () => Promise<boolean>
  reload: () => void
}

const browser: RecoveryEnvironment = {
  version: APP_VERSION,
  url: () => window.location.href,
  session: () => window.sessionStorage,
  prepare: prepareForReload,
  reload: () => window.location.reload(),
}

/** Match browser/Vite download errors, never arbitrary application TypeErrors. */
export function isScreenDownloadFailure(error: unknown): error is Error {
  return (
    error instanceof Error &&
    /^(Failed to fetch dynamically imported module:|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS for )/i.test(
      error.message
    )
  )
}

export class ScreenDownloadError extends Error {
  constructor(
    readonly original: Error,
    readonly recovery: RecoveryResult
  ) {
    super(original.message)
    this.name = 'ScreenDownloadError'
  }
}

/** At most one automatic recovery per version/canonical URL/tab across reloads. */
export async function recoverScreenDownload(
  requestedUrl: string,
  environment: RecoveryEnvironment = browser
): Promise<RecoveryResult> {
  if (environment.url() !== requestedUrl) return 'navigated'
  try {
    const storage = environment.session()
    // Our routes accept both forms; Pages redirects extensionless paths to a
    // trailing slash. That redirect must not grant a second recovery allowance.
    // Keep the raw URL checks above/below so actual user navigation still wins.
    const canonical = new URL(requestedUrl)
    canonical.pathname = canonical.pathname.replace(/\/+$/, '') || '/'
    const key = `tensho-screen-recovery:${environment.version}:${canonical.href}`
    if (storage.getItem(key)) return 'already'
    // Reserve synchronously before awaiting saves; concurrent failures cannot
    // schedule two reloads. Storage denial disables automatic recovery safely.
    storage.setItem(key, 'attempted')
  } catch {
    return 'session'
  }
  try {
    if (!(await environment.prepare())) return 'save'
  } catch {
    return 'save'
  }
  // Do not disrupt a different route selected while persistence was pending.
  if (environment.url() !== requestedUrl) return 'navigated'
  try {
    environment.reload()
    return 'reloading'
  } catch {
    return 'session'
  }
}

export async function loadScreen<T>(
  loader: () => Promise<T>,
  environment: RecoveryEnvironment = browser
): Promise<T> {
  const requestedUrl = environment.url()
  try {
    return await loader()
  } catch (error) {
    if (!isScreenDownloadFailure(error)) throw error
    const recovery = await recoverScreenDownload(requestedUrl, environment)
    if (recovery === 'reloading') {
      // Keep the existing localized Suspense fallback until the document leaves.
      // Never cache-bust imports: that can instantiate a second game singleton.
      return new Promise<T>(() => {})
    }
    throw new ScreenDownloadError(error, recovery)
  }
}

/** Declare at module scope, like React.lazy, to retain screen identity. */
export function lazyScreen<T extends ComponentType>(
  loader: () => Promise<{ default: T }>
) {
  return lazy(() => loadScreen(loader))
}
