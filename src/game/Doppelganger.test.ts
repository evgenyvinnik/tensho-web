import { afterEach, expect, it } from 'vitest'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { runRandom, RunRandom } from './RunRandom'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { eventBus } from './EventBus'
import { useOmenStore } from '../stores/omenStore'
import { Tile, TileSuit } from '../core/Tile'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'

const definition = (id: string) => ALL_DECREES.find((d) => d.id === id)!
const copyId = 'decree-doppelganger'
const wideId = 'decree-wide-grip'
afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})

function fixture(seed = 7) {
  runRandom.start(seed)
  const system = new DecreeSystem(10)
  const wide = system.acquireDecree(definition(wideId))!
  const ancient = system.acquireDecree(definition('decree-ancient-scroll'))!
  const copy = system.acquireDecree(definition(copyId))!
  return { system, wide, ancient, copy }
}

it('uses the dedicated seeded stream rather than inventory position', () => {
  const outcomes = new Set<string>()
  for (let seed = 1; seed <= 30; seed++) {
    const { system, wide, ancient, copy } = fixture(seed)
    const expected = new RunRandom()
    expected.start(seed)
    expect(copy.randomCopyTargetId).toBe(
      expected.pick('decreeCopies', [wide, ancient])!.instanceId
    )
    outcomes.add(copy.randomCopyTargetId!)
    expect(system.getHandSizeBonus()).toBe(
      copy.randomCopyTargetId === wide.instanceId ? 0 : -3
    )
    expect(runRandom.toState()).toEqual(expected.toState())
  }
  expect(outcomes.size).toBe(2)
})

it('does not spend RNG or change target during repeated effect/resource queries', () => {
  const { system, copy } = fixture()
  const before = structuredClone(system.toState()),
    random = runRandom.toState()
  for (let i = 0; i < 20; i++) {
    system.getHandSizeBonus()
    system.getAdditionalDiscards()
    system.getAdditionalDraws()
    system.getRuleModification('hand_size')
    system.calculateRetriggers([])
  }
  expect(system.toState()).toEqual(before)
  expect(runRandom.toState()).toEqual(random)
  expect(copy.randomCopyTargetId).toBe(
    before.ownedDecrees[2].randomCopyTargetId
  )
})

it('rolls once at each round start before resource initialization', () => {
  const { system, wide, ancient, copy } = fixture()
  const expected = RunRandom.fromState(runRandom.toState())
  for (let round = 0; round < 5; round++) {
    const chosen = expected.pick('decreeCopies', [wide, ancient])!
    system.onRoundStart()
    expect(copy.randomCopyTargetId).toBe(chosen.instanceId)
    expect(system.getHandSizeBonus()).toBe(chosen === wide ? 0 : -3)
    expect(runRandom.toState()).toEqual(expected.toState())
  }
})

it('waits with no candidates and selects when the first real target arrives', () => {
  runRandom.start(3)
  const system = new DecreeSystem()
  const copy = system.acquireDecree(definition(copyId))!
  system.acquireDecree(definition('decree-blueprint'))
  system.acquireDecree(definition('decree-brainstorm'))
  expect(copy.randomCopyTargetId).toBeNull()
  expect(runRandom.toState().streams).toEqual({})
  const wide = system.acquireDecree(definition(wideId))!
  expect(copy.randomCopyTargetId).toBe(wide.instanceId)
})

it.each(['sell', 'remove'] as const)(
  'does not reroll after target %s or another purchase',
  (action) => {
    const { system, copy } = fixture()
    const target = copy.randomCopyTargetId!,
      random = runRandom.toState()
    if (action === 'sell') system.sellDecree(target)
    else system.removeDecree(target)
    system.acquireDecree(definition('decree-gentle-breeze'))
    expect(copy.randomCopyTargetId).toBe(target)
    expect(runRandom.toState()).toEqual(random)
    system.onRoundStart()
    expect(copy.randomCopyTargetId).not.toBe(target)
  }
)

it('keeps physical duplicate identity across reordering and debuffing', () => {
  runRandom.start(7)
  const system = new DecreeSystem()
  const first = system.acquireDecree(definition(wideId))!
  const copy = system.acquireDecree(definition(copyId))!
  const second = system.acquireDecree(definition(wideId))!
  expect(copy.randomCopyTargetId).toBe(first.instanceId)
  first.isDebuffed = true
  expect(system.getHandSizeBonus()).toBe(1)
  const saved = system.toState()
  saved.ownedDecrees.reverse()
  const restored = DecreeSystem.fromState(saved)
  expect(restored.getOwnedDecree(copy.instanceId!)!.randomCopyTargetId).toBe(
    first.instanceId
  )
  expect(restored.getHandSizeBonus()).toBe(1)
  restored.onRoundStart()
  expect(restored.getOwnedDecree(copy.instanceId!)!.randomCopyTargetId).toBe(
    second.instanceId
  )
})

it('a copied physical Doppelganger gets its own draw without changing its sibling', () => {
  const { system, copy } = fixture()
  const target = copy.randomCopyTargetId
  const random = RunRandom.fromState(runRandom.toState())
  const candidates = system.getOwnedDecrees().filter((d) => d.id !== copyId)
  const expected = random.pick('decreeCopies', candidates)!.instanceId
  const duplicate = system.acquireDecree(copy)!
  expect(duplicate.instanceId).not.toBe(copy.instanceId)
  expect(duplicate.randomCopyTargetId).toBe(expected)
  expect(copy.randomCopyTargetId).toBe(target)
  expect(runRandom.toState()).toEqual(random.toState())
})

