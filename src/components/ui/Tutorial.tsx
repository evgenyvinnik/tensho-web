/**
 * Tutorial Component for Tensho Mahjong Roguelike
 * Multi-step tutorial using the Popup component
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { Popup } from './Popup'
import { getTileImagePath } from '../../utils/assets'
import { TileSuit } from '../../core/Tile'

const AnimatedDiv = animated('div')

/**
 * Tutorial step definition
 */
export interface TutorialStep {
  id: string
  title: string
  content: React.ReactNode
  image?: string
  showTiles?: Array<{ suit: TileSuit; rank: number }>
}

/**
 * Tutorial popup props
 */
export interface TutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

/**
 * Tutorial step content component
 */
function TutorialStepContent({ step }: { step: TutorialStep }) {
  const tileSpring = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    config: { tension: 200, friction: 20 },
    delay: 200,
  })

  return (
    <div className="space-y-4">
      {/* Content text */}
      <div className="text-lg leading-relaxed">{step.content}</div>

      {/* Show sample tiles if provided */}
      {step.showTiles && step.showTiles.length > 0 && (
        <AnimatedDiv
          className="flex justify-center gap-2 py-4"
          style={{
            opacity: tileSpring.opacity,
            transform: tileSpring.y.to((y) => `translateY(${y}px)`),
          }}
        >
          {step.showTiles.map((tile, index) => (
            <img
              key={index}
              src={getTileImagePath(tile.suit, tile.rank)}
              alt=""
              className="w-14 h-20 object-contain drop-shadow-lg"
              draggable={false}
            />
          ))}
        </AnimatedDiv>
      )}

      {/* Custom image if provided */}
      {step.image && (
        <div className="flex justify-center py-4">
          <img
            src={step.image}
            alt=""
            className="max-w-full max-h-48 object-contain rounded-lg"
            draggable={false}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Progress dots component
 */
function ProgressDots({
  total,
  current,
  onDotClick,
}: {
  total: number
  current: number
  onDotClick: (index: number) => void
}) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className={`
            w-3 h-3 rounded-full transition-all duration-200
            ${
              i === current
                ? 'bg-[var(--color-golden-yellow)] scale-125'
                : 'bg-[var(--color-metallic-gold)] opacity-50 hover:opacity-75'
            }
          `}
          aria-label={`Go to step ${i + 1}`}
        />
      ))}
    </div>
  )
}

/**
 * Main Tutorial component
 */
