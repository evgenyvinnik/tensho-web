import { describe, expect, it } from 'vitest'
import { TableLoopEngine, allTrackedTileIds } from './TableLoopEngine'
import { enumerateRackGroups } from './groupRules'
import { getTableDecree } from './content'
import { Tile } from '../core/Tile'
import {
  applySavedAction,
  newSavedRun,
  restoreSavedRun,
  tileIndices,
  type SavedAction,
} from './savedRun'

function comparable(engine: TableLoopEngine) {
  const state = engine.getState()
  const ids = new Map(
    state.collection.map((tile, index) => [tile.id, `tile-${index}`])
  )
  return JSON.parse(
    JSON.stringify(state, (_key, value) =>
      typeof value === 'string' ? (ids.get(value) ?? value) : value
    )
  )
}

describe('Table Loop saved runs', () => {
  it.each([false, true])(
    'restores a full seeded run after every action (draft=%s)',
    (draftEnabled) => {
      const engine = new TableLoopEngine(7, { draftEnabled })
      const journal = newSavedRun(engine)
      const visited = new Set<string>()
      for (let step = 0; step < 100; step++) {
        const state = engine.getState()
        visited.add(state.phase)
        let action: SavedAction
        if (state.phase === 'choosingStart')
          action = { type: 'chooseStarter', decree: 'echoing_bamboo' }
        else if (state.phase === 'roundCleared') action = { type: 'openShop' }
        else if (state.phase === 'shop') {
          const affordable = state.shopOffers.find(
            (id) => getTableDecree(id).cost <= state.gold
          )
          action = affordable
            ? { type: 'buyDecree', decree: affordable }
            : { type: 'nextRound' }
        } else if (state.phase === 'playing') {
          if (state.pendingDraftPick)
            action = {
              type: 'claimDraft',
              tile: tileIndices(engine, [state.draftRow[0].id])[0],
            }
          else if (state.score >= state.round.target)
            action = { type: 'finishRound' }
          else {
            const candidates = enumerateRackGroups(state.rack, {
              allowGap: state.gapBridgesRemaining > 0,
            })
              .flatMap((group) =>
                state.slots.map((slot) => ({
                  group,
                  slot: slot.index,
                  score:
                    engine.previewPlacement(
                      group.map((tile) => tile.id),
                      slot.index
                    )?.total ?? -1,
                }))
              )
              .filter((candidate) => candidate.score >= 0)
              .sort((a, b) => b.score - a.score)
            const best = candidates[0]
            action = best
              ? {
                  type: state.slots[best.slot].group ? 'revise' : 'place',
                  tiles: tileIndices(
                    engine,
                    best.group.map((tile) => tile.id)
                  ),
                  slot: best.slot,
                }
              : {
                  type: 'redraw',
                  tiles: tileIndices(
                    engine,
                    state.rack.slice(0, 3).map((tile) => tile.id)
                  ),
                }
          }
        } else break

        expect(
          applySavedAction(engine, action).success,
          JSON.stringify(action)
        ).toBe(true)
        journal.actions.push(action)
        const restored = restoreSavedRun(JSON.stringify(journal))
        expect(restored).not.toBeNull()
        expect(comparable(restored!.engine)).toEqual(comparable(engine))
        expect(
          restored!.engine
            .getState()
            .collection.every((tile) => tile instanceof Tile)
        ).toBe(true)
        const tracked = allTrackedTileIds(restored!.engine.getState())
        expect(new Set(tracked).size).toBe(tracked.length)
      }
      expect(visited.has('shop')).toBe(true)
      expect(['runComplete', 'runFailed']).toContain(engine.getState().phase)
    }
  )

  it('restores an authored practice deal and its earned upgrade', () => {
    const engine = new TableLoopEngine(123, { practice: true })
    const journal = newSavedRun(engine)
    for (const slot of [0, 1]) {
      const group = enumerateRackGroups(engine.getState().rack).find(
        (tiles) => tiles.length === 3
      )!
      const action: SavedAction = {
        type: 'place',
        slot,
        tiles: tileIndices(
          engine,
          group.map((tile) => tile.id)
        ),
      }
      expect(applySavedAction(engine, action).success).toBe(true)
      journal.actions.push(action)
    }
    const action: SavedAction = { type: 'takePracticeDecree' }
    expect(applySavedAction(engine, action).success).toBe(true)
    journal.actions.push(action)
    const restored = restoreSavedRun(JSON.stringify(journal))!
    expect(comparable(restored.engine)).toEqual(comparable(engine))
    expect(restored.engine.getState().ownedDecrees).toContain('echoing_bamboo')
  })

  it.each(['null', '{', '[]', '{}', 'x'.repeat(100_001)])(
    'rejects malformed input',
    (raw) => {
      expect(restoreSavedRun(raw)).toBeNull()
    }
  )

  it('rejects incompatible versions, invalid actions and oversized journals', () => {
    const valid = newSavedRun(new TableLoopEngine(7))
    for (const patch of [
      { version: 2 },
      { seed: 1.5 },
      { practice: 'yes' },
      { actions: [{ type: 'grantForMeasurement', decree: 'wide_rack' }] },
      { actions: [{ type: 'chooseStarter', decree: 'not-real' }] },
      { actions: [{ type: 'place', tiles: [0, 0], slot: 0 }] },
      { actions: [{ type: 'redraw', tiles: [-1] }] },
      { actions: [{ type: 'finishRound' }] },
      { actions: Array(257).fill({ type: 'passDraft' }) },
    ])
      expect(restoreSavedRun(JSON.stringify({ ...valid, ...patch }))).toBeNull()
  })
})
