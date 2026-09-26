import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ClassicRunPersistence } from './ClassicRunPersistence'
import { parseClassicRunSnapshot } from './validateClassicRun'
import {
  ClassicSaveRepository,
  CLASSIC_SAVE_KEY,
  type ExclusiveSave,
} from './classicSavedRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import {
  initializeMetaProgressionBridge,
  resetMetaProgressionRunContext,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'
import { useProgressionStore } from '../stores/progressionStore'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'

const coordinators: ClassicRunPersistence[] = []
function fixture() {
  const data = new Map<string, string>()
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key)
    }),
  }
  let tail = Promise.resolve()
  const exclusive: ExclusiveSave = (operation) => {
    const result = tail.then(operation)
    tail = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }
  let token = 0
  const repository = () =>
    new ClassicSaveRepository({
      storage: () => storage,
      exclusive,
      token: () => `token-${++token}`,
    })
  const repo = repository()
  const game = new GameOrchestrator()
  const persistence = new ClassicRunPersistence(game, repo)
  coordinators.push(persistence)
  return { data, storage, repo, repository, game, persistence }
}
function disk(repo: ClassicSaveRepository) {
  const value = repo.read()
  if (value.kind !== 'ready')
    throw new Error(`Expected checkpoint: ${value.kind}`)
  return value
}
function play(game: GameOrchestrator) {
  return game.processAction({
    type: 'play',
    tileIds: game
      .getHandTiles()
      .slice(0, 2)
      .map((tile) => tile.id),
  })
}
afterEach(() => {
  coordinators.splice(0).forEach((c) => c.dispose())
  shutdownMetaProgressionBridge()
  resetMetaProgressionRunContext()
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
  vi.restoreAllMocks()
})

it('does not start, claim, overwrite or load anything just by visiting the menu', () => {
  const { game, persistence, storage } = fixture()
  persistence.refresh()
  expect(game.getState().phase).toBe('menu')
  expect(persistence.getSnapshot().disk.kind).toBe('empty')
  expect(storage.setItem).not.toHaveBeenCalled()
})

it('saves only after explicit new-run intent and never captures an intermediate hand', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  await Promise.resolve()
  expect(f.storage.setItem).not.toHaveBeenCalled()
  expect(await f.persistence.saveNewRun(null)).toBe(true)
  const first = disk(f.repo)
  const during: string[] = []
  eventBus.on('tileDrawn', () => during.push(disk(f.repo).raw))
  expect(play(f.game).success).toBe(true)
  expect(during.length).toBeGreaterThan(0)
  expect(during.every((raw) => raw === first.raw)).toBe(true)
  await f.persistence.flush()
  const saved = disk(f.repo)
  expect(saved.saved.snapshot.state).toEqual(
    JSON.parse(JSON.stringify(f.game.captureRun().state))
  )
  expect(saved.saved.revision).toBe(first.saved.revision + 1)
  expect(f.persistence.getSnapshot().status).toBe('saved')
})

it('coalesces rapid events and captures selection-only changes on explicit flush', async () => {
  const f = fixture()
  f.game.startNewRun(19)
  await f.persistence.saveNewRun(null)
  const selected = f.game
    .getHandTiles()
    .slice(0, 2)
    .map((t) => t.id)
  selected.forEach((id) => f.game.selectTile(id))
  await f.persistence.flush()
  expect(disk(f.repo).saved.snapshot.state.selectedTileIds).toEqual(selected)
  const count = f.storage.setItem.mock.calls.length
  await f.persistence.flush()
  expect(f.storage.setItem).toHaveBeenCalledTimes(count)
  f.game.clearSelection()
  await f.persistence.flush()
  expect(disk(f.repo).saved.snapshot.state.selectedTileIds).toEqual([])
})

it('does not drop a play made while the first checkpoint waits for its write lock', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  const initialWrite = f.persistence.saveNewRun(null)
  expect(play(f.game).success).toBe(true)
  expect(await initialWrite).toBe(true)
  await f.persistence.flush()
  expect(disk(f.repo).saved.snapshot.state.handsPlayedThisRun).toBe(1)
  expect(f.persistence.getSnapshot()).toMatchObject({
    status: 'saved',
    unsaved: false,
  })
})

it('keeps the last valid checkpoint on write failure and can retry without losing the live action', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  await f.persistence.saveNewRun(null)
  const first = disk(f.repo)
  f.storage.setItem.mockImplementationOnce(() => {
    throw new Error('Quota')
  })
  expect(play(f.game).success).toBe(true)
  await f.persistence.flush()
  expect(disk(f.repo).raw).toBe(first.raw)
  expect(f.persistence.getSnapshot()).toMatchObject({
    status: 'unavailable',
    unsaved: true,
  })
  await f.persistence.flush()
  expect(disk(f.repo).saved.snapshot.state.handsPlayedThisRun).toBe(1)
  expect(f.persistence.getSnapshot()).toMatchObject({
    status: 'saved',
    unsaved: false,
  })
})

