import { expect, it, vi } from 'vitest'
import { createTableLoopStore } from './tableLoopStore'
import { TABLE_SAVE_KEY, tileIndices } from '../tableloop/savedRun'
import { RUN_SAVE_EPOCH_KEY } from '../game/runSaveEpoch'

function storage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  }
}
async function fixture() {
  const disk = storage()
  const a = createTableLoopStore(disk)
  a.getState().restart(7)
  a.getState().chooseStarter('echoing_bamboo')
  expect(await a.getState().retrySave()).toBe(true)
  const b = createTableLoopStore(disk)
  return { disk, a, b }
}
function redraw(store: ReturnType<typeof createTableLoopStore>, index = 0) {
  store.getState().toggleTile(store.getState().state.rack[index].id)
  store.getState().redraw()
}

it('refuses stale actions, retries and restarts before they overwrite a newer journal', async () => {
  const { disk, a, b } = await fixture()
  redraw(a)
  await a.getState().retrySave()
  const latest = disk.getItem(TABLE_SAVE_KEY)
  const staleState = b.getState().state
  redraw(b, 1)
  expect(b.getState().state).toBe(staleState)
  expect(b.getState().saveStatus).toBe('conflict')
  expect(await b.getState().retrySave()).toBe(false)
  b.getState().restart(99)
  b.getState().chooseStarter('patient_pair')
  expect(b.getState().state).toBe(staleState)
  expect(disk.getItem(TABLE_SAVE_KEY)).toBe(latest)
})

it('serializes simultaneous checkpoints: exactly one branch wins without a lost update', async () => {
  const { disk, a, b } = await fixture()
  const indices = tileIndices(a.getState().engine, [
    a.getState().state.rack[0].id,
  ])
  redraw(a, 0)
  redraw(b, 1)
  const results = await Promise.all([
    a.getState().retrySave(),
    b.getState().retrySave(),
  ])
  expect(results).toEqual([true, false])
  expect(JSON.parse(disk.getItem(TABLE_SAVE_KEY)!).actions.at(-1)).toEqual({
    type: 'redraw',
    tiles: indices,
  })
  expect(a.getState().saveStatus).toBe('saved')
  expect(b.getState().saveStatus).toBe('conflict')
  // Loading needs explicit caller consent, does not write or replay rewards.
  const write = vi.spyOn(disk, 'setItem')
  const latest = disk.getItem(TABLE_SAVE_KEY)
  expect(await b.getState().loadSavedRun()).toBe(true)
  expect(write).not.toHaveBeenCalled()
  expect(b.getState().state.redrawsRemaining).toBe(
    a.getState().state.redrawsRemaining
  )
  expect(b.getState().selectedTileIds).toEqual([])
  redraw(b, 2)
  expect(await b.getState().retrySave()).toBe(true)
  expect(disk.getItem(TABLE_SAVE_KEY)).not.toBe(latest)
  a.getState().refreshSave()
  expect(a.getState().saveStatus).toBe('conflict')
})

it.each([null, '{broken'])(
  'preserves an externally removed/corrupt record (%s) and never resurrects the old run',
  async (raw) => {
    const { disk, a } = await fixture()
    if (raw === null) disk.removeItem(TABLE_SAVE_KEY)
    else disk.setItem(TABLE_SAVE_KEY, raw)
    a.getState().refreshSave()
    expect(a.getState().saveStatus).toBe('conflict')
    expect(await a.getState().retrySave()).toBe(false)
    expect(disk.getItem(TABLE_SAVE_KEY)).toBe(raw)
    const before = a.getState().state
    expect(await a.getState().loadSavedRun()).toBe(raw === null)
    if (raw === null) {
      expect(a.getState().state.phase).toBe('choosingStart')
      expect(a.getState().state.ownedDecrees).toEqual([])
    } else {
      expect(a.getState().state).toBe(before)
      expect(a.getState().saveStatus).toBe('conflict')
    }
  }
)

it('never treats recovered access as permission to overwrite an unobserved run', async () => {
  const { disk } = await fixture()
  let accessible = false
  const a = createTableLoopStore(() => (accessible ? disk : null))
  a.getState().chooseStarter('patient_pair')
  expect(await a.getState().retrySave()).toBe(false)
  const saved = disk.getItem(TABLE_SAVE_KEY)
  accessible = true
  expect(await a.getState().retrySave()).toBe(false)
  expect(a.getState().saveStatus).toBe('conflict')
  expect(disk.getItem(TABLE_SAVE_KEY)).toBe(saved)
})

