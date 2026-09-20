import { describe, expect, it } from 'vitest'
import { Tile } from '../core/Tile'
import { createTableLoopStore } from '../stores/tableLoopStore'
import { TableLoopEngine, allTrackedTileIds } from './TableLoopEngine'
import { enumerateRackGroups } from './groupRules'
import { getTableDecree } from './content'
import {
  applySavedAction,
  newSavedRun,
  restoreSavedRun,
  tileIndices,
  TABLE_SAVE_KEY,
  type SavedAction,
} from './savedRun'

function merchant(draft = false) {
  const engine = new TableLoopEngine(12, { draftEnabled: draft })
  engine.chooseStarter('echoing_bamboo')
  const state = engine.getState()
  // Rule boundary fixture; the separate journal case earns the Decree in a shop.
  return TableLoopEngine.fromState({
    ...state,
    ownedDecrees: [...state.ownedDecrees, 'river_merchant'],
    riverRecoveriesRemaining: 1,
    river: state.wall.slice(0, 2),
    wall: state.wall.slice(2),
  })
}

function physical(engine: TableLoopEngine) {
  const state = engine.getState()
  const index = (tiles: readonly Tile[]) =>
    tileIndices(
      engine,
      tiles.map((tile) => tile.id)
    )
  return {
    rack: index(state.rack),
    river: index(state.river),
    wall: index(state.wall),
    score: state.score,
    gold: state.gold,
    actions: state.placementActionsRemaining,
    redraws: state.redrawsRemaining,
    swaps: state.riverRecoveriesRemaining,
    pending: state.pendingDraftPick,
    phase: state.phase,
  }
}

