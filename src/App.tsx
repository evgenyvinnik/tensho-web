/**
 * Tensho Mahjong Roguelike - Main Application Component
 * Uses React Router for language-prefixed navigation with CRT aesthetics
 */

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSpring, animated, useSprings } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import Button from './components/ui/Button'
import { LanguageSelector } from './components/ui/LanguageSelector'
import { Tutorial, useTutorial } from './components/ui/Tutorial'
import { SongNotification } from './components/ui/SongNotification'
import { AchievementsScreen } from './components/screens/AchievementsScreen'
import { getTileImagePath, preloadMenuAssets, preloadTileImages } from './utils/assets'
import { useAudio } from './hooks/useAudio'
import { useResponsiveTileSize } from './hooks/useResponsiveTileSize'
import { useGameStore } from './stores/gameStore'
import { Tile, TileSuit, generateTileId } from './core/Tile'
import { HandWithDiscardZone } from './components/hand/AnimatedHand'
import { createAppRouter, AppRouterProvider, useAppNavigation, ROUTES } from './router'
import type { AudioTrack } from './utils/assets'

const queryClient = new QueryClient()

// Create animated components for React 19 compatibility
const AnimatedDiv = animated('div')
const AnimatedButton = animated('button')

/**
 * Loading fallback for Suspense while i18n loads
 */
function LoadingFallback() {
  return (
    <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-[var(--color-vibrant-orange)] border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-[var(--color-golden-yellow)] text-lg font-ui neon-text-subtle">Loading...</p>
      </div>
    </div>
  )
}

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

/**
 * Generate random floating tiles for background
 */
function generateFloatingTiles(count: number): FloatingTile[] {
  const tiles: FloatingTile[] = []
  const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu, TileSuit.Dragon]

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

/**
 * Floating Tiles Background Component
 */
