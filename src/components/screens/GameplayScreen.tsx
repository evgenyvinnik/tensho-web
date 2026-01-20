/**
 * Gameplay Screen Component
 * Main game interface with hand, tiles, and scoring
 */

import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import { useGameStore } from '../../stores/gameStore'
import { useAppNavigation, ROUTES } from '../../router'

export function GameplayScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const { currentAct, currentRound, score, targetScore, gold, setPhase } = useGameStore()

  const handleSettings = () => {
    navigateTo(ROUTES.SETTINGS)
  }

  const handleEndRound = () => {
    // Simulate winning a round and going to shop
    setPhase('shop')
    navigateTo(ROUTES.SHOP)
  }

  const handleGameOver = () => {
    setPhase('gameOver')
    navigateTo(ROUTES.GAME_OVER)
  }

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
        <span className="text-lg font-bold text-[var(--color-golden-yellow)]">¥{gold}</span>
        <span className="text-lg">{t('gameplay.act')} {currentAct} - R{currentRound}</span>
        <button
          onClick={handleSettings}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={t('menu.settings')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
      </div>

      {/* Decree bar placeholder */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-16 h-20 bg-[var(--color-dark-forest)] rounded-lg border-2 border-[var(--color-metallic-gold)] flex items-center justify-center text-2xl"
          >
            📜
          </div>
        ))}
        <div className="flex-shrink-0 w-16 h-20 bg-[var(--color-dark-forest)] rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex items-center justify-center text-2xl opacity-50">
          +
        </div>
      </div>

      {/* Round target */}
      <div className="flex-shrink-0 mx-4 my-4 p-4 bg-[var(--color-dark-forest)] rounded-lg text-center">
        <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-2">{t('gameplay.target').toUpperCase()}</p>
        <p className="text-4xl font-bold text-[var(--color-golden-yellow)] animate-pulse-glow">{targetScore}</p>
        <p className="text-lg text-[var(--color-beige-white)] mt-2">{t('gameplay.score').toUpperCase()}: {score}</p>
      </div>

      {/* Play area */}
      <div className="flex-1 mx-4 mb-2 bg-[var(--color-dark-forest)] bg-opacity-50 rounded-lg border-2 border-dashed border-[var(--color-metallic-gold)] flex items-center justify-center">
        <p className="text-[var(--color-beige-white)] opacity-50 text-center px-4">
          Play Area<br/>
          (Selected tiles appear here)
        </p>
      </div>

      {/* Shanten status */}
      <div className="mx-4 mb-2 px-4 py-2 bg-[var(--color-dark-forest)] rounded-lg text-center">
        <span className="text-[var(--color-golden-yellow)] font-bold">2向聴</span>
        <span className="text-[var(--color-beige-white)] mx-2">•</span>
        <span className="text-[var(--color-beige-white)]">Waiting: 3m 6p</span>
      </div>

      {/* Info row */}
      <div className="mx-4 mb-2 flex items-center justify-between text-[var(--color-beige-white)] text-sm">
        <span>🌸×2</span>
        <span>🍂{t('flora.autumn')}</span>
        <span>{t('gameplay.draw')}s: 42</span>
      </div>

      {/* Hand area placeholder */}
      <div className="mx-4 mb-2 p-4 bg-[var(--color-dark-forest)] rounded-lg">
        <div className="flex justify-center gap-1 flex-wrap">
          {['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓'].map((tile, i) => (
            <div
              key={i}
              className="w-[50px] h-[70px] bg-[var(--color-beige-white)] rounded border-2 border-[var(--color-saddle-brown)] flex items-center justify-center text-2xl shadow-tile cursor-pointer hover:-translate-y-2 transition-transform"
            >
              {tile}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
        <Button variant="secondary" size="sm" onClick={handleGameOver}>
          {t('gameplay.discard').toUpperCase()}
        </Button>
        <Button variant="secondary" size="sm">
          {t('gameplay.draw').toUpperCase()}
        </Button>
        <Button variant="primary" size="sm" onClick={handleEndRound}>
          {t('gameplay.tsumo').toUpperCase()}
        </Button>
      </div>
    </div>
  )
}

export default GameplayScreen