it('new saves restore the exact selection without drawing random values', () => {
  const { system } = fixture()
  const random = runRandom.toState(),
    snapshot = system.toState()
  expect(DecreeSystem.fromState(snapshot).toState()).toEqual(snapshot)
  expect(runRandom.toState()).toEqual(random)
})

it('legacy saves preserve the old positional target once without drawing RNG', () => {
  const { system } = fixture()
  const snapshot = system.toState()
  delete snapshot.ownedDecrees[2].randomCopyTargetId
  const before = runRandom.toState()
  const restored = DecreeSystem.fromState(snapshot)
  expect(restored.getOwnedDecrees()[2].randomCopyTargetId).toBe(
    snapshot.ownedDecrees[0].instanceId
  )
  expect(restored.getHandSizeBonus()).toBe(0)
  expect(runRandom.toState()).toEqual(before)
})

function gameFixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  state.decreeSystem = new DecreeSystem(10)
  state.decreeSystem.acquireDecree(definition('decree-ancient-scroll'))
  const copy = state.decreeSystem.acquireDecree(definition(copyId))!
  state.handTiles = [4, 5, 6].map(
    (rank) => new Tile(TileSuit.Souzu, rank, `doppel-${rank}`)
  )
  state.wall = Array.from(
    { length: 40 },
    (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
  )
  state.wallTemplate = [...state.handTiles, ...state.wall]
  state.drawIndex = 0
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  return { game, state, copy }
}

it('actual previews, payment and validated reload retain the exact target and RNG', () => {
  const { game, state, copy } = gameFixture()
  const ids = state.handTiles.map((t) => t.id),
    random = runRandom.toState()
  const preview = game.previewScore(ids)!
  expect(preview.equation!.points).toBe(345)
  expect(game.previewScore(ids)).toEqual(preview)
  expect(runRandom.toState()).toEqual(random)
  const saved = JSON.parse(JSON.stringify(game.captureRun()))
  game.restoreRun(parseClassicRunSnapshot(saved))
  expect(JSON.parse(JSON.stringify(game.captureRun()))).toEqual(saved)
  expect(game.previewScore(ids)).toEqual(preview)
  expect(game.processAction({ type: 'play', tileIds: ids }).success).toBe(true)
  expect(game.getState().score).toBe(preview.finalScore)
  expect(
    game.getState().decreeSystem.getOwnedDecrees()[1].randomCopyTargetId
  ).toBe(copy.randomCopyTargetId)
})

it.each(['self', 'future', 'malformed', 'noncopy'] as const)(
  'rejects %s copy state without mutating a live run',
  (corruption) => {
    const { game, copy } = gameFixture()
    const before = JSON.parse(JSON.stringify(game.captureRun()))
    const saved = structuredClone(before),
      state = saved.state.decreeSystem
    if (corruption === 'noncopy')
      state.ownedDecrees[0].randomCopyTargetId = copy.instanceId
    else
      state.ownedDecrees[1].randomCopyTargetId =
        corruption === 'self'
          ? copy.instanceId
          : corruption === 'future'
            ? 'owned-decree-999'
            : 'catalog-id'
    expect(() => parseClassicRunSnapshot(saved)).toThrow()
    expect(JSON.parse(JSON.stringify(game.captureRun()))).toEqual(before)
  }
)

it('accepts a removed physical target in a validated save without replacing it', () => {
  const { game, state, copy } = gameFixture()
  state.decreeSystem.removeDecree(copy.randomCopyTargetId!)
  const saved = JSON.parse(JSON.stringify(game.captureRun()))
  game.restoreRun(parseClassicRunSnapshot(saved))
  expect(JSON.parse(JSON.stringify(game.captureRun()))).toEqual(saved)
})

it('initializes a real incoming round with the newly chosen copied resource cost', () => {
  const { game, state, copy } = gameFixture()
  const wide = state.decreeSystem.acquireDecree(definition(wideId))!
  const ancient = state.decreeSystem.getOwnedDecrees()[0]
  const random = RunRandom.fromState(runRandom.toState())
  const expected = random.pick('decreeCopies', [ancient, wide])!
  state.phase = 'shop'
  state.lastCompletedRoundType = 'Small'
  expect(game.shop.open()).toBe(true)
  game.exitShop()
  expect(state.phase).toBe('gameplay')
  expect(copy.randomCopyTargetId).toBe(expected.instanceId)
  expect(state.handTiles).toHaveLength(expected === wide ? 14 : 11)
})

it.each(['source', 'copier'] as const)(
  'suppresses the %s without jumping targets or advancing RNG',
  (suppressed) => {
    const { game, state, copy } = gameFixture()
    const ids = state.handTiles.map((t) => t.id),
      before = runRandom.toState()
    const selected =
      suppressed === 'source' ? copy.randomCopyTargetId! : copy.instanceId!
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds: [selected],
    })
    expect(game.previewScore(ids)!.equation!.points).toBe(
      suppressed === 'source' ? 45 : 195
    )
    expect(copy.randomCopyTargetId).toBe(
      state.decreeSystem.getOwnedDecrees()[0].instanceId
    )
    expect(runRandom.toState()).toEqual(before)
  }
)
