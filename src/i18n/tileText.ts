import type { TFunction } from 'i18next'
import { Tile, TileSuit, EnhancementType } from '../core/Tile'
import { tileModifierEntries } from '../core/tileModifierEntries'
import { getTilePoints } from '../rules/ScoringEngine'
import { DRAGON_GROUP_MULT } from '../rules/PlayPattern'
import { FLOWER_BASE_EFFECTS } from '../systems/FlowerSystem'

const WINDS = ['east', 'south', 'west', 'north'] as const
const DRAGONS = ['white', 'green', 'red'] as const
const FLOWERS = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo'] as const
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const

/** Small optional reading aid; concealed faces must not leak a badge. */
export function tileIndexHint(
  tile: Tile | null | undefined,
  t: TFunction,
  faceDown = false
): { label: string; tone?: (typeof DRAGONS)[number] } | null {
  if (!tile || faceDown || tile.enhancement === EnhancementType.Stone)
    return null
  if (tile.isSuited) return { label: String(tile.rank) }
  if (tile.suit !== TileSuit.Dragon) return null
  const tone = DRAGONS[tile.rank - 1]
  return tone ? { label: t(`tileDetails.${tone}Index`), tone } : null
}

/** Hidden faces must never expose identity through an accessible name. */
export function tileName(
  tile: Tile | null | undefined,
  t: TFunction,
  faceDown = false
): string {
  if (!tile || faceDown) return t('tileDetails.faceDown')
  if (tile.enhancement === EnhancementType.Stone)
    return t('tileMarks.items.stone.name', 'Stone Mark')
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
  // A Dragon's real power is Mult, so its card must say so beside its points.
  if (tile.suit === TileSuit.Dragon)
    points +=
      ' ' +
      t('tileDetails.dragonMult', {
        mult: DRAGON_GROUP_MULT.toLocaleString(language),
      })
  if (tile.enhancement === EnhancementType.Stone) {
    description = t('tileMarks.items.stone.description', 'No rank or suit')
    points = ''
  } else if (tile.suit === TileSuit.Flower) {
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
      t(`flora.details.${season}`) + ' ' + t('flora.details.roundScope')
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
        entry.kind === 'editions' && entry.id === 'negative'
          ? 'runOwnership.negativeTile'
          : `${entry.kind}.items.${entry.id}.description`,
        entry.description
      ),
    })),
  }
}
