import { afterEach, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { ALL_DECREES, DecreeSystem } from '../systems/DecreeSystem'
import { eventBus } from './EventBus'
import { runRandom } from './RunRandom'
import { useOmenStore } from '../stores/omenStore'
import { parseClassicRunSnapshot } from './validateClassicRun'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { BOSS_MANDATES } from '../systems/RoundManager'
import { Tile, TileSuit } from '../core/Tile'

afterEach(() => {
  eventBus.clear()
  runRandom.reset()
  useOmenStore.getState().clearForNewRun()
})
const definition = (id: string) => ALL_DECREES.find((d) => d.id === id)!
function fixture(copier: string, target = 'decree-phoenix') {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const state = game.getState() as OrchestratorState
  state.flowerSystem.clear()
  state.seasonSystem.clear()
  const system = (state.decreeSystem = new DecreeSystem(10))
  const ids =
    copier === 'decree-blueprint' ? [copier, target] : [target, copier]
  ids.forEach((id) => system.acquireDecree(definition(id)))
  return {
    game,
    state,
    system,
    copy: system.getOwnedDecree(copier)!,
    source: system.getOwnedDecree(target)!,
  }
}
function lose(game: GameOrchestrator) {
  const state = game.getState() as OrchestratorState
  state.handsRemaining = 1
  state.targetScore = 1e9
  state.roundManager.getCurrentRound()!.scoreTarget = 1e9
  const result = game.processAction({
    type: 'play',
    tileIds: state.handTiles.slice(0, 2).map((t) => t.id),
  })
  expect(result.success).toBe(true)
  return result
}
it.each([
  'decree-blueprint',
  'decree-brainstorm',
  'decree-doppelganger',
  'decree-clone-army',
])(
  '%s spends its own Phoenix copy before the original and survives validated reload',
  (id) => {
    const { game, state, copy, source } = fixture(id)
    lose(game)
    expect(state.phase).toBe('shop')
    expect(
      state.decreeSystem.getOwnedDecrees().map((d) => d.instanceId)
    ).toEqual([source.instanceId])
    expect(state.decreeSystem.getOwnedDecree(copy.instanceId!)).toBeUndefined()
    const saved = JSON.parse(JSON.stringify(game.captureRun()))
    game.restoreRun(parseClassicRunSnapshot(saved))
    expect(JSON.parse(JSON.stringify(game.captureRun()))).toEqual(saved)
    game.exitShop()
    lose(game)
    expect(game.getState().phase).toBe('shop')
    expect(game.getState().decreeSystem.getOwnedDecrees()).toHaveLength(0)
    game.exitShop()
    lose(game)
    expect(game.getState().phase).toBe('gameOver')
  }
)
it('Eternal copier cannot supply an unconsumed Phoenix rescue', () => {
  const { game, state, copy, source } = fixture('decree-blueprint')
  copy.sticker = { type: 'Eternal' }
  lose(game)
  expect(state.phase).toBe('shop')
  expect(state.decreeSystem.getOwnedDecrees()).toEqual([copy])
  expect(state.decreeSystem.getOwnedDecree(source.instanceId!)).toBeUndefined()
  game.exitShop()
  lose(game)
  expect(state.phase).toBe('gameOver')
})
it('an Eternal source may lend Phoenix to a spendable copier without being destroyed', () => {
  const { game, state, copy, source } = fixture('decree-doppelganger')
  source.sticker = { type: 'Eternal' }
  lose(game)
  expect(state.phase).toBe('shop')
  expect(state.decreeSystem.getOwnedDecrees()).toEqual([source])
  expect(state.decreeSystem.getOwnedDecree(copy.instanceId!)).toBeUndefined()
  game.exitShop()
  lose(game)
  expect(state.phase).toBe('gameOver')
})
it.each(['source', 'copier'] as const)(
  'respects %s suppression and does not copy around it',
  (which) => {
    const { game, state, copy, source } = fixture('decree-blueprint')
    const disabled = which === 'source' ? source : copy
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds: [disabled.instanceId!],
    })
    lose(game)
    expect(state.phase).toBe(which === 'source' ? 'gameOver' : 'shop')
    expect(state.decreeSystem.getOwnedDecree(copy.instanceId!)).toBe(copy)
  }
)
it('Clone Army prefers permanent rescue over every consuming copy', () => {
  const { game, state, system, copy, source } = fixture('decree-clone-army')
  const immortal = system.acquireDecree(definition('decree-immortal-decree'))!
  lose(game)
  expect(state.phase).toBe('shop')
  expect(system.getOwnedDecrees()).toEqual([source, copy, immortal])
  expect(state.lossPreventionScorePenalty).toBe(0.5)
})
it.each([false, true])(
  'copied Glass Cannon carries destruction risk, while Eternal protection is honored (%s)',
  (eternal) => {
    const { game, state, system, copy, source } = fixture(
      'decree-blueprint',
      'decree-glass-cannon'
    )
    if (eternal) copy.sticker = { type: 'Eternal' }
    state.roundManager.getCurrentRound()!.roundType = 'Boss'
    state.roundManager.getCurrentRound()!.bossMandate = BOSS_MANDATES[0]
    const result = lose(game)
    expect(state.phase).toBe('gameOver')
    expect(system.getOwnedDecree(source.instanceId!)).toBeUndefined()
    expect(system.getOwnedDecree(copy.instanceId!)).toBe(
      eternal ? copy : undefined
    )
    const shattered = result.effects.filter(
      (e) =>
        e.type === 'decree_triggered' && e.description.includes('shattered')
    )
    expect(shattered).toHaveLength(eternal ? 1 : 2)
  }
)

