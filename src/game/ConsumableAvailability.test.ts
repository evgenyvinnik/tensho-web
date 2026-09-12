import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import type { PlayerAction } from './ActionProcessor'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import {
  CelestialOrbSystem,
  CELESTIAL_ORBS,
} from '../systems/CelestialOrbSystem'
import { VoidScriptSystem, VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { Tile, TileSuit } from '../core/Tile'
import { runRandom } from './RunRandom'
import { eventBus } from './EventBus'
import { OMEN_OF_ASH } from '../config/omenDefinitions'
import { useOmenStore } from '../stores/omenStore'

type Action = Extract<
  PlayerAction,
  { type: 'useSeal' | 'useScript' | 'useOrb' }
>

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  return { game, state: game.getState() as OrchestratorState }
}

function seal(game: GameOrchestrator, id: string, targets?: string[]): Action {
  const item = FateSealSystem.createFateSealInstance(FATE_SEALS[id])
  expect(game.addFateSeal(item)).toBe(true)
  return { type: 'useSeal', sealId: item.instanceId, targets }
}

function clearDecrees(game: GameOrchestrator) {
  for (const item of game.getState().decreeSystem.getOwnedDecrees())
    game.getState().decreeSystem.removeDecree(item.id)
}

function fillDecrees(game: GameOrchestrator) {
  const system = game.getState().decreeSystem
  for (const item of ALL_DECREES) {
    if (system.getAvailableSlots() === 0) break
    system.acquireDecree(item)
  }
  expect(system.getAvailableSlots()).toBe(0)
}

function snapshot(game: GameOrchestrator) {
  const state = game.getState()
  return JSON.stringify({
    state,
    hidden: [...state.faceDownTileIds],
    selected: [...state.selectedTileIds],
    levels: [...state.celestialOrbSystem.getAllYakuLevels()],
    scripts: state.voidScriptSystem.toState(),
    last: state.fateSealSystem.getLastUsedConsumable(),
    omens: useOmenStore.getState(),
  })
}

function rejected(game: GameOrchestrator, action: Action, message: string) {
  const before = snapshot(game)
  const random = vi.spyOn(runRandom, 'next')
  eventBus.enableHistory()
  expect(game.validateConsumableAction(action)).toMatchObject({
    isValid: false,
    errors: [expect.stringContaining(message)],
  })
  expect(game.canPerformAction(action)).toBe(false)
  expect(game.processAction(action)).toMatchObject({
    success: false,
    effects: [],
    errors: [expect.stringContaining(message)],
  })
  expect(snapshot(game)).toBe(before)
  expect(eventBus.getHistory()).toEqual([])
  expect(random).not.toHaveBeenCalled()
  random.mockRestore()
}

afterEach(() => {
  vi.restoreAllMocks()
  eventBus.clear()
  eventBus.disableHistory()
})

