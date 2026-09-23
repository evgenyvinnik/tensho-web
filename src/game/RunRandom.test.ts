import { describe, it, expect, afterEach } from 'vitest'
import {
  createSeededRandom,
  restoreSeededRandom,
  RunRandom,
  runRandom,
  type RandomStream,
} from './RunRandom'

afterEach(() => runRandom.reset())

describe('createSeededRandom', () => {
  it('restores an exact zero cursor instead of treating it as a fresh seed', () => {
    const draw = createSeededRandom(0x92d4860b)
    draw()
    expect(draw.toState()).toBe(0)
    const restored = restoreSeededRandom(
      JSON.parse(JSON.stringify(draw.toState()))
    )
    expect([restored(), restored(), restored()]).toEqual([
      draw(),
      draw(),
      draw(),
    ])
    expect(restoreSeededRandom(0)()).not.toBe(createSeededRandom(0)())
  })

  it.each([-1, 0x100000000, 0.5, NaN, Infinity, '1', null, undefined])(
    'rejects an invalid cursor %s without normalizing it',
    (cursor) => {
      expect(() => restoreSeededRandom(cursor)).toThrow('Invalid random cursor')
    }
  )
  it('preserves the published generator sequence when adding clone support', () => {
    const draw = createSeededRandom(42)
    expect([draw(), draw(), draw()]).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099,
    ])
  })

  it('clones the exact internal state, including zero at the wraparound boundary', () => {
    const draw = createSeededRandom(0x92d4860b)
    draw() // This increment wraps the internal state to zero.
    const copy = draw.clone()
    expect([copy(), copy(), copy()]).toEqual([draw(), draw(), draw()])
  })
  it('repeats exactly for the same seed and differs for another', () => {
    const take = (seed: number) => {
      const draw = createSeededRandom(seed)
      return [draw(), draw(), draw()]
    }
    expect(take(42)).toEqual(take(42))
    expect(take(42)).not.toEqual(take(43))
  })

  it('stays inside [0, 1)', () => {
    const draw = createSeededRandom(7)
    for (let i = 0; i < 500; i += 1) {
      const value = draw()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('runRandom', () => {
  it.each([0, 73, 1790137101263, -17])(
    'restores all nine streams and unused streams for seed %s',
    (seed) => {
      const names: RandomStream[] = [
        'wall',
        'shop',
        'packs',
        'consumables',
        'decrees',
        'modifiers',
        'mandates',
        'omens',
        'charters',
      ]
      runRandom.start(seed)
      // Uneven use plus streams that have never been initialized.
      for (let i = 0; i < 7; i++)
        for (let j = 0; j <= i; j++) runRandom.next(names[i])
      const state = JSON.parse(JSON.stringify(runRandom.toState()))
      const restored = RunRandom.fromState(state)
      expect(restored.toState()).toEqual(state)
      const sample = (random: RunRandom) =>
        Array.from({ length: 30 }, () => names.map((name) => random.next(name)))
      expect(sample(restored)).toEqual(sample(runRandom))
      // The snapshot is detached from subsequent cursor advancement.
      expect(RunRandom.fromState(state).toState()).toEqual(state)
    }
  )

  it('replaces the live singleton only after validating every stream', () => {
    runRandom.start(12)
    runRandom.next('shop')
    const before = runRandom.toState()
    const invalid = { version: 1, seed: 99, streams: { wall: 12, shop: -1 } }
    expect(() => runRandom.restore(invalid)).toThrow()
    expect(runRandom.toState()).toEqual(before)
    const restored = RunRandom.fromState(before)
    expect(runRandom.next('shop')).toBe(restored.next('shop'))
    runRandom.restore(before)
    expect(runRandom.toState()).toEqual(before)
  })

  it('supports the unseeded state but never invents cursors for it', () => {
    const state = runRandom.toState()
    expect(state).toEqual({ version: 1, seed: null, streams: {} })
    const restored = RunRandom.fromState(state)
    expect(restored.isSeeded).toBe(false)
    expect(() =>
      RunRandom.fromState({ ...state, streams: { wall: 0 } })
    ).toThrow()
    runRandom.start(88)
    runRandom.restore(state)
    expect(runRandom.isSeeded).toBe(false)
  })

  it('keeps a saved zero cursor and isolates restored and exported state', () => {
    const state = { version: 1, seed: 7, streams: { shop: 0 } }
    const restored = RunRandom.fromState(state)
    state.streams.shop = 99
    const saved = restored.toState()
    saved.streams.shop = 42
    expect(restored.next('shop')).toBe(restoreSeededRandom(0)())
  })

  it.each([
    null,
    [],
    {},
    { version: 2, seed: 7, streams: {} },
    { version: 1, seed: '7', streams: {} },
    { version: 1, seed: 0.5, streams: {} },
    { version: 1, seed: Infinity, streams: {} },
    { version: 1, seed: Number.MAX_SAFE_INTEGER + 1, streams: {} },
    { version: 1, seed: 7, streams: [] },
    { version: 1, seed: 7, streams: null },
    { version: 1, seed: 7, streams: { unknown: 0 } },
    { version: 1, seed: 7, streams: { shop: null } },
  ])('rejects malformed or unsupported snapshots %#', (state) => {
    expect(() => RunRandom.fromState(state)).toThrow()
  })
  it('forks initialized and unused streams without moving the source cursor', () => {
    runRandom.start(73)
    runRandom.next('wall')
    runRandom.next('shop')
    const fork = runRandom.fork()
    const secondFork = runRandom.fork()
    const sample = (random: typeof fork) => [
      random.next('wall'),
      random.next('wall'),
      random.next('shop'),
      random.next('omens'),
    ]
    const expected = sample(fork)
    expect(sample(secondFork)).toEqual(expected)
    expect(sample(runRandom)).toEqual(expected)
    fork.start(999)
    expect(runRandom.next('wall')).toBe(secondFork.next('wall'))
  })

  it('refuses to claim an exact preview before a run has been seeded', () => {
    expect(() => runRandom.fork()).toThrow('unseeded run')
  })
  it('is unseeded until a run starts', () => {
    expect(runRandom.isSeeded).toBe(false)
    runRandom.start(1)
    expect(runRandom.isSeeded).toBe(true)
    runRandom.reset()
    expect(runRandom.isSeeded).toBe(false)
  })

  it('reproduces a run from its seed', () => {
    const sample = () => {
      runRandom.start(99)
      return [
        runRandom.next('shop'),
        runRandom.int('packs', 100),
        runRandom.pick('decrees', ['a', 'b', 'c']),
        runRandom.shuffle('wall', [1, 2, 3, 4, 5]),
      ]
    }
    expect(sample()).toEqual(sample())
  })

  it('keeps streams independent, so one drawing cannot shift another', () => {
    runRandom.start(5)
    const wallAlone = [runRandom.next('wall'), runRandom.next('wall')]

    runRandom.start(5)
    runRandom.next('shop')
    runRandom.next('packs')
    const wallAfterOthers = [runRandom.next('wall'), runRandom.next('wall')]

    expect(wallAfterOthers).toEqual(wallAlone)
  })

  it('gives different streams different sequences', () => {
    runRandom.start(11)
    const shop = [runRandom.next('shop'), runRandom.next('shop')]
    runRandom.start(11)
    const packs = [runRandom.next('packs'), runRandom.next('packs')]
    expect(shop).not.toEqual(packs)
  })

  it('handles empty and degenerate inputs', () => {
    runRandom.start(3)
    expect(runRandom.pick('shop', [])).toBeUndefined()
    expect(runRandom.int('shop', 0)).toBe(0)
    expect(runRandom.int('shop', -5)).toBe(0)
    expect(runRandom.shuffle('shop', [])).toEqual([])
  })

  it('leaves the input array untouched when shuffling', () => {
    runRandom.start(3)
    const original = [1, 2, 3, 4, 5]
    const shuffled = runRandom.shuffle('wall', original)
    expect(original).toEqual([1, 2, 3, 4, 5])
    expect([...shuffled].sort()).toEqual(original)
  })

  it('still works before a run has started', () => {
    const value = runRandom.next('shop')
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThan(1)
  })
})
