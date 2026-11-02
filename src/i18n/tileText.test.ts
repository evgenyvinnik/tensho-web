import { expect, it } from 'vitest'
import { createInstance } from 'i18next'
import en from './locales/en.json'
import es from './locales/es.json'
import { Tile, TileSuit, EnhancementType } from '../core/Tile'
import {
  DRAGON_TILE_POINTS,
  getTilePoints,
  WIND_GROUP_POINTS,
  WIND_TILE_POINTS,
} from '../rules/ScoringEngine'
import { DRAGON_GROUP_MULT, DRAGON_MULT } from '../rules/PlayPattern'
import { tileName, tileDetails, tileIndexHint } from './tileText'
import { tileRewardText } from './tileRewardText'
import { FLOWER_BASE_EFFECTS } from '../systems/FlowerSystem'

async function translator(lng = 'en') {
  const i18n = createInstance()
  await i18n.init({
    lng,
    fallbackLng: false,
    resources: { en: { translation: en }, es: { translation: es } },
  })
  return i18n.t.bind(i18n)
}

it('keeps numeral hints, distinguishes Dragon faces and hides every concealed identity', async () => {
  const t = await translator('es')
  for (const suit of Object.values(TileSuit)) {
    const max = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu].includes(suit)
      ? 9
      : suit === TileSuit.Dragon
        ? 3
        : 4
    for (let rank = 1; rank <= max; rank++) {
      const tile = new Tile(suit, rank, `hint-${suit}-${rank}`)
      const before = JSON.stringify(tile)
      const hint = tileIndexHint(tile, t)
      if (tile.isSuited) expect(hint).toEqual({ label: String(rank) })
      else if (suit === TileSuit.Dragon)
        expect(hint).toEqual({
          label: ['B', 'V', 'R'][rank - 1],
          tone: ['white', 'green', 'red'][rank - 1],
        })
      else expect(hint).toBeNull()
      expect(tileIndexHint(tile, t, true)).toBeNull()
      expect(JSON.stringify(tile)).toBe(before)
    }
  }
  expect(tileIndexHint(null, t)).toBeNull()
  expect(tileIndexHint(undefined, t)).toBeNull()
  expect(tileIndexHint(new Tile(TileSuit.Manzu, 5, 'red', true), t)).toEqual({
    label: '5',
  })
})

it('covers every valid tile face with a localized name and authoritative base points', async () => {
  const t = await translator('es')
  for (const suit of Object.values(TileSuit)) {
    const max = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu].includes(suit)
      ? 9
      : suit === TileSuit.Dragon
        ? 3
        : 4
    for (let rank = 1; rank <= max; rank++) {
      const tile = new Tile(suit, rank, `${suit}-${rank}`)
      const before = JSON.stringify(tile)
      const info = tileDetails(tile, t, 'es')
      expect(info.name).not.toMatch(/undefined|^tiles\.|^flora\.|tileDetails\./)
      expect(info.description).not.toMatch(
        /undefined|^tiles\.|^flora\.|tileDetails\./
      )
      expect(info.name).toBe(tileRewardText(tile, t).name)
      const base = t('tileDetails.basePoints', { points: getTilePoints(tile) })
      if (suit === TileSuit.Dragon)
        expect(info.points).toBe(
          `${base} ${t('tileDetails.dragonMult', { mult: DRAGON_MULT, groupMult: DRAGON_GROUP_MULT })}`
        )
      else if (suit === TileSuit.Wind)
        expect(info.points).toBe(
          `${base} ${t('tileDetails.windGroup', { points: WIND_GROUP_POINTS })}`
        )
      else if (!tile.isBonus) expect(info.points).toBe(base)
      expect(JSON.stringify(tile)).toEqual(before)
    }
  }
})

