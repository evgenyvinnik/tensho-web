import { describe, expect, it } from 'vitest'
import { TableLoopEngine } from './TableLoopEngine'
import { enumerateRackGroups } from './groupRules'
import { createTableLoopStore } from '../stores/tableLoopStore'
import { TABLE_SAVE_KEY } from './savedRun'

function waitingForOffer() {
  const engine = new TableLoopEngine(7, { draftEnabled: true })
  engine.chooseStarter('echoing_bamboo')
  const group = enumerateRackGroups(engine.getState().rack).find((tiles) =>
    engine.previewPlacement(
      tiles.map((tile) => tile.id),
      0
    )
  )!
  expect(
    engine.place(
      group.map((tile) => tile.id),
      0
    ).success
  ).toBe(true)
  expect(engine.getState().pendingDraftPick).toBe(true)
  return engine
}

describe('rejected Table Loop actions are transactional', () => {
  it.each([
    [
      'invalid group',
      (engine: TableLoopEngine) =>
        engine.place([engine.getState().rack[0].id], 1),
    ],
    ['occupied slot', (engine: TableLoopEngine) => engine.place([], 0)],
    ['empty revision', (engine: TableLoopEngine) => engine.revise([], 1)],
    ['empty exchange', (engine: TableLoopEngine) => engine.redraw([])],
    [
      'oversized exchange',
      (engine: TableLoopEngine) =>
        engine.redraw(
          engine
            .getState()
            .rack.slice(0, 4)
            .map((tile) => tile.id)
        ),
    ],
    [
      'unknown exchange tile',
      (engine: TableLoopEngine) => engine.redraw(['missing']),
    ],
    [
      'unavailable river recovery',
      (engine: TableLoopEngine) => engine.recoverFromRiver('missing'),
    ],
  ] as const)('keeps a pending offer after %s', (_label, act) => {
    const engine = waitingForOffer()
    const before = engine.getState()
    const snapshot = JSON.stringify(before)
    const result = act(engine)
    expect(result.success).toBe(false)
    expect(engine.getState()).toBe(before)
    expect(JSON.stringify(engine.getState())).toBe(snapshot)
    expect(result.state).toEqual({
      ...before,
      lastError: result.error,
      lastErrorKey: result.errorKey,
    })
    // The visible offer is still claimable, once, with no wall tile pre-drawn.
    const offer = before.draftRow[0]
    expect(engine.claimDraft(offer.id).success).toBe(true)
    expect(engine.getState().rack.map((tile) => tile.id)).toEqual([
      ...before.rack.map((tile) => tile.id),
      offer.id,
    ])
    expect(engine.claimDraft(offer.id).success).toBe(false)
  })

  it('keeps the live store and saved pending choice aligned after rejection', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value)
      },
      removeItem: (key: string) => {
        data.delete(key)
      },
    }
    const store = createTableLoopStore(storage)
    store.getState().restart(7, { draftEnabled: true })
    store.getState().chooseStarter('echoing_bamboo')
    const group = enumerateRackGroups(store.getState().state.rack).find(
      (tiles) =>
        store.getState().engine.previewPlacement(
          tiles.map((tile) => tile.id),
          0
        )
    )!
    for (const tile of group) store.getState().toggleTile(tile.id)
    store.getState().place(0)
    const before = store.getState().state
    const saved = storage.getItem(TABLE_SAVE_KEY)
    store.getState().redraw()
    expect(store.getState().state.lastError).toBeTruthy()
    expect(store.getState().state.pendingDraftPick).toBe(true)
    expect(store.getState().state.rack).toEqual(before.rack)
    expect(store.getState().state.wall).toEqual(before.wall)
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe(saved)
    const restored = createTableLoopStore(storage).getState()
    expect(restored.state.pendingDraftPick).toBe(true)
    expect(restored.state.rack.map((tile) => [tile.suit, tile.rank])).toEqual(
      before.rack.map((tile) => [tile.suit, tile.rank])
    )
    expect(restored.state.wall.length).toBe(before.wall.length)
  })
})
