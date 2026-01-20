/**
 * Menu Screen Component
 * Main menu with game title and navigation buttons
 */

import { useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import { LanguageSelector } from '../ui/LanguageSelector'
import { preloadMenuAssets } from '../../utils/assets'
import { useAudio } from '../../hooks/useAudio'
import { useAppNavigation, ROUTES } from '../../router'

const AnimatedDiv = animated('div')

export function MenuScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  // Audio hook for background music
  const audio = useAudio({
    initialVolume: 0.3,
    loop: true,
  })

  // Preload menu assets
  useEffect(() => {
    preloadMenuAssets()
      .then(() => {
        setIsLoading(false)
        setTimeout(() => setShowContent(true), 100)
      })
      .catch((err) => {
        console.error('Failed to load menu assets:', err)
        setIsLoading(false)
        setShowContent(true)
      })
  }, [])

  // Title animation
  const titleSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(-50px)',
    },
    config: { tension: 120, friction: 14 },
    delay: 200,
  })

  // Play button animation
  const playButtonSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'scale(1)' : 'scale(0.8)',
    },
    config: { tension: 200, friction: 20 },
    delay: 500,
  })

  // Secondary buttons animation
  const secondaryButtonsSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(20px)',
    },
    config: { tension: 200, friction: 20 },
    delay: 650,
  })

  // Language selector animation
  const langSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(-20px)',
    },
    config: { tension: 200, friction: 20 },
    delay: 300,
  })

  // Bottom bar animation
  const bottomSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(50px)',
    },
    config: { tension: 120, friction: 14 },
    delay: 800,
  })

  const handlePlay = () => {
    audio.play('dragonDance')
    navigateTo(ROUTES.PLAY)
  }

  const handleTutorial = () => {
    navigateTo(ROUTES.TUTORIAL)
  }

  const handleCollection = () => {
    navigateTo(ROUTES.COLLECTION)
  }

  const handleSettings = () => {
    navigateTo(ROUTES.SETTINGS)
  }

  const handleAchievements = () => {
    navigateTo(ROUTES.ACHIEVEMENTS)
  }

  if (isLoading) {
    return (
      <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-beige-white)] text-lg font-ui">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="viewport-full relative overflow-hidden bg-[var(--color-dark-forest)]">
      {/* Language selector - top right */}
      <AnimatedDiv
        style={langSpring}
        className="absolute top-4 right-4 z-10 safe-area-top"
      >
        <LanguageSelector />
      </AnimatedDiv>

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-8 px-4 safe-area-top safe-area-bottom">
        {/* Title section */}
        <AnimatedDiv
          style={titleSpring}
          className="flex-shrink-0 mt-12 md:mt-20 text-center"
        >
          <h1 className="text-6xl md:text-8xl font-decorative text-[var(--color-golden-yellow)] text-shadow-lg mb-2">
            天翔
          </h1>
          <p className="text-2xl md:text-3xl font-ui text-[var(--color-beige-white)] tracking-widest">
            TENSHO
          </p>
        </AnimatedDiv>

        {/* Buttons section */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          {/* PLAY button */}
          <AnimatedDiv style={playButtonSpring}>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlay}
              className="w-[220px] md:w-[280px] text-xl font-bold animate-pulse-glow"
            >
              {t('menu.play')}
            </Button>
          </AnimatedDiv>

          {/* Secondary buttons */}
          <AnimatedDiv style={secondaryButtonsSpring} className="flex flex-col items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleTutorial}
              className="w-[200px] md:w-[240px]"
            >
              {t('menu.tutorial')}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleCollection}
              className="w-[200px] md:w-[240px]"
            >
              {t('menu.collection')}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleSettings}
              className="w-[200px] md:w-[240px]"
            >
              {t('menu.settings')}
            </Button>
          </AnimatedDiv>

          {/* Audio indicator */}
          <div className="flex items-center gap-2 text-[var(--color-beige-white)] text-sm mt-2">
            <button
              onClick={() => audio.toggleMute()}
              className="p-2 rounded-full hover:bg-[var(--color-forest-green)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={t('accessibility.toggleMusic')}
            >
              {audio.isMuted ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>
            <span className="opacity-70">
              {audio.isPlaying ? t('menu.musicOn') : t('menu.musicOff')}
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <AnimatedDiv
          style={bottomSpring}
          className="flex-shrink-0 w-full flex items-center justify-between px-4 mb-2"
        >
          <button
            onClick={handleAchievements}
            className="p-2 rounded-full hover:bg-[var(--color-forest-green)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-golden-yellow)]"
            aria-label={t('menu.achievements')}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
          </button>

          <span className="text-[var(--color-beige-white)] text-sm opacity-50">
            v0.1.0
          </span>
        </AnimatedDiv>
      </div>
    </div>
  )
}

export default MenuScreen
