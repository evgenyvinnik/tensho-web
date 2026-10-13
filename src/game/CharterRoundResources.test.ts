import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { useOmenStore } from '../stores/omenStore'
import { advanceToRound } from '../test/roundHelpers'
import { TURNS_PER_ROUND } from './playRules'
import { BOSS_MANDATES } from '../systems/RoundManager'
import {
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'

const charter = (id: string) =>
  [...TEA_HOUSE_BASE_CHARTERS, ...TEA_HOUSE_UPGRADED_CHARTERS].find(
    (c) => c.id === id
  )!
const json = <T>(value: T): T => JSON.parse(JSON.stringify(value))

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

// Controlled eligibility and low targets isolate effects, not natural unlocks
// or balance. The purchase, round transition, actions and save codec are real.
function setup(id: string, base?: string, bossVisits = 1) {
  const game = new GameOrchestrator()
  game.setCharterUnlockResolver(() => true)
  game.startNewRun(7)
  for (const decree of game.getState().decreeSystem.getOwnedDecrees())
    game.getState().decreeSystem.removeDecree(decree.id)
  if (base) expect(game.addImperialCharter(charter(base))).toBe(true)
  const state = game.getState()
  Object.assign(state, {
    wallTemplate: state.wallTemplate.filter((t) => !t.isBonus),
  })
  state.roundManager.getCurrentAct()!.rounds[2].bossMandate =
    BOSS_MANDATES.find((m) => m.id === 'the_wall')!
  for (let i = 0; i < bossVisits * 3; i++) {
    state.roundManager.getCurrentAct()!.rounds[2].bossMandate =
      BOSS_MANDATES.find((m) => m.id === 'the_wall')!
    state.flowerSystem.clear()
    state.seasonSystem.clear()
    Object.assign(state, { gold: 100, targetScore: 1 })
    state.roundManager.getCurrentRound()!.scoreTarget = 1
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
      }).success
    ).toBe(true)
    expect(game.shop.open()).toBe(true)
    if (i < bossVisits * 3 - 1) game.exitShop()
  }
  const saved = json(game.captureRun())
  saved.shop.teaHouse.charterOffering!.item = charter(id)
  game.restoreRun(parseClassicRunSnapshot(saved))
  const offer = game.shop.state.charterOffering!
  const before = json(game.captureRun())
  expect(game.shop.validatePurchase(offer.id).success).toBe(true)
  expect(game.captureRun()).toEqual(before)
  expect(game.shop.purchase(offer.id).success).toBe(true)
  expect(game.getState().gold).toBe(before.state.gold - offer.finalCost)
  const paid = json(game.captureRun())
  expect(game.shop.purchase(offer.id).success).toBe(false)
  expect(game.captureRun()).toEqual(paid)
  game.restoreRun(parseClassicRunSnapshot(paid))
  expect(game.captureRun()).toEqual(paid)
  game.exitShop()
  expect(game.getState().phase).toBe('gameplay')
  return game
}

const T = TURNS_PER_ROUND

