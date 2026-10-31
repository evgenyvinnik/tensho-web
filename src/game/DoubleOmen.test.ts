import { afterEach, expect, it } from 'vitest'
import { ALL_OMENS } from '../config/omenDefinitions'
import { useOmenStore } from '../stores/omenStore'
import { OmenTagSystem } from '../systems/OmenTagSystem'
import { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { clearRound } from '../test/roundHelpers'
import { SWIFT_CLEAR_SPARE_TURNS } from './playRules'

const swift = { spareTurns: SWIFT_CLEAR_SPARE_TURNS }

afterEach(() => {
  useOmenStore.getState().clearForNewRun()
  eventBus.clear()
  runRandom.reset()
})

function award(system: OmenTagSystem, id: string) {
  return system.handleRoundSkip(
    'Small',
    ALL_OMENS.filter((o) => o.id !== id).map((o) => o.id)
  )
}

it('awards Double Omen through ordinary skip selection and retains its pending identity', () => {
  const system = new OmenTagSystem()
  expect(award(system, 'double_omen').omen?.id).toBe('double_omen')
  expect(system.getActiveOmens().map((o) => o.definitionId)).toEqual([
    'double_omen',
  ])
  expect(system.getOmenHistory()).toHaveLength(0)
})

it('atomically queues both copied round rewards and consumes them once', () => {
  const system = new OmenTagSystem()
  useOmenStore.getState().copyNextTag()
  award(system, 'omen_of_rivers')
  const state = useOmenStore.getState()
  expect(state.activeTags).toHaveLength(2)
  expect(state.pendingBossTags).toHaveLength(2)
  expect(new Set(state.activeTags.map((o) => o.id)).size).toBe(2)
  expect(state.hasDoubleOmenActive).toBe(false)
  expect(system.triggerRoundStartOmens().discardBonus).toBe(2)
  expect(system.triggerRoundStartOmens().discardBonus).toBe(0)
})

it('banks consecutive Double Omens without recursion or losing a copy', () => {
  const system = new OmenTagSystem()
  expect(award(system, 'double_omen').copies).toBe(1)
  expect(award(system, 'double_omen').copies).toBe(1)
  // The reveal reports every copy the banked Double Omens produced.
  expect(award(system, 'omen_of_rivers').copies).toBe(3)
  expect(system.triggerRoundStartOmens().discardBonus).toBe(3)
  expect(
    system.getOmenHistory().filter((o) => o.definitionId === 'double_omen')
  ).toHaveLength(2)
})

it.each([
  ['fortune_omen', 20],
  ['speed_omen', 20],
  ['austerity_omen', 30],
] as const)(
  'delivers both instant %s rewards and consumes both identities',
  (id, gold) => {
    const system = new OmenTagSystem()
    award(system, 'double_omen')
    expect(award(system, id).immediateGold).toBe(gold)
    expect(system.getActiveOmens()).toHaveLength(0)
    expect(
      system.getOmenHistory().filter((o) => o.definitionId === id)
    ).toHaveLength(2)
  }
)

it('keeps copied shop rewards pending when delivery is impossible', () => {
  const system = new OmenTagSystem()
  award(system, 'double_omen')
  award(system, 'omen_of_crescents')
  expect(system.triggerShopOmens(() => false).guaranteedItems).toHaveLength(0)
  expect(useOmenStore.getState().pendingShopTags).toHaveLength(2)
  expect(system.triggerShopOmens().guaranteedItems).toHaveLength(2)
  expect(system.triggerShopOmens().guaranteedItems).toHaveLength(0)
})

it('protects two separate Script uses and does not consume on inspection', () => {
  const system = new OmenTagSystem()
  useOmenStore.getState().copyNextTag()
  useOmenStore.getState().addTag('omen_of_ash')
  expect(system.hasVoidScriptDownsideProtection()).toBe(true)
  expect(system.triggerVoidScriptOmens().negateDownside).toBe(true)
  expect(system.triggerVoidScriptOmens().negateDownside).toBe(true)
  expect(system.triggerVoidScriptOmens().negateDownside).toBe(false)
})

it('retains pending copies after invalid/locked awards and rejects Boss skipping', () => {
  const system = new OmenTagSystem()
  useOmenStore.getState().copyNextTag()
  expect(useOmenStore.getState().addTag('missing')).toBeNull()
  useOmenStore.setState((s) => ({
    unlockedTagIds: s.unlockedTagIds.filter((id) => id !== 'omen_of_rivers'),
  }))
  expect(useOmenStore.getState().addTag('omen_of_rivers')).toBeNull()
  expect(system.handleRoundSkip('Boss').omen).toBeNull()
  expect(useOmenStore.getState().hasDoubleOmenActive).toBe(true)
  useOmenStore.getState().unlockTag('omen_of_rivers')
  system.reset()
  expect(useOmenStore.getState().hasDoubleOmenActive).toBe(false)
})

it.each([
  [389, 'omen_of_rivers'],
  [459, 'speed_omen'],
  [105, 'decree_omen'],
] as const)(
  'earns Double then %s through real seeded swift clears',
  (seed, id) => {
    const game = new GameOrchestrator()
    game.startNewRun(seed)
    const state = game.getState()
    clearRound(game, swift)
    expect(
      state.omenSystem.getActiveOmens().map((o) => o.definitionId)
    ).toEqual(['double_omen'])
    expect(state.lastRoundSummary!.omenGold).toBe(0)
    game.exitShop()
    clearRound(game, swift)
    expect(state.lastRoundSummary!.roundType).toBe('Large')
    expect(useOmenStore.getState().hasDoubleOmenActive).toBe(false)
    if (id === 'speed_omen') expect(state.lastRoundSummary!.omenGold).toBe(20)
    // The Decree Omen waits for the next Tea House; the others are spent by
    // the time the Boss round is dealt.
    if (id === 'decree_omen')
      expect(
        state.omenSystem.getActiveOmens().map((o) => o.definitionId)
      ).toEqual([id, id])
    game.exitShop()
    expect(state.currentRound).toBe(3)
    if (id === 'omen_of_rivers') expect(state.omenDiscardBonus).toBe(2)
    if (id !== 'decree_omen')
      expect(
        state.omenSystem.getOmenHistory().filter((o) => o.definitionId === id)
      ).toHaveLength(2)
  }
)

it('copies next-hand forecasts without spending them before payment', () => {
  const system = new OmenTagSystem()
  useOmenStore.getState().copyNextTag()
  useOmenStore.getState().addTag('score_surge_omen')
  const preview = system.peekHandScoredOmens()
  expect(preview.scoreBonus).toBe(
    Number(ALL_OMENS.find((o) => o.id === 'score_surge_omen')!.effect.value) * 2
  )
  expect(preview.consumedOmenIds).toHaveLength(2)
  expect(system.peekHandScoredOmens()).toEqual(preview)
  expect(system.triggerHandScoredOmens()).toEqual(preview)
  expect(system.peekHandScoredOmens().scoreBonus).toBe(0)
})

it('copies interest cap bonuses without extending their duration', () => {
  const system = new OmenTagSystem()
  award(system, 'double_omen')
  award(system, 'interest_omen')
  expect(system.getInterestCapBonus()).toBe(
    Number(ALL_OMENS.find((o) => o.id === 'interest_omen')!.effect.value) * 2
  )
  system.onRoundEnd()
  system.onRoundEnd()
  expect(system.getInterestCapBonus()).toBeGreaterThan(0)
  system.onRoundEnd()
  expect(system.getInterestCapBonus()).toBe(0)
})
