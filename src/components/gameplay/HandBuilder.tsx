import { useTranslation } from 'react-i18next'
import type { Tile } from '../../core/Tile'
import type { HandBuildingAdvice } from '../../gameplay/handBuildingAdvice'
import { illustrationAssets } from '../../utils/assets'
import { Popup } from '../ui/Popup'
import { TileImage } from '../tiles/TileImage'

function TileRow({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
      {tiles.map((tile) => (
        <TileImage key={tile.id} tile={tile} size="small" showTooltip={false} />
      ))}
    </div>
  )
}

export function HandBuilder({
  advice,
  onClose,
  onStage,
}: {
  advice: HandBuildingAdvice | null
  onClose: () => void
  onStage: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  return (
    <Popup
      isOpen={advice !== null}
      onClose={onClose}
      title={t('handBuilder.title')}
      className="max-w-2xl"
    >
      <div
        data-hand-builder
        className="min-w-0 space-y-4 text-sm leading-relaxed [overflow-wrap:anywhere]"
      >
        <img
          src={illustrationAssets.beginnerGuidebook}
          alt=""
          width={56}
          height={56}
          className="mx-auto h-14 w-14 object-contain"
        />
        {advice?.kind === 'redraw' ? (
          <>
            <p>{t('handBuilder.intro')}</p>
            <p className="rounded-lg border border-amber-200/25 bg-black/20 p-3">
              <strong>{t(`handBuilder.${advice.form}`)}</strong>{' '}
              {t('handBuilder.distance', { needed: advice.needed })}
            </p>
            <section
              data-plan-keep
              className="rounded-lg border border-emerald-300/30 bg-emerald-950/40 p-3"
            >
              <h3 className="text-center font-bold text-emerald-200">
                {t('handBuilder.keep')}
              </h3>
              <TileRow tiles={advice.keep} />
            </section>
            <section
              data-plan-exchange
              className="rounded-lg border border-amber-300/40 bg-black/20 p-3"
            >
              <h3 className="text-center font-bold text-amber-200">
                {t('handBuilder.exchange')}
              </h3>
              <TileRow tiles={advice.exchange} />
              <p data-plan-cost className="mt-3">
                {t('handBuilder.cost', {
                  remaining: advice.redrawsRemaining,
                  tiles: advice.exchange.length,
                })}
              </p>
            </section>
            <details className="rounded-lg border border-white/15 p-2">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold text-amber-200">
                {t('handBuilder.improving', { types: advice.improving.length })}
              </summary>
              <p>{t('handBuilder.possibilities')}</p>
              <TileRow tiles={advice.improving} />
            </details>
            <p className="text-xs text-amber-100/85">
              {t('handBuilder.caution')}
            </p>
            <button
              type="button"
              data-plan-stage
              onClick={() => onStage(advice.exchange.map((tile) => tile.id))}
              className="min-h-11 w-full rounded-lg border-2 border-amber-300 bg-emerald-900 px-3 py-2 font-bold text-amber-100"
            >
              {t('handBuilder.stage')}
            </button>
            <p className="text-center text-xs">
              {t('handBuilder.confirm', { action: t('gameplay.redraw') })}
            </p>
          </>
        ) : (
          advice && (
            <p data-plan-status={advice.kind}>
              {t(`handBuilder.${advice.kind}`)}
            </p>
          )
        )}
      </div>
    </Popup>
  )
}
