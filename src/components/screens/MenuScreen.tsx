/**
 * MenuScreen Component
 *
 * Main menu screen with Balatro-inspired design, CRT effects, and floating tiles.
 * Entry point for the game with Play, Tutorial, Settings, and Achievements options.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSpring, animated, useSprings } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../ui/LanguageSelector'
import { Tutorial, useTutorial } from '../ui/Tutorial'
import { SongNotification } from '../ui/SongNotification'
import { TableStyleButton } from '../menu/TableStyleButton'
import {
  backgroundAssets,
  getTileImagePath,
  preloadMenuAssets,
  preloadTileImages,
} from '../../utils/assets'
import { useAudio } from '../../hooks/useAudio'
import { useGameController } from '../../game/useGameController'
import { useStakeStore } from '../../stores/stakeStore'
import { useTableStyleStore } from '../../stores/tableStyleStore'
import { FORMATTED_APP_VERSION } from '../../utils/version'
import { TileSuit } from '../../core/Tile'
import { useAppNavigation, ROUTES } from '../../router'
import type { AudioTrack } from '../../utils/assets'

// Create animated components for React 19 compatibility
const AnimatedDiv = animated('div')
const AnimatedButton = animated('button')

// =============================================================================
// TYPES
// =============================================================================

/**
 * Floating tile configuration for background
 */
interface FloatingTile {
  suit: TileSuit
  rank: number
  x: number
  y: number
  rotation: number
  scale: number
  delay: number
  duration: number
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate random floating tiles for background
 */
function generateFloatingTiles(count: number): FloatingTile[] {
  const tiles: FloatingTile[] = []
  const suits = [
    TileSuit.Manzu,
    TileSuit.Pinzu,
    TileSuit.Souzu,
    TileSuit.Dragon,
  ]

  for (let i = 0; i < count; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)]
    const maxRank = suit === TileSuit.Dragon ? 3 : 9

    tiles.push({
      suit,
      rank: Math.floor(Math.random() * maxRank) + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: (Math.random() - 0.5) * 30,
      scale: 0.6 + Math.random() * 0.4,
      delay: Math.random() * 2000,
      duration: 4000 + Math.random() * 2000,
    })
  }

  return tiles
}

// =============================================================================
// FLOATING TILES BACKGROUND COMPONENT
// =============================================================================

interface FloatingTilesBackgroundProps {
  tiles: FloatingTile[]
}

function FloatingTilesBackground({ tiles }: FloatingTilesBackgroundProps) {
  const springs = useSprings(
    tiles.length,
    tiles.map((tile) => ({
      from: { y: 0, rotate: tile.rotation },
      to: async (next: (props: object) => Promise<void>) => {
        while (true) {
          await next({ y: -20, rotate: tile.rotation + 5 })
          await next({ y: 0, rotate: tile.rotation })
        }
      },
      config: { duration: tile.duration },
      delay: tile.delay,
    }))
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {springs.map((spring, index) => {
        const tile = tiles[index]
        const imagePath = getTileImagePath(tile.suit, tile.rank)

        return (
          <AnimatedDiv
            key={index}
            className="absolute"
            style={{
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              transform: spring.y.to(
                (y) =>
                  `translateY(${y}px) rotate(${spring.rotate.get()}deg) scale(${tile.scale})`
              ),
              opacity: 0.2,
              filter: 'blur(0.5px)',
            }}
          >
            <img
              src={imagePath}
              alt=""
              className="w-16 h-20 md:w-20 md:h-24 object-contain"
              draggable={false}
            />
          </AnimatedDiv>
        )
      })}
    </div>
  )
}

// =============================================================================
// FEATURED TILES COMPONENT
// =============================================================================

interface FeaturedTilesProps {
  show: boolean
}

/**
 * Featured Tiles Display - shows rotating dragon tiles in the center
 */
