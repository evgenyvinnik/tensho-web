/**
 * The run's random number stream.
 *
 * A Tensho run is supposed to be reproducible from its seed: the wall, the shop
 * offers, the pack contents and the tile modifiers a player meets should all
 * follow from it. Most of the game did not work that way — a hundred-odd
 * `Math.random()` calls decided run outcomes — and the parts that did each
 * carried their own copy of the same generator. There were four.
 *
 * This is the one generator. Seed it when a run starts and draw from it
 * wherever an outcome belongs to that run. Anything purely cosmetic — particle
 * jitter, an animation's phase — should keep using `Math.random`, because
 * making it reproducible costs a call site and buys nothing.
 *
 * @module game/RunRandom
 */

/**
 * mulberry32. Small, fast, and good enough for shuffling tiles.
 *
 * Not cryptographic, and it does not need to be: the seed is shown to the
 * player and reproducing a run is the point.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A named, independently-advancing stream.
 *
 * Streams are derived from the run seed and a label, so drawing for the shop
 * cannot shift what the wall produces. Without that, adding one call anywhere
 * would change every later outcome in the run and no two builds of the game
 * would agree on a seed.
 */
export type RandomStream =
  | 'wall'
  | 'shop'
  | 'packs'
  | 'consumables'
  | 'decrees'
  | 'modifiers'
  | 'mandates'
  | 'omens'
  | 'charters'

/** Turn a stream name into an offset, so each gets its own sequence. */
function streamOffset(stream: RandomStream): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < stream.length; index += 1) {
    hash ^= stream.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

class RunRandom {
  private seed: number | null = null
  private streams = new Map<RandomStream, () => number>()

  /** Begin a run. Every stream restarts from this seed. */
  start(seed: number): void {
    this.seed = seed
    this.streams.clear()
  }

  /** True once a run has seeded the generator. */
  get isSeeded(): boolean {
    return this.seed !== null
  }

  /**
   * A number in [0, 1) from the named stream.
   *
   * Falls back to `Math.random` before a run has started, so a menu screen or a
   * test that never called `start` still behaves.
   */
  next(stream: RandomStream): number {
    if (this.seed === null) return Math.random()
    let draw = this.streams.get(stream)
    if (!draw) {
      draw = createSeededRandom((this.seed + streamOffset(stream)) >>> 0)
      this.streams.set(stream, draw)
    }
    return draw()
  }

  /** An integer in [0, bound). Returns 0 for a bound of zero or less. */
  int(stream: RandomStream, bound: number): number {
    if (bound <= 0) return 0
    return Math.floor(this.next(stream) * bound)
  }

  /** One element, or undefined for an empty list. */
  pick<T>(stream: RandomStream, items: readonly T[]): T | undefined {
    if (items.length === 0) return undefined
    return items[this.int(stream, items.length)]
  }

  /** A shuffled copy, leaving the input untouched. */
  shuffle<T>(stream: RandomStream, items: readonly T[]): T[] {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = this.int(stream, i + 1)
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /** Forget the run, so the next draw is unseeded again. */
  reset(): void {
    this.seed = null
    this.streams.clear()
  }
}

/** The run-scoped generator. Seeded by `GameOrchestrator.startNewRun`. */
export const runRandom = new RunRandom()
