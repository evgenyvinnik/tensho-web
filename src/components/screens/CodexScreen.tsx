/**
 * CodexScreen Component
 *
 * Full-page Codex experience - the game's comprehensive reference guide.
 * Features:
 * - Category sidebar (desktop) / tabs (mobile)
 * - Step-by-step content with animations
 * - Progress tracking
 * - Tile examples and visual aids
 * - Complete coverage of game mechanics, tiles, yaku, and strategies
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { Button } from '../ui/Button'
import { PavilionScreen } from '../ui/PavilionScreen'

// Import from extracted tutorial modules (reused for Codex)
import {
  ProgressBar,
  CategoryItem,
  CategoryTabs,
  CodexCategoryHero,
  StepContent,
} from './tutorial/TutorialComponents'
import { useTutorialSteps } from './tutorial/useTutorialSteps'
import { useCategoryLabel } from '../../i18n/categoryLabel'

/**
 * CodexScreen - Full-page Codex and reference guide experience
 *
 * Provides a comprehensive learning interface for Tensho Mahjong with:
 * - Category sidebar (desktop) for navigating between sections
 * - Horizontal category tabs (mobile) for responsive navigation
 * - Step indicators showing progress within each category
 * - Animated step content with tile examples and visual aids
 * - Progress tracking that persists visited steps
 * - Navigation controls with Previous/Next buttons
 * - "Start Playing" action on final step
 *
 * The Codex is accessible from the main menu and covers:
 * Introduction, Tiles, Hand Building, How to Play, Scoring,
 * Progression, Decrees, Flora, Economy, Strategy, and a final summary.
 */
export function CodexScreen() {
  const { t } = useTranslation()
  const categoryLabel = useCategoryLabel()
  const { goBack, navigateTo } = useAppNavigation()
  const steps = useTutorialSteps()

  // Current step state
  const [currentStep, setCurrentStep] = useState(0)

  // Track visited steps
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    () => new Set([0])
  )

  // Mark current step as visited when it changes
  useEffect(() => {
    setVisitedSteps((prev) => {
      const next = new Set(prev)
      next.add(currentStep)
      return next
    })
  }, [currentStep])

  // Derived data
  const categories = useMemo(() => {
    const cats = new Set<string>()
    steps.forEach((step) => step.category && cats.add(step.category))
    return Array.from(cats)
  }, [steps])

  const currentStepData = steps[currentStep]
  const currentCategory = currentStepData.category || ''

  const categorySteps = useMemo(() => {
    const stepsByCategory: Record<string, number[]> = {}
    steps.forEach((step, index) => {
      const cat = step.category || 'Uncategorized'
      if (!stepsByCategory[cat]) stepsByCategory[cat] = []
      stepsByCategory[cat].push(index)
    })
    return stepsByCategory
  }, [steps])

  const currentCategorySteps = categorySteps[currentCategory] || []
  const stepIndexInCategory = currentCategorySteps.indexOf(currentStep)

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, steps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleCategoryClick = useCallback(
    (category: string) => {
      const firstStepIndex = steps.findIndex((s) => s.category === category)
      if (firstStepIndex !== -1) {
        setCurrentStep(firstStepIndex)
      }
    },
    [steps]
  )

  const handleStepClick = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex)
  }, [])

  const handleStartPlaying = useCallback(() => {
    // Mark codex as completed
    if (typeof window !== 'undefined') {
      localStorage.setItem('tensho_codex_completed', 'true')
    }
    navigateTo(ROUTES.PLAY)
  }, [navigateTo])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <PavilionScreen
      page="codex"
      title={t('codex.title', 'Codex')}
      onBack={goBack}
    >
      <div className="pavilion-codex-mobile">
        <CategoryTabs
          categories={categories}
          currentCategory={currentCategory}
          onCategoryClick={handleCategoryClick}
        />
      </div>
      <div className="pavilion-codex">
        <aside className="pavilion-panel pavilion-codex-sidebar">
          {categories.map((category) => {
            const catSteps = categorySteps[category] || []
            return (
              <CategoryItem
                key={category}
                category={category}
                isActive={category === currentCategory}
                stepCount={catSteps.length}
                completedCount={
                  catSteps.filter((i) => visitedSteps.has(i)).length
                }
                onClick={() => handleCategoryClick(category)}
              />
            )
          })}
        </aside>
        <section className="pavilion-panel pavilion-codex-content">
          <nav
            className="pavilion-codex-steps"
            aria-label={categoryLabel(currentCategory)}
          >
            {currentCategorySteps.map((stepIndex, i) => (
              <button
                key={stepIndex}
                onClick={() => handleStepClick(stepIndex)}
                aria-current={stepIndex === currentStep ? 'step' : undefined}
                aria-label={steps[stepIndex].title}
                title={steps[stepIndex].title}
              >
                {i + 1}
              </button>
            ))}
          </nav>
          <CodexCategoryHero
            key={currentStepData.id}
            category={currentCategory}
            title={currentStepData.title}
          />
          <div className="prose prose-invert max-w-none text-[var(--color-beige-white)]">
            <StepContent key={currentStep} step={currentStepData} />
          </div>
          <footer className="pavilion-codex-footer">
            <ProgressBar
              current={currentStep}
              total={steps.length}
              categoryProgress={t(
                'codex.categoryProgress',
                '{{category}}: {{current}}/{{total}}',
                {
                  category: categoryLabel(currentCategory),
                  current: stepIndexInCategory + 1,
                  total: currentCategorySteps.length,
                }
              )}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={handlePrev}
                disabled={isFirstStep}
                className="min-w-0 px-2"
              >
                {t('codex.previous', 'Back')}
              </Button>
              <Button
                variant="primary"
                onClick={isLastStep ? handleStartPlaying : handleNext}
                className="min-w-0 px-2"
              >
                {isLastStep
                  ? t('codex.finish', 'Start Playing!')
                  : t('codex.next', 'Next')}
              </Button>
            </div>
          </footer>
        </section>
      </div>
    </PavilionScreen>
  )
}

export default CodexScreen
