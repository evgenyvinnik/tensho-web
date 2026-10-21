import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventBus } from './EventBus'
import { gameOrchestrator } from './GameOrchestrator'
import {
  installFloraRevealQueue,
  nextWallDraw,
  useFloraRevealQueue,
} from './floraRevealQueue'
import {
  installDecreeRevealQueue,
  useDecreeRevealQueue,
} from './decreeRevealQueue'
import { useCelebrationHold } from './celebrationHold'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { useOmenStore } from '../stores/omenStore'
import { runRandom } from './RunRandom'

let uninstall: Array<() => void> = []

beforeEach(() => {
  gameOrchestrator.startNewRun(7)
  uninstall = [installFloraRevealQueue(), installDecreeRevealQueue()]
  useFloraRevealQueue.setState({ queue: [] })
  useDecreeRevealQueue.setState({ queue: [] })
})

afterEach(() => {
  uninstall.forEach((off) => off())
  eventBus.clear()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

describe('Flora reveal queue', () => {
  it('queues each collected Flower once, in order, and dismisses from the front', () => {
    eventBus.emit('flowerCollected', { flowerType: '1', totalFlowers: 1 })
    eventBus.emit('flowerCollected', { flowerType: '4', totalFlowers: 2 })
    expect(
      useFloraRevealQueue.getState().queue.map((entry) =>
        entry.kind === 'flower' ? entry.flower : entry.kind
      )
    ).toEqual(['Plum', 'Bamboo'])
    useFloraRevealQueue.getState().dismiss()
    expect(useFloraRevealQueue.getState().queue).toHaveLength(1)
  })

  it('queues the Season actually activated, never twice', () => {
    const state = gameOrchestrator.getState()
    state.seasonSystem.clear()
    state.seasonSystem.forceSetSeason('Autumn')
    const season = gameOrchestrator.getFloraState().seasons.at(-1)!
    eventBus.emit('seasonActivated', { seasonType: 'Autumn', effect: '' })
    eventBus.emit('seasonActivated', { seasonType: 'Autumn', effect: '' })
    const queue = useFloraRevealQueue.getState().queue
    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject({ kind: 'season' })
    if (queue[0].kind === 'season') expect(queue[0].season.id).toBe(season.id)
  })

  it('forgets pending reveals when a save loads or the run ends', () => {
    eventBus.emit('flowerCollected', { flowerType: '2', totalFlowers: 1 })
    eventBus.emit('gameLoaded', { timestamp: 0 })
    expect(useFloraRevealQueue.getState().queue).toEqual([])
    eventBus.emit('flowerCollected', { flowerType: '2', totalFlowers: 1 })
    eventBus.emit('runEnd', {
      victory: false,
      score: 0,
      decreesOwned: 0,
      act: 1,
      round: 1,
    })
    expect(useFloraRevealQueue.getState().queue).toEqual([])
  })

  it('installs once', () => {
    expect(installFloraRevealQueue()).toBe(uninstall[0])
  })
})

describe('Wall draw batches', () => {
  const kinds = () =>
    useFloraRevealQueue.getState().queue.map((entry) => entry.kind)

  it('queues a deal for each round start, after the bonus tiles it drew', () => {
    gameOrchestrator.startNewRun(7)
    const queue = useFloraRevealQueue.getState().queue
    expect(queue.at(-1)?.kind).toBe('deal')
    expect(
      queue.slice(0, -1).every((entry) => entry.kind !== 'deal')
    ).toBe(true)
  })

  it('shows a deal with its bonus tiles, then the bonus tiles after it', () => {
    eventBus.emit('flowerCollected', { flowerType: '1', totalFlowers: 1 })
    eventBus.emit('roundStart', {
      actNumber: 1,
      roundNumber: 2,
      roundType: 'Large',
      target: 450,
    })
    eventBus.emit('flowerCollected', { flowerType: '3', totalFlowers: 2 })
    expect(kinds()).toEqual(['flower', 'deal', 'flower'])

    const deal = nextWallDraw(useFloraRevealQueue.getState().queue)!
    expect(deal.deal).toBe(true)
    expect(deal.flora.map((entry) => entry.kind)).toEqual(['flower'])
    useFloraRevealQueue.getState().dismissThrough(deal.lastKey)
    expect(kinds()).toEqual(['flower'])

    const bonus = nextWallDraw(useFloraRevealQueue.getState().queue)!
    expect(bonus.deal).toBe(false)
    expect(
      bonus.flora.map((entry) => entry.kind === 'flower' && entry.flower)
    ).toEqual(['Chrysanthemum'])
    useFloraRevealQueue.getState().dismissThrough(bonus.lastKey)
    expect(nextWallDraw(useFloraRevealQueue.getState().queue)).toBeNull()
  })

  it('forgets a pending deal when a save loads', () => {
    eventBus.emit('roundStart', {
      actNumber: 1,
      roundNumber: 1,
      roundType: 'Small',
      target: 300,
    })
    eventBus.emit('gameLoaded', { timestamp: 0 })
    expect(kinds()).toEqual([])
  })
})

describe('Decree reveal queue', () => {
  const decree = ALL_DECREES.find((d) => d.id === 'river_tax')!

  it('reveals a created Decree from the owned copy, but not a bought one or a pack reward', () => {
    const owned = gameOrchestrator
      .getState()
      .decreeSystem.acquireDecree(decree)!
    // Both were chosen in plain sight: the pack shows its own reward and a
    // bought Decree goes straight into the build.
    for (const source of ['pack_open', 'purchase'] as const)
      eventBus.emit('decreeAcquired', {
        decreeId: decree.id,
        decreeName: 'Decree',
        rarity: 'common',
        source,
      })
    expect(useDecreeRevealQueue.getState().queue).toEqual([])
    eventBus.emit('decreeAcquired', {
      decreeId: decree.id,
      decreeName: 'Decree',
      rarity: 'common',
      source: 'generated',
    })
    const [entry] = useDecreeRevealQueue.getState().queue
    expect(entry.source).toBe('generated')
    expect(entry.decree.instanceId).toBe(owned.instanceId)
    // A snapshot: later changes to the owned Decree do not rewrite the reveal.
    expect(entry.decree).not.toBe(owned)
  })

  it('labels starting Decrees and ignores Decrees that are not owned', () => {
    eventBus.emit('decreeAcquired', {
      decreeId: 'not-owned',
      decreeName: 'Decree',
      rarity: 'common',
      source: 'generated',
    })
    expect(useDecreeRevealQueue.getState().queue).toEqual([])
    const [starter] = gameOrchestrator.getState().decreeSystem.getOwnedDecrees()
    eventBus.emit('decreeAcquired', {
      decreeId: starter.id,
      decreeName: 'Decree',
      rarity: 'common',
      source: 'starting',
    })
    expect(useDecreeRevealQueue.getState().queue[0].source).toBe('starting')
  })

  it('forgets pending reveals when a save loads', () => {
    const [starter] = gameOrchestrator.getState().decreeSystem.getOwnedDecrees()
    eventBus.emit('decreeAcquired', {
      decreeId: starter.id,
      decreeName: 'Decree',
      rarity: 'common',
      source: 'starting',
    })
    eventBus.emit('gameLoaded', { timestamp: 0 })
    expect(useDecreeRevealQueue.getState().queue).toEqual([])
  })
})

describe('celebration hold', () => {
  afterEach(() => {
    useCelebrationHold.getState().release()
    vi.useRealTimers()
  })

  it('holds until released', () => {
    useCelebrationHold.getState().hold()
    expect(useCelebrationHold.getState().holding).toBe(true)
    useCelebrationHold.getState().release()
    expect(useCelebrationHold.getState().holding).toBe(false)
  })

  it('always lets go after a short cap', () => {
    vi.useFakeTimers()
    useCelebrationHold.getState().hold()
    vi.advanceTimersByTime(2499)
    expect(useCelebrationHold.getState().holding).toBe(true)
    vi.advanceTimersByTime(1)
    expect(useCelebrationHold.getState().holding).toBe(false)
  })
})
