import { afterEach, expect, it, vi } from 'vitest'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { AMBER_ACORN, CRIMSON_HEART } from '../config/mandateDefinitions'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { Tile, TileSuit } from '../core/Tile'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'

const definition = ALL_DECREES.find((d) => d.id === 'decree-half-suited')!

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
  vi.restoreAllMocks()
})

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.decreeSystem = new DecreeSystem()
  return { game, state, system: state.decreeSystem }
}

it('assigns distinct physical identities without changing catalog identity', () => {
  const system = new DecreeSystem()
  const first = system.acquireDecree(definition)!
  const second = system.acquireDecree(first)!
  expect(first.instanceId).toEqual(expect.any(String))
  expect(second.instanceId).toEqual(expect.any(String))
  expect(second.instanceId).not.toBe(first.instanceId)
  expect([first.id, second.id]).toEqual([definition.id, definition.id])
})

it('sells the selected duplicate and its exact price without touching an Eternal sibling', () => {
  const { game, state, system } = fixture()
  const first = system.acquireDecree(
    { ...definition, sellValue: 1 },
    { type: 'Eternal' }
  )!
  const second = system.acquireDecree({
    ...definition,
    sellValue: 9,
    edition: 'Negative',
  })!
  const before = state.gold
  expect(game.sellDecree(second.instanceId!).success).toBe(true)
  expect(state.gold).toBe(before + 9)
  expect(system.getOwnedDecrees()).toEqual([first])
  expect(system.getMaxSlots()).toBe(5)
  expect(game.sellDecree(second.instanceId!).success).toBe(false)
  expect(state.gold).toBe(before + 9)
})

it('changes only the selected duplicate edition and capacity contribution', () => {
  const system = new DecreeSystem()
  const first = system.acquireDecree(definition)!
  const second = system.acquireDecree(definition)!
  expect(system.applyEdition(second.instanceId!, 'Negative')).toBe(true)
  expect(first.edition).toBeUndefined()
  expect(second.edition).toBe('Negative')
  expect(system.getMaxSlots()).toBe(6)
  expect(system.removeDecree(second.instanceId!)).toBe(true)
  expect(system.getMaxSlots()).toBe(5)
  expect(system.getOwnedDecrees()).toEqual([first])
})

it('gives each copied Perishable sticker its own clock without mutating the offer', () => {
  const system = new DecreeSystem()
  const sticker = { type: 'Perishable' as const, roundsRemaining: 3 }
  const first = system.acquireDecree(definition, sticker)!
  const second = system.acquireDecree(first)!
  system.onRoundStart()
  system.onRoundEnd()
  expect(sticker.roundsRemaining).toBe(3)
  expect(first.sticker?.roundsRemaining).toBe(2)
  expect(second.sticker?.roundsRemaining).toBe(2)
  expect(first.isDebuffed).not.toBe(true)
  expect(second.isDebuffed).not.toBe(true)
})

it('Crimson Heart suppresses exactly one physical copy', () => {
  const { state, system } = fixture()
  system.acquireDecree(definition)
  system.acquireDecree(definition)
  expect(
    state.mandateEffectSystem.activateMandate(
      CRIMSON_HEART,
      state.handTiles,
      system.getOwnedDecrees()
    ).success
  ).toBe(true)
  const disabled = new Set(state.mandateEffectSystem.getDisabledDecreeIds())
  expect(disabled.size).toBe(1)
  expect(system.getActiveDecrees(disabled)).toHaveLength(1)
})

it('scores the surviving duplicate under Crimson Heart in both preview and payment', () => {
  const { game, state, system } = fixture()
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.handTiles = [4, 5, 6].map(
    (rank) => new Tile(TileSuit.Souzu, rank, `identity-${rank}`)
  )
  const ids = state.handTiles.map((t) => t.id)
  const base = game.previewScore(ids)!.finalScore
  system.acquireDecree(definition)
  const single = game.previewScore(ids)!.finalScore
  system.acquireDecree(definition)
  expect(game.previewScore(ids)!.finalScore).toBeGreaterThan(single)
  state.mandateEffectSystem.activateMandate(
    CRIMSON_HEART,
    state.handTiles,
    system.getOwnedDecrees()
  )
  expect(single).toBeGreaterThan(base)
  expect(game.previewScore(ids)!.finalScore).toBe(single)
  const before = state.score
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(state.score - before).toBe(single)
})

