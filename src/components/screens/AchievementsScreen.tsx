/**
 * Achievements Screen - Heavenly Accolades (天賞)
 *
 * Displays player achievements organized by category.
 * Based on ARCHITECTURE.MD Section 30.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { useAppNavigation, ROUTES } from '../../router'
import { BackButton } from '../ui/BackButton'
import {
  useAchievementStore,
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_CATEGORIES,
  getAchievementsByCategory,
  type AchievementCategory,
  type AchievementDefinition,
} from '../../stores/achievementStore'

const AnimatedDiv = animated('div')

/**
 * Single achievement card component
 */
function AchievementCard({
  definition,
  unlocked,
  progress,
  delay,
}: {
  definition: AchievementDefinition
  unlocked: boolean
  progress?: number
  delay: number
}) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const spring = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    delay,
    config: { tension: 200, friction: 20 },
  })

  const target = definition.condition.target
  const progressPercent = target && progress !== undefined ? Math.min((progress / target) * 100, 100) : 0

  return (
    <AnimatedDiv
      style={spring}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${
          unlocked
            ? 'bg-[var(--color-forest-green)] border-[var(--color-golden-yellow)]'
            : 'bg-[var(--color-dark-forest)] border-[var(--color-metallic-gold)] opacity-70'
        }
        hover:scale-[1.02] active:scale-[0.98]
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
            text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg
            ${unlocked ? 'bg-[var(--color-dark-forest)]' : 'bg-[var(--color-forest-green)] grayscale'}
          `}
        >
          {definition.icon}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`
                font-bold text-base truncate
                ${unlocked ? 'text-[var(--color-golden-yellow)]' : 'text-[var(--color-beige-white)]'}
              `}
            >
              {t(definition.nameKey, definition.nameKey.split('.').pop() ?? definition.nameKey)}
            </h3>
            {unlocked && <span className="text-green-400 text-sm">✓</span>}
          </div>

          <p className="text-xs text-[var(--color-metallic-gold)] font-tile">{definition.japaneseTitle}</p>

          {/* Progress bar for cumulative achievements */}
          {target && !unlocked && progress !== undefined && (
            <div className="mt-2">
              <div className="h-1.5 bg-[var(--color-dark-forest)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-vibrant-orange)] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-[var(--color-metallic-gold)] mt-1">
                {progress.toLocaleString()} / {target.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[var(--color-forest-green)]">
          <p className="text-sm text-[var(--color-beige-white)]">
            {t(definition.descriptionKey, definition.descriptionKey.split('.').pop() ?? definition.descriptionKey)}
          </p>

          {definition.unlocks && (
            <p className="text-xs text-[var(--color-golden-yellow)] mt-2">
              {t('achievements.unlocks', 'Unlocks')}: {definition.unlocks}
            </p>
          )}
        </div>
      )}
    </AnimatedDiv>
  )
}

/**
 * Category tab button
 */
function CategoryTab({
  category,
  isActive,
  onClick,
  unlockedCount,
  totalCount,
}: {
  category: { id: AchievementCategory; nameKey: string; icon: string }
  isActive: boolean
  onClick: () => void
  unlockedCount: number
  totalCount: number
}) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-4 py-2 rounded-lg font-bold text-sm
        border-2 transition-all duration-200
        min-h-[44px] min-w-[44px]
        ${
          isActive
            ? 'bg-[var(--color-vibrant-orange)] border-[var(--color-golden-yellow)] text-[var(--color-beige-white)]'
            : 'bg-[var(--color-dark-forest)] border-[var(--color-metallic-gold)] text-[var(--color-metallic-gold)] hover:bg-[var(--color-forest-green)]'
        }
      `}
    >
      <span className="mr-1">{category.icon}</span>
      <span className="hidden sm:inline">{t(category.nameKey, category.id)}</span>
      <span className="ml-1 text-xs opacity-70">
        {unlockedCount}/{totalCount}
      </span>
    </button>
  )
}

/**
 * Main Achievements Screen
 */
