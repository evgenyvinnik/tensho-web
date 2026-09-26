import { ClassicRunPersistence } from './ClassicRunPersistence'
import { gameOrchestrator } from './GameOrchestrator'
import { CLASSIC_SAVE_KEY } from './classicSavedRun'
import { useProgressionStore } from '../stores/progressionStore'
import { useStakeStore } from '../stores/stakeStore'
import { useTableStyleStore } from '../stores/tableStyleStore'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'

// These stores use synchronous localStorage. Rehydrate after taking ownership,
// before a new action can write stale lifetime counters from an older tab.
function profileAdapter<State>(store: {
  getInitialState: () => State
  setState: (state: State, replace: true) => unknown
  persist: {
    getOptions: () => { name?: string }
    rehydrate: () => void | Promise<void>
    hasHydrated: () => boolean
  }
}) {
  return {
    key: store.persist.getOptions().name!,
    refresh: (raw: string | null) => {
      if (raw === null) {
        // Do not resurrect a cached profile whose record was cleared elsewhere.
        store.setState(store.getInitialState(), true)
      } else {
        void store.persist.rehydrate()
        if (!store.persist.hasHydrated())
          throw new Error('Profile hydration failed')
      }
    },
  }
}
function refreshProfile(): void {
  const profiles = [
    profileAdapter(useProgressionStore),
    profileAdapter(useAchievementStore),
    profileAdapter(useArchiveStore),
    profileAdapter(useStakeStore),
    profileAdapter(useTableStyleStore),
  ]
  const records = profiles.map((profile) =>
    window.localStorage.getItem(profile.key)
  )
  profiles.forEach((profile, index) => profile.refresh(records[index]))
}

let persistence: ClassicRunPersistence | null = null
let cleanup: (() => void) | null = null

/** Startup is idempotent, outside React StrictMode and route lifetimes. */
export function initializeClassicPersistence(): ClassicRunPersistence {
  if (persistence) return persistence
  gameOrchestrator.setCharterUnlockResolver((id) =>
    useProgressionStore.getState().isItemUnlocked(id)
  )
  const service = new ClassicRunPersistence(
    gameOrchestrator,
    undefined,
    refreshProfile
  )
  persistence = service
  const storage = (event: StorageEvent) => {
    if (event.key === CLASSIC_SAVE_KEY || event.key === null) service.refresh()
  }
  const hidden = () => {
    if (document.visibilityState === 'hidden') void service.flush()
  }
  const pagehide = () => {
    void service.flush()
  }
  const beforeunload = (event: BeforeUnloadEvent) => {
    if (!service.getSnapshot().unsaved || !service.hasLocalRun) return
    // Closing a page cannot await a Web Lock. Warn while a checkpoint is still
    // pending instead of claiming that pagehide guarantees its completion.
    event.preventDefault()
    event.returnValue = ''
  }
  window.addEventListener('storage', storage)
  window.addEventListener('pagehide', pagehide)
  window.addEventListener('beforeunload', beforeunload)
  document.addEventListener('visibilitychange', hidden)
  cleanup = () => {
    service.dispose()
    window.removeEventListener('storage', storage)
    window.removeEventListener('pagehide', pagehide)
    window.removeEventListener('beforeunload', beforeunload)
    document.removeEventListener('visibilitychange', hidden)
  }
  return service
}

/** Does not instantiate during reset tests or pure-engine usage. */
export function getClassicPersistence(): ClassicRunPersistence | null {
  return persistence
}
export function shutdownClassicPersistence(): void {
  cleanup?.()
  cleanup = null
  persistence = null
}

export type ClassicDestination = 'play' | 'shop' | 'game-over'
export function classicDestination(): ClassicDestination {
  const phase = gameOrchestrator.getState().phase
  return phase === 'shop' ? 'shop' : phase === 'gameOver' ? 'game-over' : 'play'
}

/** Caller obtained replacement consent against expectedRaw before starting. */
export async function startConfiguredClassicRun(
  expectedRaw: string | null
): Promise<boolean> {
  const service = initializeClassicPersistence()
  if (!service.prepareProfile()) return false
  const table = useTableStyleStore.getState().currentStyleId
  const stakes = useStakeStore.getState()
  const stake = stakes.currentWallId === table ? stakes.currentStakeTier : 1
  stakes.selectStake(table, stake)
  gameOrchestrator.startNewRun(undefined, stake, table)
  // On failure the requested run remains playable in memory, with a visible
  // unsaved warning. The preceding durable record has not been deleted.
  await service.saveNewRun(expectedRaw)
  return true
}

let entering: Promise<ClassicDestination | null> | null = null
/** Direct URL/reload restoration must finish before Gameplay can auto-start. */
export function enterClassicRoute(
  requested: ClassicDestination
): Promise<ClassicDestination | null> {
  if (entering) return entering
  const operation = (async () => {
    const service = initializeClassicPersistence()
    if (
      service.getSnapshot().ownershipLost &&
      gameOrchestrator.getState().phase !== 'menu'
    )
      return classicDestination()
    if (service.hasLocalRun) return classicDestination()
    service.refresh()
    const { disk } = service.getSnapshot()
    if (disk.kind === 'ready') {
      if (await service.resume(disk.raw)) return classicDestination()
    } else if (disk.kind === 'empty' && requested === 'play') {
      return (await startConfiguredClassicRun(null))
        ? classicDestination()
        : null
    }
    return null
  })()
  entering = operation
  const finished = () => {
    if (entering === operation) entering = null
  }
  void operation.then(finished, finished)
  return operation
}

if (import.meta.hot) import.meta.hot.dispose(shutdownClassicPersistence)