function FeaturedTiles({ show }: FeaturedTilesProps) {
  const featuredTiles = useMemo(
    () => [
      { suit: TileSuit.Dragon, rank: 1, label: 'White Dragon' },
      { suit: TileSuit.Dragon, rank: 2, label: 'Green Dragon' },
      { suit: TileSuit.Dragon, rank: 3, label: 'Red Dragon' },
    ],
    []
  )

  const springs = useSprings(
    featuredTiles.length,
    featuredTiles.map((_, index) => ({
      from: { opacity: 0, scale: 0, rotate: -180 },
      to: {
        opacity: show ? 1 : 0,
        scale: show ? 1 : 0,
        rotate: show ? 0 : -180,
      },
      config: { tension: 150, friction: 12 },
      delay: show ? 400 + index * 150 : 0,
    }))
  )

  return (
    <div className="flex items-center gap-4 md:gap-8">
      {springs.map((spring, index) => {
        const tile = featuredTiles[index]
        const imagePath = getTileImagePath(tile.suit, tile.rank)

        return (
          <AnimatedDiv
            key={index}
            className="rotating-tile"
            style={{
              opacity: spring.opacity,
              transform: spring.scale.to(
                (s) => `scale(${s}) rotate(${spring.rotate.get()}deg)`
              ),
              filter:
                'drop-shadow(0 0 20px var(--color-golden-yellow)) drop-shadow(0 0 40px rgba(255,87,34,0.5))',
            }}
          >
            <img
              src={imagePath}
              alt={tile.label}
              className="w-20 h-28 md:w-28 md:h-36 object-contain"
              draggable={false}
            />
          </AnimatedDiv>
        )
      })}
    </div>
  )
}

// =============================================================================
// NEON BUTTON COMPONENT
// =============================================================================

interface NeonButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  compact?: boolean
  delay?: number
  show?: boolean
}

/**
 * Neon Button Component for Balatro-style menu
 */
function NeonButton({
  children,
  onClick,
  variant = 'primary',
  compact = false,
  delay = 0,
  show = true,
}: NeonButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const spring = useSpring({
    from: { opacity: 0, scale: 0.8, y: 30 },
    to: {
      opacity: show ? 1 : 0,
      scale: show ? (isPressed ? 0.95 : isHovered ? 1.05 : 1) : 0.8,
      y: show ? 0 : 30,
    },
    config: { tension: 200, friction: 15 },
    delay: show ? delay : 0,
  })

  const isPrimary = variant === 'primary'
  const baseColor = isPrimary
    ? 'var(--color-vibrant-orange)'
    : 'var(--color-forest-green)'
  const glowColor = isPrimary
    ? 'rgba(255, 87, 34, 0.6)'
    : 'rgba(45, 95, 74, 0.6)'

  return (
    <AnimatedButton
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        relative w-full rounded-lg font-ui font-bold
        ${compact ? 'px-4 py-2.5 text-sm sm:text-base' : 'px-10 py-3.5 text-xl md:text-2xl'}
        text-[var(--color-beige-white)] uppercase tracking-wider
        border-2 transition-colors duration-200
        ${isPrimary ? 'border-[var(--color-golden-yellow)]' : 'border-[var(--color-metallic-gold)]'}
        ${isPrimary ? 'button-pulse' : ''}
      `}
      style={{
        opacity: spring.opacity,
        transform: spring.scale.to(
          (s) => `scale(${s}) translateY(${spring.y.get()}px)`
        ),
        backgroundColor: baseColor,
        boxShadow: isHovered
          ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 0 20px rgba(255,255,255,0.1)`
          : `0 0 15px ${glowColor}, 0 0 30px rgba(0,0,0,0.3)`,
      }}
    >
      <span className="relative z-10 neon-text-subtle">{children}</span>
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div className="absolute inset-0 shimmer opacity-30" />
      </div>
    </AnimatedButton>
  )
}

// =============================================================================
// MENU SCREEN COMPONENT
// =============================================================================

/**
 * Menu Screen Component
 * Balatro-inspired design with CRT effects and floating tiles
 */
