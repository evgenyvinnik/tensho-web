import { create } from 'zustand'
import { prepareForReload } from './reloadGuards'
import { UpdateError } from './registerUpdates'

/**
 * Updates install silently. A downloaded release waits until the player is at
 * a safe boundary (outside a run: menu, settings, guides), then every loaded
 * mode saves before the new worker takes over and this document reloads.
 *
 * There is no prompt. A failed save, another open window or a worker error
 * simply postpones activation until the next boundary; the waiting worker also
 * activates by itself once every window of the app has closed.
 */
interface UpdateState {
  /** A new release is downloaded and waiting. */
  available: boolean
  /** An activation attempt is in flight. */
  busy: boolean
  /** Why the last attempt was postponed, for diagnostics only. */
  error: 'save' | 'update' | 'tabs' | null
  announce: (activate: () => Promise<void>) => void
  /** Activate now if the app is at a safe boundary; otherwise keep waiting. */
  attempt: () => Promise<void>
}

export const createUpdateStore = (
  prepare = prepareForReload,
  isSafeBoundary: () => boolean = () => updateBoundary()
) => {
  let activate: (() => Promise<void>) | null = null
  return create<UpdateState>((set, get) => ({
    available: false,
    busy: false,
    error: null,
    announce: (action) => {
      activate = action
      set({ available: true })
      void get().attempt()
    },
    attempt: async () => {
      if (!activate || get().busy || !isSafeBoundary()) return
      set({ busy: true, error: null })
      try {
        if (!(await prepare().catch(() => false))) {
          set({ busy: false, error: 'save' })
          return
        }
        // The player may have started a run while saves were flushing.
        if (!isSafeBoundary()) {
          set({ busy: false })
          return
        }
        await activate()
        // Stay busy until the document unloads after success.
      } catch (error) {
        set({
          busy: false,
          error: error instanceof UpdateError ? error.reason : 'update',
        })
      }
    },
  }))
}

let updateBoundary: () => boolean = () => false

/** The application decides where reloading cannot interrupt play. */
export function setUpdateBoundary(isSafe: () => boolean): void {
  updateBoundary = isSafe
}

/** Screens a run is played on: an update never reloads these. */
const RUN_SCREENS = new Set(['play', 'shop', 'game-over'])

/** True outside a run: the menu and the reference/settings screens. */
export function isOutsideRunPath(pathname: string): boolean {
  const screen = pathname.replace(/\/+$/, '').split('/').at(-1) ?? ''
  return !RUN_SCREENS.has(screen)
}

export const useUpdateStore = createUpdateStore()