it.each(['script_of_the_hex', 'script_of_the_ankh'] as const)(
  '%s preserves only its chosen physical target(s), not every same-name sibling',
  (id) => {
    const { game, system } = fixture()
    system.acquireDecree(definition)
    system.acquireDecree(definition)
    const chosen = system.acquireDecree(definition)!
    const script = VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id])
    expect(game.addVoidScript(script)).toBe(true)
    vi.spyOn(runRandom, 'next').mockReturnValue(0.99)
    expect(
      game.processAction({ type: 'useScript', scriptId: script.instanceId })
        .success
    ).toBe(true)
    const survivors = system.getOwnedDecrees()
    expect(survivors).toHaveLength(id === 'script_of_the_hex' ? 1 : 2)
    expect(new Set(survivors.map((d) => d.instanceId)).size).toBe(
      survivors.length
    )
    expect(survivors[0].instanceId).toBe(chosen.instanceId)
    if (id === 'script_of_the_hex')
      expect(survivors[0].edition).toBe('Polychrome')
  }
)

it('retains physical identities and non-reused allocation across validated JSON saves', () => {
  const { game, system } = fixture()
  const first = system.acquireDecree(definition)!
  const sold = system.acquireDecree(definition)!
  system.sellDecree(sold.instanceId!)
  const saved = JSON.parse(JSON.stringify(game.captureRun()))
  game.restoreRun(parseClassicRunSnapshot(saved))
  expect(JSON.parse(JSON.stringify(game.captureRun()))).toEqual(saved)
  const restored = game.getState().decreeSystem
  expect(restored.getOwnedDecrees().map((d) => d.instanceId)).toEqual([
    first.instanceId,
  ])
  const next = restored.acquireDecree(definition)!
  expect(next.instanceId).toEqual(expect.any(String))
  expect(next.instanceId).not.toBe(first.instanceId)
  expect(next.instanceId).not.toBe(sold.instanceId)
})

it('restores legacy duplicates deterministically without spending RNG or losing old suppression', () => {
  const { game, state, system } = fixture()
  system.acquireDecree(definition)
  system.acquireDecree(definition)
  const saved = JSON.parse(JSON.stringify(game.captureRun()))
  delete saved.state.decreeSystem.nextInstanceId
  for (const decree of saved.state.decreeSystem.ownedDecrees)
    delete decree.instanceId
  saved.state.mandateEffectSystem.disabledDecreeIds = [definition.id]
  const parsed = parseClassicRunSnapshot(saved)
  game.restoreRun(parsed)
  const firstRestore = game.captureRun()
  expect(firstRestore.random).toEqual(saved.random)
  expect(
    new Set(
      firstRestore.state.decreeSystem.ownedDecrees.map((d) => d.instanceId)
    ).size
  ).toBe(2)
  const restored = game.getState()
  expect(
    restored.decreeSystem.getActiveDecrees(
      new Set(restored.mandateEffectSystem.getDisabledDecreeIds())
    )
  ).toHaveLength(0)
  expect(state.decreeSystem).toBe(system) // The replaced engine did not mutate the prior object.
  game.restoreRun(parsed)
  expect(game.captureRun().state.decreeSystem).toEqual(
    firstRestore.state.decreeSystem
  )
  expect(() =>
    parseClassicRunSnapshot(JSON.parse(JSON.stringify(firstRestore)))
  ).not.toThrow()
})

