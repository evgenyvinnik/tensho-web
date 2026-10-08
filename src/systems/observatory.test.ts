import { expect, it } from 'vitest'
import { CELESTIAL_ORBS, CelestialOrbSystem } from './CelestialOrbSystem'
import { observatoryMultiplier } from './observatory'

const orb = (id: string) =>
  CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS[id])
it.each([
  ['pluto_orb', 'riichi'],
  ['mercury_orb', 'tanyao'],
  ['uranus_orb', 'yakuhai'],
  ['venus_orb', 'pinfu'],
  ['saturn_orb', 'ittsu'],
  ['saturn_orb', 'ikkitsuukan'],
  ['jupiter_orb', 'honitsu'],
  ['earth_orb', 'toitoi'],
  ['mars_orb', 'chinitsu'],
  ['neptune_orb', 'sanshoku_doujun'],
  ['neptune_orb', 'sanshoku_doukou'],
  ['planet_x_orb', 'chiitoitsu'],
  ['ceres_orb', 'junchan'],
  ['eris_orb', 'kokushi_musou'],
])('attunes %s to scored %s', (id, yaku) => {
  const held = [orb(id)]
  expect(observatoryMultiplier(held, [yaku], 1.5)).toBe(1.5)
  expect(observatoryMultiplier(held, [yaku], 1)).toBe(1)
  expect(observatoryMultiplier(held, [], 1.5)).toBe(1)
})
it('counts each held Orb once even when several matching patterns score', () => {
  const held = [orb('neptune_orb'), orb('neptune_orb'), orb('black_hole_orb')]
  expect(
    observatoryMultiplier(
      held,
      ['sanshoku_doujun', 'sanshoku_doukou', 'sanshoku_doujun'],
      1.5
    )
  ).toBe(1.5 ** 3)
})
it('Black Hole includes scored Yakuman outside ordinary Orb families, not an empty score', () => {
  expect(
    observatoryMultiplier([orb('black_hole_orb')], ['daisangen'], 1.5)
  ).toBe(1.5)
  expect(observatoryMultiplier([orb('black_hole_orb')], [], 1.5)).toBe(1)
})
it('ignores used instances and does not mutate inventory', () => {
  const held = [orb('saturn_orb'), { ...orb('saturn_orb'), isUsed: true }]
  const before = structuredClone(held)
  expect(observatoryMultiplier(held, ['ittsu'], 1.5)).toBe(1.5)
  expect(held).toEqual(before)
})
