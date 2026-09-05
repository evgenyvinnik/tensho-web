import { describe, it, expect } from 'vitest'
import { Tile, TileSuit, DragonType } from '../core/Tile'
import { MeldType } from '../core/Meld'
import { TableLoopEngine, allTrackedTileIds, clearReward } from './TableLoopEngine'
import { createEmptySlots, enumerateRackGroups } from './groupRules'
import { RACK_SIZE, TABLE_ROUNDS } from './content'
import { PAIR_SLOT_INDEX, type TableLoopState } from './types'

let counter = 0
const t = (suit: TileSuit, rank: number) => new Tile(suit, rank, `e${counter++}`)
const seq = (suit: TileSuit, start: number) => [
  t(suit, start),
  t(suit, start + 1),
  t(suit, start + 2),
]
const trip = (suit: TileSuit, rank: number) => [
  t(suit, rank),
  t(suit, rank),
  t(suit, rank),
]
const ids = (tiles: readonly Tile[]) => tiles.map((tile) => tile.id)

/** A playing state with an exact rack, so a test never depends on the shuffle. */
function playing(overrides: Partial<TableLoopState> = {}): TableLoopState {
  const base = TableLoopEngine.createRun(1)
  return {
    ...base,
    phase: 'playing',
    rack: [],
    wall: [],
    slots: createEmptySlots(),
    ownedDecrees: [],
    starterChoices: [],
    ...overrides,
  }
}

describe('opening build choice (E03)', () => {
  it('offers three starters and deals only after one is taken', () => {
    const engine = new TableLoopEngine(42)
    const start = engine.getState()
    expect(start.phase).toBe('choosingStart')
    expect(start.starterChoices).toHaveLength(3)
    expect(start.rack).toHaveLength(0)

    const chosen = start.starterChoices[0]
    const result = engine.chooseStarter(chosen)
    expect(result.success).toBe(true)
    expect(result.state.phase).toBe('playing')
    expect(result.state.ownedDecrees).toEqual([chosen])
    expect(result.state.rack).toHaveLength(RACK_SIZE)
  })

  it('refuses a Decree that was not offered', () => {
    const engine = new TableLoopEngine(42)
    const notOffered = (['echoing_bamboo', 'patient_pair', 'dragon_lantern'] as const).find(
      (id) => !engine.getState().starterChoices.includes(id)
    )
    const result = engine.chooseStarter(notOffered ?? 'twin_flame')
    expect(result.success).toBe(false)
    expect(engine.getState().phase).toBe('choosingStart')
  })

  it('is reproducible from a seed', () => {
    expect(TableLoopEngine.createRun(7).starterChoices).toEqual(
      TableLoopEngine.createRun(7).starterChoices
    )
  })
})

