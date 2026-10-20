/**
 * Draws from the wall waiting to be shown: each round's opening deal and every
 * Flower or Season drawn.
 *
 * Bonus tiles are drawn whenever the rack refills, including the opening deal
 * of a round that starts while the Tea House or menu is still on screen. This
 * queue listens to the engine from startup, so every real draw plays once
 * when the table is next shown (see WallDraw). Loading a saved run clears it:
 * draws already seen are never replayed.
 */

import { create } from 'zustand'
import { eventBus } from './EventBus'
import { gameOrchestrator } from './GameOrchestrator'
import type { FlowerVariant, SeasonTile } from '../systems/types'

export type FloraRevealEntry =
  | { kind: 'flower'; flower: FlowerVariant; key: number }
  | { kind: 'season'; season: SeasonTile; key: number }

/** A round's opening deal; the bonus tiles queued before it were drawn in it. */
export type DealEntry = { kind: 'deal'; key: number }

export type WallDrawEntry = FloraRevealEntry | DealEntry

/** What the wall shows next: one deal, or the bonus tiles of one refill. */
export interface WallDrawBatch {
  deal: boolean
  flora: FloraRevealEntry[]
  /** The last queued entry this batch shows. */
  lastKey: number
}

const FLOWER_BY_RANK: Record<string, FlowerVariant> = {
  '1': 'Plum',
  '2': 'Orchid',
  '3': 'Chrysanthemum',
  '4': 'Bamboo',
}

interface FloraRevealState {
  queue: WallDrawEntry[]
  dismiss: () => void
  /** Drop every entry up to and including `key`, once it has been shown. */
  dismissThrough: (key: number) => void
}

let nextKey = 0
export const useFloraRevealQueue = create<FloraRevealState>((set) => ({
  queue: [],
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
  dismissThrough: (key) =>
    set((state) => ({ queue: state.queue.filter((entry) => entry.key > key) })),
}))

/**
 * The next draw to show: everything up to the first deal (its bonus tiles
 * and any left from before it), or else every bonus tile waiting.
 */
export function nextWallDraw(
  queue: readonly WallDrawEntry[]
): WallDrawBatch | null {
  if (queue.length === 0) return null
  const deal = queue.findIndex((entry) => entry.kind === 'deal')
  const batch = deal === -1 ? queue : queue.slice(0, deal + 1)
  return {
    deal: deal !== -1,
    flora: batch.filter(
      (entry): entry is FloraRevealEntry => entry.kind !== 'deal'
    ),
    lastKey: batch[batch.length - 1].key,
  }
}

let installed: (() => void) | null = null

/** Idempotent; called once at startup. */
export function installFloraRevealQueue(): () => void {
  if (installed) return installed
  const push = (entry: WallDrawEntry) =>
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
    eventBus.on('roundStart', () => push({ kind: 'deal', key: ++nextKey })),
    eventBus.on('gameLoaded', () => useFloraRevealQueue.setState({ queue: [] })),
    eventBus.on('runEnd', () => useFloraRevealQueue.setState({ queue: [] })),
  ]
  installed = () => {
    offs.forEach((off) => off())
    installed = null
  }
  return installed
}
