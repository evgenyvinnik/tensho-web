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
import { BackButton } from '../ui/BackButton'

// Import from extracted tutorial modules (reused for Codex)
import {
  CATEGORY_CONFIG,
  ProgressBar,
  CategoryItem,
  CategoryTabs,
  StepContent,
} from './tutorial/TutorialComponents'
import { useTutorialSteps } from './tutorial/useTutorialSteps'

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
  const { goBack, navigateTo } = useAppNavigation()
  const steps = useTutorialSteps()

  // Current step state
  const [currentStep, setCurrentStep] = useState(0)

  // Track visited steps
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([0]))

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
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-[var(--color-dark-forest)]">
        <BackButton onClick={goBack} ariaLabel={t('common.back')} />
        <h1 className="text-xl font-bold text-[var(--color-golden-yellow)]">
          📜 {t('codex.title', 'Codex')}
        </h1>
        <div className="w-[44px]" />
      </div>

      {/* Mobile category tabs */}
      <div className="lg:hidden px-4 py-3 bg-[var(--color-dark-forest)] border-t border-[var(--color-forest-green)]">
        <CategoryTabs categories={categories} currentCategory={currentCategory} onCategoryClick={handleCategoryClick} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-72 bg-[var(--color-dark-forest)] border-r border-[var(--color-forest-green)] overflow-y-auto p-4 gap-2">
          {categories.map((category) => {
            const catSteps = categorySteps[category] || []
            const completedCount = catSteps.filter((i) => visitedSteps.has(i)).length

            return (
              <CategoryItem
                key={category}
                category={category}
                isActive={category === currentCategory}
                stepCount={catSteps.length}
                completedCount={completedCount}
                onClick={() => handleCategoryClick(category)}
              />
            )
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Step indicators for current category */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-dark-forest)] overflow-x-auto scrollbar-hide">
            {currentCategorySteps.map((stepIndex, i) => {
              const step = steps[stepIndex]
              const isActive = stepIndex === currentStep
              const isVisited = visitedSteps.has(stepIndex)

              return (
                <button
                  key={stepIndex}
                  onClick={() => handleStepClick(stepIndex)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-[var(--color-vibrant-orange)] text-white scale-110'
                      : isVisited
                        ? 'bg-[var(--color-forest-green)] text-[var(--color-golden-yellow)]'
                        : 'bg-[var(--color-dark-forest)] text-[var(--color-beige-white)] opacity-50'
                    }`}
                  title={step.title}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {/* Step title */}
            <div className="mb-6">
              {currentStepData.category && (
                <div className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-[var(--color-dark-forest)] text-[var(--color-metallic-gold)] border border-[var(--color-metallic-gold)]/30 mb-3">
                  <span>{CATEGORY_CONFIG[currentStepData.category]?.icon || '📖'}</span>
                  <span>{currentStepData.category}</span>
                </div>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-golden-yellow)]">
                {currentStepData.title}
              </h2>
            </div>

            {/* Step content */}
            <div className="prose prose-invert max-w-none text-[var(--color-beige-white)]">
              <StepContent key={currentStep} step={currentStepData} />
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="px-4 py-4 bg-[var(--color-dark-forest)] border-t border-[var(--color-forest-green)]">
            {/* Progress bar */}
            <div className="mb-4">
              <ProgressBar
                current={currentStep}
                total={steps.length}
                categoryProgress={`${currentStepData.category}: ${stepIndexInCategory + 1}/${currentCategorySteps.length}`}
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-4">
              <Button variant="secondary" onClick={handlePrev} disabled={isFirstStep} className="flex-1 max-w-[150px]">
                ← {t('codex.previous', 'Back')}
              </Button>

              {isLastStep ? (
                <Button variant="primary" onClick={handleStartPlaying} className="flex-1 max-w-[200px]">
                  {t('codex.finish', 'Start Playing!')}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext} className="flex-1 max-w-[150px]">
                  {t('codex.next', 'Next')} →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodexScreen
