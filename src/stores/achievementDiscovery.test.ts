import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventBus } from '../game/EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from '../game/MetaProgressionBridge'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import {
  createArchiveKey,
  isActiveArchiveItem,
} from '../config/archiveDefinitions'
import { ArchiveSystem } from '../systems/ArchiveSystem'
import { getAllFateSeals } from '../systems/FateSealSystem'
import { getAllCelestialOrbs } from '../systems/CelestialOrbSystem'
import { getAllVoidScripts } from '../systems/VoidScriptSystem'
import { useAchievementStore } from './achievementStore'
import { useArchiveStore } from './archiveStore'
import { useProgressionStore } from './progressionStore'

const cases = [
  {
    id: 'seal_scholar',
    keys: getAllFateSeals().map((item) =>
      createArchiveKey('consumables', item.id)
    ),
  },
  {
    id: 'star_gazer',
    keys: getAllCelestialOrbs().map((item) =>
      createArchiveKey('consumables', item.id)
    ),
  },
  {
    id: 'void_walker',
    keys: getAllVoidScripts().map((item) =>
      createArchiveKey('consumables', item.id)
    ),
  },
  {
    id: 'charter_complete',
    keys: ALL_CHARTERS.map((item) => createArchiveKey('charters', item.id)),
  },
  {
    id: 'archive_complete',
    keys: new ArchiveSystem()
      .toState()
      .entries.filter(([, entry]) =>
        isActiveArchiveItem(entry.category, entry.itemId)
      )
      .map(([key]) => key),
  },
]

function discover(keys: string[]) {
  const entries = { ...useArchiveStore.getState().entries }
  for (const key of keys) entries[key] = { ...entries[key], discoveredAt: 123 }
  useArchiveStore.setState({ entries })
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useAchievementStore.getState().resetAchievements()
})

afterEach(() => shutdownMetaProgressionBridge())

describe.each(cases)('$id catalog completion', ({ id, keys }) => {
  it('requires the last distinct item, regardless of legacy counters', () => {
    // High historical counters cannot substitute for a missing current item.
    const store = useAchievementStore.getState()
    for (const stat of [
      'fateSealsDiscovered',
      'celestialOrbsDiscovered',
      'voidScriptsDiscovered',
      'chartersDiscovered',
      'totalItemsDiscovered',
    ] as const) {
      store.setStat(stat, 9999)
    }
    const missing = keys.at(-1)!
    discover(keys.slice(0, -1))
    const entries = { ...useArchiveStore.getState().entries }
    entries[missing] = { ...entries[missing], discoveredAt: null }
    useArchiveStore.setState({ entries })
    store.checkAchievements()
    expect(useAchievementStore.getState().achievements[id].unlocked).toBe(false)
    discover([missing])
    store.checkAchievements()
    expect(useAchievementStore.getState().achievements[id].unlocked).toBe(true)
  })

  it('earns completion from the catalog even with stale low counters', () => {
    discover(keys)
    useAchievementStore.getState().checkAchievements()
    expect(useAchievementStore.getState().achievements[id].unlocked).toBe(true)
  })

  it('does not award completion for an empty or incompletely hydrated archive', () => {
    useArchiveStore.setState({ entries: {} })
    useAchievementStore.getState().checkAchievements()
    expect(useAchievementStore.getState().achievements[id].unlocked).toBe(false)
  })

  it('preserves an already-earned award without replaying its notification', () => {
    const store = useAchievementStore.getState()
    store.unlockAchievement(id)
    store.markAsSeen(id)
    const earned = useAchievementStore.getState().achievements[id]
    useArchiveStore.setState({ entries: {} })
    store.checkAchievements()
    expect(useAchievementStore.getState().achievements[id]).toEqual(earned)
    expect(useAchievementStore.getState().getUnseenUnlocks()).not.toContain(id)
  })
})

it('does not require retired archive entries or award unknown items as substitutes', () => {
  const keys = cases.find((item) => item.id === 'archive_complete')!.keys
  expect(isActiveArchiveItem('walls', 'jade_wall')).toBe(false)
  expect(keys).not.toContain('walls:jade_wall')
  discover(keys)
  const entries = { ...useArchiveStore.getState().entries }
  entries['walls:jade_wall'] = {
    ...entries['walls:green_felt'],
    key: 'walls:jade_wall',
    itemId: 'jade_wall',
    discoveredAt: null,
  }
  useArchiveStore.setState({ entries })
  useAchievementStore.getState().checkAchievements()
  expect(
    useAchievementStore.getState().achievements.archive_complete.unlocked
  ).toBe(true)

  useAchievementStore.getState().resetAchievements()
  delete entries[keys.at(-1)!]
  entries['walls:jade_wall'] = {
    ...entries['walls:jade_wall'],
    discoveredAt: 123,
  }
  useArchiveStore.setState({ entries })
  useAchievementStore.getState().checkAchievements()
  expect(
    useAchievementStore.getState().achievements.archive_complete.unlocked
  ).toBe(false)
})

it('does not manufacture collection achievements in Full Unlock mode', () => {
  discover(cases.find((item) => item.id === 'archive_complete')!.keys)
  useProgressionStore.setState({ fullUnlockEnabled: true })
  useAchievementStore.getState().checkAchievements()
  for (const { id } of cases) {
    expect(useAchievementStore.getState().achievements[id].unlocked).toBe(false)
  }
})

it('announces the final real discovery once, including across bridge reinitialization', () => {
  const keys = cases.find((item) => item.id === 'void_walker')!.keys
  discover(keys.slice(0, -1))
  initializeMetaProgressionBridge()
  // Settle unrelated baseline awards (the default wall already exceeds 80 tiles).
  useAchievementStore.getState().checkAchievements()
  expect(useAchievementStore.getState().achievements.void_walker.unlocked).toBe(
    false
  )
  const notified = vi.fn()
  const off = eventBus.on('achievementUnlocked', notified)
  try {
    const script = getAllVoidScripts().at(-1)!
    eventBus.emit('consumableAcquired', {
      consumableType: 'VoidScript',
      itemId: script.id,
      instanceId: 'discovery-final-script',
      name: script.name,
      source: 'generated',
    })
    expect(
      useAchievementStore.getState().achievements.void_walker.unlocked
    ).toBe(true)
    expect(notified.mock.calls.map(([event]) => event.achievementId)).toEqual([
      'void_walker',
    ])
    useAchievementStore.getState().markAsSeen('void_walker')
    eventBus.emit('consumableAcquired', {
      consumableType: 'VoidScript',
      itemId: script.id,
      instanceId: 'discovery-repeat-script',
      name: script.name,
      source: 'generated',
    })
    shutdownMetaProgressionBridge()
    initializeMetaProgressionBridge()
    expect(notified).toHaveBeenCalledTimes(1)
    expect(useAchievementStore.getState().getUnseenUnlocks()).not.toContain(
      'void_walker'
    )
  } finally {
    off()
  }
})
