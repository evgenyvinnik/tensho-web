/**
 * Tile Edition overlay
 *
 * An Edition is not drawn here: TileImage draws a special tile from its
 * finished artwork, the whole tile painted in the Edition's material. This
 * layer adds what the artwork cannot know: the roll a Lucky tile made for the
 * round being played.
 */

import { useTranslation } from 'react-i18next'
import { Tile } from '../../../core/Tile'
import { scoreMultiplier } from '../../../utils/scoreNumber'
import { useTileRound } from '../../tiles/TileRoundContext'

/**
 * Props for ModifierOverlay component
 */
export interface ModifierOverlayProps {
  tile: Tile
  /** Text size fitted to the tile, in px. */
  fontSize?: number
  className?: string
}

/** A Lucky tile's ×Mult and Points for this round, on its lower face. */
export function ModifierOverlay({
  tile,
  fontSize,
  className = '',
}: ModifierOverlayProps) {
  const { i18n } = useTranslation()
  const roll = useTileRound()?.luckyRolls[tile.id]
  if (!tile.isLucky || !roll) return null
  return (
    <span
      aria-hidden="true"
      data-lucky-roll={`${roll.multiplier}:${roll.points}`}
      className={`lucky-roll z-20 ${className}`}
      style={{ fontSize }}
    >
      <span>×{scoreMultiplier(roll.multiplier, i18n.language).exact}</span>
      <span>+{roll.points.toLocaleString(i18n.language)}</span>
    </span>
  )
}
