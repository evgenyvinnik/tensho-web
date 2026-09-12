import { afterEach, describe, expect, it } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { eventBus } from './EventBus'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import { VoidScriptSystem, VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import {
  CelestialOrbSystem,
  CELESTIAL_ORBS,
} from '../systems/CelestialOrbSystem'
import { Tile, TileSuit } from '../core/Tile'
import { consumableTargetRange } from '../gameplay/consumableTargeting'

function fixture(id = 'seal_of_the_alchemist') {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  const seal = FateSealSystem.createFateSealInstance(FATE_SEALS[id])
  expect(game.addFateSeal(seal)).toBe(true)
  return { game, seal }
}

function snapshot(game: GameOrchestrator) {
  const state = game.getState()
  return JSON.stringify({
    hand: state.handTiles,
    wall: state.wallTemplate,
    gold: state.gold,
    seals: state.fateSeals,
    scripts: state.voidScripts,
    orbs: state.celestialOrbs,
    uses: state.consumableSystem.getFateSealUsesRemaining(),
    hidden: [...state.faceDownTileIds],
  })
}

afterEach(() => {
  eventBus.clear()
  eventBus.disableHistory()
})

describe('consumable targeting contract', () => {
  it.each([
    ['seal_of_strength', TileSuit.Manzu, 9],
    ['seal_of_strength', TileSuit.Wind, 1],
    ['seal_of_manzu', TileSuit.Manzu, 3],
    ['seal_of_manzu', TileSuit.Wind, 1],
  ] as const)(
    'does not consume %s when it changes no tile (%s %i)',
    (id, suit, rank) => {
      const { game, seal } = fixture(id)
      const state = game.getState() as OrchestratorState
      const tile = new Tile(suit, rank, 'no-change')
      state.handTiles = [tile]
      state.wallTemplate = [tile]
      const before = snapshot(game)
      const result = game.processAction({
        type: 'useSeal',
        sealId: seal.instanceId,
        targets: [tile.id],
      })
      expect(result.success).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
      expect(snapshot(game)).toBe(before)
    }
  )

  it.each([
    'seal_of_manzu',
    'seal_of_pinzu',
    'seal_of_souzu',
    'seal_of_unity',
    'seal_of_strength',
    'seal_of_release',
  ])('honors the authored up-to range for %s', (id) => {
    const { game, seal } = fixture(id)
    const tile = game
      .getHandTiles()
      .find(
        (tile) =>
          tile.isSuited && tile.rank < 9 && tile.suit !== seal.effect.targetSuit
      )!
    const action = {
      type: 'useSeal' as const,
      sealId: seal.instanceId,
      targets: [tile.id],
    }
    expect(consumableTargetRange(seal.effect).min).toBe(1)
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.processAction(action).success).toBe(true)
    expect(game.getFateSeals()).toHaveLength(0)
    expect(game.processAction(action).success).toBe(false)
  })

  it.each(['empty', 'short', 'duplicate', 'missing', 'excess'])(
    'rejects %s targets without spending or revealing anything',
    (kind) => {
      const { game, seal } = fixture()
      const ids = game
        .getHandTiles()
        .slice(0, 3)
        .map((tile) => tile.id)
      const targets =
        kind === 'empty'
          ? []
          : kind === 'short'
            ? ids.slice(0, 1)
            : kind === 'duplicate'
              ? [ids[0], ids[0]]
              : kind === 'missing'
                ? [ids[0], 'missing']
                : ids
      const action = {
        type: 'useSeal' as const,
        sealId: seal.instanceId,
        targets,
      }
      const before = snapshot(game)
      eventBus.enableHistory()
      expect(game.canPerformAction(action)).toBe(false)
      expect(game.validateConsumableAction(action).isValid).toBe(false)
      expect(game.processAction(action).success).toBe(false)
      expect(snapshot(game)).toBe(before)
      expect(eventBus.getHistory()).toEqual([])
    }
  )

  it('keeps target order: first chosen tile becomes a copy of the second', () => {
    const { game, seal } = fixture('seal_of_transmutation')
    const state = game.getState() as OrchestratorState
    const source = new Tile(TileSuit.Manzu, 1, 'source')
    const target = new Tile(TileSuit.Souzu, 9, 'target')
    state.handTiles = [source, target]
    state.wallTemplate = [source, target]
    const action = {
      type: 'useSeal' as const,
      sealId: seal.instanceId,
      targets: [target.id, source.id],
    }
    const before = snapshot(game)
    expect(game.canPerformAction(action)).toBe(true)
    expect(snapshot(game)).toBe(before)
    expect(game.processAction(action).success).toBe(true)
    expect(
      game.getHandTiles().map((tile) => [tile.id, tile.suit, tile.rank])
    ).toEqual([
      ['source', TileSuit.Manzu, 1],
      ['target', TileSuit.Manzu, 1],
    ])
  })

  it('does not let untargeted effects inspect unrelated concealed tiles', () => {
    const { game, seal } = fixture('seal_of_the_hermit')
    const id = game.getHandTiles()[0].id
    game.getState().faceDownTileIds.add(id)
    const before = snapshot(game)
    expect(
      game.processAction({
        type: 'useSeal',
        sealId: seal.instanceId,
        targets: [id],
      }).success
    ).toBe(false)
    expect(snapshot(game)).toBe(before)
    expect(
      game.processAction({
        type: 'useSeal',
        sealId: seal.instanceId,
        targets: [],
      }).success
    ).toBe(true)
    expect(game.getState().faceDownTileIds.has(id)).toBe(true)
  })

  it('preflights Script counts and the once-per-round limit', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const script = VoidScriptSystem.createVoidScriptInstance(
      VOID_SCRIPTS.script_of_the_gold_seal
    )
    const other = VoidScriptSystem.createVoidScriptInstance(
      VOID_SCRIPTS.script_of_the_gold_seal
    )
    expect(game.addVoidScript(script)).toBe(true)
    expect(game.addVoidScript(other)).toBe(true)
    const action = {
      type: 'useScript' as const,
      scriptId: script.instanceId,
      targets: [] as string[],
    }
    expect(game.canPerformAction(action)).toBe(false)
    action.targets = [game.getHandTiles()[0].id]
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.processAction(action).success).toBe(true)
    expect(
      game.canPerformAction({ ...action, scriptId: other.instanceId })
    ).toBe(false)
    expect(game.getState().voidScripts).toHaveLength(1)
  })

  it('consumes an owned Orb once and rejects use outside gameplay', () => {
    const game = new GameOrchestrator()
    game.startNewRun(7)
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      Object.values(CELESTIAL_ORBS)[0]
    )
    expect(game.addCelestialOrb(orb)).toBe(true)
    const action = { type: 'useOrb' as const, orbId: orb.instanceId }
    const state = game.getState() as OrchestratorState
    state.phase = 'shop'
    expect(game.canPerformAction(action)).toBe(false)
    state.phase = 'gameplay'
    const before = state.celestialOrbSystem.getYakuLevel(orb.effect.targetYaku)
    expect(game.processAction(action).success).toBe(true)
    expect(state.celestialOrbSystem.getYakuLevel(orb.effect.targetYaku)).toBe(
      before + 1
    )
    expect(game.processAction(action).success).toBe(false)
  })
})