export function AchievementsScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('progression')

  const achievements = useAchievementStore((state) => state.achievements)
  const stats = useAchievementStore((state) => state.stats)

  // Calculate total progress
  const totalUnlocked = useMemo(
    () => Object.values(achievements).filter((a) => a.unlocked).length,
    [achievements]
  )

  // Get achievements for active category
  const categoryAchievements = useMemo(
    () => getAchievementsByCategory(activeCategory),
    [activeCategory]
  )

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<AchievementCategory, { unlocked: number; total: number }> = {
      progression: { unlocked: 0, total: 0 },
      cumulative: { unlocked: 0, total: 0 },
      skill: { unlocked: 0, total: 0 },
      scoring: { unlocked: 0, total: 0 },
      collection: { unlocked: 0, total: 0 },
      mastery: { unlocked: 0, total: 0 },
      challenge: { unlocked: 0, total: 0 },
    }

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      counts[def.category].total++
      if (achievements[def.id]?.unlocked) {
        counts[def.category].unlocked++
      }
    }

    return counts
  }, [achievements])

  // Get progress value for an achievement
  const getProgress = (def: AchievementDefinition): number | undefined => {
    switch (def.condition.type) {
      case 'reach_act':
        return stats.highestActReached
      case 'tiles_played':
        return stats.totalTilesPlayed
      case 'tiles_discarded':
        return stats.totalTilesDiscarded
      case 'max_gold':
        return stats.maxGoldInRun
      case 'single_hand_score':
        return stats.highestSingleHandScore
      case 'fate_seals_used':
        return stats.totalFateSealsUsed
      default:
        return achievements[def.id]?.progress
    }
  }

  // Header animation
  const headerSpring = useSpring({
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    config: { tension: 200, friction: 20 },
  })

  // Progress bar animation
  const progressSpring = useSpring({
    width: `${(totalUnlocked / ACHIEVEMENT_DEFINITIONS.length) * 100}%`,
    config: { tension: 100, friction: 20 },
  })

  const handleBack = () => {
    navigateTo(ROUTES.MENU)
  }

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-dark-forest)]">
      {/* Header */}
      <AnimatedDiv
        style={headerSpring}
        className="flex-shrink-0 px-4 py-3 bg-[var(--color-forest-green)] border-b-2 border-[var(--color-saddle-brown)]"
      >
        <div className="flex items-center justify-between mb-3">
          <BackButton onClick={handleBack} ariaLabel={t('common.back', 'Back')} />

          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
              {t('achievements.title', 'Heavenly Accolades')}
            </h1>
            <p className="text-xs text-[var(--color-metallic-gold)] font-tile">天賞</p>
          </div>

          <div className="w-[44px]" /> {/* Spacer for centering */}
        </div>

        {/* Overall progress */}
        <div className="bg-[var(--color-dark-forest)] rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--color-beige-white)]">{t('achievements.progress', 'Progress')}</span>
            <span className="text-[var(--color-golden-yellow)]">
              {totalUnlocked} / {ACHIEVEMENT_DEFINITIONS.length}
            </span>
          </div>
          <div className="h-2 bg-[var(--color-forest-green)] rounded-full overflow-hidden">
            <AnimatedDiv
              className="h-full bg-gradient-to-r from-[var(--color-vibrant-orange)] to-[var(--color-golden-yellow)]"
              style={progressSpring}
            />
          </div>
        </div>
      </AnimatedDiv>

      {/* Category tabs */}
      <div className="flex-shrink-0 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {ACHIEVEMENT_CATEGORIES.map((category) => (
            <CategoryTab
              key={category.id}
              category={category}
              isActive={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              unlockedCount={categoryCounts[category.id].unlocked}
              totalCount={categoryCounts[category.id].total}
            />
          ))}
        </div>
      </div>

      {/* Achievement list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoryAchievements.map((def, index) => (
            <AchievementCard
              key={def.id}
              definition={def}
              unlocked={achievements[def.id]?.unlocked || false}
              progress={getProgress(def)}
              delay={index * 50}
            />
          ))}
        </div>

        {categoryAchievements.length === 0 && (
          <div className="text-center py-12 text-[var(--color-metallic-gold)]">
            {t('achievements.noAchievements', 'No achievements in this category')}
          </div>
        )}
      </div>
    </div>
  )
}

export default AchievementsScreen
