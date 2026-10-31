import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { Tile, TileSuit, SeasonType } from '../core/Tile'
import { useOmenStore } from '../stores/omenStore'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import type { Decree } from '../systems/types'
import { advanceRound, clearRound } from '../test/roundHelpers'
import { SWIFT_CLEAR_SPARE_TURNS } from './playRules'

// Omens are earned by a swift clear: a Small or Large round cleared with
// Turns to spare. The round still pays out and opens the Tea House.
const swift = { spareTurns: SWIFT_CLEAR_SPARE_TURNS }

afterEach(() => {
  eventBus.clear()
  eventBus.disableHistory()
  useOmenStore.getState().clearForNewRun()
  runRandom.reset()
})

function start(seed: number) {
  const game = new GameOrchestrator()
  game.startNewRun(seed)
  const state = game.getState() as OrchestratorState
  // Keep the next Season under test control, not hidden in a starting deal.
  state.wallTemplate = state.wallTemplate.filter((tile) => !tile.isSeason)
  return { game, state }
}

it('a swift clear clears round-scoped Seasons and REDRAW penalties, pays out and names the Omen', () => {
  const { game, state } = start(3)
  state.seasonSystem.forceSetSeason('Autumn', true)
  state.seasonSystem.onDiscard()
  state.seasonSystem.onDiscard()
  state.gold = 100
  eventBus.enableHistory()
  clearRound(game, swift)
  expect(state.phase).toBe('shop')
  expect(state.gold).toBeGreaterThan(100)
  expect(state.lastRoundSummary?.omenId).toBe('blessing_pack_omen')
  // The Tea House's Omen reveal names where it came from.
  expect(state.lastRoundSummary).toMatchObject({
    roundType: 'Small',
    spareTurns: SWIFT_CLEAR_SPARE_TURNS,
    omenCopies: 1,
  })
  expect(state.seasonSystem.getSeasonStack()).toEqual([])
  expect(state.seasonSystem.toState().discardCount).toBe(0)
  expect(
    useOmenStore.getState().activeTags.map((tag) => tag.definitionId)
  ).toEqual(['blessing_pack_omen'])
  expect(eventBus.getHistoryByEvent('roundEnd')).toHaveLength(1)
  expect(eventBus.getHistoryByEvent('omenEarned')).toEqual([
    expect.objectContaining({
      data: { roundType: 'Small', omenTagGranted: 'blessing_pack_omen' },
    }),
  ])
  game.exitShop()
  expect(state.currentRound).toBe(2)
})

it('a clear on the last Turn earns no Omen', () => {
  const { game, state } = start(3)
  clearRound(game, { spareTurns: SWIFT_CLEAR_SPARE_TURNS - 1 })
  expect(state.phase).toBe('shop')
  expect(state.lastRoundSummary?.omenId).toBeNull()
  expect(state.lastRoundSummary).toMatchObject({
    spareTurns: SWIFT_CLEAR_SPARE_TURNS - 1,
    omenCopies: 0,
  })
  expect(useOmenStore.getState().activeTags).toHaveLength(0)
  expect(state.omenSystem.getTotalSkippedRounds()).toBe(0)
})

it('an earned Season lock appends the actual drawn tile without clearing prior Seasons or Decay', () => {
  const { game, state } = start(13)
  advanceRound(game, swift)
  advanceRound(game, swift)
  expect(state.omenSystem.getLockedSeason()).toBe('Winter')
  expect(
    useOmenStore
      .getState()
      .activeTags.some((tag) => tag.definitionId === 'omen_of_ash')
  ).toBe(true)

  // Deliberate draw fixture after real swift-clear acquisition: Decay already exists,
  // then a Spring tile must become Winter and a second Season stays Summer.
  state.seasonSystem.forceSetSeason('Autumn', true)
  state.seasonSystem.onDiscard()
  state.seasonSystem.onDiscard()
  const prior = state.seasonSystem.getSeasonStack()[0]
  state.handTiles = state.handTiles.slice(0, 10)
  state.wall = [
    Tile.createSeason(SeasonType.Spring, 'locked-season'),
    Tile.createSeason(SeasonType.Summer, 'ordinary-season'),
    new Tile(TileSuit.Pinzu, 3, 'dead-wall-replenishment'),
  ]
  state.drawIndex = 0
  state.deadWall = [
    new Tile(TileSuit.Pinzu, 1, 'replacement-one'),
    new Tile(TileSuit.Pinzu, 2, 'replacement-two'),
  ]
  expect(game.processAction({ type: 'draw' }).success).toBe(true)
  expect(state.seasonSystem.getSeasonStack()).toEqual([
    prior,
    expect.objectContaining({
      id: 'locked-season',
      type: 'Winter',
      isCorrupted: false,
    }),
  ])
  expect(state.seasonSystem.getActiveSeason()).toEqual(prior)
  expect(state.seasonSystem.toState().discardCount).toBe(2)
  expect(state.omenSystem.getLockedSeason()).toBeNull()
  expect(state.handTiles.some((tile) => tile.id === 'replacement-one')).toBe(
    true
  )
  expect(game.processAction({ type: 'draw' }).success).toBe(true)
  expect(
    state.seasonSystem.getSeasonStack().map(({ id, type }) => ({ id, type }))
  ).toEqual([
    { id: prior.id, type: 'Autumn' },
    { id: 'locked-season', type: 'Winter' },
    { id: 'ordinary-season', type: 'Summer' },
  ])
  expect(state.handTiles.some((tile) => tile.id === 'replacement-two')).toBe(
    true
  )
  // Consuming the tradeoff does not spend the separate Script protection.
  expect(state.omenSystem.hasVoidScriptDownsideProtection()).toBe(true)
})