describe('placement', () => {
  it('commits a group, spends one action and refills the rack', () => {
    const group = seq(TileSuit.Souzu, 3)
    const spare = [t(TileSuit.Manzu, 1), t(TileSuit.Manzu, 2)]
    const engine = TableLoopEngine.fromState(
      playing({ rack: [...group, ...spare], wall: [t(TileSuit.Pinzu, 5)] })
    )

    const result = engine.place(ids(group), 0)
    expect(result.success).toBe(true)

    const state = result.state
    expect(state.slots[0].group?.type).toBe(MeldType.Sequence)
    expect(state.placementActionsRemaining).toBe(TABLE_ROUNDS[0].placementActions - 1)
    expect(state.score).toBe(55)
    expect(state.rack.map((tile) => tile.id)).not.toContain(group[0].id)
    // Rack refills while the wall lasts.
    expect(state.rack).toHaveLength(3)
    expect(state.wall).toHaveLength(0)
  })

  it('refuses a pair in a meld slot and a sequence in the pair slot', () => {
    const pair = [t(TileSuit.Pinzu, 9), t(TileSuit.Pinzu, 9)]
    const run = seq(TileSuit.Souzu, 3)
    const engine = TableLoopEngine.fromState(playing({ rack: [...pair, ...run] }))

    expect(engine.place(ids(pair), 0).errorKey).toBe('tableLoop.reject.meldSlotOnly')
    expect(engine.place(ids(run), PAIR_SLOT_INDEX).errorKey).toBe(
      'tableLoop.reject.pairSlotOnly'
    )
    expect(engine.getState().placementActionsRemaining).toBe(
      TABLE_ROUNDS[0].placementActions
    )
  })

  it('refuses a selection that is not a group', () => {
    const loose = [t(TileSuit.Souzu, 1), t(TileSuit.Pinzu, 5), t(TileSuit.Manzu, 9)]
    const engine = TableLoopEngine.fromState(playing({ rack: loose }))
    expect(engine.place(ids(loose), 0).errorKey).toBe('tableLoop.reject.notAGroup')
  })

  it('refuses a slot that already holds a group', () => {
    const first = seq(TileSuit.Souzu, 3)
    const second = seq(TileSuit.Souzu, 3)
    const engine = TableLoopEngine.fromState(
      playing({ rack: [...first, ...second], wall: [t(TileSuit.Pinzu, 1)] })
    )
    engine.place(ids(first), 0)
    expect(engine.place(ids(second), 0).errorKey).toBe('tableLoop.reject.slotTaken')
  })

  it('forecasts exactly what the placement will score', () => {
    const group = trip(TileSuit.Dragon, DragonType.Red)
    const engine = TableLoopEngine.fromState(
      playing({ rack: group, ownedDecrees: ['honor_court'] })
    )
    const forecast = engine.previewPlacement(ids(group), 0)
    expect(forecast).not.toBeNull()

    const before = engine.getState().score
    const played = engine.place(ids(group), 0)
    expect(played.state.score - before).toBe(forecast!.total)
  })
})

describe('revision', () => {
  it('costs an action, sends the displaced group to the river, and keeps the score', () => {
    const first = seq(TileSuit.Manzu, 1)
    const better = trip(TileSuit.Dragon, DragonType.White)
    const engine = TableLoopEngine.fromState(
      playing({ rack: [...first, ...better] })
    )

    engine.place(ids(first), 0)
    const scoreAfterFirst = engine.getState().score
    const actionsAfterFirst = engine.getState().placementActionsRemaining

    const revised = engine.revise(ids(better), 0)
    expect(revised.success).toBe(true)
    expect(revised.state.placementActionsRemaining).toBe(actionsAfterFirst - 1)
    expect(revised.state.slots[0].group?.type).toBe(MeldType.Triplet)
    expect(revised.state.river.map((tile) => tile.id)).toEqual(ids(first))
    expect(revised.state.score).toBeGreaterThan(scoreAfterFirst)
  })

  it('cannot re-claim a milestone the table already showed', () => {
    const a = seq(TileSuit.Souzu, 3)
    const b = seq(TileSuit.Souzu, 3)
    const c = seq(TileSuit.Souzu, 3)
    const engine = TableLoopEngine.fromState(playing({ rack: [...a, ...b, ...c] }))

    engine.place(ids(a), 0)
    const twin = engine.place(ids(b), 1)
    expect(twin.score?.claimedMilestones).toContain('twin_sequence')

    const again = engine.revise(ids(c), 1)
    expect(again.score?.claimedMilestones).toEqual([])
    expect(engine.getState().claimedMilestones.filter((id) => id === 'twin_sequence')).toHaveLength(1)
  })

  it('refuses to revise an empty slot', () => {
    const group = seq(TileSuit.Manzu, 1)
    const engine = TableLoopEngine.fromState(playing({ rack: group }))
    expect(engine.revise(ids(group), 2).errorKey).toBe('tableLoop.reject.slotEmpty')
  })
})

