import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { FLOWER_BASE_EFFECTS } from '../../../systems/FlowerSystem'
import { CORRUPTED_TO_BASE_SEASON } from '../../../systems/SeasonSystem'
import type { FlowerVariant, SeasonVariant } from '../../../systems/types'
import { illustrationAssets } from '../../../utils/assets'
import { getFlowerArt, getSeasonArt, getItemArt } from '../../../utils/itemArt'
import { scoreMultiplier } from '../../../utils/scoreNumber'

export const FLORA_CODEX_SECTIONS = [
  ['flowers-system', 'flora.flowers', 'flowers'],
  ['flower-awakening', 'flora.mutations.awakened', 'awakening'],
  ['seasons-system', 'flora.seasons', 'seasons'],
  ['corrupted-seasons', 'flora.details.corruptedName', 'corruption'],
  ['flora-interactions', 'codexFlora.interactionsTitle', 'interactions'],
  ['flower-catalysts', 'codexFlora.catalystsTitle', 'catalysts'],
] as const
type Section = (typeof FLORA_CODEX_SECTIONS)[number][2]
const flowers: FlowerVariant[] = ['Plum', 'Orchid', 'Chrysanthemum', 'Bamboo']
const seasons: SeasonVariant[] = ['Spring', 'Summer', 'Autumn', 'Winter']

function Card({
  id,
  art,
  title,
  children,
}: {
  id: string
  art: string
  title: string
  children: ReactNode
}) {
  return (
    <article
      data-codex-flora-card={id}
      className="min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/30 bg-black/15 p-4 [overflow-wrap:anywhere]"
    >
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <img
          src={art}
          alt=""
          aria-hidden="true"
          width={72}
          height={72}
          className="h-[72px] w-[72px] shrink-0 object-contain"
        />
        <h3 className="min-w-0 font-semibold text-[var(--color-golden-yellow)]">
          {title}
        </h3>
      </div>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </article>
  )
}

/** Reference content uses the same localized rules and artwork as live tokens.
 * Never reads/mutates the active run, unlocks content or starts a tutorial. */
export function FloraCodex({ section }: { section: Section }) {
  const { t, i18n } = useTranslation()
  const name = (type: string) => t('flora.' + type.toLowerCase())
  const grid = 'grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2'
  return (
    <div data-codex-flora={section} className="space-y-4">
      {section === 'flowers' && (
        <>
          <p>{t('flora.details.runScope')}</p>
          <div className={grid}>
            {flowers.map((flower) => (
              <Card
                key={flower}
                id={flower}
                art={getFlowerArt(flower)}
                title={name(flower)}
              >
                <p>
                  {t('flora.details.flower' + flower, {
                    percent: FLOWER_BASE_EFFECTS[
                      flower
                    ].percentagePerMatch.toLocaleString(i18n.language),
                  })}
                </p>
              </Card>
            ))}
          </div>
          <ul className="space-y-2">
            {['setTwo', 'setThree', 'setFour'].map((key) => (
              <li key={key}>{t('flora.details.' + key)}</li>
            ))}
          </ul>
          <p>{t('codexFlora.empowerment')}</p>
        </>
      )}
      {section === 'awakening' && (
        <>
          <p>{t('flora.mutations.locked')}</p>
          <p>{t('codexFlora.awakeningLifecycle')}</p>
          <div className={grid}>
            {flowers.map((flower) => (
              <Card
                key={flower}
                id={'awakened-' + flower}
                art={illustrationAssets.awakenedFlowers[flower]}
                title={name(flower)}
              >
                <p>
                  {t('flora.mutations.' + flower.toLowerCase(), {
                    factor: scoreMultiplier(1.2, i18n.language).display,
                  })}
                </p>
                {flower === 'Chrysanthemum' && (
                  <p>
                    {t('codexFlora.chrysanthemumSet', {
                      factor: scoreMultiplier(1.4, i18n.language).display,
                    })}
                  </p>
                )}
              </Card>
            ))}
          </div>
          <p>{t('codexFlora.drought')}</p>
        </>
      )}
      {section === 'seasons' && (
        <>
          <p>{t('flora.details.roundScope')}</p>
          <p>{t('codexFlora.distinction')}</p>
          <div className={grid}>
            {seasons.map((season) => (
              <Card
                key={season}
                id={season}
                art={getSeasonArt(season)}
                title={name(season)}
              >
                <p>{t('flora.details.' + season.toLowerCase())}</p>
              </Card>
            ))}
          </div>
        </>
      )}
      {section === 'corruption' && (
        <>
          <p>{t('codexFlora.corruption')}</p>
          <div className={grid}>
            {Object.entries(CORRUPTED_TO_BASE_SEASON).map(
              ([corrupted, base]) => (
                <Card
                  key={corrupted}
                  id={corrupted}
                  art={getSeasonArt({
                    type: base,
                    isCorrupted: true,
                    corruptedType:
                      corrupted as keyof typeof CORRUPTED_TO_BASE_SEASON,
                  })}
                  title={t('flora.details.' + corrupted.toLowerCase() + 'Name')}
                >
                  <p className="text-[var(--color-metallic-gold)]">
                    {name(base)}
                  </p>
                  <p>{t('flora.details.' + corrupted.toLowerCase())}</p>
                </Card>
              )
            )}
          </div>
          <p>{t('codexFlora.drought')}</p>
        </>
      )}
      {section === 'interactions' && (
        <>
          <p>{t('codexFlora.interactionsIntro')}</p>
          {(
            [
              ['Orchid', 'Spring', 'orchidSpring'],
              ['Bamboo', 'Summer', 'bambooSummer'],
              ['Plum', 'Autumn', 'plumAutumn'],
              ['Chrysanthemum', 'Winter', 'chrysanthemumWinter'],
            ] as const
          ).map(([flower, season, key]) => (
            <details
              key={key}
              data-codex-combo={key}
              className="rounded-xl border border-[var(--color-metallic-gold)]/30 p-3"
            >
              <summary className="cursor-pointer py-2 font-semibold text-[var(--color-golden-yellow)] [overflow-wrap:anywhere]">
                {name(flower)} + {name(season)}
              </summary>
              <div className="flex gap-3 py-3" aria-hidden="true">
                <img
                  src={getFlowerArt(flower)}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
                <img
                  src={getSeasonArt(season)}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
              </div>
              <p className="text-sm leading-relaxed">
                {t('codexFlora.' + key)}
              </p>
            </details>
          ))}
        </>
      )}
      {section === 'catalysts' && (
        <>
          <p>{t('codexFlora.catalystsIntro')}</p>
          <p>{t('shop.catalyst.warning')}</p>
          <p>{t('codexFlora.catalystsCost')}</p>
          <div className={grid}>
            {[
              'tanyao_dispensation',
              'decree-yaku-amplifier',
              'decree-yaku-nexus',
              'yakuman_succession',
            ].map((id) => (
              <Card
                key={id}
                id={id}
                art={getItemArt('decrees', id).src}
                title={t('decrees.items.' + id + '.name')}
              >
                <p>{t('decrees.items.' + id + '.description')}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
