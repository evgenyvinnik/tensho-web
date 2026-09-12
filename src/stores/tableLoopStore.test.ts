import { describe, expect, it } from 'vitest'
import { createTableLoopStore } from './tableLoopStore'
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
  it('saves committed actions but not transient selections or rejected actions', () => {
    const storage = memoryStorage()
    const store = createTableLoopStore(storage)
    store.getState().restart(7)
    store.getState().chooseStarter('echoing_bamboo')
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

  it('keeps the game playable and reports unavailable storage', () => {
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
    expect(store.getState().saveStatus).toBe('unavailable')
  })

  it('does not erase an invalid save until a new run action replaces it', () => {
    const storage = memoryStorage()
    storage.setItem(TABLE_SAVE_KEY, '{invalid')
    const store = createTableLoopStore(storage)
    expect(store.getState().saveStatus).toBe('invalid')
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe('{invalid')
    store.getState().chooseStarter('echoing_bamboo')
    expect(store.getState().saveStatus).toBe('saved')
    expect(createTableLoopStore(storage).getState().state.phase).toBe('playing')
  })

  it('starts a fresh journal on restart and preserves the chosen variant', () => {
    const storage = memoryStorage()
    const store = createTableLoopStore(storage)
    store.getState().restart(7, { draftEnabled: true })
    store.getState().chooseStarter('echoing_bamboo')
    store.getState().restart(8)
    const resumed = createTableLoopStore(storage).getState()
    expect(resumed.state.phase).toBe('choosingStart')
    expect(resumed.state.seed).toBe(8)
    expect(resumed.state.draftEnabled).toBe(true)
    expect(resumed.state.ownedDecrees).toEqual([])
  })
})
