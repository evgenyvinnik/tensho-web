/**
 * Decrees waiting for their reveal.
 *
 * The engine grants a Decree first and announces it after; this queue only
 * listens. The reveal is presentation: skipping it, reduced motion or a reload
 * can neither lose nor duplicate the Decree, and a loaded save never replays
 * old reveals. Pack rewards are revealed by the pack itself, so only direct
 * purchases, starting Decrees and Decrees created by other items queue here.
 */

import { create } from 'zustand'
import { eventBus } from './EventBus'
import { gameOrchestrator } from './GameOrchestrator'
import type { OwnedDecree } from '../systems/types'

export interface DecreeRevealEntry {
  key: number
  decree: OwnedDecree
  source: 'starting' | 'purchase' | 'generated'
}

interface DecreeRevealState {
  queue: DecreeRevealEntry[]
  dismiss: () => void
}

let nextKey = 0
export const useDecreeRevealQueue = create<DecreeRevealState>((set) => ({
  queue: [],
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}))

let installed: (() => void) | null = null

export function installDecreeRevealQueue(): () => void {
  if (installed) return installed
  const offs = [
    eventBus.on('decreeAcquired', ({ decreeId, source }) => {
      if (source === 'pack_open') return
      // The newest owned copy of this Decree is the one just granted.
      const decree = [...gameOrchestrator.getState().decreeSystem.getOwnedDecrees()]
        .reverse()
        .find((owned) => owned.id === decreeId)
      if (!decree) return
      useDecreeRevealQueue.setState((state) => ({
        queue: [
          ...state.queue,
          {
            key: ++nextKey,
            decree: { ...decree },
            source: source === 'starting' || source === 'generated' ? source : 'purchase',
          },
        ],
      }))
    }),
    eventBus.on('gameLoaded', () => useDecreeRevealQueue.setState({ queue: [] })),
    eventBus.on('runEnd', () => useDecreeRevealQueue.setState({ queue: [] })),
  ]
  installed = () => {
    offs.forEach((off) => off())
    installed = null
  }
  return installed
}
