import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  initializeClassicPersistence,
  shutdownClassicPersistence,
  enterClassicRoute,
  startConfiguredClassicRun,
} from './classicPersistenceApp'
import {
  gameOrchestrator as game,
  type OrchestratorState,
} from './GameOrchestrator'
import { CLASSIC_SAVE_KEY, ClassicSaveRepository } from './classicSavedRun'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { useProgressionStore } from '../stores/progressionStore'
import { resetAllProgress } from './resetProgress'

let data: Map<string, string>
const oldLocks = Object.getOwnPropertyDescriptor(navigator, 'locks')
beforeEach(() => {
  shutdownClassicPersistence()
  shutdownMetaProgressionBridge()
  game.resetGame()
  data = new Map()
  vi.spyOn(localStorage, 'getItem').mockImplementation(
    (key) => data.get(key) ?? null
  )
  vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
    data.set(key, value)
  })
  vi.spyOn(localStorage, 'removeItem').mockImplementation((key) => {
    data.delete(key)
  })
  let tail = Promise.resolve()
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_name: string, _options: unknown, callback: () => unknown) => {
        const next = tail.then(callback)
        tail = next.then(
          () => undefined,
          () => undefined
        )
        return next
      },
    },
  })
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownClassicPersistence()
  shutdownMetaProgressionBridge()
  game.resetGame()
  if (oldLocks) Object.defineProperty(navigator, 'locks', oldLocks)
  else Reflect.deleteProperty(navigator, 'locks')
  vi.restoreAllMocks()
})

it('initializes once without starting a run or claiming a saved record', () => {
  const first = initializeClassicPersistence()
  expect(initializeClassicPersistence()).toBe(first)
  expect(game.getState().phase).toBe('menu')
  expect(data.has(CLASSIC_SAVE_KEY)).toBe(false)
})

it('coalesces StrictMode/repeated direct-route entry into one real run start', async () => {
  const before = useProgressionStore.getState().stats.totalRunsStarted
  expect(
    await Promise.all([enterClassicRoute('play'), enterClassicRoute('play')])
  ).toEqual(['play', 'play'])
  expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(before + 1)
  expect(initializeClassicPersistence().getSnapshot().status).toBe('saved')
  expect(game.getState().phase).toBe('gameplay')
})

it('direct shop/result URLs with no checkpoint return to the menu rather than inventing progress', async () => {
  expect(await enterClassicRoute('shop')).toBeNull()
  expect(await enterClassicRoute('game-over')).toBeNull()
  expect(game.getState().phase).toBe('menu')
  expect(data.has(CLASSIC_SAVE_KEY)).toBe(false)
})

it('reload chooses the saved shop phase and preserves its paid pending reward', async () => {
  await startConfiguredClassicRun(null)
  const state = game.getState() as OrchestratorState
  state.gold = 100
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id),
    }).success
  ).toBe(true)
  expect(game.shop.open()).toBe(true)
  expect(game.shop.purchase(game.shop.state.packOfferings[0].id).success).toBe(
    true
  )
  await initializeClassicPersistence().flush()
  const pending = game.shop.pendingPack!.pack.id
  const gold = state.gold
  const stats = structuredClone(useProgressionStore.getState().stats)
  shutdownClassicPersistence()
  game.resetGame()
  expect(await enterClassicRoute('play')).toBe('shop')
  expect(game.shop.pendingPack?.pack.id).toBe(pending)
  expect(game.getState().gold).toBe(gold)
  expect(useProgressionStore.getState().stats).toEqual(stats)
})

it('does not auto-replace a corrupt or inaccessible checkpoint on a direct play URL', async () => {
  data.set(CLASSIC_SAVE_KEY, '{broken')
  expect(await enterClassicRoute('play')).toBeNull()
  expect(data.get(CLASSIC_SAVE_KEY)).toBe('{broken')
  vi.mocked(localStorage.getItem).mockImplementation(() => {
    throw new Error('Denied')
  })
  expect(await enterClassicRoute('play')).toBeNull()
  expect(game.getState().phase).toBe('menu')
})

it('storage events revoke ownership without automatically taking the run back', async () => {
  await startConfiguredClassicRun(null)
  const service = initializeClassicPersistence()
  const raw = data.get(CLASSIC_SAVE_KEY)!
  const other = new ClassicSaveRepository()
  expect((await other.claim(raw)).ok).toBe(true)
  const foreign = data.get(CLASSIC_SAVE_KEY)
  window.dispatchEvent(new StorageEvent('storage', { key: CLASSIC_SAVE_KEY }))
  expect(service.getSnapshot().status).toBe('conflict')
  expect(await enterClassicRoute('play')).toBe('play')
  expect(data.get(CLASSIC_SAVE_KEY)).toBe(foreign)
  expect(service.getSnapshot().status).toBe('conflict')
})