describe('Whispering Merchant rack-for-river swap', () => {
  it.each([false, true])(
    'works with a full rack, costs no action, and preserves physical tiles (empty wall=%s)',
    (emptyWall) => {
      let engine = merchant()
      if (emptyWall) {
        const state = engine.getState()
        engine = TableLoopEngine.fromState({
          ...state,
          river: [...state.river, ...state.wall],
          wall: [],
        })
      }
      const before = engine.getState()
      const given = before.rack[2],
        taken = before.river[1]
      expect(before.rack.length).toBe(before.rackSize)
      const result = engine.swapWithRiver(taken.id, given.id)
      expect(result.success).toBe(true)
      const after = engine.getState()
      expect(after.rack[2]).toBe(taken)
      expect(after.river[1]).toBe(given)
      expect(after.rack.length).toBe(before.rack.length)
      expect(after.river.length).toBe(before.river.length)
      expect(after.wall).toEqual(before.wall)
      expect(after.placementActionsRemaining).toBe(
        before.placementActionsRemaining
      )
      expect(after.redrawsRemaining).toBe(before.redrawsRemaining)
      expect(after.gold).toBe(before.gold)
      expect(after.score).toBe(before.score)
      expect(after.riverRecoveriesRemaining).toBe(0)
      expect(new Set(allTrackedTileIds(after)).size).toBe(
        after.collection.length
      )
      expect(allTrackedTileIds(after).length).toBe(after.collection.length)
      expect(engine.swapWithRiver(given.id, taken.id).success).toBe(false)
      expect(engine.getState()).toBe(after)
    }
  )

  it.each([
    'missingRack',
    'missingRiver',
    'noDecree',
    'spent',
    'roundOver',
  ] as const)('rejects %s without declining a pending offer', (reason) => {
    const initial = merchant(true).getState()
    const engine = TableLoopEngine.fromState({
      ...initial,
      pendingDraftPick: true,
      rack: initial.rack.slice(0, -1),
      wall: [initial.rack[initial.rack.length - 1], ...initial.wall],
      ownedDecrees: reason === 'noDecree' ? [] : initial.ownedDecrees,
      riverRecoveriesRemaining: reason === 'spent' ? 0 : 1,
      phase: reason === 'roundOver' ? 'roundCleared' : 'playing',
    })
    const before = engine.getState()
    expect(
      engine.swapWithRiver(
        reason === 'missingRiver' ? 'missing' : before.river[0].id,
        reason === 'missingRack' ? 'missing' : before.rack[0].id
      ).success
    ).toBe(false)
    expect(engine.getState()).toBe(before)
  })

  it('declines an unanswered offer only on an accepted swap', () => {
    const initial = merchant(true).getState()
    const engine = TableLoopEngine.fromState({
      ...initial,
      pendingDraftPick: true,
      rack: initial.rack.slice(0, -1),
      wall: [initial.rack[initial.rack.length - 1], ...initial.wall],
    })
    const before = engine.getState()
    const result = engine.swapWithRiver(before.river[0].id, before.rack[0].id)
    expect(result.success).toBe(true)
    expect(result.state.pendingDraftPick).toBe(false)
    expect(result.state.rack.length).toBe(before.rackSize)
    expect(result.state.rack).toContain(before.wall[0])
    expect(result.state.wall).toEqual(before.wall.slice(1))
    expect(result.state.draftRow).toEqual(before.draftRow)
  })

  it('renews the allowance on the next round and preserves tile modifiers', () => {
    const engine = merchant()
    const before = engine.getState()
    expect(
      engine.swapWithRiver(before.river[0].id, before.rack[0].id).success
    ).toBe(true)
    const between = TableLoopEngine.fromState({
      ...engine.getState(),
      phase: 'roundCleared',
    })
    expect(between.nextRound().state.riverRecoveriesRemaining).toBe(1)
    expect(between.getState().collection).toEqual(before.collection)
  })

  it('migrates a real version-1 run, journals a paid Merchant swap, and restores its once-only result', () => {
    const engine = new TableLoopEngine(12)
    const journal = newSavedRun(engine)
    for (let step = 0; step < 100; step++) {
      const state = engine.getState()
      if (
        state.phase === 'playing' &&
        state.ownedDecrees.includes('river_merchant')
      )
        break
      let action: SavedAction
      if (state.phase === 'choosingStart')
        action = { type: 'chooseStarter', decree: 'echoing_bamboo' }
      else if (state.phase === 'roundCleared') action = { type: 'openShop' }
      else if (state.phase === 'shop') {
        const offer = state.shopOffers.find(
          (id) => getTableDecree(id).cost <= state.gold
        )
        action = offer
          ? { type: 'buyDecree', decree: offer }
          : { type: 'nextRound' }
      } else if (state.score >= state.round.target)
        action = { type: 'finishRound' }
      else {
        const candidate = enumerateRackGroups(state.rack, {
          allowGap: state.gapBridgesRemaining > 0,
        })
          .flatMap((tiles) =>
            state.slots.map((slot) => ({
              tiles,
              slot: slot.index,
              total:
                engine.previewPlacement(
                  tiles.map((tile) => tile.id),
                  slot.index
                )?.total ?? -1,
            }))
          )
          .filter((item) => item.total >= 0)
          .sort((a, b) => b.total - a.total)[0]
        action = candidate
          ? {
              type: state.slots[candidate.slot].group ? 'revise' : 'place',
              tiles: tileIndices(
                engine,
                candidate.tiles.map((tile) => tile.id)
              ),
              slot: candidate.slot,
            }
          : {
              type: 'redraw',
              tiles: tileIndices(
                engine,
                state.rack.slice(0, 3).map((tile) => tile.id)
              ),
            }
      }
      expect(applySavedAction(engine, action).success).toBe(true)
      journal.actions.push(action)
    }
    expect(engine.getState().ownedDecrees).toContain('river_merchant')
    expect(engine.getState().phase).toBe('playing')
    let raw: string | null = JSON.stringify({ ...journal, version: 1 })
    const oldRaw = raw
    const storage = {
      getItem: (_key: string) => raw,
      setItem: (_key: string, value: string) => {
        raw = value
      },
      removeItem: () => {
        raw = null
      },
    }
    const store = createTableLoopStore(storage)
    expect(raw).toBe(oldRaw) // Reading alone never rewrites an existing save.
    const tile = store.getState().state.rack[0]
    store.getState().toggleTile(tile.id)
    store.getState().redraw() // A real discard creates a river tile without a fixture grant.
    const offered = store.getState().state.river[0]
    const given = store.getState().state.rack[1]
    const before = physical(store.getState().engine)
    store.getState().swapWithRiver(offered.id)
    expect(physical(store.getState().engine)).toEqual(before) // No selection.
    store.getState().toggleTile(given.id)
    expect(store.getState().swapWithRiver(offered.id)).toBe(true)
    expect(store.getState().selectedTileIds).toEqual([])
    expect(JSON.parse(raw!).version).toBe(2)
    expect(JSON.parse(raw!).actions.at(-1).type).toBe('swapWithRiver')
    const restored = createTableLoopStore(storage)
    expect(physical(restored.getState().engine)).toEqual(
      physical(store.getState().engine)
    )
    expect(restored.getState().state.riverRecoveriesRemaining).toBe(0)
    expect(
      restoreSavedRun(JSON.stringify({ ...JSON.parse(raw!), version: 1 }))
    ).toBeNull()
    const invalid = JSON.parse(raw!)
    invalid.actions[invalid.actions.length - 1].rackTile = -1
    expect(restoreSavedRun(JSON.stringify(invalid))).toBeNull()
    expect(storage.getItem(TABLE_SAVE_KEY)).toBe(raw)
  })
})
