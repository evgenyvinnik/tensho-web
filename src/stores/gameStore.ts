/**
 * Game Store - Main game state management
 *
 * Manages session state, scoring, gold, and game phases.
 */

import { create } from 'zustand'

export type GamePhase = 'menu' | 'gameplay' | 'shop' | 'gameOver'

export interface GameState {
  // Session state
  currentAct: number
  currentRound: number
  score: number
  targetScore: number
  gold: number

  // Game phase
  phase: GamePhase

  // Actions
  startNewRun: () => void
  nextRound: () => void
  nextAct: () => void
  addScore: (points: number) => void
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  setPhase: (phase: GamePhase) => void
  resetGame: () => void
}

/**
 * Initial target scores by act (based on A9 Score Requirements)
 */
const TARGET_SCORES_BY_ACT: Record<number, number> = {
  1: 300,
  2: 800,
  3: 2000,
  4: 5000,
  5: 11000,
  6: 20000,
  7: 35000,
  8: 50000,
}

const INITIAL_GOLD = 4
const ROUNDS_PER_ACT = 3

function getTargetScore(act: number): number {
  return TARGET_SCORES_BY_ACT[act] ?? TARGET_SCORES_BY_ACT[8] * (act - 7)
}

export const useGameStore = create<GameState>()((set, get) => ({
  // Initial state
  currentAct: 1,
  currentRound: 1,
  score: 0,
  targetScore: getTargetScore(1),
  gold: INITIAL_GOLD,
  phase: 'menu',

  // Actions
  startNewRun: () => {
    set({
      currentAct: 1,
      currentRound: 1,
      score: 0,
      targetScore: getTargetScore(1),
      gold: INITIAL_GOLD,
      phase: 'gameplay',
    })
  },

  nextRound: () => {
    const { currentRound, currentAct } = get()

    if (currentRound >= ROUNDS_PER_ACT) {
      // Move to next act
      const newAct = currentAct + 1
      set({
        currentAct: newAct,
        currentRound: 1,
        targetScore: getTargetScore(newAct),
        score: 0,
        phase: 'shop',
      })
    } else {
      // Next round in current act
      set({
        currentRound: currentRound + 1,
        score: 0,
      })
    }
  },

  nextAct: () => {
    const { currentAct } = get()
    const newAct = currentAct + 1

    set({
      currentAct: newAct,
      currentRound: 1,
      targetScore: getTargetScore(newAct),
      score: 0,
      phase: 'gameplay',
    })
  },

  addScore: (points: number) => {
    set((state) => ({
      score: state.score + points,
    }))
  },

  addGold: (amount: number) => {
    set((state) => ({
      gold: state.gold + amount,
    }))
  },

  spendGold: (amount: number) => {
    const { gold } = get()

    if (gold >= amount) {
      set({ gold: gold - amount })
      return true
    }

    return false
  },

  setPhase: (phase: GamePhase) => {
    set({ phase })
  },

  resetGame: () => {
    set({
      currentAct: 1,
      currentRound: 1,
      score: 0,
      targetScore: getTargetScore(1),
      gold: INITIAL_GOLD,
      phase: 'menu',
    })
  },
}))