export function MenuScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [floatingTiles] = useState(() => generateFloatingTiles(12))
  const { startNewRun } = useGameController()
  const currentStyleId = useTableStyleStore((state) => state.currentStyleId)
  const currentStakeTier = useStakeStore((state) => state.currentStakeTier)
  const currentStakeWallId = useStakeStore((state) => state.currentWallId)
  const selectStake = useStakeStore((state) => state.selectStake)
  const tutorial = useTutorial()

  // Audio hook for background music
  const audio = useAudio({
    initialVolume: 0.3,
    loop: true,
  })

  // Track song changes for notification
  const [notificationTrack, setNotificationTrack] = useState<AudioTrack | null>(
    null
  )
  const previousTrackRef = useRef<AudioTrack | null>(null)

  // Watch for track changes and trigger notification
  useEffect(() => {
    if (
      audio.currentTrack &&
      audio.currentTrack !== previousTrackRef.current &&
      audio.isPlaying
    ) {
      setNotificationTrack(audio.currentTrack)
      previousTrackRef.current = audio.currentTrack
    }
  }, [audio.currentTrack, audio.isPlaying])

  // Preload assets including tiles
  useEffect(() => {
    Promise.all([preloadMenuAssets(), preloadTileImages()])
      .then(() => {
        setIsLoading(false)
        setTimeout(() => setShowContent(true), 100)
      })
      .catch((err) => {
        console.error('Failed to load assets:', err)
        setIsLoading(false)
        setShowContent(true)
      })
  }, [])

  // Title animation
  const titleSpring = useSpring({
    from: { opacity: 0, scale: 0.8, y: -50 },
    to: {
      opacity: showContent ? 1 : 0,
      scale: showContent ? 1 : 0.8,
      y: showContent ? 0 : -50,
    },
    config: { tension: 100, friction: 12 },
    delay: 300,
  })

  // Language selector animation
  const langSpring = useSpring({
    from: { opacity: 0, y: -20 },
    to: {
      opacity: showContent ? 1 : 0,
      y: showContent ? 0 : -20,
    },
    config: { tension: 200, friction: 20 },
    delay: 300,
  })

  const startConfiguredRun = () => {
    const stakeTier =
      currentStakeWallId === currentStyleId ? currentStakeTier : 1
    selectStake(currentStyleId, stakeTier)
    startNewRun(undefined, stakeTier, currentStyleId)
  }

  const handlePlay = () => {
    // Go directly to game - progressive tutorial will show hints during gameplay
    audio.play()
    startConfiguredRun()
    navigateTo(ROUTES.PLAY)
  }

  // Called when tutorial is completed - start the game
  const handleTutorialComplete = () => {
    tutorial.complete()
    audio.play()
    startConfiguredRun()
    navigateTo(ROUTES.PLAY)
  }

  const handleCodex = () => {
    navigateTo(ROUTES.CODEX)
  }

  const handleSettings = () => {
    navigateTo(ROUTES.SETTINGS)
  }

  const handleAchievements = () => {
    navigateTo(ROUTES.ACHIEVEMENTS)
  }

  const handleCollection = () => {
    navigateTo(ROUTES.COLLECTION)
  }

  // Loading screen with Balatro-style spinner
  if (isLoading) {
    return (
      <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin" />
            <div
              className="absolute inset-2 border-4 border-[var(--color-vibrant-orange)] border-b-transparent rounded-full animate-spin"
              style={{
                animationDirection: 'reverse',
                animationDuration: '0.8s',
              }}
            />
          </div>
          <p className="text-[var(--color-golden-yellow)] text-lg font-ui neon-text-subtle">
            {t('common.loading')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="viewport-full relative overflow-hidden bg-[var(--color-forest-green)] crt-glow">
      <div
        aria-hidden="true"
        className="immersive-background absolute inset-0"
        style={{ backgroundImage: `url("${backgroundAssets.menu}")` }}
      />

      {/* Ambient background gradient - using theme colors */}
      <div
        className="absolute inset-0 ambient-glow"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(255, 87, 34, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(255, 213, 79, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(28, 58, 46, 0.4) 0%, transparent 70%)
          `,
        }}
      />

      {/* Floating tiles background */}
      <FloatingTilesBackground tiles={floatingTiles} />

      {/* Language selector - top right */}
      <AnimatedDiv
        className="absolute top-4 right-4 z-20"
        style={{
          opacity: langSpring.opacity,
          transform: langSpring.y.to((y) => `translateY(${y}px)`),
        }}
      >
        <LanguageSelector />
      </AnimatedDiv>

      {/* Main content */}
      <main className="absolute inset-0 z-10 overflow-y-auto safe-area-top safe-area-bottom">
        <div className="screen-canvas flex min-h-full items-center px-5 pb-5 pt-16 sm:px-6 sm:py-7 lg:px-10">
          <div className="grid w-full items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:gap-12 xl:gap-20">
            <section className="flex min-w-0 flex-col items-center justify-center lg:gap-6">
              {/* Title section - 天翔 TENSHO */}
              <AnimatedDiv
                className="flex-shrink-0 text-center"
                style={{
                  opacity: titleSpring.opacity,
                  transform: titleSpring.scale.to(
                    (s) => `scale(${s}) translateY(${titleSpring.y.get()}px)`
                  ),
                }}
              >
                <h1 className="mb-1 font-decorative text-5xl text-[var(--color-golden-yellow)] title-glow md:text-7xl xl:text-8xl">
                  天翔
                </h1>
                <h2 className="font-decorative text-2xl text-[var(--color-vibrant-orange)] neon-text-subtle tracking-widest md:text-3xl">
                  TENSHO
                </h2>
                <p className="mt-2 font-ui text-xs text-[var(--color-beige-white)] opacity-70 tracking-wide md:text-sm">
                  {t('menu.subtitle', 'MAHJONG ROGUELIKE')}
                </p>
              </AnimatedDiv>

              {/* Featured dragon tiles */}
              <div className="flex min-h-[126px] items-center justify-center py-2 md:min-h-[150px] md:py-3 lg:min-h-[220px]">
                <FeaturedTiles show={showContent} />
              </div>
            </section>

            {/* Run setup and navigation */}
            <section className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-[var(--color-metallic-gold)]/25 bg-[var(--color-dark-forest)]/55 p-3 shadow-2xl backdrop-blur-sm sm:p-4 lg:bg-[var(--color-dark-forest)]/75 lg:p-5">
              {/* Table Style Selection Button */}
              <TableStyleButton delay={550} show={showContent} />

              <NeonButton
                onClick={handlePlay}
                variant="primary"
                delay={650}
                show={showContent}
              >
                {t('menu.play')}
              </NeonButton>

              <div className="grid w-full grid-cols-2 gap-3">
                <NeonButton
                  compact
                  onClick={handleCodex}
                  variant="secondary"
                  delay={750}
                  show={showContent}
                >
                  📜 {t('menu.codex', 'Codex')}
                </NeonButton>

                <NeonButton
                  compact
                  onClick={handleSettings}
                  variant="secondary"
                  delay={850}
                  show={showContent}
                >
                  {t('menu.settings')}
                </NeonButton>

                <NeonButton
                  compact
                  onClick={handleAchievements}
                  variant="secondary"
                  delay={950}
                  show={showContent}
                >
                  {t('menu.achievements', 'Achievements')}
                </NeonButton>

                <NeonButton
                  compact
                  onClick={handleCollection}
                  variant="secondary"
                  delay={1050}
                  show={showContent}
                >
                  {t('menu.collection', 'Collection')}
                </NeonButton>
              </div>

              {/* Audio indicator */}
              <div className="mt-1 flex items-center gap-3 text-[var(--color-beige-white)]">
                <button
                  onClick={() => audio.toggle()}
                  className="p-3 rounded-full bg-[var(--color-dark-forest)] hover:bg-[var(--color-forest-green)]
                         transition-all duration-200 border-2 border-[var(--color-saddle-brown)]
                         hover:border-[var(--color-metallic-gold)] hover:scale-110 active:scale-95"
                  aria-label={t('accessibility.toggleMusic')}
                >
                  {!audio.isPlaying ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
                <span className="text-sm opacity-60 font-ui">
                  {audio.isPlaying ? t('menu.musicOn') : t('menu.musicOff')}
                </span>
              </div>

              {/* Version */}
              <span className="text-[var(--color-metallic-gold)] text-xs opacity-50">
                {FORMATTED_APP_VERSION}
              </span>
            </section>
          </div>
        </div>
      </main>

      {/* Tutorial popup */}
      <Tutorial
        isOpen={tutorial.isOpen}
        onClose={tutorial.close}
        onComplete={handleTutorialComplete}
      />

      {/* Song notification - shows when a new track starts playing */}
      <SongNotification
        track={notificationTrack}
        duration={4000}
        onDismiss={() => setNotificationTrack(null)}
      />

      {/* CRT Effects - adjusted for green background */}
      <div className="vignette" />
      <div className="crt-scanlines" />
    </div>
  )
}

export default MenuScreen
