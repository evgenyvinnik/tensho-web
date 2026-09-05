import { describe, it, expect } from 'vitest'
import { TileSuit } from '../core/Tile'
import { MeldType } from '../core/Meld'
import { TableLoopEngine, allTrackedTileIds } from './TableLoopEngine'
import { classifyGroup, enumerateRackGroups } from './groupRules'
import { RACK_SIZE } from './content'
import {
  PRACTICE_DECREE,
  createPracticeCollection,
  practiceOpeningMoves,
  practiceStep,
} from './practice'
import { PAIR_SLOT_INDEX } from './types'

describe('the authored practice deal', () => {
  it('deals immediately, with no opening Decree to choose', () => {
    const engine = new TableLoopEngine(1, { practice: true })
    const state = engine.getState()

    expect(state.practice).toBe(true)
    expect(state.phase).toBe('playing')
    expect(state.starterChoices).toEqual([])
    expect(state.ownedDecrees).toEqual([])
    expect(state.rack).toHaveLength(RACK_SIZE)
  })

  it('is the same deal every time, whatever the seed', () => {
    const describe = (engine: TableLoopEngine) =>
      engine.getState().rack.map((tile) => `${tile.suit}${tile.rank}`)

    expect(describe(new TableLoopEngine(1, { practice: true }))).toEqual(
      describe(new TableLoopEngine(9999, { practice: true }))
    )
  })

  it('opens with exactly one run and one pair, and nothing else', () => {
    const engine = new TableLoopEngine(1, { practice: true })
    const groups = enumerateRackGroups(engine.getState().rack)
      .map((group) => classifyGroup(group))
      .filter((result) => result.ok)
      .map((result) => (result.ok ? result.type : null))

    expect(groups).toHaveLength(2)
    expect(groups).toEqual(
      expect.arrayContaining([MeldType.Sequence, MeldType.Pair])
    )
  })

  it('names both opening moves from the live rack', () => {
    const engine = new TableLoopEngine(1, { practice: true })
    const moves = practiceOpeningMoves(engine.getState())

    expect(moves.run).toHaveLength(3)
    expect(moves.pair).toHaveLength(2)

    const rack = engine.getState().rack
    const run = rack.filter((tile) => moves.run.includes(tile.id))
    expect(run.every((tile) => tile.suit === TileSuit.Souzu)).toBe(true)
    const pair = rack.filter((tile) => moves.pair.includes(tile.id))
    expect(pair.every((tile) => tile.rank === 9)).toBe(true)
  })

  it('delivers the answering run whichever group is committed first', () => {
    for (const openWithRun of [true, false]) {
      const engine = new TableLoopEngine(1, { practice: true })
      const moves = practiceOpeningMoves(engine.getState())

      if (openWithRun) engine.place(moves.run, 0)
      else engine.place(moves.pair, PAIR_SLOT_INDEX)

      // Keep placing runs; the authored wall guarantees a matching one.
      for (let guard = 0; guard < 4; guard += 1) {
        if (engine.getState().claimedMilestones.includes('twin_sequence')) break
        const next = practiceOpeningMoves(engine.getState())
        if (next.run.length !== 3) break
        const slot = engine
          .getState()
          .slots.find((candidate) => candidate.group === null && candidate.kind === 'meld')
        if (!slot) break
        engine.place(next.run, slot.index)
      }

      expect(engine.getState().claimedMilestones).toContain('twin_sequence')
    }
  })

  it('walks the guide forward only as the table earns it', () => {
    const engine = new TableLoopEngine(1, { practice: true })
    expect(practiceStep(engine.getState())?.id).toBe('choose')

    const moves = practiceOpeningMoves(engine.getState())
    engine.place(moves.run, 0)
    expect(practiceStep(engine.getState())?.id).toBe('interact')

    const second = practiceOpeningMoves(engine.getState())
    engine.place(second.run, 1)
    expect(engine.getState().claimedMilestones).toContain('twin_sequence')
    expect(practiceStep(engine.getState())?.id).toBe('upgrade')

    engine.takePracticeDecree()
    expect(engine.getState().ownedDecrees).toEqual([PRACTICE_DECREE])
    expect(practiceStep(engine.getState())?.id).toBe('ready')
  })

  it('offers its Decree only inside practice, and only once', () => {
    const ordinary = new TableLoopEngine(1)
    expect(ordinary.takePracticeDecree().errorKey).toBe(
      'tableLoop.reject.notPractice'
    )

    const engine = new TableLoopEngine(1, { practice: true })
    expect(engine.takePracticeDecree().success).toBe(true)
    expect(engine.takePracticeDecree().errorKey).toBe(
      'tableLoop.reject.alreadyOwned'
    )
    expect(engine.getState().ownedDecrees).toEqual([PRACTICE_DECREE])
  })

  it('shows no guide in an ordinary run', () => {
    const engine = new TableLoopEngine(1)
    expect(practiceStep(engine.getState())).toBeNull()
  })

  it('keeps every authored tile in exactly one place', () => {
    const engine = new TableLoopEngine(1, { practice: true })
    const moves = practiceOpeningMoves(engine.getState())
    engine.place(moves.run, 0)

    const tracked = allTrackedTileIds(engine.getState())
    expect(new Set(tracked).size).toBe(tracked.length)
    expect(tracked.length).toBe(createPracticeCollection().length)
  })
})