it('leaves the live engine and private journal intact if loading the reset marker fails', async () => {
  const { disk, a } = await fixture()
  const original = disk.getItem(TABLE_SAVE_KEY)!
  const state = a.getState().state
  // A readable foreign journal followed by a denied metadata read must not
  // partially replace the private journal behind the unchanged live engine.
  const foreignDisk = storage()
  const foreign = createTableLoopStore(foreignDisk)
  foreign.getState().restart(99)
  foreign.getState().chooseStarter('patient_pair')
  await foreign.getState().retrySave()
  disk.setItem(TABLE_SAVE_KEY, foreignDisk.getItem(TABLE_SAVE_KEY)!)
  const read = disk.getItem.bind(disk)
  const denied = vi.spyOn(disk, 'getItem').mockImplementation((key) => {
    if (key === RUN_SAVE_EPOCH_KEY) throw new Error('Read denied')
    return read(key)
  })
  expect(await a.getState().loadSavedRun()).toBe(false)
  expect(a.getState().state).toBe(state)
  denied.mockRestore()
  disk.setItem(TABLE_SAVE_KEY, original)
  redraw(a)
  expect(await a.getState().retrySave()).toBe(true)
  const result = JSON.parse(disk.getItem(TABLE_SAVE_KEY)!)
  expect(result.seed).toBe(JSON.parse(original).seed)
  expect(result.actions[0]).toEqual({
    type: 'chooseStarter',
    decree: 'echoing_bamboo',
  })
})

it('cancels queued writes when a foreign storage notification revokes the branch', async () => {
  const { disk, a } = await fixture()
  redraw(a)
  disk.setItem(TABLE_SAVE_KEY, '{foreign}')
  a.getState().refreshSave()
  expect(await a.getState().retrySave()).toBe(false)
  await Promise.resolve()
  expect(disk.getItem(TABLE_SAVE_KEY)).toBe('{foreign}')
})

it('deletes under the same lock and never lets a queued save resurrect that journal', async () => {
  const { disk, a, b } = await fixture()
  redraw(a)
  await a.getState().clearSavedRun()
  expect(disk.getItem(TABLE_SAVE_KEY)).toBeNull()
  redraw(b)
  expect(await b.getState().retrySave()).toBe(false)
  expect(disk.getItem(TABLE_SAVE_KEY)).toBeNull()
  a.getState().chooseStarter('patient_pair')
  expect(await a.getState().retrySave()).toBe(true)
  expect(JSON.parse(disk.getItem(TABLE_SAVE_KEY)!).actions).toEqual([
    { type: 'chooseStarter', decree: 'patient_pair' },
  ])
})

it('reports unsupported locking without an unsafe fallback or false saved state', async () => {
  const disk = storage()
  const store = createTableLoopStore(disk, () =>
    Promise.reject(new Error('No locks'))
  )
  store.getState().chooseStarter('echoing_bamboo')
  expect(await store.getState().retrySave()).toBe(false)
  expect(store.getState().saveStatus).toBe('unavailable')
  expect(store.getState().unsaved).toBe(true)
  expect(disk.getItem(TABLE_SAVE_KEY)).toBeNull()
})

it('rejects an obsolete checkpoint even if another window restarts the same seed and repeats every action', async () => {
  const { disk, a, b } = await fixture()
  const original = disk.getItem(TABLE_SAVE_KEY)!
  a.getState().restart(7)
  a.getState().chooseStarter('echoing_bamboo')
  expect(await a.getState().retrySave()).toBe(true)
  const fresh = disk.getItem(TABLE_SAVE_KEY)!
  expect(JSON.parse(fresh).actions).toEqual(JSON.parse(original).actions)
  expect(JSON.parse(fresh).seed).toBe(JSON.parse(original).seed)
  expect(JSON.parse(fresh).checkpointId).not.toBe(
    JSON.parse(original).checkpointId
  )
  redraw(b)
  expect(await b.getState().retrySave()).toBe(false)
  expect(disk.getItem(TABLE_SAVE_KEY)).toBe(fresh)
})

it('fences a queued first-ever save across an empty-to-empty reset', async () => {
  const disk = storage()
  let release!: () => void
  const barrier = new Promise<void>((resolve) => {
    release = resolve
  })
  const store = createTableLoopStore(disk, async (operation) => {
    await barrier
    return operation()
  })
  store.getState().chooseStarter('echoing_bamboo')
  const pending = store.getState().retrySave()
  disk.setItem(RUN_SAVE_EPOCH_KEY, 'reset-after-save-request')
  release()
  expect(await pending).toBe(false)
  expect(store.getState().saveStatus).toBe('conflict')
  expect(disk.getItem(TABLE_SAVE_KEY)).toBeNull()
  expect(await store.getState().loadSavedRun()).toBe(true)
  store.getState().chooseStarter('patient_pair')
  expect(await store.getState().retrySave()).toBe(true)
})
