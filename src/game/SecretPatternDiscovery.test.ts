import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlayPatternId } from '../rules/PlayPattern'
import { useProgressionStore } from '../stores/progressionStore'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'

beforeEach(() => {
  useProgressionStore.getState().resetProgression()
  initializeMetaProgressionBridge()
})

afterEach(() => {
  shutdownMetaProgressionBridge()
  eventBus.clear()
  useProgressionStore.getState().resetProgression()
})

const played = (pattern: PlayPatternId) =>
  eventBus.emit('handPlayed', {
    tiles: ['a', 'b', 'c', 'd'],
    score: 1000,
    yakuIds: [],
    equation: { points: 500, multiplier: 2, adjustment: 0, total: 1000 },
    pattern,
  })

describe('secret hand discovery', () => {
  it('records a secret hand and announces it on its first play only', () => {
    const found = vi.fn()
    eventBus.on('secretPatternDiscovered', found)
    played('four_winds')
    played('four_winds')
    expect(found).toHaveBeenCalledOnce()
    expect(found).toHaveBeenCalledWith({ pattern: 'four_winds' })
    expect(useProgressionStore.getState().discoveredPatterns).toEqual([
      'four_winds',
    ])
  })

  it('ignores every pattern the guide already teaches', () => {
    const found = vi.fn()
    eventBus.on('secretPatternDiscovered', found)
    played('quad')
    played('mahjong')
    expect(found).not.toHaveBeenCalled()
    expect(useProgressionStore.getState().discoveredPatterns).toEqual([])
  })

  it('is forgotten by a progress reset', () => {
    played('three_dragons')
    useProgressionStore.getState().resetProgression()
    expect(useProgressionStore.getState().discoveredPatterns).toEqual([])
    expect(useProgressionStore.getState().discoverPattern('three_dragons'))
      .toBe(true)
  })
})
