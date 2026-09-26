import { create } from 'zustand'
import { prepareForReload } from './reloadGuards'
import { UpdateError } from './registerUpdates'

interface UpdateState {
  available: boolean
  busy: boolean
  error: 'save' | 'update' | 'tabs' | null
  announce: (activate: () => Promise<void>) => void
  accept: () => Promise<void>
}

export const createUpdateStore = (prepare = prepareForReload) => {
  let activate: (() => Promise<void>) | null = null
  return create<UpdateState>((set, get) => ({
    available: false,
    busy: false,
    error: null,
    announce: (action) => {
      activate = action
      set({ available: true })
    },
    accept: async () => {
      if (!activate || get().busy) return
      set({ busy: true, error: null })
      try {
        if (!(await prepare().catch(() => false))) {
          set({ busy: false, error: 'save' })
          return
        }
        await activate()
        // Keep controls blocked until the document unloads after success.
      } catch (error) {
        set({
          busy: false,
          error: error instanceof UpdateError ? error.reason : 'update',
        })
      }
    },
  }))
}

export const useUpdateStore = createUpdateStore()