it('states the honor payouts: Winds are big points, Dragons add Mult', async () => {
  const t = await translator()
  const wind = tileDetails(new Tile(TileSuit.Wind, 1, 'east'), t, 'en')
  const dragon = tileDetails(new Tile(TileSuit.Dragon, 3, 'red'), t, 'en')
  expect(wind.points).toContain(`${WIND_TILE_POINTS} base points`)
  expect(wind.points).toContain(`${WIND_GROUP_POINTS} when it scores inside a group`)
  expect(wind.points).not.toContain('Mult')
  expect(dragon.points).toContain(`${DRAGON_TILE_POINTS} base points`)
  expect(dragon.points).toContain(`+${DRAGON_MULT} Mult`)
  expect(dragon.points).toContain(`+${DRAGON_GROUP_MULT} when it scores inside a group`)
})

it('distinguishes red fives from ordinary fives without promising unsupported bonus scoring', async () => {
  const t = await translator()
  const red = new Tile(TileSuit.Manzu, 5, 'red', true)
  const plain = new Tile(TileSuit.Manzu, 5, 'plain')
  expect(tileName(red, t)).toBe('Red 5 of Characters')
  expect(tileName(red, t)).not.toBe(tileName(plain, t))
  expect(tileDetails(red, t, 'en').points).toBe(
    tileDetails(plain, t, 'en').points
  )
})

it('reports base Flower rules and tells players where active scaling is shown', async () => {
  const t = await translator()
  Object.entries(FLOWER_BASE_EFFECTS).forEach(([flower, rule], index) => {
    const info = tileDetails(
      new Tile(TileSuit.Flower, index + 1, flower),
      t,
      'en'
    )
    expect(info.description).toContain(
      t(`flora.details.flower${flower}`, { percent: rule.percentagePerMatch })
    )
    expect(info.description).toContain(t('tileDetails.flowerScope'))
  })
})

it('provides localized text for every catalog Edition without unconditional payout totals', async () => {
  const t = await translator('es')
  for (const enhancement of Object.values(EnhancementType)) {
    const tile = new Tile(TileSuit.Pinzu, 3, 'modified', false, {
      enhancement,
    })
    const details = tileDetails(tile, t, 'es')
    expect(details.modifiers).toHaveLength(
      enhancement === EnhancementType.None ? 0 : 1
    )
    for (const entry of details.modifiers) {
      expect(entry.kind).toBe('tileMarks')
      expect(entry.id).toBe(enhancement)
      expect(entry.name).toBe(t(`tileMarks.items.${enhancement}.name`))
      expect(entry.description).toBe(
        t(`tileMarks.items.${enhancement}.description`)
      )
      // Outside a round the details state rules, never a current payout.
      expect(entry.current).toBeUndefined()
    }
    expect(tileDetails(tile, t, 'es', true)).toEqual({
      name: t('tileDetails.faceDown'),
      description: '',
      points: '',
      modifiers: [],
    })
  }
})

it('adds what a Bonus or Lucky Edition pays in the round, in the locale’s numbers', async () => {
  const t = await translator('es')
  const round = {
    act: 2,
    luckyRolls: { modified: { multiplier: 1.5, points: 40 } },
  }
  const current = (enhancement: EnhancementType, id = 'modified') =>
    tileDetails(
      new Tile(TileSuit.Pinzu, 3, id, false, { enhancement }),
      t,
      'es',
      false,
      round
    ).modifiers[0]?.current
  expect(current(EnhancementType.Bonus)).toBe(
    t('tileDetails.bonusThisAct', { act: '2', points: '60' })
  )
  expect(current(EnhancementType.Lucky)).toBe(
    t('tileDetails.luckyThisRound', { multiplier: '1,5', points: '40' })
  )
  // A Lucky tile without a roll this round has nothing to show yet.
  expect(current(EnhancementType.Lucky, 'unrolled')).toBeUndefined()
  for (const enhancement of [
    EnhancementType.Mult,
    EnhancementType.Gold,
    EnhancementType.Glass,
  ])
    expect(current(enhancement)).toBeUndefined()
  expect(
    tileDetails(
      new Tile(TileSuit.Pinzu, 3, 'modified', false, {
        enhancement: EnhancementType.Lucky,
      }),
      t,
      'es',
      true,
      round
    ).modifiers
  ).toEqual([])
})
