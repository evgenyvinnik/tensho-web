/**
 * Tutorial Component for Tensho Mahjong Roguelike
 * Comprehensive multi-step tutorial covering all game mechanics in detail
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'
import { Popup } from './Popup'
import { getTileImagePath } from '../../utils/assets'
import { useTutorialSteps } from '../screens/tutorial/useTutorialSteps'
import type { TutorialStep } from '../screens/tutorial/TutorialComponents'

const AnimatedDiv = animated('div')



export interface TutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

function TutorialStepContent({ step }: { step: TutorialStep }) {
  const tileSpring = useSpring({ from: { opacity: 0, y: 20 }, to: { opacity: 1, y: 0 }, config: { tension: 200, friction: 20 }, delay: 200 })
  return (
    <div className="space-y-4">
      {step.category && <div className="inline-block px-2 py-1 text-xs rounded bg-[var(--color-forest-green)] text-[var(--color-metallic-gold)] border border-[var(--color-metallic-gold)]/30">{step.category}</div>}
      <div className="text-base leading-relaxed">{step.content}</div>
      {step.showTiles && step.showTiles.length > 0 && (
        <AnimatedDiv className="flex justify-center gap-2 py-4 flex-wrap" style={{ opacity: tileSpring.opacity, transform: tileSpring.y.to((y) => `translateY(${y}px)`) }}>
          {step.showTiles.map((tile, index) => <img key={index} src={getTileImagePath(tile.suit, tile.rank)} alt="" className="w-12 h-16 object-contain drop-shadow-lg" draggable={false} />)}
        </AnimatedDiv>
      )}
      {step.image && <div className="flex justify-center py-4"><img src={step.image} alt="" className="max-w-full max-h-48 object-contain rounded-lg" draggable={false} /></div>}
    </div>
  )
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = ((current + 1) / total) * 100
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[var(--color-metallic-gold)] mb-1"><span>Step {current + 1} of {total}</span><span>{Math.round(percentage)}%</span></div>
      <div className="w-full h-2 bg-[var(--color-dark-forest)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--color-vibrant-orange)] to-[var(--color-golden-yellow)] transition-all duration-300" style={{ width: `${percentage}%` }} /></div>
    </div>
  )
}

function CategoryNav({ categories, currentCategory, onCategoryClick }: { categories: string[]; currentCategory: string; onCategoryClick: (category: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center mb-4">
      {categories.map((cat) => <button key={cat} onClick={() => onCategoryClick(cat)} className={`px-2 py-1 text-xs rounded transition-all ${cat === currentCategory ? 'bg-[var(--color-vibrant-orange)] text-white' : 'bg-[var(--color-forest-green)] text-[var(--color-metallic-gold)] hover:bg-[var(--color-dark-forest)]'}`}>{cat}</button>)}
    </div>
  )
}

export function Tutorial({ isOpen, onClose, onComplete }: TutorialProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = useTutorialSteps()

  const categories = useMemo(() => { const cats = new Set<string>(); steps.forEach((step) => step.category && cats.add(step.category)); return Array.from(cats) }, [steps])
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const currentStepData = steps[currentStep]

  const handleNext = useCallback(() => { if (isLastStep) { onComplete?.(); onClose() } else { setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1)) } }, [isLastStep, onComplete, onClose, steps.length])
  const handlePrev = useCallback(() => { setCurrentStep((prev) => Math.max(prev - 1, 0)) }, [])
  const handleCategoryClick = useCallback((category: string) => { const index = steps.findIndex((s) => s.category === category); if (index !== -1) setCurrentStep(index) }, [steps])
  const handleClose = useCallback(() => { setCurrentStep(0); onClose() }, [onClose])

  return (
    <Popup isOpen={isOpen} onClose={handleClose} title={currentStepData.title} showCloseButton={true} closeOnBackdrop={false} className="w-[95vw] max-w-[550px] max-h-[85vh] overflow-hidden">
      <div className="flex flex-col h-full max-h-[60vh]">
        <CategoryNav categories={categories} currentCategory={currentStepData.category || ''} onCategoryClick={handleCategoryClick} />
        <div className="flex-1 overflow-y-auto pr-2 -mr-2"><TutorialStepContent step={currentStepData} /></div>
        <div className="mt-4 pt-4 border-t border-[var(--color-metallic-gold)]/20"><ProgressBar current={currentStep} total={steps.length} /></div>
        <div className="flex justify-between gap-4 mt-4">
          <button onClick={handlePrev} disabled={isFirstStep} className={`px-4 py-2 rounded-lg font-bold text-sm border-2 border-[var(--color-metallic-gold)] transition-all hover:scale-105 active:scale-95 ${isFirstStep ? 'bg-[var(--color-dark-forest)] text-[var(--color-metallic-gold)] opacity-50 cursor-not-allowed' : 'bg-[var(--color-forest-green)] text-[var(--color-beige-white)] hover:bg-[var(--color-dark-forest)]'}`}>{t('tutorial.prev', '← Back')}</button>
          <button onClick={handleNext} className="px-6 py-2 bg-[var(--color-vibrant-orange)] hover:bg-[var(--color-deep-orange)] text-[var(--color-beige-white)] font-bold rounded-lg text-sm border-2 border-[var(--color-golden-yellow)] transition-all hover:scale-105 active:scale-95">{isLastStep ? t('tutorial.finish', '🎮 Start Playing!') : t('tutorial.next', 'Next →')}</button>
        </div>
        {!isLastStep && (<button onClick={handleClose} className="w-full mt-3 py-2 text-[var(--color-metallic-gold)] text-xs hover:text-[var(--color-golden-yellow)] transition-colors">{t('tutorial.skip', 'Skip Tutorial')}</button>)}
      </div>
    </Popup>
  )
}

export function useTutorial() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(() => { if (typeof window !== 'undefined') { return localStorage.getItem('tensho_tutorial_completed') === 'true' } return false })
  const open = useCallback(() => { setIsOpen(true) }, [])
  const close = useCallback(() => { setIsOpen(false) }, [])
  const complete = useCallback(() => { setHasCompleted(true); if (typeof window !== 'undefined') { localStorage.setItem('tensho_tutorial_completed', 'true') } }, [])
  const reset = useCallback(() => { setHasCompleted(false); if (typeof window !== 'undefined') { localStorage.removeItem('tensho_tutorial_completed') } }, [])
  return { isOpen, hasCompleted, open, close, complete, reset }
}

export default Tutorial