function FloatingTilesBackground({ tiles }: { tiles: FloatingTile[] }) {
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
                (y) => `translateY(${y}px) rotate(${spring.rotate.get()}deg) scale(${tile.scale})`
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

/**
 * Featured Tiles Display - shows rotating dragon tiles in the center
 */
function FeaturedTiles({ show }: { show: boolean }) {
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

/**
 * Neon Button Component for Balatro-style menu
 */
function NeonButton({
  children,
  onClick,
  variant = 'primary',
  delay = 0,
  show = true,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary'
  delay?: number
  show?: boolean
}) {
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
        relative px-12 py-4 rounded-lg font-ui font-bold text-xl md:text-2xl
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
  const { startNewRun, setPhase } = useGameStore()
  const tutorial = useTutorial()

  // Audio hook for background music
  const audio = useAudio({
    initialVolume: 0.3,
    loop: true,
  })

  // Track song changes for notification
  const [notificationTrack, setNotificationTrack] = useState<AudioTrack | null>(null)
  const previousTrackRef = useRef<AudioTrack | null>(null)

  // Watch for track changes and trigger notification
  useEffect(() => {
    if (audio.currentTrack && audio.currentTrack !== previousTrackRef.current && audio.isPlaying) {
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

  const handlePlay = () => {
    // Show tutorial for first-time users
    if (!tutorial.hasCompleted) {
      tutorial.open()
      return
    }
    audio.play()
    startNewRun()
    setPhase('gameplay')
    navigateTo(ROUTES.PLAY)
  }

  // Called when tutorial is completed - start the game
  const handleTutorialComplete = () => {
    tutorial.complete()
    audio.play()
    startNewRun()
    setPhase('gameplay')
    navigateTo(ROUTES.PLAY)
  }

  const handleTutorial = () => {
    tutorial.open()
  }

  const handleSettings = () => {
    navigateTo(ROUTES.SETTINGS)
  }

  const handleAchievements = () => {
    navigateTo(ROUTES.ACHIEVEMENTS)
  }

  // Loading screen with Balatro-style spinner
  if (isLoading) {
    return (
      <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-[var(--color-vibrant-orange)] border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
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
      <div className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6 safe-area-top safe-area-bottom z-10">

        {/* Title section - 天翔 TENSHO */}
        <AnimatedDiv
          className="flex-shrink-0 mt-8 md:mt-16 text-center"
          style={{
            opacity: titleSpring.opacity,
            transform: titleSpring.scale.to(
              (s) => `scale(${s}) translateY(${titleSpring.y.get()}px)`
            ),
          }}
        >
          <h1 className="font-decorative text-6xl md:text-8xl text-[var(--color-golden-yellow)] title-glow mb-2">
            天翔
          </h1>
          <h2 className="font-decorative text-3xl md:text-4xl text-[var(--color-vibrant-orange)] neon-text-subtle tracking-widest">
            TENSHO
          </h2>
          <p className="font-ui text-sm md:text-base text-[var(--color-beige-white)] opacity-70 mt-4 tracking-wide">
            {t('menu.subtitle', 'MAHJONG ROGUELIKE')}
          </p>
        </AnimatedDiv>

        {/* Center area - featured dragon tiles */}
        <div className="flex-1 flex items-center justify-center">
          <FeaturedTiles show={showContent} />
        </div>

        {/* Buttons section */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0 mb-8">
          <NeonButton onClick={handlePlay} variant="primary" delay={600} show={showContent}>
            {t('menu.play')}
          </NeonButton>

          <NeonButton onClick={handleTutorial} variant="secondary" delay={700} show={showContent}>
            {t('menu.tutorial', 'Tutorial')}
          </NeonButton>

          <NeonButton onClick={handleSettings} variant="secondary" delay={800} show={showContent}>
            {t('menu.settings')}
          </NeonButton>

          <NeonButton onClick={handleAchievements} variant="secondary" delay={900} show={showContent}>
            {t('menu.achievements', 'Achievements')}
          </NeonButton>

          {/* Audio indicator */}
          <div className="flex items-center gap-3 text-[var(--color-beige-white)] mt-4">
            <button
              onClick={() => audio.toggleMute()}
              className="p-3 rounded-full bg-[var(--color-dark-forest)] hover:bg-[var(--color-forest-green)]
                         transition-all duration-200 border-2 border-[var(--color-saddle-brown)]
                         hover:border-[var(--color-metallic-gold)] hover:scale-110 active:scale-95"
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
            <span className="text-sm opacity-60 font-ui">
              {audio.isPlaying ? t('menu.musicOn') : t('menu.musicOff')}
            </span>
          </div>

          {/* Version */}
          <span className="text-[var(--color-metallic-gold)] text-xs opacity-50 mt-2">
            v0.1.0
          </span>
        </div>
      </div>

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

/**
 * Create a sample hand of Tile objects for testing
 */
function createSampleHand(): Tile[] {
  const tiles: Tile[] = [
    new Tile(TileSuit.Manzu, 1, generateTileId()),
    new Tile(TileSuit.Manzu, 2, generateTileId()),
    new Tile(TileSuit.Manzu, 3, generateTileId()),
    new Tile(TileSuit.Pinzu, 4, generateTileId()),
    new Tile(TileSuit.Pinzu, 5, generateTileId()),
    new Tile(TileSuit.Pinzu, 6, generateTileId()),
    new Tile(TileSuit.Souzu, 7, generateTileId()),
    new Tile(TileSuit.Souzu, 8, generateTileId()),
    new Tile(TileSuit.Souzu, 9, generateTileId()),
    new Tile(TileSuit.Dragon, 1, generateTileId()),
    new Tile(TileSuit.Dragon, 2, generateTileId()),
    new Tile(TileSuit.Dragon, 3, generateTileId()),
    new Tile(TileSuit.Wind, 1, generateTileId()),
  ]
  return tiles
}

/**
 * Gameplay Screen Component
 * Layout based on ARCHITECTURE.MD GameScene specification
 */
export function GameplayScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const { currentAct, currentRound, score, targetScore, gold, setPhase } = useGameStore()

  // Responsive tile size
  const tileSize = useResponsiveTileSize()

  // Hand state
  const [handTiles, setHandTiles] = useState<Tile[]>(() => createSampleHand())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Handle tile click (toggle selection)
  const handleTileClick = useCallback((tile: Tile) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tile.id)) {
        newSet.delete(tile.id)
      } else {
        newSet.add(tile.id)
      }
      return newSet
    })
  }, [])

  // Handle tile discard (when dragged to discard zone)
  const handleTileDiscard = useCallback((tile: Tile) => {
    setHandTiles((prev) => prev.filter((t) => t.id !== tile.id))
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(tile.id)
      return newSet
    })
  }, [])

  const handleSettings = () => {
    navigateTo(ROUTES.SETTINGS)
  }

  const handleEndRound = () => {
    setPhase('shop')
    navigateTo(ROUTES.SHOP)
  }

  const handleGameOver = () => {
    setPhase('gameOver')
    navigateTo(ROUTES.GAME_OVER)
  }

  // Reset hand when navigating back
  const handleDrawTile = useCallback(() => {
    // Add a random tile to the hand (simplified for demo)
    const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
    const suit = suits[Math.floor(Math.random() * suits.length)]
    const rank = Math.floor(Math.random() * 9) + 1
    const newTile = new Tile(suit, rank, generateTileId())
    setHandTiles((prev) => [...prev, newTile])
  }, [])

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

      {/* Hand area with drag-to-discard support */}
      <div className="mx-4 mb-2 p-4 bg-[var(--color-dark-forest)] rounded-lg">
        <HandWithDiscardZone
          tiles={handTiles}
          size={tileSize}
          selectedIds={selectedIds}
          onTileClick={handleTileClick}
          onTileDiscard={handleTileDiscard}
          discardZoneLabel={t('gameplay.discard')}
          overlap={true}
        />
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 px-4 py-4 bg-[var(--color-dark-forest)]">
        <Button variant="secondary" size="sm" onClick={handleGameOver}>
          {t('gameplay.discard').toUpperCase()}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleDrawTile}>
          {t('gameplay.draw').toUpperCase()}
        </Button>
        <Button variant="primary" size="sm" onClick={handleEndRound}>
          {t('gameplay.win').toUpperCase()}
        </Button>
      </div>
    </div>
  )
}