describe('redraw', () => {
  it('exchanges up to three tiles for one allowance', () => {
    const rack = [t(TileSuit.Manzu, 1), t(TileSuit.Pinzu, 5), t(TileSuit.Souzu, 9)]
    const wall = [t(TileSuit.Manzu, 4), t(TileSuit.Manzu, 5), t(TileSuit.Manzu, 6)]
    const engine = TableLoopEngine.fromState(playing({ rack, wall }))

    const result = engine.redraw(ids(rack).slice(0, 2))
    expect(result.success).toBe(true)
    expect(result.state.redrawsRemaining).toBe(TABLE_ROUNDS[0].redraws - 1)
    expect(result.state.river).toHaveLength(2)
    // An exchange tops the rack back up while the wall lasts; this wall holds
    // three tiles, so the one remaining rack tile is joined by all of them.
    expect(result.state.rack).toHaveLength(4)
    expect(result.state.wall).toHaveLength(0)
    expect(result.state.placementActionsRemaining).toBe(
      TABLE_ROUNDS[0].placementActions
    )
  })

  it('refuses more than three tiles and refuses with no allowance left', () => {
    const rack = [
      t(TileSuit.Manzu, 1),
      t(TileSuit.Manzu, 3),
      t(TileSuit.Manzu, 5),
      t(TileSuit.Manzu, 7),
    ]
    const engine = TableLoopEngine.fromState(
      playing({ rack, wall: [t(TileSuit.Pinzu, 2)] })
    )
    expect(engine.redraw(ids(rack)).errorKey).toBe('tableLoop.reject.redrawSize')

    const stranded = TableLoopEngine.fromState(
      playing({
        rack,
        wall: [t(TileSuit.Pinzu, 2)],
        redrawsRemaining: 0,
        placementActionsRemaining: 0,
      })
    )
    expect(stranded.redraw(ids(rack).slice(0, 1)).errorKey).toBe(
      'tableLoop.reject.noRedraws'
    )
  })

  it('falls back to a recovery exchange that costs a placement action', () => {
    const rack = [
      t(TileSuit.Manzu, 1),
      t(TileSuit.Pinzu, 5),
      t(TileSuit.Souzu, 9),
    ]
    const engine = TableLoopEngine.fromState(
      playing({
        rack,
        wall: [t(TileSuit.Pinzu, 2), t(TileSuit.Pinzu, 3)],
        redrawsRemaining: 0,
        placementActionsRemaining: 3,
      })
    )
    expect(engine.exchangeCostsAction()).toBe(true)

    const result = engine.redraw(ids(rack).slice(0, 1))
    expect(result.success).toBe(true)
    expect(result.state.placementActionsRemaining).toBe(2)
    expect(result.state.redrawsRemaining).toBe(0)
    expect(result.state.river).toHaveLength(1)
  })
})

describe('river recovery', () => {
  it('is available once per round only with the Decree', () => {
    const rack = [t(TileSuit.Manzu, 1), t(TileSuit.Pinzu, 5)]
    const river = [t(TileSuit.Souzu, 4)]
    const without = TableLoopEngine.fromState(playing({ rack, river }))
    expect(without.recoverFromRiver(river[0].id).errorKey).toBe(
      'tableLoop.reject.noRecoveries'
    )

    const engine = TableLoopEngine.fromState(
      playing({
        rack,
        river,
        wall: [t(TileSuit.Pinzu, 3)],
        ownedDecrees: ['river_merchant'],
        riverRecoveriesRemaining: 1,
      })
    )
    const result = engine.recoverFromRiver(river[0].id)
    expect(result.success).toBe(true)
    expect(result.state.rack.map((tile) => tile.id)).toContain(river[0].id)
    expect(result.state.river).toHaveLength(0)
    expect(result.state.riverRecoveriesRemaining).toBe(0)
  })
})

describe('tile conservation', () => {
  it('keeps every physical tile in exactly one place across a whole round', () => {
    const engine = new TableLoopEngine(2024)
    engine.chooseStarter(engine.getState().starterChoices[0])

    const seen = () => {
      const tracked = allTrackedTileIds(engine.getState())
      expect(new Set(tracked).size).toBe(tracked.length)
      expect(tracked.length).toBe(engine.getState().collection.length)
    }
    seen()

    for (let step = 0; step < 12; step += 1) {
      const state = engine.getState()
      if (state.phase !== 'playing') break

      const placed = tryAnyPlacement(engine)
      if (!placed && state.redrawsRemaining > 0) {
        engine.redraw([state.rack[0].id])
      } else if (!placed) {
        break
      }
      seen()
    }
  })
})

