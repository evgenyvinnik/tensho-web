/**
 * Which round's pay the Tea House has already shown arriving.
 *
 * The toasts and coins play once per settlement. The key is remembered for
 * this tab so a reload, a trip to Settings or a second visit to the same shop
 * does not pay the same Gold into the purse twice on screen. Resuming a saved
 * run in a fresh tab replays the last arrival once; nothing here moves money.
 * Storage can be blocked (private windows), so an in-memory record backs it.
 */

import type { RoundCashOutSummary } from '../../game/GameOrchestrator'

const STORAGE_KEY = 'tensho-cash-out-shown'
const shown = new Set<string>()

export function cashOutKey(summary: RoundCashOutSummary): string {
  return [
    summary.actNumber,
    summary.roundNumber,
    summary.roundType,
    summary.goldBefore,
    summary.goldAfter,
  ].join(':')
}

export function wasCashOutShown(key: string): boolean {
  if (shown.has(key)) return true
  try {
    return sessionStorage.getItem(STORAGE_KEY) === key
  } catch {
    return false
  }
}

export function markCashOutShown(key: string): void {
  shown.add(key)
  try {
    sessionStorage.setItem(STORAGE_KEY, key)
  } catch {
    // Private windows and blocked storage only lose the reload guard.
  }
}

/** Test and reset hook: forget what was shown. */
export function forgetCashOutShown(): void {
  shown.clear()
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to forget.
  }
}
