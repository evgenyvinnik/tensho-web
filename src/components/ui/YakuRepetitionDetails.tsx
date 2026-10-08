import { useTranslation } from 'react-i18next'

export interface YakuRepetitionHistory {
  previousRoundYakuIds: ReadonlySet<string>
  previousRoundYakuStreaks?: Readonly<Record<string, number>>
}
const aliases: Record<string, string> = {
  menzen_tsumo: 'menzenTsumo',
  sanshoku_doujun: 'sanshokuDoujun',
  seven_pairs: 'chiitoitsu',
  kokushi: 'kokushiMusou',
  suu_ankou: 'suuAnkou',
  dai_sangen: 'daisangen',
  chuuren_poutou: 'chuurenPoutou',
}

/** Read-only planning information inside the player's optional item inspector. */
export function YakuRepetitionDetails({
  history,
}: {
  history: YakuRepetitionHistory
}) {
  const { t, i18n } = useTranslation()
  return (
    <div
      data-yaku-repetition-details
      className="mt-3 rounded-lg border border-amber-200/25 bg-black/20 p-2.5 text-sm leading-relaxed [overflow-wrap:anywhere]"
    >
      <p className="font-semibold text-[var(--color-golden-yellow)]">
        {t('yakuRepetition.title')}
      </p>
      {history.previousRoundYakuIds.size ? (
        <ul className="mt-2 space-y-1">
          {[...history.previousRoundYakuIds].map((id) => (
            <li key={id} data-yaku-streak={id}>
              {t('yakuRepetition.streak', {
                name: t(`yaku.${aliases[id] ?? id}`, id),
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