it.each([
  ['steady_hand', undefined, T + 1, 0, 14, 2],
  ['swift_hand', 'steady_hand', T + 2, 0, 14, 2],
  ['frugal_discard', undefined, T, 1, 14, 2],
  ['wasteful_plenty', 'frugal_discard', T, 2, 14, 2],
  ['brush_stroke', undefined, T, 0, 15, 2],
  ['full_palette', 'brush_stroke', T, 0, 16, 2],
  ['ancient_script', undefined, T - 1, 0, 14, 1],
  ['stone_script', 'ancient_script', T - 2, 0, 14, 1],
] as const)(
  '%s survives paid acquisition/reload and grants its actual next-round resources',
  (id, base, turns, freeRedraws, rackSize, act) => {
    const game = setup(id, base)
    const state = game.getState()
    expect(state.currentAct).toBe(act)
    expect(state.currentRound).toBe(1)
    expect(state.pendingActReduction).toBe(0)
    expect(state.handsRemaining).toBe(turns)
    expect(state.handsAllowance).toBe(turns)
    expect(state.redrawsRemaining).toBe(freeRedraws)
    expect(state.discardsRemaining).toBe(0)
    expect(game.getHandTiles()).toHaveLength(rackSize)
    // Exercise the resources, including a refill back to the increased capacity.
    Object.assign(state, { targetScore: 1_000_000 })
    state.roundManager.getCurrentRound()!.scoreTarget = 1_000_000
    expect(
      game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
      }).success
    ).toBe(true)
    expect(state.handsRemaining).toBe(turns - 1)
    expect(game.getHandTiles()).toHaveLength(rackSize)
    // Free redraws are spent first and leave the Turns alone.
    for (let i = 0; i < freeRedraws; i++) {
      expect(
        game.processAction({ type: 'redraw', tileIds: [state.handTiles[0].id] })
          .success
      ).toBe(true)
      expect(state.redrawsRemaining).toBe(freeRedraws - i - 1)
      expect(state.handsRemaining).toBe(turns - 1)
      expect(game.getHandTiles()).toHaveLength(rackSize)
    }
    // Then each REDRAW spends a Turn, always keeping the last one for a play.
    while (state.handsRemaining > 1) {
      const turnsBefore = state.handsRemaining
      expect(
        game.processAction({ type: 'redraw', tileIds: [state.handTiles[0].id] })
          .success
      ).toBe(true)
      expect(state.handsRemaining).toBe(turnsBefore - 1)
      expect(game.getHandTiles()).toHaveLength(rackSize)
    }
    const spent = json(game.captureRun())
    expect(
      game.processAction({ type: 'redraw', tileIds: [state.handTiles[0].id] })
        .success
    ).toBe(false)
    expect(game.captureRun()).toEqual(spent)
    game.restoreRun(parseClassicRunSnapshot(spent))
    expect(game.captureRun()).toEqual(spent)
    // Ending this round refreshes allowances, not the one-shot Act reduction.
    Object.assign(game.getState(), { targetScore: 1 })
    game.getState().roundManager.getCurrentRound()!.scoreTarget = 1
    expect(
      game.processAction({
        type: 'play',
        tileIds: game
          .getHandTiles()
          .slice(0, 2)
          .map((t) => t.id),
      }).success
    ).toBe(true)
    game.exitShop()
    expect(game.getState().handsRemaining).toBe(turns)
    expect(game.getState().redrawsRemaining).toBe(freeRedraws)
    expect(game.getHandTiles()).toHaveLength(rackSize)
    expect(game.getState().currentAct).toBe(act)
    expect(game.getState().currentRound).toBe(2)
    game.startNewRun(8)
    const decrees = game.getState().decreeSystem
    const redrawDelta = decrees.getAdditionalDiscards()
    expect(game.getState().handsRemaining).toBe(
      T + Math.min(0, redrawDelta) + decrees.getAdditionalDraws()
    )
    expect(game.getState().redrawsRemaining).toBe(Math.max(0, redrawDelta))
    expect(game.getHandTiles()).toHaveLength(14)
    expect(game.getState().charterSystem.getOwnedCharters()).toEqual([])
  }
)

it('Swift Hand supplies two extra usable plays, including after resuming beyond the base Turns', () => {
  const game = setup('swift_hand', 'steady_hand')
  Object.assign(game.getState(), { targetScore: 1_000_000 })
  game.getState().roundManager.getCurrentRound()!.scoreTarget = 1_000_000
  for (let i = 0; i < T + 2; i++) {
    expect(game.getState().phase).toBe('gameplay')
    expect(game.getState().handsRemaining).toBe(T + 2 - i)
    expect(
      game.processAction({
        type: 'play',
        tileIds: game
          .getHandTiles()
          .slice(0, 2)
          .map((t) => t.id),
      }).success
    ).toBe(true)
    const saved = json(game.captureRun())
    game.restoreRun(parseClassicRunSnapshot(saved))
    expect(game.captureRun()).toEqual(saved)
  }
  expect(game.getState().phase).toBe('gameOver')
  expect(game.getState().hasWonRun).toBe(false)
  const ended = json(game.captureRun())
  expect(
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id),
    }).success
  ).toBe(false)
  expect(game.captureRun()).toEqual(ended)
})

