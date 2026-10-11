import { describe, expect, it, vi } from 'vitest'
import { createTableLoopStore, useTableLoopStore } from './tableLoopStore'
import { TABLE_SAVE_KEY } from '../tableloop/savedRun'

function memoryStorage() {
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

describe('Table Loop persistence binding', () => {
  it.each(['null', 'throw'])(
    'recovers when initially unavailable storage (%s) becomes accessible',
    async (failure) => {
      const storage = memoryStorage()
      let accessible = false
      const provider = () => {
        if (accessible) return storage
        if (failure === 'throw') throw new Error('access denied')
        return null
      }
      const store = createTableLoopStore(provider)
      expect(store.getState().saveStatus).toBe('unavailable')
      store.getState().chooseStarter('echoing_bamboo')
      const live = store.getState().state
      expect(live.phase).toBe('playing')
      expect(await store.getState().retrySave()).toBe(false)
      expect(storage.getItem(TABLE_SAVE_KEY)).toBeNull()
      accessible = true
      expect(await store.getState().retrySave()).toBe(true)
      expect(store.getState().unsaved).toBe(false)
      expect(store.getState().state).toBe(live)
      expect(JSON.parse(storage.getItem(TABLE_SAVE_KEY)!).actions).toEqual([
        { type: 'chooseStarter', decree: 'echoing_bamboo' },
      ])
      expect(
        createTableLoopStore(storage).getState().state.ownedDecrees
      ).toEqual(['echoing_bamboo'])
    }
  )

  it('warns before unload only while a committed journal remains unsaved', async () => {
    const storage = memoryStorage()
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(storage.getItem)
    const write = vi.spyOn(window.localStorage, 'setItem')
    write.mockImplementation(storage.setItem)
    try {
      useTableLoopStore.getState().forgetAfterReset()
      useTableLoopStore.getState().restart(7)
      await useTableLoopStore.getState().retrySave()
      const clean = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(clean)
      expect(clean.defaultPrevented).toBe(false)
      write.mockImplementationOnce(() => {
        throw new Error('full')
      })
      useTableLoopStore.getState().chooseStarter('echoing_bamboo')
      await useTableLoopStore.getState().retrySave()
      const dirty = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(dirty)
      expect(dirty.defaultPrevented).toBe(true)
      expect(await useTableLoopStore.getState().retrySave()).toBe(true)
      const recovered = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(recovered)
      expect(recovered.defaultPrevented).toBe(false)
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('preserves the live run if access is withdrawn before an explicit reset', async () => {
    const storage = memoryStorage()
    let accessible = true
    const store = createTableLoopStore(() => (accessible ? storage : null))
    store.getState().restart(7)
    store.getState().chooseStarter('echoing_bamboo')
    await store.getState().retrySave()
    const live = store.getState()
    const saved = storage.getItem(TABLE_SAVE_KEY)
    accessible = false
    await expect(store.getState().clearSavedRun()).rejects.toThrow(
      'Storage unavailable'
    )
    expect(store.getState()).toBe(live)
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe(saved)
    accessible = true
    await store.getState().clearSavedRun()
    expect(store.getState().unsaved).toBe(false)
    expect(store.getState().state.phase).toBe('choosingStart')
    expect(storage.getItem(TABLE_SAVE_KEY)).toBeNull()
  })
  it('retries the exact unsaved journal without replaying actions or rewards', async () => {
    const storage = memoryStorage()
    const write = vi.spyOn(storage, 'setItem')
    const store = createTableLoopStore(storage)
    store.getState().restart(7)
    await store.getState().retrySave()
    const original = storage.getItem(TABLE_SAVE_KEY)
    write.mockImplementationOnce(() => {
      throw new Error('full')
    })
    store.getState().chooseStarter('echoing_bamboo')
    await store.getState().retrySave()
    const state = store.getState().state
    expect(store.getState().unsaved).toBe(true)
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe(original)
    write.mockImplementationOnce(() => {
      throw new Error('still full')
    })
    expect(await store.getState().retrySave()).toBe(false)
    expect(store.getState().unsaved).toBe(true)
    expect(await store.getState().retrySave()).toBe(true)
    expect(store.getState().state).toBe(state)
    expect(store.getState().unsaved).toBe(false)
    expect(JSON.parse(storage.getItem(TABLE_SAVE_KEY)!).actions).toEqual([
      { type: 'chooseStarter', decree: 'echoing_bamboo' },
    ])
    const writes = write.mock.calls.length
    expect(await store.getState().retrySave()).toBe(true)
    expect(write).toHaveBeenCalledTimes(writes)
    expect(createTableLoopStore(storage).getState().state.ownedDecrees).toEqual(
      ['echoing_bamboo']
    )
  })

  it('does not fabricate a save or replace invalid data for an untouched run', async () => {
    const storage = memoryStorage()
    storage.setItem(TABLE_SAVE_KEY, '{invalid')
    const store = createTableLoopStore(storage)
    const write = vi.spyOn(storage, 'setItem')
    expect(await store.getState().retrySave()).toBe(true)
    expect(store.getState().unsaved).toBe(false)
    expect(write).not.toHaveBeenCalled()
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe('{invalid')
  })

  it('blocks reload after a committed action when storage is unavailable', async () => {
    const store = createTableLoopStore(null)
    expect(await store.getState().retrySave()).toBe(true)
    store.getState().chooseStarter('echoing_bamboo')
    expect(await store.getState().retrySave()).toBe(false)
    expect(store.getState().unsaved).toBe(true)
    expect(store.getState().state.phase).toBe('playing')
  })
  it('saves committed actions but not transient selections or rejected actions', async () => {
    const storage = memoryStorage()
    const store = createTableLoopStore(storage)
    store.getState().restart(7)
    store.getState().chooseStarter('echoing_bamboo')
    await store.getState().retrySave()
    const tile = store.getState().state.rack[0]
    const saved = storage.getItem(TABLE_SAVE_KEY)
    store.getState().toggleTile(tile.id)
    store.getState().place(0)
    expect(store.getState().state.lastError).toBeTruthy()
    expect(store.getState().selectedTileIds).toEqual([tile.id])
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe(saved)
    const resumed = createTableLoopStore(storage).getState()
    expect(resumed.state.phase).toBe('playing')
    expect(resumed.state.ownedDecrees).toEqual(['echoing_bamboo'])
    expect(resumed.selectedTileIds).toEqual([])
    expect(resumed.state.lastError).toBeNull()
  })

  it('keeps the game playable and reports unavailable storage', async () => {
    const store = createTableLoopStore({
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    })
    store.getState().restart(7)
    store.getState().chooseStarter('echoing_bamboo')
    expect(store.getState().state.phase).toBe('playing')
    await store.getState().retrySave()
    expect(store.getState().saveStatus).toBe('unavailable')
  })

  it('does not erase an invalid save until a new run action replaces it', async () => {
    const storage = memoryStorage()
    storage.setItem(TABLE_SAVE_KEY, '{invalid')
    const store = createTableLoopStore(storage)
    expect(store.getState().saveStatus).toBe('invalid')
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe('{invalid')
    store.getState().chooseStarter('echoing_bamboo')
    await store.getState().retrySave()
    expect(store.getState().saveStatus).toBe('saved')
    expect(createTableLoopStore(storage).getState().state.phase).toBe('playing')
  })

  it('starts a fresh journal on restart and preserves the chosen variant', async () => {
    const storage = memoryStorage()
    const store = createTableLoopStore(storage)
    store.getState().restart(7, { draftEnabled: true })
    store.getState().chooseStarter('echoing_bamboo')
    store.getState().restart(8)
    await store.getState().retrySave()
    const resumed = createTableLoopStore(storage).getState()
    expect(resumed.state.phase).toBe('choosingStart')
    expect(resumed.state.seed).toBe(8)
    expect(resumed.state.draftEnabled).toBe(true)
    expect(resumed.state.ownedDecrees).toEqual([])
  })
})
