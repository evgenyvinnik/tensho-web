import { useTranslation } from 'react-i18next'
import type { CompleteHandInterpretation } from '../../game/GameOrchestrator'
import { getTileImagePath } from '../../utils/assets'
import { tileName } from '../../i18n/tileText'
import type { Tile } from '../../core/Tile'

/** Optional native disclosure: works with touch and keyboard, without a tutorial overlay. */
export function HandInterpretationDetails({
  interpretation,
  skippedSequences = [],
  flowerSequences,
}: {
  interpretation?: CompleteHandInterpretation | null
  skippedSequences?: Tile[][]
  flowerSequences?: { overlapping: Tile[][]; anchored: Tile[][] }
}) {
  const { t } = useTranslation()
  if (
    skippedSequences.length === 0 &&
    !flowerSequences?.overlapping.length &&
    !flowerSequences?.anchored.length &&
    (!interpretation ||
      (interpretation.naturalComplete &&
        !interpretation.substitutions.length &&
        !interpretation.usedShantenClemency &&
        !interpretation.allWild))
  )
    return null
  const {
    substitutions = [],
    completionTile,
    usedShantenClemency,
    allWild,
  } = interpretation ?? {}
  return (
    <details
      data-hand-interpretation
      className="col-span-2 min-w-0 text-xs text-[var(--color-beige-white)] [overflow-wrap:anywhere]"
    >
      <summary className="min-h-11 cursor-pointer py-3 underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-300">
        {t('handInterpretation.why')}
      </summary>
      <div className="space-y-3 rounded-lg border border-[var(--color-metallic-gold)]/40 bg-black/20 p-3">
        {interpretation && <p>{t('handInterpretation.assisted')}</p>}
        {[
          {
            kind: 'skipped',
            groups: skippedSequences,
            label: 'handInterpretation.sequenceSkip',
          },
          {
            kind: 'overlapping',
            groups: flowerSequences?.overlapping ?? [],
            label: 'flora.mutations.plum',
          },
          {
            kind: 'anchored',
            groups: flowerSequences?.anchored ?? [],
            label: 'flora.mutations.bamboo',
          },
        ]
          .filter(({ groups }) => groups.length > 0)
          .map(({ kind, groups, label }) => (
            <div
              key={kind}
              data-skipped-sequences={kind === 'skipped' || undefined}
              data-overlapping-sequences={kind === 'overlapping' || undefined}
              data-anchored-sequences={kind === 'anchored' || undefined}
              className="space-y-2"
            >
              <p>{t(label)}</p>
              {groups.map((tiles) => (
                <div key={tiles.map((tile) => tile.id).join('|')}>
                  <div aria-hidden="true" className="flex gap-1">
                    {tiles.map((tile) => (
                      <img
                        key={tile.id}
                        src={getTileImagePath(tile.suit, tile.rank)}
                        alt=""
                        width={36}
                        height={48}
                        data-shared-tile={
                          (kind === 'overlapping' &&
                            groups.filter((group) =>
                              group.some(
                                (candidate) => candidate.id === tile.id
                              )
                            ).length > 1) ||
                          undefined
                        }
                        className="h-12 w-9 rounded object-contain data-[shared-tile=true]:outline data-[shared-tile=true]:outline-2 data-[shared-tile=true]:outline-[var(--color-golden-yellow)]"
                      />
                    ))}
                  </div>
                  <p className="mt-1">
                    {tiles.map((tile) => tileName(tile, t)).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          ))}
        {allWild && <p>{t('handInterpretation.allWild')}</p>}
        {substitutions.map(({ physical, effective }) => (
          <div key={physical.id} data-interpreted-tile={physical.id}>
            <div aria-hidden="true" className="mb-1 flex items-center gap-3">
              <img
                src={getTileImagePath(physical.suit, physical.rank)}
                alt=""
                width={36}
                height={48}
                className="h-12 w-9 object-contain"
              />
              <span>→</span>
              <img
                src={getTileImagePath(effective.suit, effective.rank)}
                alt=""
                width={36}
                height={48}
                className="h-12 w-9 object-contain"
              />
            </div>
            <p>
              {t('handInterpretation.substitution', {
                from: tileName(physical, t),
                to: tileName(effective, t),
              })}
            </p>
          </div>
        ))}
        {completionTile && (
          <p>
            {t('handInterpretation.virtual', {
              tile: tileName(completionTile, t),
            })}
          </p>
        )}
        {usedShantenClemency && <p>{t('handInterpretation.penalty')}</p>}
        {(substitutions.length > 0 || completionTile || allWild) && (
          <p className="opacity-70">{t('handInterpretation.unchanged')}</p>
        )}
      </div>
    </details>
  )
}
