import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { PavilionScreen } from '../ui/PavilionScreen'
import { ControlIcon } from '../ui/ControlIcon'
import {
  useAchievementStore,
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_CATEGORIES,
  getAchievementsByCategory,
  type AchievementCategory,
  type AchievementDefinition,
  type AchievementStats,
} from '../../stores/achievementStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { getGeneratedArt } from '../../utils/generatedArt'
import { useArchiveStore } from '../../stores/archiveStore'
import { getGoldDecreeProgress } from '../../utils/stakeMastery'

const statByCondition: Record<string, keyof AchievementStats> = {
  reach_act: 'highestActReached',
  tiles_played: 'totalTilesPlayed',
  tiles_discarded: 'totalTilesDiscarded',
  max_gold: 'maxGoldInRun',
  single_hand_score: 'highestSingleHandScore',
  fate_seals_used: 'totalFateSealsUsed',
  break_glass_tiles: 'maxGlassTilesBrokenInHand',
  yaku_level: 'highestYakuLevel',
  rounds_without_honor_discard: 'roundsWonWithoutHonorDiscards',
  charters_by_act: 'maxChartersPurchasedByAct5',
  wind_yaku_in_run: 'maxWindYakuInRun',
}

function AchievementCard({
  definition,
  unlocked,
  progress,
  target = definition.condition.target,
}: {
  definition: AchievementDefinition
  unlocked: boolean
  progress?: number
  target?: number
}) {
  const { t, i18n } = useTranslation()
  const number = (value: number) => value.toLocaleString(i18n.resolvedLanguage)
  return (
    <article
      className="pavilion-panel accolade-card"
      data-unlocked={unlocked}
      data-achievement-card={definition.id}
    >
      <img
        src={getGeneratedArt('achievements', definition.icon)}
        alt=""
        aria-hidden="true"
        className="accolade-art"
        width={92}
        height={92}
        loading="lazy"
      />
      <h2 className="accolade-title">
        {t(definition.nameKey)}
        <ControlIcon name={unlocked ? 'check' : 'lock'} size={18} />
      </h2>
      <p className="mt-1 text-xs text-[var(--color-metallic-gold)] font-tile">
        {definition.japaneseTitle}
      </p>
      <p className="accolade-description">{t(definition.descriptionKey)}</p>
      {target && !unlocked && progress !== undefined && (
        <div className="mt-4">
          <div
            className="pavilion-meter"
            role="progressbar"
            aria-label={t(definition.nameKey)}
            aria-valuemin={0}
            aria-valuemax={target}
            aria-valuenow={Math.min(target, Math.max(0, progress))}
          >
            <span
              style={{
                width: `${Math.min(100, Math.max(0, (progress / target) * 100))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--color-metallic-gold)]">
            {number(progress)} / {number(target)}
          </p>
        </div>
      )}
      {definition.reward && (
        <p
          data-achievement-reward
          className="mt-3 text-xs text-[var(--color-golden-yellow)]"
        >
          {t('achievements.unlocks', 'Unlocks')}:{' '}
          {t(
            `${definition.reward.category}.items.${definition.reward.itemId}.name`
          )}
        </p>
      )}
    </article>
  )
}

export function AchievementsScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const [activeCategory, setActiveCategory] =
    useState<AchievementCategory>('progression')
  const achievements = useAchievementStore((state) => state.achievements)
  const stats = useAchievementStore((state) => state.stats)
  const fullUnlock = useProgressionStore((state) => state.fullUnlockEnabled)
  const archiveEntries = useArchiveStore((state) => state.entries)
  const goldMastery = getGoldDecreeProgress(archiveEntries)
  const unlocked = ACHIEVEMENT_DEFINITIONS.filter(
    (def) => achievements[def.id]?.unlocked
  ).length
  const total = ACHIEVEMENT_DEFINITIONS.length
  return (
    <PavilionScreen
      page="achievements"
      title={t('achievements.title', 'Heavenly Accolades')}
      shortTitle={t('achievements.shortTitle', 'Accolades')}
      onBack={() => navigateTo(ROUTES.MENU)}
      summary={
        <>
          <div className="pavilion-progress">
            <span>{t('achievements.progress', 'Progress')}</span>
            <span>
              {unlocked} / {total}
            </span>
          </div>
          <div className="pavilion-meter">
            <span style={{ width: `${(unlocked / total) * 100}%` }} />
          </div>
        </>
      }
    >
      <nav className="pavilion-tabs" aria-label={t('achievements.title')}>
        {ACHIEVEMENT_CATEGORIES.map((category) => {
          const definitions = getAchievementsByCategory(category.id)
          const count = definitions.filter(
            (def) => achievements[def.id]?.unlocked
          ).length
          return (
            <button
              key={category.id}
              className="pavilion-tab"
              aria-pressed={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            >
              <ControlIcon name={category.icon} size={22} />
              <span>{t(category.nameKey)}</span>
              <span className="text-xs opacity-75">
                {count}/{definitions.length}
              </span>
            </button>
          )
        })}
      </nav>
      {fullUnlock && (
        <p
          role="status"
          className="mb-4 text-sm text-[var(--color-golden-yellow)]"
        >
          {t('settings.fullUnlock.active')}
        </p>
      )}
      <div className="pavilion-achievements">
        {getAchievementsByCategory(activeCategory).map((definition) => (
          <AchievementCard
            key={definition.id}
            definition={definition}
            unlocked={achievements[definition.id]?.unlocked ?? false}
            progress={
              definition.condition.type === 'gold_sticker_all_decrees'
                ? goldMastery.completed
                : statByCondition[definition.condition.type]
                  ? stats[statByCondition[definition.condition.type]]
                  : achievements[definition.id]?.progress
            }
            target={
              definition.condition.type === 'gold_sticker_all_decrees'
                ? goldMastery.total
                : definition.condition.target
            }
          />
        ))}
      </div>
    </PavilionScreen>
  )
}
export default AchievementsScreen
