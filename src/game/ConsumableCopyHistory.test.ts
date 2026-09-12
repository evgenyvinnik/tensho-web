import { afterEach, describe, expect, it, vi } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'
import { FATE_SEALS, FateSealSystem } from '../systems/FateSealSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../systems/CelestialOrbSystem'
import { VOID_SCRIPTS, VoidScriptSystem } from '../systems/VoidScriptSystem'
import { runRandom } from './RunRandom'
import { useConsumableStore } from '../stores/consumableStore'

function fixture() {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  game.getState().consumableSystem.setMaxSealsPerRound(4)
  return game
}

function useScript(game: GameOrchestrator) {
  const script = VoidScriptSystem.createVoidScriptInstance(
    VOID_SCRIPTS.script_of_the_wraith
  )
  expect(game.addVoidScript(script)).toBe(true)
  expect(
    game.processAction({ type: 'useScript', scriptId: script.instanceId })
      .success
  ).toBe(true)
}

function addFool(game: GameOrchestrator) {
  const fool = FateSealSystem.createFateSealInstance(
    FATE_SEALS.seal_of_the_fool
  )
  expect(game.addFateSeal(fool)).toBe(true)
  return { type: 'useSeal' as const, sealId: fool.instanceId }
}

afterEach(() => {
  vi.restoreAllMocks()
  useConsumableStore.getState().clearConsumables()
})

describe('Fool history follows the authored Seal-or-Orb rule', () => {
  it.each([false, true])(
    'keeps the legacy store and its copy system consistent (prior Orb: %s)',
    (priorOrb) => {
      useConsumableStore.getState().clearConsumables()
      const store = useConsumableStore.getState()
      const orb = CelestialOrbSystem.createCelestialOrbInstance(
        CELESTIAL_ORBS.pluto_orb
      )
      if (priorOrb) {
        expect(store.addCelestialOrb(orb)).toBe(true)
        expect(store.useCelestialOrb(orb.instanceId).success).toBe(true)
      }
      const script = VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_the_wraith
      )
      expect(store.addVoidScript(script)).toBe(true)
      expect(
        store.useVoidScript(script.instanceId, {
          getAvailableDecreeSlots: () => 1,
        }).success
      ).toBe(true)
      const expected = priorOrb ? orb.id : undefined
      expect(useConsumableStore.getState().lastUsedConsumable?.id).toBe(
        expected
      )
      expect(store.fateSealSystem.getLastUsedConsumable()?.id).toBe(expected)
    }
  )

  it('does not establish eligible history by successfully using a Script', () => {
    const game = fixture()
    useScript(game)
    expect(game.getState().fateSealSystem.getLastUsedConsumable()).toBeNull()
    const action = addFool(game)
    const uses = game.getState().consumableSystem.getFateSealUsesRemaining()
    const random = vi.spyOn(runRandom, 'next')
    expect(game.canPerformAction(action)).toBe(false)
    expect(game.processAction(action).success).toBe(false)
    expect(game.getFateSeals().map((item) => item.instanceId)).toEqual([
      action.sealId,
    ])
    expect(game.getState().consumableSystem.getFateSealUsesRemaining()).toBe(
      uses
    )
    expect(random).not.toHaveBeenCalled()
  })

  it.each(['seal', 'orb'] as const)(
    'copies the preceding %s after an intervening Script',
    (kind) => {
      const game = fixture()
      const original =
        kind === 'seal'
          ? FateSealSystem.createFateSealInstance(
              FATE_SEALS.seal_of_the_alchemist
            )
          : CelestialOrbSystem.createCelestialOrbInstance(
              CELESTIAL_ORBS.pluto_orb
            )
      if (original.type === 'FateSeal') {
        expect(game.addFateSeal(original)).toBe(true)
        expect(
          game.processAction({
            type: 'useSeal',
            sealId: original.instanceId,
            targets: game
              .getHandTiles()
              .slice(0, 2)
              .map((tile) => tile.id),
          }).success
        ).toBe(true)
      } else {
        expect(game.addCelestialOrb(original)).toBe(true)
        expect(
          game.processAction({ type: 'useOrb', orbId: original.instanceId })
            .success
        ).toBe(true)
      }
      useScript(game)
      expect(game.getState().fateSealSystem.getLastUsedConsumable()?.id).toBe(
        original.id
      )
      const level = game.getState().celestialOrbSystem.getYakuLevel('Riichi')
      const action = addFool(game)
      const random = vi.spyOn(runRandom, 'next')
      expect(game.canPerformAction(action)).toBe(true)
      expect(game.processAction(action).success).toBe(true)
      const items = [
        ...game.getFateSeals(),
        ...game.getCelestialOrbs(),
        ...game.getVoidScripts(),
      ]
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        id: original.id,
        type: original.type,
        isUsed: false,
        edition: 'Base',
      })
      expect(items[0].instanceId).not.toBe(original.instanceId)
      expect(items[0].instanceId).not.toBe(action.sealId)
      // Creation is not execution: a copied Orb does not upgrade a level yet.
      expect(game.getState().celestialOrbSystem.getYakuLevel('Riichi')).toBe(
        level
      )
      expect(random).not.toHaveBeenCalled()
    }
  )

  it('ignores a Script even when an alternate caller records history directly', () => {
    const system = new FateSealSystem()
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    system.setLastUsedConsumable(orb)
    system.setLastUsedConsumable(
      VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_the_wraith
      )
    )
    expect(system.getLastUsedConsumable()?.id).toBe(orb.id)
  })

  it('retains the existing self-copy rule and charges each confirmed use', () => {
    const game = fixture()
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    game.addCelestialOrb(orb)
    game.processAction({ type: 'useOrb', orbId: orb.instanceId })
    expect(game.processAction(addFool(game)).success).toBe(true)
    expect(game.getState().fateSealSystem.getLastUsedConsumable()?.id).toBe(
      'seal_of_the_fool'
    )
    const action = addFool(game)
    const before = game.getState().consumableSystem.getFateSealUsesRemaining()
    expect(game.processAction(action).success).toBe(true)
    expect(game.getFateSeals()).toHaveLength(1)
    expect(game.getFateSeals()[0].id).toBe('seal_of_the_fool')
    expect(game.getFateSeals()[0].instanceId).not.toBe(action.sealId)
    expect(game.getState().consumableSystem.getFateSealUsesRemaining()).toBe(
      before - 1
    )
    expect(game.processAction(action).success).toBe(false)
  })

  it('keeps history across a round boundary and clears it for a new run', () => {
    const game = fixture()
    const orb = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.pluto_orb
    )
    game.addCelestialOrb(orb)
    game.processAction({ type: 'useOrb', orbId: orb.instanceId })
    expect(game.processAction({ type: 'skip' }).success).toBe(true)
    expect(game.getState().fateSealSystem.getLastUsedConsumable()?.id).toBe(
      orb.id
    )
    game.startNewRun(8)
    expect(game.getState().fateSealSystem.getLastUsedConsumable()).toBeNull()
  })
})