export function Tutorial({ isOpen, onClose, onComplete }: TutorialProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)

  // Define tutorial steps
  const steps: TutorialStep[] = useMemo(
    () => [
      {
        id: 'welcome',
        title: t('tutorial.welcome.title', 'Welcome to Tensho!'),
        content: (
          <p>
            {t(
              'tutorial.welcome.content',
              'Tensho is a roguelike game built around Japanese Riichi Mahjong. Your goal is to build scoring hands and reach the target score each round.'
            )}
          </p>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 1 },
          { suit: TileSuit.Dragon, rank: 2 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
      {
        id: 'tiles',
        title: t('tutorial.tiles.title', 'Mahjong Tiles'),
        content: (
          <div className="space-y-2">
            <p>
              {t(
                'tutorial.tiles.content1',
                'There are three main suits: Characters (萬), Circles (筒), and Bamboo (索), each numbered 1-9.'
              )}
            </p>
            <p>
              {t(
                'tutorial.tiles.content2',
                'Honor tiles include Winds (East, South, West, North) and Dragons (White, Green, Red).'
              )}
            </p>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Manzu, rank: 1 },
          { suit: TileSuit.Pinzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 9 },
          { suit: TileSuit.Wind, rank: 1 },
        ],
      },
      {
        id: 'hands',
        title: t('tutorial.hands.title', 'Building Hands'),
        content: (
          <div className="space-y-2">
            <p>
              {t(
                'tutorial.hands.content1',
                'A winning hand consists of 4 groups (melds) plus 1 pair.'
              )}
            </p>
            <p>
              {t(
                'tutorial.hands.content2',
                'Groups can be sequences (1-2-3) or triplets (3-3-3).'
              )}
            </p>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Pinzu, rank: 2 },
          { suit: TileSuit.Pinzu, rank: 3 },
          { suit: TileSuit.Pinzu, rank: 4 },
        ],
      },
      {
        id: 'yaku',
        title: t('tutorial.yaku.title', 'Yaku - Scoring Patterns'),
        content: (
          <div className="space-y-2">
            <p>
              {t(
                'tutorial.yaku.content1',
                'Yaku are special patterns that multiply your score. Each yaku has a tier from 1-4.'
              )}
            </p>
            <p>
              {t(
                'tutorial.yaku.content2',
                'Examples: All Simples (no terminals/honors), All Triplets, Full Flush (single suit).'
              )}
            </p>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Souzu, rank: 2 },
          { suit: TileSuit.Souzu, rank: 2 },
          { suit: TileSuit.Souzu, rank: 2 },
        ],
      },
      {
        id: 'decrees',
        title: t('tutorial.decrees.title', 'Decrees - Rule Modifiers'),
        content: (
          <div className="space-y-2">
            <p>
              {t(
                'tutorial.decrees.content1',
                'Decrees are special cards that modify the rules and boost your score.'
              )}
            </p>
            <p>
              {t(
                'tutorial.decrees.content2',
                'Collect powerful decrees from the Tea House (shop) between rounds.'
              )}
            </p>
          </div>
        ),
      },
      {
        id: 'scoring',
        title: t('tutorial.scoring.title', 'Scoring Formula'),
        content: (
          <div className="space-y-2">
            <p className="font-mono bg-[var(--color-forest-green)] p-3 rounded text-center">
              {t('tutorial.scoring.formula', 'Score = (Base + Bonuses) × Multipliers')}
            </p>
            <p>
              {t(
                'tutorial.scoring.content',
                'Reach the target score each round to advance. Higher acts require higher scores!'
              )}
            </p>
          </div>
        ),
      },
      {
        id: 'ready',
        title: t('tutorial.ready.title', "You're Ready!"),
        content: (
          <div className="space-y-2 text-center">
            <p className="text-xl">
              {t('tutorial.ready.content1', 'Good luck on your journey!')}
            </p>
            <p className="text-[var(--color-metallic-gold)]">
              {t(
                'tutorial.ready.content2',
                'Press PLAY to begin your first run.'
              )}
            </p>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
    ],
    [t]
  )

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const currentStepData = steps[currentStep]

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete?.()
      onClose()
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }, [isLastStep, onComplete, onClose, steps.length])

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleDotClick = useCallback((index: number) => {
    setCurrentStep(index)
  }, [])

  const handleClose = useCallback(() => {
    setCurrentStep(0)
    onClose()
  }, [onClose])

  return (
    <Popup
      isOpen={isOpen}
      onClose={handleClose}
      title={currentStepData.title}
      showCloseButton={true}
      closeOnBackdrop={false}
      className="w-[400px] md:w-[500px]"
    >
      {/* Step content */}
      <TutorialStepContent step={currentStepData} />

      {/* Progress dots */}
      <div className="mt-6 mb-4">
        <ProgressDots
          total={steps.length}
          current={currentStep}
          onDotClick={handleDotClick}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4 mt-6">
        <button
          onClick={handlePrev}
          disabled={isFirstStep}
          className={`
            px-6 py-3 rounded-lg font-bold
            border-2 border-[var(--color-metallic-gold)]
            transition-all hover:scale-105 active:scale-95
            ${
              isFirstStep
                ? 'bg-[var(--color-dark-forest)] text-[var(--color-metallic-gold)] opacity-50 cursor-not-allowed'
                : 'bg-[var(--color-forest-green)] text-[var(--color-beige-white)] hover:bg-[var(--color-dark-forest)]'
            }
          `}
        >
          {t('tutorial.prev', '← Back')}
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)]
                     text-[var(--color-beige-white)] font-bold rounded-lg
                     border-2 border-[var(--color-golden-yellow)]
                     transition-all hover:scale-105 active:scale-95"
        >
          {isLastStep ? t('tutorial.finish', 'Start Playing!') : t('tutorial.next', 'Next →')}
        </button>
      </div>

      {/* Skip button */}
      {!isLastStep && (
        <button
          onClick={handleClose}
          className="w-full mt-4 py-2 text-[var(--color-metallic-gold)] text-sm hover:text-[var(--color-golden-yellow)] transition-colors"
        >
          {t('tutorial.skip', 'Skip Tutorial')}
        </button>
      )}
    </Popup>
  )
}

/**
 * Hook to manage tutorial state
 */
export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(() => {
    // Check localStorage for completion status
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tensho_tutorial_completed') === 'true'
    }
    return false
  })

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const complete = useCallback(() => {
    setHasCompleted(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('tensho_tutorial_completed', 'true')
    }
  }, [])

  const reset = useCallback(() => {
    setHasCompleted(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tensho_tutorial_completed')
    }
  }, [])

  return {
    isOpen,
    hasCompleted,
    open,
    close,
    complete,
    reset,
  }
}

export default Tutorial