// The Needle allows one Play but keeps the Turns for REDRAW; The Water
// removes REDRAW, free redraws included.
it.each([
  ['swift_hand', 'steady_hand', 'the_needle', T + 2, 0, 14],
  ['wasteful_plenty', 'frugal_discard', 'the_water', T, 0, 14],
  ['full_palette', 'brush_stroke', 'the_manacle', T, 0, 15],
] as const)(
  '%s retains the %s prerequisite but respects %s restrictions after reload',
  (id, base, mandate, turns, freeRedraws, rackSize) => {
    const game = setup(id, base)
    game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate =
      BOSS_MANDATES.find((m) => m.id === mandate)!
    advanceToRound(game, 'Boss')
    const saved = json(game.captureRun())
    game.restoreRun(parseClassicRunSnapshot(saved))
    expect(game.captureRun()).toEqual(saved)
    expect(game.getState().handsRemaining).toBe(turns)
    expect(game.getState().handsAllowance).toBe(turns)
    expect(game.getState().redrawsRemaining).toBe(freeRedraws)
    expect(game.getHandTiles()).toHaveLength(rackSize)
    if (mandate === 'the_water')
      expect(
        game.canPerformAction({
          type: 'redraw',
          tileIds: [game.getHandTiles()[0].id],
        })
      ).toBe(false)
  }
)

it('Stone Script applies its own Act reduction only once after Ancient Script was already spent', () => {
  const game = setup('stone_script', 'ancient_script', 4)
  expect(game.getState().currentAct).toBe(3)
  expect(game.getState().pendingActReduction).toBe(0)
  expect(game.getState().handsRemaining).toBe(T - 2)
  expect(game.getState().redrawsRemaining).toBe(0)
  game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate =
    BOSS_MANDATES.find((m) => m.id === 'the_wall')!
  advanceToRound(game, 'Boss')
  Object.assign(game.getState(), { targetScore: 1 })
  game.getState().roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: game
        .getHandTiles()
        .slice(0, 2)
        .map((t) => t.id),
    }).success
  ).toBe(true)
  const saved = json(game.captureRun())
  game.restoreRun(parseClassicRunSnapshot(saved))
  game.exitShop()
  expect(game.getState().currentAct).toBe(4)
  expect(game.getState().handsRemaining).toBe(T - 2)
  expect(game.getState().redrawsRemaining).toBe(0)
})

it('Final Cut allows repeated paid boss rerolls after resume but never a free or in-boss reroll', () => {
  const game = setup('final_cut', 'directors_take')
  const budget = game.getState().gold
  expect(budget).toBeGreaterThanOrEqual(30)
  const count = Math.floor(budget / 10)
  for (let i = 0; i < count; i++) {
    const before = game.getState().roundManager.getCurrentAct()!.rounds[2]
      .bossMandate!.id
    expect(game.rerollBossMandate().success).toBe(true)
    expect(
      game.getState().roundManager.getCurrentAct()!.rounds[2].bossMandate!.id
    ).not.toBe(before)
    expect(game.getState().gold).toBe(budget - 10 * (i + 1))
    expect(game.getState().charterSystem.getMandateRerollsRemaining()).toBe(-1)
    const saved = json(game.captureRun())
    game.restoreRun(parseClassicRunSnapshot(saved))
    expect(game.captureRun()).toEqual(saved)
  }
  const broke = json(game.captureRun())
  expect(game.canRerollBossMandate()).toBe(false)
  expect(game.rerollBossMandate().success).toBe(false)
  expect(game.captureRun()).toEqual(broke)
  Object.assign(game.getState(), { gold: 100 })
  advanceToRound(game, 'Boss')
  const boss = json(game.captureRun())
  expect(game.canRerollBossMandate()).toBe(false)
  expect(game.rerollBossMandate().success).toBe(false)
  expect(game.captureRun()).toEqual(boss)
})
