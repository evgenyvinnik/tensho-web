import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAchievementStore } from '../stores/achievementStore'
import { useArchiveStore } from '../stores/archiveStore'
import { useProgressionStore } from '../stores/progressionStore'
import {
  CelestialOrbSystem,
  CELESTIAL_ORBS,
} from '../systems/CelestialOrbSystem'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import { VoidScriptSystem, VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { GameOrchestrator } from './GameOrchestrator'
import type { PlayerAction } from './ActionProcessor'
import { eventBus } from './EventBus'
import {
  initializeMetaProgressionBridge,
  shutdownMetaProgressionBridge,
} from './MetaProgressionBridge'

const highest = () => useAchievementStore.getState().stats.highestYakuLevel
const earned = () =>
  useAchievementStore.getState().achievements.retrograde.unlocked

function consumeOrdinaryOrb(game: GameOrchestrator) {
  const orb = CelestialOrbSystem.createCelestialOrbInstance(
    CELESTIAL_ORBS.pluto_orb
  )
  expect(game.addCelestialOrb(orb)).toBe(true)
  expect(
    game.processAction({ type: 'useOrb', orbId: orb.instanceId }).success
  ).toBe(true)
}

beforeEach(() => {
  shutdownMetaProgressionBridge()
  useProgressionStore.getState().resetProgression()
  useArchiveStore.getState().resetArchive()
  useAchievementStore.getState().resetAchievements()
  initializeMetaProgressionBridge()
})
afterEach(() => {
  shutdownMetaProgressionBridge()
  vi.restoreAllMocks()
})

it.each(['ordinary', 'black-hole', 'seal', 'script', 'shop', 'pack'] as const)(
  'earns level 10 from %s, without counting Seals or Scripts as Orbs',
  (kind) => {
    const game = new GameOrchestrator()
    game.setConsumableUnlockResolver(() => true)
    game.startNewRun(7)
    for (let i = 0; i < 8; i++) consumeOrdinaryOrb(game)
    expect(game.getState().celestialOrbSystem.getYakuLevel('Pairs')).toBe(9)
    expect(highest()).toBe(9)
    expect(earned()).toBe(false)
    const beforeOrbs =
      useAchievementStore.getState().stats.totalCelestialOrbsUsed
    const notified = vi.fn()
    const off = eventBus.on('achievementUnlocked', ({ achievementId }) => {
      if (achievementId === 'retrograde') notified()
    })
    try {
      if (kind === 'shop' || kind === 'pack') {
        const orb = CelestialOrbSystem.createCelestialOrbInstance(
          CELESTIAL_ORBS.pluto_orb
        )
        expect(
          game.applyCelestialOrb(
            orb,
            kind === 'shop' ? 'purchase' : 'pack_open'
          )
        ).toBe(true)
        expect(
          game.applyCelestialOrb(
            orb,
            kind === 'shop' ? 'purchase' : 'pack_open'
          )
        ).toBe(false)
      } else {
        let action: PlayerAction
        if (kind === 'seal') {
          const seal = FateSealSystem.createFateSealInstance(
            FATE_SEALS.seal_of_the_void
          )
          expect(game.addFateSeal(seal)).toBe(true)
          action = { type: 'useSeal', sealId: seal.instanceId }
        } else if (kind === 'script') {
          const script = VoidScriptSystem.createVoidScriptInstance(
            VOID_SCRIPTS.script_of_the_singularity
          )
          expect(game.addVoidScript(script)).toBe(true)
          action = { type: 'useScript', scriptId: script.instanceId }
        } else {
          const orb = CelestialOrbSystem.createCelestialOrbInstance(
            kind === 'ordinary'
              ? CELESTIAL_ORBS.pluto_orb
              : CELESTIAL_ORBS.black_hole_orb
          )
          expect(game.addCelestialOrb(orb)).toBe(true)
          action = { type: 'useOrb', orbId: orb.instanceId }
        }
        expect(game.canPerformAction(action)).toBe(true)
        expect(game.canPerformAction(action)).toBe(true)
        expect(highest()).toBe(9)
        expect(notified).not.toHaveBeenCalled()
        expect(game.processAction(action).success).toBe(true)
        expect(game.processAction(action).success).toBe(false)
      }
      expect(highest()).toBe(10)
      expect(earned()).toBe(true)
      expect(notified).toHaveBeenCalledTimes(1)
      expect(useAchievementStore.getState().stats.totalCelestialOrbsUsed).toBe(
        beforeOrbs + (kind === 'seal' || kind === 'script' ? 0 : 1)
      )
      useAchievementStore.getState().markAsSeen('retrograde')
      const saved = game.captureRun()
      game.restoreRun(saved)
      shutdownMetaProgressionBridge()
      initializeMetaProgressionBridge()
      useAchievementStore.getState().checkAchievements()
      expect(notified).toHaveBeenCalledTimes(1)
      expect(useAchievementStore.getState().getUnseenUnlocks()).not.toContain(
        'retrograde'
      )
    } finally {
      off()
    }
  }
)

it('does not track level mastery in Full Unlock mode', () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  useProgressionStore.setState({ fullUnlockEnabled: true })
  for (let i = 0; i < 9; i++) consumeOrdinaryOrb(game)
  expect(game.getState().celestialOrbSystem.getYakuLevel('Pairs')).toBe(10)
  expect(highest()).toBe(1)
  expect(earned()).toBe(false)
})

it('persists level mastery and seen status across profile rehydration and a new run', async () => {
  const game = new GameOrchestrator()
  game.startNewRun(7)
  for (let i = 0; i < 9; i++) consumeOrdinaryOrb(game)
  useAchievementStore.getState().markAsSeen('retrograde')
  const { stats, achievements } = useAchievementStore.getState()
  const saved = JSON.stringify({ state: { stats, achievements }, version: 2 })
  useAchievementStore.getState().resetAchievements()
  vi.spyOn(localStorage, 'getItem').mockImplementation((key) =>
    key === 'tensho-achievements' ? saved : null
  )
  await useAchievementStore.persist.rehydrate()
  game.startNewRun(8)
  expect(game.getState().celestialOrbSystem.getYakuLevel('Pairs')).toBe(1)
  expect(highest()).toBe(10)
  expect(earned()).toBe(true)
  expect(useAchievementStore.getState().getUnseenUnlocks()).not.toContain(
    'retrograde'
  )
})
