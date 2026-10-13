/**
 * Flower and Season draws waiting to be announced.
 *
 * Bonus tiles are drawn whenever the rack refills, including the opening deal
 * of a round that starts while the Tea House or menu is still on screen. This
 * queue listens to the engine from startup, so every real draw is announced
 * once when the table is next shown. Loading a saved run clears it: draws
 * already seen are never replayed.
 */

import { create } from 'zustand'
import { eventBus } from './EventBus'
import { gameOrchestrator } from './GameOrchestrator'
import type { FlowerVariant, SeasonTile } from '../systems/types'

export type FloraRevealEntry =
  | { kind: 'flower'; flower: FlowerVariant; key: number }
  | { kind: 'season'; season: SeasonTile; key: number }

const FLOWER_BY_RANK: Record<string, FlowerVariant> = {
  '1': 'Plum',
  '2': 'Orchid',
  '3': 'Chrysanthemum',
  '4': 'Bamboo',
}

interface FloraRevealState {
  queue: FloraRevealEntry[]
  dismiss: () => void
}

let nextKey = 0
export const useFloraRevealQueue = create<FloraRevealState>((set) => ({
  queue: [],
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}))

let installed: (() => void) | null = null

/** Idempotent; called once at startup. */
export function installFloraRevealQueue(): () => void {
  if (installed) return installed
  const push = (entry: FloraRevealEntry) =>
    useFloraRevealQueue.setState((state) => ({
      queue: [...state.queue, entry],
    }))
  const offs = [
    eventBus.on('flowerCollected', ({ flowerType }) => {
      const flower = FLOWER_BY_RANK[flowerType]
      if (flower) push({ kind: 'flower', flower, key: ++nextKey })
    }),
    eventBus.on('seasonActivated', () => {
      const season = gameOrchestrator.getFloraState().seasons.at(-1)
      if (
        season &&
        !useFloraRevealQueue
          .getState()
          .queue.some(
            (entry) => entry.kind === 'season' && entry.season.id === season.id
          )
      )
        push({ kind: 'season', season: { ...season }, key: ++nextKey })
    }),
    eventBus.on('gameLoaded', () => useFloraRevealQueue.setState({ queue: [] })),
    eventBus.on('runEnd', () => useFloraRevealQueue.setState({ queue: [] })),
  ]
  installed = () => {
    offs.forEach((off) => off())
    installed = null
  }
  return installed
}