it('warns on closing only while this tab has unsaved progress', async () => {
  await startConfiguredClassicRun(null)
  const saved = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(saved)
  expect(saved.defaultPrevented).toBe(false)
  game.selectTile(game.getHandTiles()[0].id)
  const pending = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(pending)
  expect(pending.defaultPrevented).toBe(true)
  await initializeClassicPersistence().flush()
})

it('full reset removes the Classic record and cancels a queued application save', async () => {
  await startConfiguredClassicRun(null)
  const service = initializeClassicPersistence()
  game.selectTile(game.getHandTiles()[0].id)
  const pending = service.flush()
  expect(resetAllProgress()).toEqual({ success: true })
  await pending
  expect(data.has(CLASSIC_SAVE_KEY)).toBe(false)
  expect(game.getState().phase).toBe('menu')
  expect(service.getSnapshot()).toMatchObject({
    status: 'idle',
    unsaved: false,
  })
})

it('refreshes persisted lifetime counters before resuming an older tab or starting another run', async () => {
  await startConfiguredClassicRun(null)
  const service = initializeClassicPersistence()
  const raw = data.get(CLASSIC_SAVE_KEY)!
  const profile = JSON.parse(data.get('tensho-progression')!)
  profile.state.stats.totalTilesPlayed = 42
  profile.state.stats.totalRunsStarted = 9
  data.set('tensho-progression', JSON.stringify(profile))
  expect(useProgressionStore.getState().stats.totalTilesPlayed).not.toBe(42)
  expect(await service.resume(raw)).toBe(true)
  expect(useProgressionStore.getState().stats.totalTilesPlayed).toBe(42)
  expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(9)
  profile.state.stats.totalTilesPlayed = 44
  data.set('tensho-progression', JSON.stringify(profile))
  expect(await startConfiguredClassicRun(data.get(CLASSIC_SAVE_KEY)!)).toBe(
    true
  )
  expect(useProgressionStore.getState().stats.totalTilesPlayed).toBe(44)
  expect(useProgressionStore.getState().stats.totalRunsStarted).toBe(10)
})

it('does not start a run or replace a checkpoint if the profile cannot be read', async () => {
  await startConfiguredClassicRun(null)
  const before = game.getState()
  const raw = data.get(CLASSIC_SAVE_KEY)!
  vi.mocked(localStorage.getItem).mockImplementation((key) => {
    if (key === 'tensho-progression') throw new Error('Denied')
    return data.get(key) ?? null
  })
  expect(await startConfiguredClassicRun(raw)).toBe(false)
  expect(game.getState()).toBe(before)
  expect(data.get(CLASSIC_SAVE_KEY)).toBe(raw)
  expect(initializeClassicPersistence().getSnapshot().status).toBe(
    'unavailable'
  )
})

it('keeps a resumed table paused when persisted profile JSON is corrupt', async () => {
  await startConfiguredClassicRun(null)
  const service = initializeClassicPersistence()
  const before = game.getState()
  const raw = data.get(CLASSIC_SAVE_KEY)!
  data.set('tensho-progression', '{broken profile')
  expect(await service.resume(raw)).toBe(false)
  expect(game.getState()).toBe(before)
  expect(service.getSnapshot()).toMatchObject({
    status: 'unavailable',
    ownershipLost: true,
  })
  expect(service.hasLocalRun).toBe(false)
  expect(data.get('tensho-progression')).toBe('{broken profile')
})

it('a failed full reset rolls back the checkpoint and retains the live save lease', async () => {
  await startConfiguredClassicRun(null)
  const service = initializeClassicPersistence()
  const before = data.get(CLASSIC_SAVE_KEY)
  const state = game.getState()
  const remove = localStorage.removeItem.bind(localStorage)
  vi.mocked(localStorage.removeItem).mockImplementation((key) => {
    if (key === CLASSIC_SAVE_KEY) throw new Error('Denied')
    remove(key)
  })
  expect(resetAllProgress().success).toBe(false)
  expect(data.get(CLASSIC_SAVE_KEY)).toBe(before)
  expect(game.getState()).toBe(state)
  game.selectTile(game.getHandTiles()[0].id)
  expect(await service.retrySave()).toBe(true)
  expect(data.get(CLASSIC_SAVE_KEY)).not.toBe(before)
})
