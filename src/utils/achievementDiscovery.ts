import {
  createArchiveKey,
  isActiveArchiveItem,
} from '../config/archiveDefinitions'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import { ArchiveSystem, type ArchiveEntry } from '../systems/ArchiveSystem'
import { getAllFateSeals } from '../systems/FateSealSystem'
import { getAllCelestialOrbs } from '../systems/CelestialOrbSystem'
import { getAllVoidScripts } from '../systems/VoidScriptSystem'

type DiscoveryCondition =
  | 'discover_all_seals'
  | 'discover_all_orbs'
  | 'discover_all_scripts'
  | 'discover_all_charters'
  | 'discover_all'

let requiredKeys: Record<DiscoveryCondition, string[]> | undefined

function getRequiredKeys(): Record<DiscoveryCondition, string[]> {
  // A pristine catalog, never a hydrated profile or the mutable archive singleton.
  // Snapshot only identities; earned progress always comes from the live store.
  return (requiredKeys ??= {
    discover_all_seals: getAllFateSeals().map((item) =>
      createArchiveKey('consumables', item.id)
    ),
    discover_all_orbs: getAllCelestialOrbs().map((item) =>
      createArchiveKey('consumables', item.id)
    ),
    discover_all_scripts: getAllVoidScripts().map((item) =>
      createArchiveKey('consumables', item.id)
    ),
    discover_all_charters: ALL_CHARTERS.map((item) =>
      createArchiveKey('charters', item.id)
    ),
    discover_all: new ArchiveSystem()
      .toState()
      .entries.filter(([, entry]) =>
        isActiveArchiveItem(entry.category, entry.itemId)
      )
      .map(([key]) => key),
  })
}

/** Old lifetime counters and retired discoveries cannot replace a required item. */
export function isDiscoveryAchievementComplete(
  condition: DiscoveryCondition,
  entries: Readonly<Record<string, ArchiveEntry>>
): boolean {
  const keys = getRequiredKeys()[condition]
  return (
    keys.length > 0 && keys.every((key) => entries[key]?.discoveredAt != null)
  )
}
