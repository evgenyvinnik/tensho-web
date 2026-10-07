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
  for (let i = 0; i < 50; i++) system.onYakuScored('SevenPairs')
  expect(system.getYakuLevel('SevenPairs')).toBe(1)
  expect(system.calculateYakuBonus('SevenPairs')).toEqual({ chips: 0, mult: 0 })
  expect(system.useOrb(orb('SevenPairs')).success).toBe(true)
  expect(system.getYakuLevel('SevenPairs')).toBe(2)
  const bonus = system.calculateYakuBonus('SevenPairs')
  expect(bonus).toEqual({ chips: 35, mult: 3 })
  for (let i = 0; i < 50; i++) system.triggerYaku('SevenPairs')
  expect(system.getYakuTriggerCount('SevenPairs')).toBe(100)
  expect(system.getYakuLevel('SevenPairs')).toBe(2)
  expect(system.calculateYakuBonus('SevenPairs')).toEqual(bonus)
  expect(system.getOrbForMostPlayedYaku()?.effect.targetYaku).toBe('SevenPairs')
})

it('keeps capped families capped while Black Hole upgrades other families', () => {
  const system = new CelestialOrbSystem()
  for (let i = 0; i < 9; i++)
    expect(system.useOrb(orb('SevenPairs')).success).toBe(true)
  const before = system.toState()
  expect(system.useOrb(orb('SevenPairs')).success).toBe(false)
  expect(system.toState()).toEqual(before)
  expect(system.useOrb(orb('All')).success).toBe(true)
  expect(system.getYakuLevel('SevenPairs')).toBe(10)
  expect(system.getYakuLevel('Tanyao')).toBe(2)
  expect(system.getAllYakuLevels().size).toBe(12)
  expect(system.getAllYakuLevels().has('All')).toBe(false)
})
