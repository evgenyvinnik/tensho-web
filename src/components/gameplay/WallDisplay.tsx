import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile, TileSuit } from '../../core/Tile'
import { tileName } from '../../i18n/tileText'
import { getTileImagePath } from '../../utils/assets'
import { Popup } from '../ui/Popup'

export interface WallDisplayProps {
  /** Physical tiles still in the live wall, excluding the dead wall. */
  wallTiles: Tile[]
}

const SUITS = [
  { suit: TileSuit.Manzu, label: 'tiles.manzu', color: 'text-red-300' },
  { suit: TileSuit.Pinzu, label: 'tiles.pinzu', color: 'text-blue-300' },
  { suit: TileSuit.Souzu, label: 'tiles.souzu', color: 'text-green-300' },
  { suit: TileSuit.Wind, label: 'tiles.winds', color: 'text-gray-300' },
  { suit: TileSuit.Dragon, label: 'tiles.dragons', color: 'text-purple-300' },
  { suit: TileSuit.Flower, label: 'flora.flowers', color: 'text-pink-300' },
  { suit: TileSuit.Season, label: 'flora.seasons', color: 'text-amber-300' },
] as const

/** A compact inventory control with readable, localized wall contents. */
export function WallDisplay({ wallTiles }: WallDisplayProps) {
  const { t, i18n } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const groups = useMemo(() => {
    const counts = new Map<string, { key: string; tile: Tile; count: number }>()
    for (const tile of wallTiles) {
      // Red and ordinary fives have different names and values. Never label
      // their combined count using whichever physical copy happened to be first.
      const key = `${tile.suit}-${tile.rank}-${tile.isRed}`
      const entry = counts.get(key)
      if (entry) entry.count++
      else counts.set(key, { key, tile, count: 1 })
    }
    return SUITS.map((suit) => {
      const tiles = [...counts.values()]
        .filter(({ tile }) => tile.suit === suit.suit)
        .sort(
          (a, b) =>
            a.tile.rank - b.tile.rank ||
            Number(a.tile.isRed) - Number(b.tile.isRed)
        )
      return {
        ...suit,
        tiles,
        count: tiles.reduce((sum, tile) => sum + tile.count, 0),
      }
    }).filter(({ count }) => count > 0)
  }, [wallTiles])

  return (
    <>
      <button
        type="button"
        data-wall-chip
        onClick={() => setIsExpanded(true)}
        aria-haspopup="dialog"
        aria-expanded={isExpanded}
        aria-label={`${t('gameplay.tilesInWall')}: ${wallTiles.length.toLocaleString(i18n.language)}`}
        title={t('gameplay.tilesInWall')}
        className="flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)] px-2.5 py-1 transition-colors hover:border-[var(--color-golden-yellow)]"
      >
        <span className="text-xs text-[var(--color-beige-white)]/60">
          {t('gameplay.wall')}
        </span>
        <span className="font-bold tabular-nums text-[var(--color-golden-yellow)]">
          {wallTiles.length.toLocaleString(i18n.language)}
        </span>
      </button>
      <Popup
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={t('gameplay.tilesInWall')}
      >
        <div data-wall-breakdown className="space-y-5">
          <p className="text-center text-sm text-[var(--color-beige-white)]/80">
            {t('collection.remaining', { count: wallTiles.length })}
          </p>
          {groups.map(({ suit, label, color, tiles, count }) => (
            <section key={suit} data-wall-suit={suit}>
              <h3
                aria-label={`${t(label)}: ${count.toLocaleString(i18n.language)}`}
                className={`mb-3 flex flex-wrap justify-between gap-2 text-sm font-semibold ${color}`}
              >
                <span>{t(label)}</span>
                <span>{count.toLocaleString(i18n.language)}</span>
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(64px,1fr))] items-start gap-x-3 gap-y-4">
                {tiles.map(({ key, tile, count }) => (
                  <figure
                    key={key}
                    data-wall-tile={key}
                    className="min-w-0 text-center"
                  >
                    <img
                      src={getTileImagePath(tile.suit, tile.rank)}
                      alt={tileName(tile, t)}
                      width={44}
                      height={62}
                      className="mx-auto h-auto w-11 rounded"
                    />
                    <figcaption className="mt-1 break-words text-xs leading-relaxed">
                      <span className="block text-[var(--color-beige-white)]">
                        {tileName(tile, t)}
                      </span>
                      <span
                        data-wall-count={count}
                        className="block text-[var(--color-golden-yellow)]"
                      >
                        {t('collection.remaining', { count })}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Popup>
    </>
  )
}

export default WallDisplay
