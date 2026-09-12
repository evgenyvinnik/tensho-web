import { describe, expect, it, vi, afterEach } from 'vitest'
import { audioSystem } from '../systems/AudioSystem'
import { createTableLoopStore } from '../stores/tableLoopStore'
import { playTableAction } from './audioFeedback'
import { TileSuit } from '../core/Tile'
import type { TableLoopState, CausalStage } from './types'

afterEach(() => vi.restoreAllMocks())

describe('Table Loop live sound feedback', () => {
  it.each([
    [[], 'game_hand_played'],
    [[{ kind: 'milestone' }], 'special_yaku_scored'],
    [[{ kind: 'milestone' }, { kind: 'completion' }], 'special_yakuman'],
  ] as const)(
    'chooses one intensity from the actual resolution %j',
    (stages, cue) => {
      const play = vi.spyOn(audioSystem, 'play')
      const state = {
        phase: 'playing',
        lastResolution: stages as unknown as CausalStage[],
      } as Pick<TableLoopState, 'phase' | 'lastResolution'>
      playTableAction({ type: 'place', tiles: [], slot: 0 }, true, state)
      expect(play).toHaveBeenCalledExactlyOnceWith(cue, undefined)
    }
  )

  it('never replays cues while restoring a run or inspecting a forecast', () => {
    const play = vi.spyOn(audioSystem, 'play')
    let saved: string | null = null
    const storage = {
      getItem: () => saved,
      setItem: (_key: string, value: string) => {
        saved = value
      },
      removeItem: () => {
        saved = null
      },
    }
    const store = createTableLoopStore(storage)
    store.getState().restart(7, { practice: true })
    const run = store
      .getState()
      .state.rack.filter(
        (tile) => tile.suit === TileSuit.Souzu && [3, 4, 5].includes(tile.rank)
      )
    expect(run).toHaveLength(3)
    run.forEach((tile) => store.getState().toggleTile(tile.id))
    play.mockClear()
    expect(store.getState().previewPlacement(0)).not.toBeNull()
    expect(play).not.toHaveBeenCalled()
    store.getState().place(0)
    expect(play).toHaveBeenCalledWith('game_hand_played', undefined)
    play.mockClear()
    const restored = createTableLoopStore(storage)
    expect(restored.getState().state.score).toBe(store.getState().state.score)
    expect(play).not.toHaveBeenCalled()
    restored.getState().place(1)
    expect(play).toHaveBeenCalledExactlyOnceWith('feedback_invalid', undefined)
  })
})
