/**
 * Celestial Orbs the Tea House has just used, waiting for their reveal.
 *
 * Buying an Orb, or choosing one from a Blessing Pack, applies its upgrade the
 * moment it is taken; this queue only listens and shows what rose. Orbs used
 * from the rail during a round are the player's own deliberate taps and get no
 * reveal. Skipping it, reduced motion or a reload can neither lose nor repeat
 * an upgrade, and a loaded save never replays old reveals.
 */

import { create } from 'zustand'
import { eventBus } from './EventBus'
import {
  getAllCelestialOrbs,
  type CelestialOrb,
  type YakuCategory,
} from '../systems/CelestialOrbSystem'

export interface OrbLevelChange {
  yaku: YakuCategory
  from: number
  to: number
}

export interface OrbRevealEntry {
  key: number
  orb: Pick<CelestialOrb, 'id' | 'name' | 'description' | 'effect'>
  levels: OrbLevelChange[]
}

interface OrbRevealState {
  queue: OrbRevealEntry[]
  dismiss: () => void
}

let nextKey = 0
export const useOrbRevealQueue = create<OrbRevealState>((set) => ({
  queue: [],
  dismiss: () => set((state) => ({ queue: state.queue.slice(1) })),
}))

let installed: (() => void) | null = null

export function installOrbRevealQueue(): () => void {
  if (installed) return installed
  const offs = [
    eventBus.on('celestialOrbUsed', ({ orbId, onAcquire, levels }) => {
      // `source` is where the Orb came from: one bought before Orbs applied
      // at once can still sit on the rail, and its use there is no reveal.
      if (!onAcquire) return
      if (!levels || levels.length === 0) return
      const orb = getAllCelestialOrbs().find((entry) => entry.id === orbId)
      if (!orb) return
      useOrbRevealQueue.setState((state) => ({
        queue: [
          ...state.queue,
          {
            key: ++nextKey,
            orb,
            levels: levels.map((level) => ({
              ...level,
              yaku: level.yaku as YakuCategory,
            })),
          },
        ],
      }))
    }),
    eventBus.on('gameLoaded', () => useOrbRevealQueue.setState({ queue: [] })),
    eventBus.on('runEnd', () => useOrbRevealQueue.setState({ queue: [] })),
  ]
  installed = () => {
    offs.forEach((off) => off())
    installed = null
  }
  return installed
}
