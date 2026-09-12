import type { TFunction } from 'i18next'
import { Tile, TileSuit } from '../core/Tile'
import { tileModifierEntries } from '../core/tileModifierEntries'

/** Reward tiles are public. Never use this helper to label concealed rack tiles. */
export function tileRewardText(tile: Tile, t: TFunction) {
  let tileName = tile.displayName
  if (tile.isSuited) tileName = `${tile.rank} ${t(`tiles.${tile.suit}`)}`
  else if (tile.suit === TileSuit.Wind) {
    const key = ['east', 'south', 'west', 'north'][tile.rank - 1]
    if (key) tileName = t(`tiles.${key}`)
  } else if (tile.suit === TileSuit.Dragon) {
    const key = ['white', 'green', 'red'][tile.rank - 1]
    if (key) tileName = t(`tiles.${key}`)
  }
  const entries = tileModifierEntries(tile)
  return {
    name: [
      tileName,
      ...entries.map((entry) =>
        t(`${entry.kind}.items.${entry.id}.name`, entry.name)
      ),
    ].join(' · '),
    description: entries
      .map((entry) =>
        t(`${entry.kind}.items.${entry.id}.description`, entry.description)
      )
      .join(' '),
  }
}