/** Place the first legal group the rack offers, if any. */
function tryAnyPlacement(engine: TableLoopEngine): boolean {
  const state = engine.getState()
  for (const slot of state.slots) {
    if (slot.group) continue
    for (let i = 0; i < state.rack.length; i += 1) {
      for (let j = i + 1; j < state.rack.length; j += 1) {
        const pair = [state.rack[i].id, state.rack[j].id]
        if (engine.previewPlacement(pair, slot.index)) {
          return engine.place(pair, slot.index).success
        }
        for (let k = j + 1; k < state.rack.length; k += 1) {
          const triple = [...pair, state.rack[k].id]
          if (engine.previewPlacement(triple, slot.index)) {
            return engine.place(triple, slot.index).success
          }
        }
      }
    }
  }
  return false
}

describe('finishing a round', () => {
  it('only allows an explicit finish once the target is met', () => {
    const engine = TableLoopEngine.fromState(playing({ score: 10 }))
    expect(engine.canFinish()).toBe(false)
    expect(engine.finishRound().errorKey).toBe('tableLoop.reject.targetNotMet')

    const cleared = TableLoopEngine.fromState(
      playing({ score: TABLE_ROUNDS[0].target })
    )
    expect(cleared.canFinish()).toBe(true)
    const result = cleared.finishRound()
    expect(result.success).toBe(true)
    expect(result.state.phase).toBe('roundCleared')
    expect(result.state.runScore).toBe(TABLE_ROUNDS[0].target)
  })

  it('ends the round the moment the table is completed', () => {
    const melds = [
      seq(TileSuit.Manzu, 1),
      seq(TileSuit.Manzu, 4),
      seq(TileSuit.Manzu, 7),
      trip(TileSuit.Manzu, 2),
    ]
    const pair = [t(TileSuit.Manzu, 6), t(TileSuit.Manzu, 6)]
    const engine = TableLoopEngine.fromState(
      playing({ rack: [...melds.flat(), ...pair] })
    )

    melds.forEach((group, index) => engine.place(ids(group), index))
    expect(engine.getState().phase).toBe('playing')

    const finish = engine.place(ids(pair), PAIR_SLOT_INDEX)
    expect(finish.score?.stages.some((stage) => stage.kind === 'completion')).toBe(true)
    expect(engine.getState().tableCompleted).toBe(true)
    expect(engine.getState().phase).toBe('roundCleared')
  })

  it('pays a clear reward that rewards unspent resources', () => {
    const state = playing({
      score: TABLE_ROUNDS[0].target,
      redrawsRemaining: 2,
      placementActionsRemaining: 3,
    })
    expect(clearReward(state)).toBe(TABLE_ROUNDS[0].reward + 4 + 3)

    const engine = TableLoopEngine.fromState(state)
    engine.finishRound()
    expect(engine.getState().gold).toBe(TABLE_ROUNDS[0].reward + 7)
  })

  it('fails the run when the resources run out below the target', () => {
    const engine = TableLoopEngine.fromState(
      playing({ score: 10, placementActionsRemaining: 1, rack: [], wall: [] })
    )
    const group = seq(TileSuit.Pinzu, 2)
    const withGroup = TableLoopEngine.fromState({
      ...engine.getState(),
      rack: group,
    })
    withGroup.place(ids(group), 0)
    expect(withGroup.getState().phase).toBe('runFailed')
  })

  it('ends the round when no rack group fits an open slot and nothing can change that', () => {
    const slots = createEmptySlots().map((slot) =>
      slot.kind === 'meld'
        ? {
            ...slot,
            group: { type: MeldType.Triplet, tiles: [], placementOrder: slot.index + 1 },
          }
        : slot
    )
    const engine = TableLoopEngine.fromState(
      playing({
        slots,
        score: TABLE_ROUNDS[0].target,
        rack: [t(TileSuit.Manzu, 1), t(TileSuit.Pinzu, 5)],
        wall: [],
        redrawsRemaining: 0,
        placementActionsRemaining: 2,
      })
    )
    // The state is already stuck; any action settles it.
    const stuck = engine.redraw([engine.getState().rack[0].id])
    expect(stuck.success).toBe(false)
    expect(engine.canFinish()).toBe(true)
  })
})

