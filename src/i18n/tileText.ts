import type { TFunction } from 'i18next'
import { Tile, TileSuit } from '../core/Tile'
import { tileModifierEntries } from '../core/tileModifierEntries'
import { getTilePoints } from '../rules/ScoringEngine'
import { FLOWER_BASE_EFFECTS } from '../systems/FlowerSystem'

const WINDS = ['east', 'south', 'west', 'north'] as const
const DRAGONS = ['white', 'green', 'red'] as const
const FLOWERS = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo'] as const
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const

/** Hidden faces must never expose identity through an accessible name. */
export function tileName(
  tile: Tile | null | undefined,
  t: TFunction,
  faceDown = false
): string {
  if (!tile || faceDown) return t('tileDetails.faceDown')
  if (tile.isSuited) {
    const name = t('tileDetails.suitedName', {
      rank: tile.rank,
      suit: t(`tiles.${tile.suit}`),
    })
    return tile.isRed ? t('tileDetails.redName', { name }) : name
  }
  if (tile.suit === TileSuit.Wind)
    return t('tileDetails.windName', {
      name: t(`tiles.${WINDS[tile.rank - 1]}`),
    })
  if (tile.suit === TileSuit.Dragon) return t(`tiles.${DRAGONS[tile.rank - 1]}`)
  if (tile.suit === TileSuit.Flower)
    return t('tileDetails.flowerName', {
      name: t(`flora.${FLOWERS[tile.rank - 1].toLowerCase()}`),
    })
  return t('tileDetails.seasonName', {
    name: t(`flora.${SEASONS[tile.rank - 1]}`),
  })
}

/** Catalog rules, not a forecast of this tile's current modified payout. */
export function tileDetails(
  tile: Tile | null | undefined,
  t: TFunction,
  language: string,
  faceDown = false
) {
  const name = tileName(tile, t, faceDown)
  if (!tile || faceDown)
    return { name, description: '', points: '', modifiers: [] }
  let description = t(
    tile.isHonor ? 'tileDetails.honorRule' : 'tileDetails.numberedRule'
  )
  let points = t('tileDetails.basePoints', {
    points: getTilePoints(tile).toLocaleString(language),
  })
  if (tile.suit === TileSuit.Flower) {
    const flower = FLOWERS[tile.rank - 1]
    description =
      t(`flora.details.flower${flower}`, {
        percent:
          FLOWER_BASE_EFFECTS[flower].percentagePerMatch.toLocaleString(
            language
          ),
      }) +
      ' ' +
      t('tileDetails.flowerScope')
    points = t('tileDetails.bonusTile')
  } else if (tile.suit === TileSuit.Season) {
    const season = SEASONS[tile.rank - 1]
    description =
      t(`flora.details.${season === 'spring' ? 'unwired' : season}`) +
      ' ' +
      t('flora.details.roundScope')
    points = t('tileDetails.bonusTile')
  }
  return {
    name,
    description,
    points,
    modifiers: tileModifierEntries(tile).map((entry) => ({
      ...entry,
      name: t(`${entry.kind}.items.${entry.id}.name`, entry.name),
      description: t(
        `${entry.kind}.items.${entry.id}.description`,
        entry.description
      ),
    })),
  }
}