it('resumes a paid pending pack without replaying purchases or persisted meta rewards', async () => {
  initializeMetaProgressionBridge()
  const f = fixture()
  f.game.startNewRun(7)
  expect(() => parseClassicRunSnapshot(f.game.captureRun())).not.toThrow()
  expect(await f.persistence.saveNewRun(null)).toBe(true)
  const state = f.game.getState() as OrchestratorState
  state.gold = 100
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(play(f.game).success).toBe(true)
  expect(f.game.shop.open()).toBe(true)
  expect(
    f.game.shop.purchase(f.game.shop.state.packOfferings[0].id).success
  ).toBe(true)
  await f.persistence.flush()
  const saved = disk(f.repo)
  const stats = () =>
    structuredClone({
      progression: useProgressionStore.getState().stats,
      achievements: useAchievementStore.getState().stats,
      archive: useArchiveStore.getState().currentRunItems,
    })
  const before = stats()
  f.persistence.dispose()
  const restored = new GameOrchestrator()
  const persistence = new ClassicRunPersistence(restored, f.repository())
  coordinators.push(persistence)
  expect(await persistence.resume(saved.raw)).toBe(true)
  expect(stats()).toEqual(before)
  expect(restored.getState().phase).toBe('shop')
  expect(restored.getState().gold).toBe(saved.saved.snapshot.state.gold)
  expect(restored.shop.pendingPack?.pack.id).toBe(
    saved.saved.snapshot.shop.pendingPackId
  )
  expect(restored.shop.skipPack().success).toBe(true)
  await persistence.flush()
  expect(disk(f.repo).saved.snapshot.shop.pendingPackId).toBeNull()
})

it('a foreign claim visibly revokes the old tab write lease', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  await f.persistence.saveNewRun(null)
  const claimed = await f.repository().claim(disk(f.repo).raw)
  expect(claimed.ok).toBe(true)
  const foreign = disk(f.repo).raw
  f.persistence.refresh()
  expect(f.persistence.getSnapshot().status).toBe('conflict')
  play(f.game)
  await f.persistence.flush()
  expect(disk(f.repo).raw).toBe(foreign)
})

it('temporary read failure is not misreported as a foreign-tab conflict or a lost lease', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  expect(await f.persistence.saveNewRun(null)).toBe(true)
  f.storage.getItem.mockImplementationOnce(() => {
    throw new Error('Denied')
  })
  f.persistence.refresh()
  expect(f.persistence.getSnapshot().status).toBe('unavailable')
  expect(play(f.game).success).toBe(true)
  await f.persistence.flush()
  expect(f.persistence.getSnapshot()).toMatchObject({
    status: 'saved',
    unsaved: false,
  })
  expect(disk(f.repo).saved.snapshot.state.handsPlayedThisRun).toBe(1)
})

it('keeps an obsolete table paused through read and claim failures until a successful resume', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  await f.persistence.saveNewRun(null)
  await f.repository().claim(disk(f.repo).raw)
  const foreign = disk(f.repo).raw
  f.persistence.refresh()
  expect(f.persistence.hasLocalRun).toBe(false)
  f.storage.getItem.mockImplementationOnce(() => {
    throw new Error('Denied')
  })
  f.persistence.refresh()
  expect(f.persistence.getSnapshot()).toMatchObject({
    status: 'unavailable',
    ownershipLost: true,
  })
  expect(f.persistence.hasLocalRun).toBe(false)
  f.storage.setItem.mockImplementationOnce(() => {
    throw new Error('Quota')
  })
  expect(await f.persistence.resume(foreign)).toBe(false)
  expect(f.persistence.hasLocalRun).toBe(false)
  expect(disk(f.repo).raw).toBe(foreign)
  expect(await f.persistence.resume(foreign)).toBe(true)
  expect(f.persistence.getSnapshot().ownershipLost).toBe(false)
  expect(f.persistence.hasLocalRun).toBe(true)
})

it('retrying a failed new-run save retains the original replacement consent', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  f.storage.setItem.mockImplementationOnce(() => {
    throw new Error('Quota')
  })
  expect(await f.persistence.saveNewRun(null)).toBe(false)
  expect(await f.persistence.retrySave()).toBe(true)
  const original = disk(f.repo).raw
  f.game.startNewRun(19)
  f.storage.setItem.mockImplementationOnce(() => {
    throw new Error('Quota')
  })
  expect(await f.persistence.saveNewRun(original)).toBe(false)
  await f.repository().claim(original)
  const newer = disk(f.repo).raw
  expect(await f.persistence.retrySave()).toBe(false)
  expect(f.persistence.getSnapshot()).toMatchObject({
    status: 'conflict',
    ownershipLost: true,
  })
  expect(disk(f.repo).raw).toBe(newer)
})

it('starting another run never silently reuses the existing lease', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  await f.persistence.saveNewRun(null)
  const first = disk(f.repo)
  f.game.startNewRun(19)
  await f.persistence.flush()
  expect(disk(f.repo).raw).toBe(first.raw)
  expect(await f.persistence.saveNewRun(first.raw)).toBe(true)
  expect(disk(f.repo).saved.runId).not.toBe(first.saved.runId)
  expect(disk(f.repo).saved.snapshot.state.seed).toBe(19)
})

it('a failed explicit abandon preserves both live and durable progress', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  await f.persistence.saveNewRun(null)
  const first = disk(f.repo)
  f.storage.removeItem.mockImplementationOnce(() => {
    throw new Error('Denied')
  })
  expect(await f.persistence.discard(first.raw)).toBe(false)
  expect(f.game.getState().isRunActive).toBe(true)
  expect(disk(f.repo).raw).toBe(first.raw)
  expect(await f.persistence.discard(first.raw)).toBe(true)
  expect(f.game.getState().phase).toBe('menu')
  expect(f.repo.read().kind).toBe('empty')
})

it('successful progress reset prevents an already queued checkpoint from resurrecting the save', async () => {
  const f = fixture()
  f.game.startNewRun(7)
  await f.persistence.saveNewRun(null)
  play(f.game)
  const pending = f.persistence.flush()
  f.storage.removeItem(CLASSIC_SAVE_KEY)
  f.persistence.forgetAfterReset()
  f.game.resetGame()
  await pending
  expect(f.repo.read().kind).toBe('empty')
  expect(f.persistence.getSnapshot()).toMatchObject({
    status: 'idle',
    unsaved: false,
  })
})
