import { describe, it, expect, afterEach } from 'vitest'
import { createSeededRandom, runRandom } from './RunRandom'

afterEach(() => runRandom.reset())

describe('createSeededRandom', () => {
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
