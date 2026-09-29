import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { Tile, TileSuit } from '../core/Tile'
import { getDecreeStickers } from '../systems/decreeStickers'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
})

// Controlled hands and targets isolate lifetime/settlement from run balance.
function win(game: GameOrchestrator, target = 1) {
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.mandateEffectSystem.deactivateMandate()
  state.roundManager.getCurrentRound()!.bossMandate = undefined
  state.roundManager.getCurrentRound()!.scoreTarget = target
  state.targetScore = target
  const tiles = [4, 5, 6].map(
    (rank) =>
      new Tile(
        TileSuit.Souzu,
        rank,
        `lifetime-${state.handsPlayedThisRun}-${rank}`
      )
  )
  state.handTiles = [...tiles, ...state.handTiles.slice(3)]
  expect(
    game.processAction({ type: 'play', tileIds: tiles.map((t) => t.id) })
      .success
  ).toBe(true)
  expect(state.phase).toBe('shop')
  return state.lastRoundSummary!
}

function buy() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  ;(game.getState() as OrchestratorState).decreeSystem = new DecreeSystem()
  win(game)
  expect(game.shop.open()).toBe(true)
  const offer = game.shop.state.itemOfferings[0]
  Object.assign(offer, {
    itemType: 'Decree',
    item: {
      ...ALL_DECREES.find((d) => d.id === 'decree-tax-collector')!,
      stickers: [
        { type: 'Perishable', roundsRemaining: 5 },
        { type: 'Rental', goldPerRound: 3 },
      ],
    },
    baseCost: 1,
    editionCost: 0,
    finalCost: 1,
    edition: undefined,
  })
  expect(game.shop.purchase(offer.id).success).toBe(true)
  game.exitShop()
  return game
}

function remaining(game: GameOrchestrator) {
  return getDecreeStickers(
    game.getState().decreeSystem.getOwnedDecrees()[0]
  ).find((s) => s.type === 'Perishable')!.roundsRemaining
}

it('a purchased Perishable gets five complete scoring/payout rounds, then expires and still pays rent', () => {
  const game = buy()
  expect(remaining(game)).toBe(5)
  for (let round = 1; round <= 6; round++) {
    expect(game.getState().decreeSystem.getActiveDecrees()).toHaveLength(
      round <= 5 ? 1 : 0
    )
    const summary = win(game)
    expect(summary.decreeGold).toBe(round <= 5 ? 4 : 0)
    expect(summary.rentalCost).toBe(3)
    expect(remaining(game)).toBe(Math.max(0, 5 - round))
    const checkpoint = parseClassicRunSnapshot(
      JSON.parse(JSON.stringify(game.captureRun()))
    )
    game.restoreRun(checkpoint)
    expect(game.captureRun()).toEqual(checkpoint)
    game.exitShop()
    expect(remaining(game)).toBe(Math.max(0, 5 - round))
  }
})

it('skipping preserves Perishable lifetime and does not charge rent', () => {
  const game = buy()
  const before = game.getState().gold
  const timer = remaining(game)
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(remaining(game)).toBe(timer)
  expect(game.getState().decreeSystem.getActiveDecrees()).toHaveLength(1)
  // The skip may award an Omen, but never deducts the rental fee.
  expect(game.getState().gold).toBeGreaterThanOrEqual(before)
  expect(game.processAction({ type: 'skip' }).success).toBe(false) // Boss
  expect(remaining(game)).toBe(timer)
})

it('loss prevention settles and ages the played round exactly once', () => {
  const game = buy()
  const state = game.getState() as OrchestratorState
  const phoenix = state.decreeSystem.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-phoenix')!
  )!
  state.handsRemaining = 1
  const summary = win(game, 1e9)
  expect(summary.decreeGold).toBe(4)
  expect(remaining(game)).toBe(4)
  expect(state.decreeSystem.getOwnedDecree(phoenix.instanceId!)).toBeUndefined()
})

it('terminal defeat ages once and a rejected action cannot age it again', () => {
  const game = buy()
  const state = game.getState() as OrchestratorState
  state.seasonSystem.clear()
  state.flowerSystem.clear()
  state.handsRemaining = 1
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const action = {
    type: 'play' as const,
    tileIds: state.handTiles.slice(0, 2).map((tile) => tile.id),
  }
  expect(game.processAction(action).success).toBe(true)
  expect(state.phase).toBe('gameOver')
  expect(remaining(game)).toBe(4)
  expect(game.processAction(action).success).toBe(false)
  expect(remaining(game)).toBe(4)
})
