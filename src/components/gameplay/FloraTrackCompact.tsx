import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import type { FlowerVariant, SeasonTile } from '../../systems/types'
import { TileSuit } from '../../core/Tile'
import { FLOWER_BASE_EFFECTS } from '../../systems/FlowerSystem'
import { FLOWER_DATA, SEASON_DATA } from './gameplayTypes'
import { getTileImagePath } from '../../utils/assets'
import { Popup } from '../ui/Popup'

export interface FloraTrackCompactProps {
  flora: ReturnType<GameOrchestrator['getFloraState']>
}

const FLOWERS: FlowerVariant[] = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']

/** Inspect public bonus tiles without changing the hand, turn, or selection. */
export function FloraTrackCompact({ flora }: FloraTrackCompactProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const collected = new Set(flora.flowers.flowers.map((flower) => flower.type))
  const title = t('flora.flowers') + ' · ' + t('flora.seasons')
  const seasonName = (season: SeasonTile) =>
    season.isCorrupted
      ? t(
          'flora.details.' +
            (season.corruptedType?.toLowerCase() ?? 'corrupted') +
            'Name'
        )
      : t('flora.' + season.type.toLowerCase())
  // Verified gaps, not active powers. Do not advertise unused helpers.
  const incomplete = flora.seasons.some(
    (season) =>
      !season.isCorrupted ||
      season.corruptedType === 'Monsoon' ||
      season.corruptedType === 'Frostbite'
  )

  return (
    <>
      <button
        type="button"
        data-testid="flora-details-trigger"
        aria-label={
          title + ': ' + collected.size + '/4 · ' + flora.seasons.length
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full min-w-0 flex-col items-center gap-1 rounded-lg border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)] p-1 text-[var(--color-beige-white)] shadow-lg hover:border-[var(--color-golden-yellow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)] md:max-w-36 md:p-2"
      >
        <span aria-hidden="true" className="flex gap-1">
          {FLOWERS.map((flower) => (
            <img
              key={flower}
              src={getTileImagePath(TileSuit.Flower, FLOWER_DATA[flower].rank)}
              alt=""
              draggable={false}
              className={
                'h-7 w-5 object-contain md:h-9 md:w-6 ' +
                (collected.has(flower) ? '' : 'opacity-30 grayscale')
              }
            />
          ))}
        </span>
        <span className="text-[10px] leading-tight">
          {t('flora.flowers')} {collected.size}/4
        </span>
        {flora.seasons.length > 0 && (
          <span className="flex max-w-full flex-wrap items-center justify-center gap-1 border-t border-[var(--color-metallic-gold)]/30 pt-1">
            {flora.seasons.slice(0, 2).map((season) => (
              <span
                key={season.id}
                data-flora-season={season.id}
                aria-label={seasonName(season)}
                title={seasonName(season)}
              >
                <img
                  src={getTileImagePath(
                    TileSuit.Season,
                    SEASON_DATA[season.type].rank
                  )}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className={
                    'h-7 w-5 object-contain ' +
                    (season.isCorrupted ? 'grayscale' : '')
                  }
                />
              </span>
            ))}
            <span className="text-[10px]">
              {t('flora.seasons')} {flora.seasons.length}
            </span>
          </span>
        )}
      </button>

      <Popup isOpen={open} onClose={() => setOpen(false)} title={title}>
        <section
          data-testid="flora-flower-details"
          className="min-w-0 space-y-3 break-words"
        >
          <h3 className="font-bold text-[var(--color-golden-yellow)]">
            {t('flora.flowers')} {collected.size}/4
          </h3>
          <p className="text-sm">{t('flora.details.runScope')}</p>
          {(flora.flowersSuppressed || flora.flowersProtected) && (
            <p
              data-testid="flora-suppression"
              className="rounded-lg border border-[var(--color-metallic-gold)] p-2 text-sm"
            >
              {t(
                flora.flowersSuppressed
                  ? 'flora.details.suppressed'
                  : 'flora.details.protected'
              )}
            </p>
          )}
          <ul className="space-y-3">
            {FLOWERS.map((flower) => (
              <li
                key={flower}
                data-flora-flower={flower}
                data-collected={collected.has(flower)}
                className="flex min-w-0 gap-2 rounded-lg bg-black/15 p-2"
              >
                <img
                  src={getTileImagePath(
                    TileSuit.Flower,
                    FLOWER_DATA[flower].rank
                  )}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className={
                    'h-14 w-10 shrink-0 object-contain ' +
                    (collected.has(flower) ? '' : 'opacity-40 grayscale')
                  }
                />
                <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <h4 className="text-sm font-bold">
                    {t('flora.' + flower.toLowerCase())}
                  </h4>
                  <p className="text-xs text-[var(--color-metallic-gold)]">
                    {t(
                      collected.has(flower)
                        ? 'flora.details.collected'
                        : 'flora.details.missing'
                    )}
                  </p>
                  <p className="mt-1 text-sm">
                    {t('flora.details.flower' + flower, {
                      percent: (
                        FLOWER_BASE_EFFECTS[flower].percentagePerMatch *
                        flora.flowers.totalEffectiveness
                      ).toLocaleString(i18n.language),
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <ul className="space-y-2 text-sm">
            <li>
              {collected.size >= 2 ? '✓ ' : ''}
              {t('flora.details.setTwo')}
            </li>
            <li>{t('flora.details.setThree')}</li>
            <li>
              {collected.size >= 4 ? '✓ ' : ''}
              {t('flora.details.setFour')}
            </li>
          </ul>
        </section>

        <section
          data-testid="flora-season-details"
          className="mt-5 min-w-0 space-y-3 border-t border-[var(--color-metallic-gold)]/40 pt-4 [overflow-wrap:anywhere]"
        >
          <h3 className="font-bold text-[var(--color-golden-yellow)]">
            {t('flora.seasons')} ({flora.seasons.length})
          </h3>
          <p className="text-sm">{t('flora.details.roundScope')}</p>
          {flora.seasons.length === 0 && (
            <p className="text-sm">{t('flora.details.noSeasons')}</p>
          )}
          {incomplete && (
            <p className="rounded-lg border border-[var(--color-metallic-gold)] p-2 text-xs">
              {t('flora.details.partial')}
            </p>
          )}
          <ol className="space-y-3">
            {flora.seasons.map((season, index) => {
              const effect = season.isCorrupted
                ? season.corruptedType
                : season.type
              return (
                <li
                  key={season.id}
                  data-flora-detail-season={season.id}
                  className="flex min-w-0 gap-2 rounded-lg bg-black/15 p-2"
                >
                  <img
                    src={getTileImagePath(
                      TileSuit.Season,
                      SEASON_DATA[season.type].rank
                    )}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className={
                      'h-14 w-10 shrink-0 object-contain ' +
                      (season.isCorrupted ? 'grayscale' : '')
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <h4
                      className={
                        'text-sm font-bold ' +
                        (season.isCorrupted
                          ? 'text-orange-300'
                          : 'text-[var(--color-golden-yellow)]')
                      }
                    >
                      {index + 1}. {seasonName(season)}
                    </h4>
                    {season.isCorrupted && (
                      <p className="text-xs">
                        {t('flora.' + season.type.toLowerCase())}
                      </p>
                    )}
                    <p className="mt-1 text-sm">
                      {t(
                        'flora.details.' +
                          (effect && effect !== 'Spring' && effect !== 'Monsoon'
                            ? effect.toLowerCase()
                            : 'unwired')
                      )}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
          {flora.seasons.some(
            (season) => season.isCorrupted && season.corruptedType === 'Decay'
          ) && (
            <p data-testid="flora-decay-penalty" className="text-sm font-bold">
              {t('flora.details.decayPenalty', {
                points: flora.decayPenalty.toLocaleString(i18n.language),
              })}
            </p>
          )}
        </section>
      </Popup>
    </>
  )
}
