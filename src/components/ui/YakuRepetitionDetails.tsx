import { useTranslation } from 'react-i18next'
import { PLAY_PATTERN_IDS } from '../../rules/PlayPattern'

/** The play patterns of the last round and their back-to-back streaks. */
export interface YakuRepetitionHistory {
  previousRoundYakuIds: ReadonlySet<string>
  previousRoundYakuStreaks?: Readonly<Record<string, number>>
}

const PATTERN_IDS: ReadonlySet<string> = new Set(PLAY_PATTERN_IDS)

/** Read-only planning information inside the player's optional item inspector. */
export function YakuRepetitionDetails({
  history,
}: {
  history: YakuRepetitionHistory
}) {
  const { t, i18n } = useTranslation()
  // Saves from before patterns replaced Yaku can still list Yaku ids.
  const patterns = [...history.previousRoundYakuIds].filter((id) =>
    PATTERN_IDS.has(id)
  )
  return (
    <div
      data-yaku-repetition-details
      className="mt-3 rounded-lg border border-amber-200/25 bg-black/20 p-2.5 text-sm leading-relaxed [overflow-wrap:anywhere]"
    >
      <p className="font-semibold text-[var(--color-golden-yellow)]">
        {t('yakuRepetition.title')}
      </p>
      {patterns.length ? (
        <ul className="mt-2 space-y-1">
          {patterns.map((id) => (
            <li key={id} data-yaku-streak={id}>
              {t('yakuRepetition.streak', {
                name: t(`patterns.${id}.name`, id),
                rounds: (
                  history.previousRoundYakuStreaks?.[id] ?? 1
                ).toLocaleString(i18n.resolvedLanguage),
              })}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">{t('yakuRepetition.empty')}</p>
      )}
    </div>
  )
}