it.each([
  'duplicate',
  'empty',
  'invalid',
  'exhausted',
  'reused',
  'missing-counter',
  'missing-id',
])('rejects %s physical identity data at the public save boundary', (kind) => {
  const { game, system } = fixture()
  system.acquireDecree(definition)
  system.acquireDecree(definition)
  const saved = JSON.parse(JSON.stringify(game.captureRun()))
  const inventory = saved.state.decreeSystem
  if (kind === 'duplicate')
    inventory.ownedDecrees[1].instanceId = inventory.ownedDecrees[0].instanceId
  if (kind === 'empty') inventory.ownedDecrees[0].instanceId = ''
  if (kind === 'invalid')
    inventory.ownedDecrees[0].instanceId = 'owned-decree-Infinity'
  if (kind === 'exhausted') inventory.nextInstanceId = Number.MAX_SAFE_INTEGER
  if (kind === 'reused') inventory.nextInstanceId = 1
  if (kind === 'missing-counter') delete inventory.nextInstanceId
  if (kind === 'missing-id') delete inventory.ownedDecrees[0].instanceId
  expect(() => parseClassicRunSnapshot(saved)).toThrow(/Invalid Classic save/)
})

it('Amber Acorn keeps two distinct physical entries through serialization', () => {
  const { game, state, system } = fixture()
  system.acquireDecree(definition)
  system.acquireDecree(definition)
  state.mandateEffectSystem.activateMandate(
    AMBER_ACORN,
    state.handTiles,
    system.getOwnedDecrees()
  )
  const order = state.mandateEffectSystem.getShuffledDecreeIds()
  expect(new Set(order).size).toBe(2)
  const saved = JSON.parse(JSON.stringify(game.captureRun()))
  game.restoreRun(parseClassicRunSnapshot(saved))
  expect(game.getState().mandateEffectSystem.getShuffledDecreeIds()).toEqual(
    order
  )
})

it('isolates snapshot and restored Perishable clocks from live state', () => {
  const system = new DecreeSystem()
  system.acquireDecree(definition, { type: 'Perishable', roundsRemaining: 3 })
  const saved = system.toState()
  const restored = DecreeSystem.fromState(saved)
  restored.onRoundStart()
  restored.onRoundEnd()
  expect(saved.ownedDecrees[0].sticker?.roundsRemaining).toBe(3)
  expect(system.getOwnedDecrees()[0].sticker?.roundsRemaining).toBe(3)
  expect(restored.getOwnedDecrees()[0].sticker?.roundsRemaining).toBe(2)
})

it.each(['script_of_the_hex', 'script_of_the_ankh'] as const)(
  '%s still respects Omen of Ash protection from the destruction penalty',
  (id) => {
    const { game, system } = fixture()
    system.acquireDecree(definition)
    system.acquireDecree(definition)
    useOmenStore.getState().addTag('omen_of_ash')
    const script = VoidScriptSystem.createVoidScriptInstance(VOID_SCRIPTS[id])
    game.addVoidScript(script)
    expect(
      game.processAction({ type: 'useScript', scriptId: script.instanceId })
        .success
    ).toBe(true)
    expect(system.getOwnedDecrees()).toHaveLength(
      id === 'script_of_the_hex' ? 2 : 3
    )
  }
)

it('Hex cannot destroy Eternal siblings and removes only each Negative copy’s own capacity', () => {
  const { game, system } = fixture()
  const eternal = system.acquireDecree(definition, { type: 'Eternal' })!
  system.acquireDecree({ ...definition, edition: 'Negative' })
  const chosen = system.acquireDecree(definition)!
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_the_hex
  )
  game.addVoidScript(script)
  vi.spyOn(runRandom, 'next').mockReturnValue(0.99)
  expect(
    game.processAction({ type: 'useScript', scriptId: script.instanceId })
      .success
  ).toBe(true)
  expect(system.getOwnedDecrees()).toEqual([eternal, chosen])
  expect(chosen.edition).toBe('Polychrome')
  expect(system.getMaxSlots()).toBe(5)
})
