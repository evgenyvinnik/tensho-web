import { useTranslation } from 'react-i18next'
import { teachingIllustrations } from '../../utils/teachingArt'

/** Pictures reinforce the adjacent rules; all meaning remains in localized text. */
export function TeachingIllustration({
  kind,
}: {
  kind: keyof typeof teachingIllustrations
}) {
  const { t } = useTranslation()
  const labels =
    kind === 'synergy'
      ? [`+${t('guide.points')}`, `+${t('guide.mult')}`, `×${t('guide.mult')}`]
      : kind === 'awakening'
        ? [t('teachingArt.ordinaryFlower'), t('flora.mutations.awakened')]
        : [t('results.victory'), t('teachingArt.optionalEndless')]

  return (
    <figure
      data-teaching-art={kind}
      className="min-w-0 overflow-hidden rounded-xl border border-[var(--color-metallic-gold)]/30 bg-black/15"
    >
      <img
        src={teachingIllustrations[kind]}
        alt=""
        width={960}
        height={320}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
      <figcaption
        className={`grid ${kind === 'synergy' ? 'grid-cols-3' : 'grid-cols-2'} divide-x divide-[var(--color-metallic-gold)]/20 text-center text-xs font-semibold leading-relaxed text-[var(--color-golden-yellow)] sm:text-sm`}
      >
        {labels.map((label, index) => (
          <span
            key={index}
            className="min-w-0 px-2 py-2 [overflow-wrap:anywhere]"
          >
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
