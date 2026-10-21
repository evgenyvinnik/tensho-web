import type { ArchiveEntry } from '../systems/ArchiveSystem'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { createArchiveKey } from '../config/archiveDefinitions'

/** Old generic win totals do not prove a difficulty or a held-at-victory item. */
export function getWonStakeTiers(entry?: ArchiveEntry): number[] {
  return [
    ...new Set(
      (entry?.wonStakeTiers ?? []).filter(
        (tier) => Number.isInteger(tier) && tier >= 1 && tier <= 8
      )
    ),
  ].sort((a, b) => a - b)
}

export function getGoldDecreeProgress(
  entries: Readonly<Record<string, ArchiveEntry>>
): { completed: number; total: number } {
  const ids = new Set(ALL_DECREES.map((decree) => decree.id))
  return {
    total: ids.size,
    completed: [...ids].filter((id) =>
      getWonStakeTiers(entries[createArchiveKey('decrees', id)]).includes(8)
    ).length,
  }
}
