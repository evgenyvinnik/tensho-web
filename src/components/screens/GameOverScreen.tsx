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
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const {
    runScore,
    currentAct,
    currentRound,
    hasWonRun,
    continueEndless,
    resetGame,
  } = useGameController()
  const reduceMotion = useReducedMotion()

  const isFreshVictory = hasWonRun && currentAct === 8
  const isEndlessResult = hasWonRun && currentAct > 8
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
    ? t('results.victory', 'Victory')
    : isEndlessResult
      ? t('results.endlessComplete', 'Endless Ascent Complete')
      : t('results.defeat')

  const subtitle = isFreshVictory
    ? t(
        'results.victorySubtitle',
        'The Act 8 Showdown is yours. Your run is secured.'
      )
    : isEndlessResult
      ? t(
          'results.endlessSubtitle',
          'Your victory stands—and the ascent will be remembered.'
        )
      : t(
          'results.defeatSubtitle',
          'The wall closes, but every run leaves you stronger.'
        )

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
              ? t('results.showdownCleared', 'Showdown cleared')
              : t('results.runComplete', 'Run complete')}
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

          <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-[var(--color-metallic-gold)]/25 bg-[var(--color-forest-green)]/55 sm:mb-7">
            <div className="p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-metallic-gold)]">
                {t('gameplay.act')}
              </p>
              <p className="mt-1 text-2xl font-black text-[var(--color-beige-white)]">
                {currentAct}
              </p>
            </div>
            <div className="border-x border-[var(--color-metallic-gold)]/20 p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-metallic-gold)]">
                {t('gameplay.round', 'Round')}
              </p>
              <p className="mt-1 text-2xl font-black text-[var(--color-beige-white)]">
                {currentRound}
              </p>
            </div>
            <div className="min-w-0 p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-metallic-gold)]">
                {t('results.finalScore')}
              </p>
              <p className="mt-1 truncate text-lg font-black tabular-nums text-[var(--color-golden-yellow)] sm:text-2xl">
                {runScore.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isFreshVictory && (
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinueEndless}
                className="w-full sm:w-auto"
              >
                {t('results.continueEndless', 'Continue into Endless')}
              </Button>
            )}
            <Button
              variant={isFreshVictory ? 'secondary' : 'primary'}
              size={isFreshVictory ? 'md' : 'lg'}
              onClick={handlePlayAgain}
              className="w-full sm:w-auto"
            >
              {t('results.tryAgain')}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleReturnToMenu}
              className="w-full sm:w-auto"
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