it('resolves permanent rescue provenance without stacking the score penalty', () => {
  const { game, state, system, copy, source } = fixture(
    'decree-blueprint',
    'decree-immortal-decree'
  )
  expect(
    system
      .getRuleContributions('prevent_loss')
      .map((c) => [c.owner.instanceId, c.source.instanceId])
  ).toEqual([
    [copy.instanceId, source.instanceId],
    [source.instanceId, source.instanceId],
  ])
  lose(game)
  expect(state.lossPreventionScorePenalty).toBe(0.5)
  game.exitShop()
  lose(game)
  expect(state.lossPreventionScorePenalty).toBe(0.5)
  expect(system.getOwnedDecrees()).toEqual([copy, source])
})

it('copies neither nested rescue effects nor a debuffed source', () => {
  const { game, state, system, source } = fixture('decree-blueprint')
  source.isDebuffed = true
  expect(system.getRuleContributions('prevent_loss')).toEqual([])
  lose(game)
  expect(state.phase).toBe('gameOver')
  const chained = new DecreeSystem()
  chained.acquireDecree(definition('decree-blueprint'))
  const direct = chained.acquireDecree(definition('decree-blueprint'))!
  const phoenix = chained.acquireDecree(definition('decree-phoenix'))!
  expect(
    chained.getRuleContributions('prevent_loss').map((c) => c.owner)
  ).toEqual([direct, phoenix])
})

it.each(['source', 'copier'] as const)(
  'suppressed %s cannot lend Glass Cannon risk; native liability remains',
  (which) => {
    const { game, state, system, copy, source } = fixture(
      'decree-blueprint',
      'decree-glass-cannon'
    )
    state.mandateEffectSystem = MandateEffectSystem.fromJSON({
      ...state.mandateEffectSystem.toJSON(),
      disabledDecreeIds: [(which === 'source' ? source : copy).instanceId!],
    })
    state.roundManager.getCurrentRound()!.roundType = 'Boss'
    state.roundManager.getCurrentRound()!.bossMandate = BOSS_MANDATES[0]
    const result = lose(game)
    expect(system.getOwnedDecrees()).toEqual([copy])
    expect(
      result.effects.filter((e) => e.description.includes('shattered'))
    ).toHaveLength(1)
  }
)

it('snapshots Clone Army liabilities and reports no destruction for Eternal Glass Cannon', () => {
  const { game, state, system, source } = fixture(
    'decree-clone-army',
    'decree-glass-cannon'
  )
  source.sticker = { type: 'Eternal' }
  system.acquireDecree(definition('decree-clone-army'))
  state.roundManager.getCurrentRound()!.roundType = 'Boss'
  state.roundManager.getCurrentRound()!.bossMandate = BOSS_MANDATES[0]
  const result = lose(game)
  expect(system.getOwnedDecrees()).toEqual([source])
  expect(
    result.effects.filter((e) => e.description.includes('shattered'))
  ).toHaveLength(2)
})

it('Dead Wall Writ copies share a saved round budget, renewed only next round', () => {
  const { game, state, system } = fixture('decree-blueprint', 'dead_wall_writ')
  state.deadWall = [
    new Tile(TileSuit.Manzu, 1, 'copy-writ-1'),
    new Tile(TileSuit.Manzu, 2, 'copy-writ-2'),
  ]
  expect(system.getRuleContributions('dead_wall_draw')).toHaveLength(2)
  expect(game.useDeadWallWrit(state.handTiles[0].id).success).toBe(true)
  expect(game.canUseDeadWallWrit(state.handTiles[0].id)).toBe(false)
  const snapshot = JSON.parse(JSON.stringify(game.captureRun()))
  game.restoreRun(parseClassicRunSnapshot(snapshot))
  expect(game.canUseDeadWallWrit(game.getHandTiles()[0].id)).toBe(false)
  const restored = game.getState() as OrchestratorState
  restored.targetScore = 1
  restored.roundManager.getCurrentRound()!.scoreTarget = 1
  expect(
    game.processAction({
      type: 'play',
      tileIds: restored.handTiles.slice(0, 2).map((t) => t.id),
    }).success
  ).toBe(true)
  expect(game.getState().phase).toBe('shop')
  game.exitShop()
  expect(game.canUseDeadWallWrit(game.getHandTiles()[0].id)).toBe(true)
})
