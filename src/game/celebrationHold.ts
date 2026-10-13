/**
 * Keeps the table on screen while a play is being celebrated.
 *
 * The play that clears (or loses) a round moves the run to the Tea House or
 * the result at once. Without a hold, the biggest plays — usually the winning
 * ones — would never show their toast and fire. The hold is presentation
 * only: the engine has already settled, and nothing can act on the table while
 * it lasts. It always ends with the celebration (or after a short cap).
 */

import { create } from 'zustand'

interface CelebrationHoldState {
  holding: boolean
  hold: () => void
  release: () => void
}

const MAX_HOLD_MS = 2500
let timer: ReturnType<typeof setTimeout> | null = null

export const useCelebrationHold = create<CelebrationHoldState>((set) => ({
  holding: false,
  hold: () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => set({ holding: false }), MAX_HOLD_MS)
    set({ holding: true })
  },
  release: () => {
    if (timer) clearTimeout(timer)
    timer = null
    set({ holding: false })
  },
}))
