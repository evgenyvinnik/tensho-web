import { expect, it } from 'vitest'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
  type YakuCategory,
} from './CelestialOrbSystem'
import { observatoryMultiplier } from './observatory'

const orb = (id: string) =>
  CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS[id])

it.each(
  Object.values(CELESTIAL_ORBS)
    .filter((definition) => definition.effect.targetYaku !== 'All')
    .map((definition) => [definition.id, definition.effect.targetYaku] as const)
)('attunes %s to a scored %s family', (id, family) => {
  const held = [orb(id)]
  expect(observatoryMultiplier(held, 1.5, [family])).toBe(1.5)
  expect(observatoryMultiplier(held, 1, [family])).toBe(1)
  expect(observatoryMultiplier(held, 1.5, [])).toBe(1)
})

it('counts each held Orb once, however many times its family paid', () => {
  const held = [orb('ceres_orb'), orb('ceres_orb'), orb('black_hole_orb')]
  const loose: YakuCategory[] = ['Sequence', 'Loose', 'Loose', 'Loose']
  expect(observatoryMultiplier(held, 1.5, loose)).toBe(1.5 ** 3)
})

it('Black Hole matches any scored family, not an empty score', () => {
  expect(observatoryMultiplier([orb('black_hole_orb')], 1.5, ['Winds'])).toBe(
    1.5
  )
  expect(observatoryMultiplier([orb('black_hole_orb')], 1.5, [])).toBe(1)
})

it('ignores used instances and does not mutate inventory', () => {
  const held = [orb('saturn_orb'), { ...orb('saturn_orb'), isUsed: true }]
  const before = structuredClone(held)
  expect(observatoryMultiplier(held, 1.5, ['Straights'])).toBe(1.5)
  expect(held).toEqual(before)
})
