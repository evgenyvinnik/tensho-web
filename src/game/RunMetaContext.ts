/** Transient run context only; persistent progression remains owned by its bridge. */
interface ActiveRunMeta {
  stake: number
  wallId: string
  hadFlowers: boolean
  flowerTypes: Set<string>
  pendingCorruptedSeasons: number
  /** Absent in older saves; only observed scoring contributes after resume. */
  windYakuScored?: number
  /** Missing in older saves means unproven history, not zero rerolls. */
  shopRerolls?: number
  /** Missing in older saves means unknown Turn spending, not a zero-cost run. */
  paidTurns?: number
  /** Only observed purchases through Act 5; legacy history is not inferred. */
  chartersPurchasedByAct5?: number
}

export const runMetaContext: { current: ActiveRunMeta | null } = {
  current: null,
}
export type RunMetaSnapshot =
  | (Omit<ActiveRunMeta, 'flowerTypes'> & { flowerTypes: string[] })
  | null

export function captureMetaProgressionRunContext(): RunMetaSnapshot {
  const run = runMetaContext.current
  return run ? { ...run, flowerTypes: [...run.flowerTypes] } : null
}

/** Resume is not runStart/runEnd and must not award or reset persistent stats. */
export function restoreMetaProgressionRunContext(saved: RunMetaSnapshot): void {
  runMetaContext.current = saved
    ? { ...saved, flowerTypes: new Set(saved.flowerTypes) }
    : null
}