it('awards immediate Fortune gold exactly once through a swift clear, on top of the round payout', () => {
  const { game, state } = start(6)
  const before = state.gold
  clearRound(game, swift)
  const summary = state.lastRoundSummary!
  expect(summary.omenId).toBe('fortune_omen')
  expect(summary.omenGold).toBe(10)
  expect(state.gold).toBe(before + summary.netGoldChange)
  expect(summary.goldAfter - summary.goldBefore).toBe(summary.netGoldChange)
  expect(
    useOmenStore.getState().consumedTags.map((tag) => tag.definitionId)
  ).toEqual(['fortune_omen'])
  expect(useOmenStore.getState().activeTags).toHaveLength(0)
})

it('earns a Rare+ Omen by a swift clear and charges it only when the next Tea House opens', () => {
  const { game, state } = start(73)
  advanceRound(game, swift)
  // Keep the fixture focused on reward settlement, not random boss restrictions.
  state.roundManager.getCurrentAct()!.rounds[2].bossMandate = undefined
  state.targetScore = 1
  state.roundManager.getCurrentRound()!.scoreTarget = 1
  state.handTiles = [
    new Tile(TileSuit.Pinzu, 2, 'a'),
    new Tile(TileSuit.Pinzu, 2, 'b'),
  ]
  state.selectedTileIds.clear()
  state.handsRemaining = SWIFT_CLEAR_SPARE_TURNS + 1
  expect(
    game.processAction({ type: 'play', tileIds: ['a', 'b'] }).success
  ).toBe(true)
  expect(state.phase).toBe('shop')
  expect(
    useOmenStore
      .getState()
      .activeTags.some((tag) => tag.definitionId === 'decree_omen')
  ).toBe(true)
  const settledGold = state.gold
  expect(game.shop.open()).toBe(true)
  expect(state.gold).toBe(settledGold - 5)
  const offer = game.shop.state.itemOfferings[0]
  expect(['ImperialDecree', 'HeavenlyOrdinance']).toContain(
    (offer.item as Decree).rarity
  )
  expect(game.shop.open()).toBe(true)
  expect(state.gold).toBe(settledGold - 5)
  expect(
    useOmenStore
      .getState()
      .consumedTags.filter((tag) => tag.definitionId === 'decree_omen')
  ).toHaveLength(1)
})

it('a Boss round earns no Omen however many Turns are spared', () => {
  const { game, state } = start(3)
  advanceRound(game)
  advanceRound(game)
  expect(state.currentRound).toBe(3)
  expect(game.getAvailableActions()).not.toContain('skip')
  clearRound(game, { spareTurns: 5 })
  expect(state.lastRoundSummary?.roundType).toBe('Boss')
  expect(state.lastRoundSummary?.omenId).toBeNull()
  expect(state.omenSystem.getTotalSkippedRounds()).toBe(0)
})

it.each([
  {
    seed: 4,
    skips: 1,
    id: 'omen_of_rivers',
    field: 'omenDiscardBonus',
    amount: 1,
  },
  {
    seed: 16,
    skips: 1,
    id: 'abundance_omen',
    field: 'omenRedrawBonus',
    amount: 2,
  },
  {
    seed: 24,
    skips: 2,
    id: 'precision_omen',
    field: 'omenHandSizeBonus',
    amount: 2,
  },
] as const)(
  'applies earned $id once to the incoming round',
  ({ seed, skips, id, field, amount }) => {
    const { game, state } = start(seed)
    for (const decree of state.decreeSystem.getOwnedDecrees())
      state.decreeSystem.removeDecree(decree.id)
    for (let i = 0; i < skips; i++) advanceRound(game, swift)
    expect(state[field]).toBe(amount)
    if (field === 'omenHandSizeBonus') expect(state.handTiles).toHaveLength(16)
    expect(
      useOmenStore
        .getState()
        .consumedTags.filter((tag) => tag.definitionId === id)
    ).toHaveLength(1)
    expect(
      useOmenStore.getState().activeTags.some((tag) => tag.definitionId === id)
    ).toBe(false)
    expect(state.omenSystem.triggerRoundStartOmens()).toEqual({
      drawBonus: 0,
      discardBonus: 0,
      handSizeBonus: 0,
      consumedOmenIds: [],
    })
    game.startNewRun(seed + 1)
    expect(game.getState()[field]).toBe(0)
  }
)
