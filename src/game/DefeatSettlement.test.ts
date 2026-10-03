import { afterEach, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { EnhancementType } from '../core/Tile'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  vi.restoreAllMocks()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.handsRemaining = 1
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const action = {
    type: 'play' as const,
    tileIds: state.handTiles.slice(0, 2).map((tile) => tile.id),
  }
  return { game, state, action }
}

it.each(['Rental', 'Expired Rental', 'Eternal Rental'])(
  'charges %s on defeat, allows debt, and settles only once across reload',
  (kind) => {
    const { game, state, action } = fixture()
    state.gold = 1
    state.decreeSystem.acquireDecree({
      ...ALL_DECREES.find((d) => d.id === 'decree-tax-collector')!,
      stickers: [
        { type: 'Rental', goldPerRound: 3 },
        ...(kind === 'Expired Rental'
          ? [{ type: 'Perishable' as const, roundsRemaining: 0 }]
          : kind === 'Eternal Rental'
            ? [{ type: 'Eternal' as const }]
            : []),
      ],
    })
    expect(game.processAction(action).success).toBe(true)
    expect(state.phase).toBe('gameOver')
    expect(state.gold).toBe(-2)
    expect(state.lastRoundSummary).toMatchObject({
      actNumber: 1,
      roundNumber: 1,
      roundType: 'Small',
      score: state.score,
      target: 1e9,
      baseReward: 0,
      interest: 0,
      decreeGold: 0,
      heldGoldMarkReward: 0,
      rentalCost: 3,
      netGoldChange: -3,
      goldBefore: 1,
      goldAfter: -2,
      nextRoundType: null,
      nextTarget: null,
    })
    const saved = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    game.restoreRun(saved)
    expect(game.captureRun()).toEqual(saved)
    expect(game.processAction(action).success).toBe(false)
    expect(game.captureRun()).toEqual(saved)
  }
)

it('pays no interest, round-end Decree or held Gold income on defeat', () => {
  const { game, state, action } = fixture()
  state.gold = 25
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-tax-collector')!
  )
  state.handTiles[2].modifiers.enhancement = EnhancementType.Gold
  const income = vi.spyOn(state.decreeSystem, 'calculateRoundEndGold')
  const interest = vi.spyOn(state.roundManager, 'calculateInterest')
  expect(game.processAction(action).success).toBe(true)
  expect(state.gold).toBe(25)
  expect(income).not.toHaveBeenCalled()
  expect(interest).not.toHaveBeenCalled()
  expect(state.lastRoundSummary).toMatchObject({
    baseReward: 0,
    interest: 0,
    decreeGold: 0,
    heldGoldMarkReward: 0,
    rentalCost: 0,
    netGoldChange: 0,
    goldBefore: 25,
    goldAfter: 25,
  })
})

it('charges a Rental held for the failed boss round before destruction', () => {
  const { game, state, action } = fixture()
  state.roundManager.startAct(2)
  state.roundManager.skipRound()
  state.roundManager.skipRound()
  const round = state.roundManager.getCurrentRound()!
  round.bossMandate = undefined
  round.scoreTarget = state.targetScore
  state.currentAct = 2
  state.currentRound = 3
  state.decreeSystem.acquireDecree({
    ...ALL_DECREES.find((d) => d.id === 'decree-glass-cannon')!,
    stickers: [{ type: 'Rental', goldPerRound: 3 }],
  })
  const before = state.gold
  expect(game.processAction(action).success).toBe(true)
  expect(state.gold).toBe(before - 3)
  expect(state.decreeSystem.getOwnedDecrees()).toHaveLength(0)
  expect(state.lastRoundSummary).toMatchObject({
    actNumber: 2,
    roundNumber: 3,
    roundType: 'Boss',
    rentalCost: 3,
  })
})

it('a Phoenix rescue uses winning settlement, with a single Rental charge', () => {
  const { game, state, action } = fixture()
  state.gold = 25
  state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-phoenix')!
  )
  state.decreeSystem.acquireDecree({
    ...ALL_DECREES.find((d) => d.id === 'decree-tax-collector')!,
    stickers: [{ type: 'Rental', goldPerRound: 3 }],
  })
  expect(game.processAction(action).success).toBe(true)
  expect(state.phase).toBe('shop')
  expect(state.lastRoundSummary).toMatchObject({
    baseReward: 3,
    interest: 5,
    decreeGold: 4,
    rentalCost: 3,
    goldBefore: 25,
    goldAfter: 34,
  })
  expect(state.gold).toBe(34)
})