describe('public-information consumable preflight', () => {
  it.each([
    ['seal_of_strength', TileSuit.Manzu, 9, 'new rank'],
    ['seal_of_strength', TileSuit.Wind, 1, 'new rank'],
    ['seal_of_manzu', TileSuit.Manzu, 3, 'different suit'],
    ['seal_of_manzu', TileSuit.Dragon, 1, 'different suit'],
  ] as const)(
    'rejects visible no-op %s targets before confirmation (%s %s)',
    (id, suit, rank, error) => {
      const { game, state } = fixture()
      state.handTiles[0] = new Tile(suit, rank, 'target')
      rejected(game, seal(game, id, ['target']), error)
    }
  )

  it('rejects an ordinary capped Orb without consuming it or changing copy history', () => {
    const { game, state } = fixture()
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    for (let i = 0; i < 9; i++) state.celestialOrbSystem.useOrb(orb)
    expect(game.addCelestialOrb(orb)).toBe(true)
    rejected(
      game,
      { type: 'useOrb', orbId: orb.instanceId },
      'already at max level'
    )
  })

  it.each(['orb', 'seal', 'script'])(
    'preserves an all-Yaku %s when every level is capped',
    (kind) => {
      const { game, state } = fixture()
      const orb = CelestialOrbSystem.createCelestialOrbInstance(
        CELESTIAL_ORBS.black_hole_orb
      )
      for (let i = 0; i < 9; i++)
        expect(state.celestialOrbSystem.useOrb(orb).success).toBe(true)
      expect(state.celestialOrbSystem.canUpgradeAnyYaku()).toBe(false)
      let action: Action
      if (kind === 'orb') {
        expect(game.addCelestialOrb(orb)).toBe(true)
        action = { type: 'useOrb', orbId: orb.instanceId }
      } else if (kind === 'seal') action = seal(game, 'seal_of_the_void')
      else {
        const definition = Object.values(VOID_SCRIPTS).find(
          (item) => item.effect.type === 'upgrade_all_yaku'
        )!
        const script = VoidScriptSystem.createVoidScriptInstance(definition)
        expect(game.addVoidScript(script)).toBe(true)
        action = { type: 'useScript', scriptId: script.instanceId }
      }
      rejected(game, action, 'already at max level')
    }
  )

  it('allows an all-Yaku Orb when some categories can still advance', () => {
    const { game, state } = fixture()
    const ordinary = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    for (let i = 0; i < 9; i++) state.celestialOrbSystem.useOrb(ordinary)
    const before = [...state.celestialOrbSystem.getAllYakuLevels()]
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.black_hole_orb
    )
    expect(game.addCelestialOrb(orb)).toBe(true)
    const action: Action = { type: 'useOrb', orbId: orb.instanceId }
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.processAction(action).success).toBe(true)
    for (const [category, level] of before)
      expect(state.celestialOrbSystem.getYakuLevel(category)).toBe(
        Math.min(10, level + 1)
      )
  })

  it.each(['seal_of_judgment', 'seal_of_the_immortal'])(
    'rejects %s when Decree slots are full',
    (id) => {
      const { game } = fixture()
      fillDecrees(game)
      rejected(game, seal(game, id), 'No room for Decree')
    }
  )

  it('reuses the consumed Seal slot when creating rewards into a full inventory', () => {
    const { game } = fixture()
    const action = seal(game, 'seal_of_the_emperor')
    while (game.canAddConsumable())
      game.addCelestialOrb(
        CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.pluto_orb)
      )
    const before =
      game.getState().fateSeals.length + game.getState().celestialOrbs.length
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.processAction(action).success).toBe(true)
    expect(
      game.getState().fateSeals.length + game.getState().celestialOrbs.length
    ).toBe(before)
    expect(game.canAddConsumable()).toBe(false)
  })

  it('preserves a copy Seal before any consumable has been used', () => {
    const { game } = fixture()
    rejected(
      game,
      seal(game, 'seal_of_the_fool'),
      'No Fate Seal or Celestial Orb has been used'
    )
  })

  it.each(['seal_of_the_hermit', 'seal_of_balance'])(
    'preserves %s when it would grant zero gold',
    (id) => {
      const { game, state } = fixture()
      clearDecrees(game)
      state.gold = 0
      rejected(game, seal(game, id), 'No gold can be generated')
    }
  )

  it('does not roll Fortune with no Decree target', () => {
    const { game } = fixture()
    clearDecrees(game)
    rejected(game, seal(game, 'seal_of_fortune'), 'No Decrees to modify')
  })

  it('does not peek at a valid Fortune roll; a disclosed chance can still fail after use', () => {
    const { game } = fixture()
    const action = seal(game, 'seal_of_fortune')
    const random = vi.spyOn(runRandom, 'next').mockReturnValue(0.9)
    for (let i = 0; i < 5; i++) expect(game.canPerformAction(action)).toBe(true)
    expect(random).not.toHaveBeenCalled()
    expect(game.processAction(action).success).toBe(true)
    expect(game.getFateSeals()).toHaveLength(0)
    expect(random).toHaveBeenCalledTimes(1)
  })

  it('preserves an empty-target Hex and its Omen protection without applying a penalty', () => {
    const { game } = fixture()
    clearDecrees(game)
    useOmenStore.getState().addOmen(OMEN_OF_ASH)
    const script = VoidScriptSystem.createVoidScriptInstance(
      VOID_SCRIPTS.script_of_the_hex
    )
    expect(game.addVoidScript(script)).toBe(true)
    rejected(
      game,
      { type: 'useScript', scriptId: script.instanceId },
      'No Decrees to modify'
    )
    expect(game.getState().omenSystem.hasVoidScriptDownsideProtection()).toBe(
      true
    )
  })

  it.each(
    Object.values(VOID_SCRIPTS).filter((item) =>
      ['create_rare_decree', 'create_legendary'].includes(item.effect.type)
    )
  )(
    'preserves $id and its penalty state when reward slots are full',
    (definition) => {
      const { game } = fixture()
      fillDecrees(game)
      const script = VoidScriptSystem.createVoidScriptInstance(definition)
      expect(game.addVoidScript(script)).toBe(true)
      rejected(
        game,
        { type: 'useScript', scriptId: script.instanceId },
        'No room for Decree'
      )
    }
  )

  it('never inspects a concealed target to decide suitability; confirmation still resolves the real effect', () => {
    const { game, state } = fixture()
    const tile = new Tile(TileSuit.Manzu, 9, 'hidden-target')
    state.handTiles[0] = tile
    state.faceDownTileIds.add(tile.id)
    const action = seal(game, 'seal_of_strength', [tile.id])
    state.handTiles[0] = new Proxy(tile, {
      get(target, key, receiver) {
        if (['rank', 'suit', 'isSuited'].includes(String(key)))
          throw new Error('Preflight read a concealed identity')
        return Reflect.get(target, key, receiver)
      },
    })
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.validateConsumableAction(action).warnings).toEqual([
      'Target outcome depends on concealed tiles',
    ])
    state.handTiles[0] = tile
    const before = snapshot(game)
    expect(game.processAction(action).success).toBe(false)
    expect(snapshot(game)).toBe(before)
    state.handTiles[0] = new Tile(TileSuit.Manzu, 1, tile.id)
    expect(game.canPerformAction(action)).toBe(true)
    expect(game.processAction(action).success).toBe(true)
    expect(state.faceDownTileIds.has(tile.id)).toBe(false)
  })
})
