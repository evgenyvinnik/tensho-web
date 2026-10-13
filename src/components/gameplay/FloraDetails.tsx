/**
 * The words for one Flower or one Season: what it does and how long it lasts.
 * Shared by its own token's panel and by the reveal shown when one is drawn.
 */

import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import type { FlowerVariant, SeasonTile } from '../../systems/types'
import { FLOWER_BASE_EFFECTS } from '../../systems/FlowerSystem'

type Flora = ReturnType<GameOrchestrator['getFloraState']>

export function useSeasonName() {
  const { t } = useTranslation()
  return (season: Pick<SeasonTile, 'type' | 'isCorrupted' | 'corruptedType'>) =>
    season.isCorrupted
      ? t(
          'flora.details.' +
            (season.corruptedType?.toLowerCase() ?? 'corrupted') +
            'Name'
        )
      : t('flora.' + season.type.toLowerCase())
}

export function FlowerDetails({
  flower,
  flora,
}: {
  flower: FlowerVariant
  flora: Flora
}) {
  const { t, i18n } = useTranslation()
  const owned = flora.flowers.flowers.find((entry) => entry.type === flower)
  const awakened = !!owned?.mutation?.isUnlocked
  const collected = new Set(flora.flowers.flowers.map((entry) => entry.type))
  return (
    <div data-flower-details={flower} className="space-y-2 text-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-metallic-gold)]">
        {t('flora.duration.run', 'Lasts the whole run')}
      </p>
      {!(awakened && flower === 'Chrysanthemum') && (
        <p>
          {t('flora.details.flower' + flower, {
            percent: (
              FLOWER_BASE_EFFECTS[flower].percentagePerMatch *
              flora.flowers.totalEffectiveness
            ).toLocaleString(i18n.language),
          })}
        </p>
      )}
      {awakened && (
        <p data-flora-mutation={flower}>
          <strong className="text-[var(--color-golden-yellow)]">
            {t('flora.mutations.awakened')}
          </strong>{' '}
          {t('flora.mutations.' + flower.toLowerCase(), {
            factor: (1 + 0.2 * flora.flowers.totalEffectiveness).toLocaleString(
              i18n.language
            ),
          })}
        </p>
      )}
      {flora.flowersSuppressed && (
        <p className="rounded border border-amber-300/50 p-2 text-xs">
          {t('flora.details.suppressed')}
        </p>
      )}
      <p className="text-xs text-[var(--color-beige-white)]/70">
        {t('flora.setProgress', {
          count: collected.size,
          defaultValue: 'Flowers collected: {{count}}/4',
        })}
        {' · '}
        {t('flora.details.setTwo')}
      </p>
    </div>
  )
}

export function SeasonDetails({
  season,
  flora,
}: {
  season: SeasonTile
  flora: Flora
}) {
  const { t, i18n } = useTranslation()
  const effect = season.isCorrupted ? season.corruptedType : season.type
  const sheltered = effect === 'Summer' && flora.bambooSummerProtection
  return (
    <div data-season-details={season.id} className="space-y-2 text-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-metallic-gold)]">
        {t('flora.duration.round', 'Lasts this round')}
      </p>
      {season.isCorrupted && (
        <p className="text-xs text-orange-300">
          {t('flora.' + season.type.toLowerCase())}
        </p>
      )}
      <p>
        {t(
          'flora.details.' +
            (sheltered
              ? 'summerSheltered'
              : effect
                ? effect.toLowerCase()
                : 'unwired')
        )}
      </p>
      {effect === 'Decay' && (
        <p className="text-xs font-bold">
          {t('flora.details.decayPenalty', {
            points: flora.decayPenalty.toLocaleString(i18n.language),
          })}
        </p>
      )}
    </div>
  )
}
