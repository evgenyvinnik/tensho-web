/** Transient run context only; persistent progression remains owned by its bridge. */
interface ActiveRunMeta {
  stake: number
  wallId: string
  hadFlowers: boolean
  flowerTypes: Set<string>
  pendingCorruptedSeasons: number
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