/**
 * Shop Screen Component (Tea House)
 * Layout based on ARCHITECTURE.MD Shop specification
 */
export function ShopScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const { gold, nextAct, setPhase } = useGameStore()

  const handleNextRound = () => {
    nextAct()
    setPhase('gameplay')
    navigateTo(ROUTES.PLAY)
  }

  const handleSettings = () => {
    navigateTo(ROUTES.SETTINGS)
  }

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-dark-forest)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-forest-green)]">
        <span className="text-lg font-bold text-[var(--color-golden-yellow)]">¥{gold}</span>
        <span className="text-lg text-[var(--color-beige-white)]">{t('results.roundComplete')}</span>
        <button
          onClick={handleSettings}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-beige-white)]"
          aria-label={t('menu.settings')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
      </div>

      {/* Shop items */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Shop title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-decorative text-[var(--color-golden-yellow)]">{t('shop.title')}</h2>
          <p className="text-sm text-[var(--color-beige-white)] opacity-70">{t('shop.titleJp')}</p>
        </div>

        {/* Row 1 - Decrees and Seals */}
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {[
            { name: 'River Tax', type: t('decrees.title'), price: 5 },
            { name: 'Phantom Terminal', type: t('decrees.title'), price: 8 },
            { name: 'Lightning', type: 'SEAL', price: 3, icon: '⚡' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 p-3 bg-[var(--color-forest-green)] rounded-lg border-2 border-[var(--color-metallic-gold)] text-center cursor-pointer hover:scale-105 transition-transform"
            >
              <p className="text-xs text-[var(--color-golden-yellow)]">{item.type}</p>
              <p className="text-lg my-2">{item.icon || '📜'}</p>
              <p className="text-sm text-[var(--color-beige-white)] mb-1">{item.name}</p>
              <p className="text-sm text-[var(--color-golden-yellow)]">¥{item.price}</p>
            </div>
          ))}
        </div>

        {/* Row 2 - Packs */}
        <div className="flex gap-3 mb-4">
          {[
            { name: 'Standard Pack', price: 4 },
            { name: 'Premium Pack', price: 6 },
          ].map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 p-3 bg-[var(--color-forest-green)] rounded-lg border-2 border-[var(--color-metallic-gold)] text-center cursor-pointer hover:scale-105 transition-transform"
            >
              <p className="text-xs text-[var(--color-golden-yellow)]">PACK</p>
              <p className="text-3xl my-2">📦</p>
              <p className="text-sm text-[var(--color-beige-white)] mb-1">{item.name}</p>
              <p className="text-sm text-[var(--color-golden-yellow)]">¥{item.price}</p>
            </div>
          ))}
        </div>

        {/* Imperial Charter */}
        <div className="p-4 bg-[var(--color-forest-green)] rounded-lg border-2 border-[var(--color-golden-yellow)]">
          <p className="text-sm text-[var(--color-golden-yellow)] mb-1">IMPERIAL CHARTER</p>
          <p className="text-lg text-[var(--color-beige-white)] font-bold">Abundant Stock</p>
          <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-2">+1 shop slot</p>
          <p className="text-lg text-[var(--color-golden-yellow)]">¥10</p>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-center gap-4 px-4 py-4 border-t border-[var(--color-forest-green)]">
        <Button variant="secondary" size="md">
          {t('shop.rerollCost', { cost: 5 })}
        </Button>
        <Button variant="primary" size="md" onClick={handleNextRound}>
          {t('shop.nextAct')} →
        </Button>
      </div>
    </div>
  )
}

/**
 * Game Over Screen Component
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

/**
 * Main App Component with Router
 */
function App() {
  // Create the router with all screen components
  const router = useMemo(
    () =>
      createAppRouter({
        MenuScreen,
        GameplayScreen,
        ShopScreen,
        GameOverScreen,
        AchievementsScreen,
      }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <AppRouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  )
}

export default App
