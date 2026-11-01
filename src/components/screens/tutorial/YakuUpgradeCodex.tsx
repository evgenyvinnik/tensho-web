/**
 * The Codex's Yaku upgrade reference: what a Celestial Orb levels, what each
 * level pays, and example plays for every family, drawn as tiles.
 *
 * Read-only: it never touches the active run. Numbers come from the Orb
 * catalog and the scoring constants, and each ordinary example is read by the
 * real play parser, so the pattern and families it names are the ones a real
 * play would score.
 *
 * @module components/screens/tutorial/YakuUpgradeCodex
 */

import { useTranslation } from 'react-i18next'
import { MeldType } from '../../../core/Meld'
import {
  getCelestialOrbByYaku,
  type YakuCategory,
} from '../../../systems/CelestialOrbSystem'
import { GROUP_MULT } from '../../../rules/PlayPattern'
import {
  STRUCTURE_POINTS_BY_TYPE,
  calculateTilePoints,
} from '../../../rules/ScoringEngine'
import { SHOWN_MAX_UPGRADE_LEVEL } from '../../gameplay/yakuUpgradeLevel'
import { getItemArt } from '../../../utils/itemArt'
import { Formula, InfoBox, TileGroups } from './TutorialComponents'
import {
  COMPLETE_HAND_UPGRADE_FAMILIES,
  PLAY_UPGRADE_FAMILIES,
  UPGRADE_FAMILY_EXAMPLES,
  exampleTiles,
  readUpgradeExample,
  type UpgradeExample,
  type UpgradeFamily,
} from './yakuUpgradeExamples'

export const YAKU_UPGRADE_CODEX_SECTIONS = [
  ['yaku-upgrades', 'yakuUpgrades.title', 'intro'],
  ['upgrade-families-plays', 'codexUpgrades.playsTitle', 'plays'],
  ['upgrade-families-hands', 'codexUpgrades.handsTitle', 'hands'],
] as const
type Section = (typeof YAKU_UPGRADE_CODEX_SECTIONS)[number][2]

/** The worked example: one Sequence, before and after one Venus level. */
const WORKED_EXAMPLE: UpgradeExample = UPGRADE_FAMILY_EXAMPLES.Pinfu[0]

function Example({ example }: { example: UpgradeExample }) {
  const { t } = useTranslation()
  const familyName = (family: YakuCategory) =>
    t(`upgradeFamilies.${family}.name`)
  const reading = example.complete ? null : readUpgradeExample(example)
  return (
    <figure
      data-codex-upgrade-example
      className="m-0 min-w-0 rounded-lg bg-black/20 p-2"
    >
      <TileGroups groups={example.groups} />
      <figcaption className="text-center text-xs leading-snug">
        <span className="font-semibold text-[var(--color-golden-yellow)]">
          {reading
            ? t(`patterns.${reading.pattern}.name`)
            : t('codexUpgrades.completeHand')}
        </span>
        {reading && (
          <span className="block text-[var(--color-beige-white)]/80">
            {t('codexUpgrades.scores', {
              families: reading.families.map(familyName).join(' · '),
            })}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

function FamilyCard({ family }: { family: UpgradeFamily }) {
  const { t } = useTranslation()
  const orb = getCelestialOrbByYaku(family)!
  const secret = (COMPLETE_HAND_UPGRADE_FAMILIES as readonly string[]).includes(
    family
  )
  return (
    <article
      data-codex-upgrade-family={family}
      className="min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/30 bg-black/15 p-4 [overflow-wrap:anywhere]"
    >
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <img
          src={getItemArt('orbs', orb.id).src}
          alt=""
          aria-hidden="true"
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--color-golden-yellow)]">
            {t(`upgradeFamilies.${family}.name`)}
          </h3>
          <p className="text-xs text-[var(--color-metallic-gold)]">
            {t('yakuUpgrades.fromOrb', { orb: t(`orbs.items.${orb.id}.name`) })}
          </p>
        </div>
      </div>
      <div className="space-y-3 text-sm leading-relaxed">
        <p className="font-semibold text-emerald-200">
          {t('codexUpgrades.perLevel', {
            chips: orb.effect.chipsPerLevel,
            mult: orb.effect.multPerLevel,
          })}
        </p>
        <p>{t(`upgradeFamilies.${family}.covers`)}</p>
        <div className="grid min-w-0 grid-cols-1 gap-2">
          {UPGRADE_FAMILY_EXAMPLES[family].map((example, index) => (
            <Example key={index} example={example} />
          ))}
        </div>
        {secret && (
          <p className="text-xs text-[var(--color-metallic-gold)]">
            {t('collection.unlock')} {t(`consumableUnlocks.${orb.id}`)}
          </p>
        )}
      </div>
    </article>
  )
}

export function YakuUpgradeCodex({ section }: { section: Section }) {
  const { t } = useTranslation()

  if (section === 'intro') {
    const venus = getCelestialOrbByYaku('Pinfu')!.effect
    const points =
      calculateTilePoints(exampleTiles(WORKED_EXAMPLE)) +
      STRUCTURE_POINTS_BY_TYPE[MeldType.Sequence]
    const mult = 1 + GROUP_MULT.sequence
    return (
      <div data-codex-upgrades="intro" className="space-y-3">
        <p>{t('codexUpgrades.intro', { max: SHOWN_MAX_UPGRADE_LEVEL })}</p>
        <p>{t('codexUpgrades.stacking')}</p>
        <TileGroups groups={WORKED_EXAMPLE.groups} />
        <Formula>
          <span className="block text-base">
            {t('codexUpgrades.exampleBefore', {
              pattern: t('patterns.sequence.name'),
              points,
              mult,
              score: points * mult,
            })}
          </span>
          <span className="block text-base text-emerald-200">
            {t('codexUpgrades.exampleAfter', {
              family: t('upgradeFamilies.Pinfu.name'),
              points,
              chips: venus.chipsPerLevel,
              mult,
              bonusMult: venus.multPerLevel,
              score:
                (points + venus.chipsPerLevel) * (mult + venus.multPerLevel),
            })}
          </span>
        </Formula>
        <p>{t('codexUpgrades.completeHands')}</p>
        <InfoBox type="tip">{t('codexUpgrades.secretTip')}</InfoBox>
      </div>
    )
  }

  const families =
    section === 'plays' ? PLAY_UPGRADE_FAMILIES : COMPLETE_HAND_UPGRADE_FAMILIES
  return (
    <div data-codex-upgrades={section} className="space-y-4">
      <p>
        {t(
          section === 'plays'
            ? 'codexUpgrades.playsIntro'
            : 'codexUpgrades.handsIntro'
        )}
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
        {families.map((family) => (
          <FamilyCard key={family} family={family} />
        ))}
      </div>
    </div>
  )
}
