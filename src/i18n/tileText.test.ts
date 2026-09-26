import { expect, it } from 'vitest'
import { createInstance } from 'i18next'
import en from './locales/en.json'
import es from './locales/es.json'
import {
  Tile,
  TileSuit,
  EnhancementType,
  SealType,
  EditionType,
} from '../core/Tile'
import { getTilePoints } from '../rules/ScoringEngine'
import { tileName, tileDetails } from './tileText'
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
      if (!tile.isBonus)
        expect(info.points).toBe(
          t('tileDetails.basePoints', { points: getTilePoints(tile) })
        )
      expect(JSON.stringify(tile)).toEqual(before)
    }
  }
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

it('provides localized text for every catalog modifier without unconditional payout totals', async () => {
  const t = await translator('es')
  for (const enhancement of Object.values(EnhancementType))
    for (const seal of Object.values(SealType))
      for (const edition of Object.values(EditionType)) {
        const tile = new Tile(TileSuit.Pinzu, 3, 'modified', false, {
          enhancement,
          seal,
          edition,
        })
        const details = tileDetails(tile, t, 'es')
        for (const entry of details.modifiers) {
          expect(entry.name).toBe(t(`${entry.kind}.items.${entry.id}.name`))
          expect(entry.description).toBe(
            t(`${entry.kind}.items.${entry.id}.description`)
          )
        }
        expect(tileDetails(tile, t, 'es', true)).toEqual({
          name: t('tileDetails.faceDown'),
          description: '',
          points: '',
          modifiers: [],
        })
      }
})