describe('shop and round progression (E04)', () => {
  it('offers three unowned Decrees and sells one', () => {
    const engine = TableLoopEngine.fromState(
      playing({
        phase: 'roundCleared',
        gold: 30,
        ownedDecrees: ['echoing_bamboo'],
      })
    )
    const shop = engine.openShop()
    expect(shop.state.phase).toBe('shop')
    expect(shop.state.shopOffers).toHaveLength(3)
    expect(shop.state.shopOffers).not.toContain('echoing_bamboo')

    const offer = shop.state.shopOffers[0]
    const bought = engine.buyDecree(offer)
    expect(bought.success).toBe(true)
    expect(bought.state.ownedDecrees).toContain(offer)
    expect(bought.state.gold).toBeLessThan(30)
    expect(bought.state.shopOffers).not.toContain(offer)
  })

  it('refuses a purchase the player cannot afford', () => {
    const engine = TableLoopEngine.fromState(
      playing({ phase: 'roundCleared', gold: 0 })
    )
    engine.openShop()
    const offer = engine.getState().shopOffers[0]
    expect(engine.buyDecree(offer).errorKey).toBe('tableLoop.reject.tooExpensive')
  })

  it('clears round-local state when the next round is dealt', () => {
    const engine = TableLoopEngine.fromState(
      playing({
        phase: 'roundCleared',
        score: 500,
        runScore: 500,
        claimedMilestones: ['twin_sequence'],
        tableMult: 0.5,
        tableCompleted: true,
        river: [t(TileSuit.Manzu, 3)],
        slots: createEmptySlots().map((slot) => ({
          ...slot,
          group: { type: MeldType.Triplet, tiles: [], placementOrder: 1 },
        })),
      })
    )
    const next = engine.nextRound()
    expect(next.state.roundIndex).toBe(1)
    expect(next.state.round.target).toBe(TABLE_ROUNDS[1].target)
    expect(next.state.score).toBe(0)
    expect(next.state.runScore).toBe(500)
    expect(next.state.claimedMilestones).toEqual([])
    expect(next.state.tableMult).toBe(0)
    expect(next.state.tableCompleted).toBe(false)
    expect(next.state.river).toEqual([])
    expect(next.state.slots.every((slot) => slot.group === null)).toBe(true)
    expect(next.state.rack).toHaveLength(RACK_SIZE)
  })

  it('completes the run after the last round', () => {
    const engine = TableLoopEngine.fromState(
      playing({
        phase: 'playing',
        roundIndex: TABLE_ROUNDS.length - 1,
        round: TABLE_ROUNDS[TABLE_ROUNDS.length - 1],
        score: TABLE_ROUNDS[TABLE_ROUNDS.length - 1].target,
      })
    )
    engine.finishRound()
    expect(engine.getState().phase).toBe('runComplete')
  })

  it('gives Jade Ledger one fewer redraw when a round is dealt', () => {
    const engine = TableLoopEngine.fromState(
      playing({ phase: 'roundCleared', ownedDecrees: ['jade_ledger'] })
    )
    engine.nextRound()
    expect(engine.getState().redrawsRemaining).toBe(TABLE_ROUNDS[1].redraws - 1)
  })
})

describe('the boss round', () => {
  it('is the last round and carries a telegraphed rule', () => {
    const boss = TABLE_ROUNDS[TABLE_ROUNDS.length - 1]
    expect(boss.bossRule).toBe('frost_magistrate')

    const engine = TableLoopEngine.fromState(
      playing({
        roundIndex: boss.index,
        round: boss,
        rack: trip(TileSuit.Dragon, DragonType.White),
      })
    )
    const group = engine.getState().rack
    const result = engine.place(ids(group), 0)
    // 45 tile points would be the ordinary value; the boss halves them.
    expect(result.state.score).toBe(21 + 45)
  })
})

