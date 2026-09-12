/**
 * GameOverScreen Component
 *
 * End-of-run screen for defeat, victory, and completed Endless ascents.
 */

import { useTranslation } from 'react-i18next'
import { animated, useSpring } from '@react-spring/web'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController } from '../../game/useGameController'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { Button } from '../ui/Button'
import { TablePattern } from '../ui/TablePattern'

const AnimatedMain = animated('main')

/**
 * GameOverScreen - End-of-run result screen
 */
export function GameOverScreen() {
  const { t, i18n } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const {
    runScore,
    currentAct,
    currentRound,
    hasWonRun,
    hasEnteredEndless,
    continueEndless,
    resetGame,
  } = useGameController()
  const reduceMotion = useReducedMotion()

  const isFreshVictory = hasWonRun && !hasEnteredEndless
  const isEndlessResult = hasWonRun && hasEnteredEndless
  const resultSpring = useSpring({
    from: reduceMotion
      ? { opacity: 1, transform: 'translateY(0px) scale(1)' }
      : { opacity: 1, transform: 'translateY(0px) scale(1)' },
    to: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    config: { tension: 210, friction: 22 },
  })

  const handlePlayAgain = () => {
    resetGame()
    navigateTo(ROUTES.PLAY)
  }

  const handleReturnToMenu = () => {
    resetGame()
    navigateTo(ROUTES.MENU)
  }

  const handleContinueEndless = () => {
    if (continueEndless()) navigateTo(ROUTES.SHOP)
  }

  const title = isFreshVictory
    ? t('results.victory')
    : isEndlessResult
      ? t('results.endlessComplete')
      : t('results.defeat')

  const subtitle = isFreshVictory
    ? t('results.victorySubtitle')
    : isEndlessResult
      ? t('results.endlessSubtitle')
      : t('results.defeatSubtitle')

  return (
    <div className="viewport-full relative overflow-x-hidden overflow-y-auto bg-[var(--color-dark-forest)] p-3 safe-area-top safe-area-bottom sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <TablePattern animated={!reduceMotion} showOrnaments={isFreshVictory} />
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b ${
          isFreshVictory ? 'from-amber-400/20' : 'from-orange-950/30'
        } to-transparent`}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center py-3">
        <AnimatedMain
          aria-live="polite"
          className="w-full max-w-xl rounded-3xl border border-[var(--color-metallic-gold)]/50 bg-[var(--color-dark-forest)]/90 p-4 text-center shadow-2xl backdrop-blur-md sm:p-9"
          style={resultSpring}
        >
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 text-3xl shadow-lg sm:mb-5 sm:h-20 sm:w-20 sm:text-4xl ${
              isFreshVictory
                ? 'border-[var(--color-golden-yellow)] bg-amber-400/15 shadow-amber-400/20'
                : 'border-[var(--color-vibrant-orange)] bg-orange-950/40 shadow-orange-500/10'
            }`}
            aria-hidden="true"
          >
            {isFreshVictory ? '昇' : isEndlessResult ? '∞' : '牌'}
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.32em] text-[var(--color-metallic-gold)]">
            {isFreshVictory
              ? t('results.showdownCleared')
              : t('results.runComplete')}
          </p>
          <h1
            className={`mb-3 text-3xl font-black sm:text-5xl ${
              isFreshVictory
                ? 'text-[var(--color-golden-yellow)] neon-text-subtle'
                : 'text-[var(--color-vibrant-orange)]'
            }`}
          >
            {title}
          </h1>
          <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-[var(--color-beige-white)]/75 sm:mb-7 sm:text-base">
            {subtitle}
          </p>

          <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-[var(--color-metallic-gold)]/25 bg-[var(--color-forest-green)]/55 sm:mb-7">
            <div className="p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-metallic-gold)]">
                {t('gameplay.act')}
              </p>
              <p className="mt-1 text-2xl font-black text-[var(--color-beige-white)]">
                {currentAct}
              </p>
            </div>
            <div className="border-l border-[var(--color-metallic-gold)]/20 p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-metallic-gold)]">
                {t('gameplay.round', 'Round')}
              </p>
              <p className="mt-1 text-2xl font-black text-[var(--color-beige-white)]">
                {currentRound}
              </p>
            </div>
            <div className="col-span-2 min-w-0 border-t border-[var(--color-metallic-gold)]/20 p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-metallic-gold)]">
                {t('results.finalScore')}
              </p>
              <p
                data-result-score
                className="mt-1 break-all text-2xl font-black tabular-nums text-[var(--color-golden-yellow)] sm:text-3xl"
              >
                {runScore.toLocaleString(i18n.resolvedLanguage)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {isFreshVictory && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinueEndless}
                className="w-full min-w-0 whitespace-normal break-words sm:col-span-2"
              >
                {t('results.continueEndless')}
              </Button>
            )}
            <Button
              variant={isFreshVictory ? 'secondary' : 'primary'}
              size={isFreshVictory ? 'md' : 'lg'}
              onClick={handlePlayAgain}
              className="w-full min-w-0 whitespace-normal break-words"
            >
              {t('results.tryAgain')}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleReturnToMenu}
              className="w-full min-w-0 whitespace-normal break-words"
            >
              {t('results.returnToMenu')}
            </Button>
          </div>
        </AnimatedMain>
      </div>
    </div>
  )
}

export default GameOverScreen
