import type { TFunction } from 'i18next'
import { Tile } from '../core/Tile'
import { tileModifierEntries } from '../core/tileModifierEntries'
import { tileName } from './tileText'

/** Reward tiles are public. Never use this helper to label concealed rack tiles. */
export function tileRewardText(tile: Tile, t: TFunction) {
  const entries = tileModifierEntries(tile)
  return {
    name: [
      tileName(tile, t),
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