describe('the draft row (E06)', () => {
  it('is off unless the run asks for it', () => {
    const plain = new TableLoopEngine(3)
    plain.chooseStarter(plain.getState().starterChoices[0])
    expect(plain.getState().draftEnabled).toBe(false)
    expect(plain.getState().draftRow).toEqual([])
  })

  it('deals three face-up offers and reserves one replacement per placement', () => {
    const engine = new TableLoopEngine(7, true)
    engine.chooseStarter(engine.getState().starterChoices[0])

    const dealt = engine.getState()
    expect(dealt.draftRow).toHaveLength(3)
    expect(dealt.rack).toHaveLength(RACK_SIZE)
    expect(dealt.pendingDraftPick).toBe(false)

    const group = enumerateRackGroups(dealt.rack).find(
      (candidate) => candidate.length === 3
    )
    expect(group, 'seed 7 deals a rack with a meld in it').toBeDefined()
    engine.place(ids(group!), 0)

    // One slot is held back for the player to fill from the offers.
    expect(engine.getState().pendingDraftPick).toBe(true)
    expect(engine.getState().rack).toHaveLength(RACK_SIZE - 1)
  })

  it('claims only the taken offer and refills that one from the wall', () => {
    const offers = [t(TileSuit.Pinzu, 1), t(TileSuit.Pinzu, 2), t(TileSuit.Pinzu, 3)]
    const engine = TableLoopEngine.fromState(
      playing({
        draftEnabled: true,
        draftRow: offers,
        pendingDraftPick: true,
        rack: [t(TileSuit.Manzu, 4)],
        wall: [t(TileSuit.Souzu, 8)],
      })
    )

    const result = engine.claimDraft(offers[1].id)
    expect(result.success).toBe(true)
    expect(result.state.rack.map((tile) => tile.id)).toContain(offers[1].id)
    expect(result.state.pendingDraftPick).toBe(false)

    const row = result.state.draftRow.map((tile) => tile.id)
    expect(row[0]).toBe(offers[0].id)
    expect(row[2]).toBe(offers[2].id)
    expect(row[1]).not.toBe(offers[1].id)
    expect(result.state.wall).toHaveLength(0)
  })

  it('refuses a claim without a pick, and refuses a tile outside the offers', () => {
    const offers = [t(TileSuit.Pinzu, 1)]
    const idle = TableLoopEngine.fromState(
      playing({ draftEnabled: true, draftRow: offers, pendingDraftPick: false })
    )
    expect(idle.claimDraft(offers[0].id).errorKey).toBe(
      'tableLoop.reject.noDraftPick'
    )

    const waiting = TableLoopEngine.fromState(
      playing({ draftEnabled: true, draftRow: offers, pendingDraftPick: true })
    )
    expect(waiting.claimDraft('not-an-offer').errorKey).toBe(
      'tableLoop.reject.notInDraft'
    )
  })

  it('passes the offer and takes the replacement off the wall instead', () => {
    const engine = TableLoopEngine.fromState(
      playing({
        draftEnabled: true,
        draftRow: [t(TileSuit.Pinzu, 1)],
        pendingDraftPick: true,
        rack: [t(TileSuit.Manzu, 4)],
        wall: [t(TileSuit.Souzu, 8), t(TileSuit.Souzu, 9)],
      })
    )
    const before = engine.getState().rack.length

    const result = engine.passDraft()
    expect(result.success).toBe(true)
    expect(result.state.pendingDraftPick).toBe(false)
    expect(result.state.rack.length).toBeGreaterThan(before)
    expect(result.state.draftRow).toHaveLength(1)
  })

  it('resolves a forgotten offer from the wall before the next action', () => {
    const group = seq(TileSuit.Manzu, 1)
    const engine = TableLoopEngine.fromState(
      playing({
        draftEnabled: true,
        draftRow: [t(TileSuit.Pinzu, 1)],
        pendingDraftPick: true,
        rack: [...group],
        wall: [t(TileSuit.Souzu, 8), t(TileSuit.Souzu, 9)],
      })
    )

    engine.place(ids(group), 0)
    expect(engine.getState().draftRow.map((tile) => tile.suit)).toEqual([
      TileSuit.Pinzu,
    ])
  })

  it('keeps every tile in exactly one place with the offers in play', () => {
    const engine = new TableLoopEngine(11, true)
    engine.chooseStarter(engine.getState().starterChoices[0])

    const tracked = allTrackedTileIds(engine.getState())
    expect(new Set(tracked).size).toBe(tracked.length)
    expect(tracked.length).toBe(engine.getState().collection.length)

    const group = enumerateRackGroups(engine.getState().rack).find(
      (candidate) => candidate.length === 3
    )
    if (group) {
      engine.place(ids(group), 0)
      if (engine.getState().pendingDraftPick) {
        engine.claimDraft(engine.getState().draftRow[0].id)
      }
    }

    const after = allTrackedTileIds(engine.getState())
    expect(new Set(after).size).toBe(after.length)
    expect(after.length).toBe(engine.getState().collection.length)
  })
})
