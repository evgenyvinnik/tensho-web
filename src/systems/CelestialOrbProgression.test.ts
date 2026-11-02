import { afterEach, expect, it } from 'vitest'
import {
  CelestialOrbSystem,
  getCelestialOrbByYaku,
  type YakuCategory,
} from './CelestialOrbSystem'
import { runRandom } from '../game/RunRandom'

afterEach(() => runRandom.reset())

const orb = (yaku: YakuCategory) =>
  CelestialOrbSystem.createCelestialOrbInstance(getCelestialOrbByYaku(yaku)!)

it('pays upgrades on use, not by accumulating scored occurrences', () => {
  const system = new CelestialOrbSystem()
  for (let i = 0; i < 50; i++) system.onYakuScored('ThreePairs')
  expect(system.getYakuLevel('ThreePairs')).toBe(1)
  expect(system.calculateYakuBonus('ThreePairs')).toEqual({ chips: 0, mult: 0 })
  expect(system.useOrb(orb('ThreePairs')).success).toBe(true)
  expect(system.getYakuLevel('ThreePairs')).toBe(2)
  const bonus = system.calculateYakuBonus('ThreePairs')
  const { chipsPerLevel, multPerLevel } =
    getCelestialOrbByYaku('ThreePairs')!.effect
  expect(bonus).toEqual({ chips: chipsPerLevel, mult: multPerLevel })
  for (let i = 0; i < 50; i++) system.triggerYaku('ThreePairs')
  expect(system.getYakuTriggerCount('ThreePairs')).toBe(100)
  expect(system.getYakuLevel('ThreePairs')).toBe(2)
  expect(system.calculateYakuBonus('ThreePairs')).toEqual(bonus)
  expect(system.getOrbForMostPlayedYaku()?.effect.targetYaku).toBe('ThreePairs')
})

it('keeps capped families capped while Black Hole upgrades other families', () => {
  const system = new CelestialOrbSystem()
  for (let i = 0; i < 9; i++)
    expect(system.useOrb(orb('ThreePairs')).success).toBe(true)
  const before = system.toState()
  expect(system.useOrb(orb('ThreePairs')).success).toBe(false)
  expect(system.toState()).toEqual(before)
  expect(system.useOrb(orb('All')).success).toBe(true)
  expect(system.getYakuLevel('ThreePairs')).toBe(10)
  expect(system.getYakuLevel('TwoSequences')).toBe(2)
  expect(system.getAllYakuLevels().size).toBe(13)
  expect(system.getAllYakuLevels().has('All')).toBe(false)
})
