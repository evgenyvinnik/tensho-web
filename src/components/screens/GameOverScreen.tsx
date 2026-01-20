/**
 * GameOverScreen Component
 *
 * End-of-run screen displayed when the player loses.
 * Shows final score and act reached with options to retry or return to menu.
 */

import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'

/**
 * GameOverScreen - End-of-run defeat screen
 */
export function GameOverScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const { score, currentAct, resetGame } = useGameStore()

  const handlePlayAgain = () => {
    resetGame()
    navigateTo(ROUTES.MENU)
  }

  const handleReturnToMenu = () => {
    resetGame()
    navigateTo(ROUTES.MENU)
  }

  return (
    <div className="viewport-full flex flex-col items-center justify-center bg-[var(--color-dark-forest)] p-4">
      <h1 className="text-4xl font-bold text-[var(--color-vibrant-orange)] mb-8">
        {t('results.defeat')}
      </h1>

      <div className="bg-[var(--color-forest-green)] rounded-lg p-6 mb-8 text-[var(--color-beige-white)] text-center">
        <p className="text-lg mb-2">{t('gameplay.act')} {currentAct}</p>
        <p className="text-2xl font-bold text-[var(--color-golden-yellow)]">
          {t('results.finalScore')}: {score}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Button variant="primary" size="lg" onClick={handlePlayAgain}>
          {t('results.tryAgain')}
        </Button>
        <Button variant="secondary" size="md" onClick={handleReturnToMenu}>
          {t('results.returnToMenu')}
        </Button>
      </div>
    </div>
  )
}

export default GameOverScreen
