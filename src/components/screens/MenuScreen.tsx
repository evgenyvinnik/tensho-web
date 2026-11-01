/**
 * MenuScreen Component
 *
 * Main menu screen with Balatro-inspired design, CRT effects, and floating tiles.
 * Entry point for the game: New Run plus the Codex, Settings, Achievements and
 * Collection pavilions, each marked with its room's painted emblem.
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
  preloadTileImages,
} from '../../utils/assets'
import { useAudio } from '../../hooks/useAudio'
import { useClassicPersistence } from '../../game/useClassicPersistence'
import {
  startConfiguredClassicRun,
  classicDestination,
} from '../../game/classicPersistenceApp'
import { ClassicResumeCard } from '../menu/ClassicResumeCard'
import { FORMATTED_APP_VERSION } from '../../utils/version'
import { TileSuit } from '../../core/Tile'
import { useAppNavigation, ROUTES } from '../../router'
import type { AudioTrack } from '../../utils/assets'
import { VolumeMutedIcon } from '../ui/Icons'
import { ControlIcon } from '../ui/ControlIcon'
import { PavilionPageIcon } from '../ui/PavilionIcon'

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
  disabled?: boolean
  /** The main call to action: taller, warmer, with a tile emblem. */
  hero?: boolean
  /** A small tile shown beside the label (decorative). */
  emblem?: string
  /** A decorative icon in front of the label, on the same line (size in em). */
  icon?: React.ReactNode
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
  disabled = false,
  hero = false,
  emblem,
  icon,
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
      disabled={disabled}
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
        relative w-full font-ui font-bold disabled:cursor-wait disabled:opacity-50
        ${hero ? 'rounded-xl px-4 py-4 text-xl sm:text-2xl' : compact ? '@container rounded-lg px-2 py-2.5 tracking-wide sm:px-3' : 'rounded-lg px-6 py-3 text-lg md:text-xl'}
        text-[var(--color-beige-white)] uppercase ${compact ? '' : 'tracking-wider'}
        ${hero ? 'border-[3px]' : 'border-2'} transition-colors duration-200
        ${isPrimary ? 'border-[var(--color-golden-yellow)]' : 'border-[var(--color-metallic-gold)]'}
        ${isPrimary ? 'button-pulse' : ''}
      `}
      style={{
        opacity: spring.opacity,
        transform: spring.scale.to(
          (s) => `scale(${s}) translateY(${spring.y.get()}px)`
        ),
        background: hero
          ? 'linear-gradient(135deg, #ff7a45 0%, var(--color-vibrant-orange) 45%, #c2410c 100%)'
          : baseColor,
        boxShadow: isHovered
          ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 0 20px rgba(255,255,255,0.1)`
          : hero
            ? `0 0 24px ${glowColor}, 0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)`
            : `0 0 15px ${glowColor}, 0 0 30px rgba(0,0,0,0.3)`,
      }}
    >
      {/* Compact labels size to the button (11-14px), so the longest one,
          with its icon, stays on one line in a two-column grid on phones. */}
      <span
        className={`relative z-10 flex items-center justify-center ${compact ? 'gap-1.5 text-[length:clamp(11px,9cqi,14px)] sm:gap-2' : 'gap-3'}`}
      >
        {emblem && (
          <img
            src={emblem}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`${hero ? 'h-14 w-10' : 'h-10 w-7'} shrink-0 -rotate-6 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]`}
          />
        )}
        {icon}
        <span className="neon-text-subtle min-w-0 leading-tight">
          {children}
        </span>
      </span>
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
  const [showContent, setShowContent] = useState(false)
  const [floatingTiles] = useState(() => generateFloatingTiles(12))
  const { service, disk } = useClassicPersistence()
  const [starting, setStarting] = useState(false)
  const tutorial = useTutorial()
  useEffect(() => {
    service.refresh()
  }, [service])

  // Audio hook for background music
  const audio = useAudio()

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

  // Artwork warms in the background; a slow image must never hide navigation,
  // saved-run recovery, or update controls. Keep the existing entrance animation.
  useEffect(() => {
    setShowContent(true)
    void preloadTileImages().catch((err) => {
      console.error('Failed to load assets:', err)
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

  const startConfiguredRun = async (expectedRaw: string | null) => {
    if (starting) return
    setStarting(true)
    audio.play()
    try {
      if (await startConfiguredClassicRun(expectedRaw))
        navigateTo(classicDestination())
    } finally {
      setStarting(false)
    }
  }

  // New Run always starts the configured run. It atomically replaces exactly
  // the record read here; a failed write leaves that record untouched.
  const handlePlay = () => {
    if (starting) return
    void startConfiguredRun(
      disk.kind === 'ready' || disk.kind === 'invalid' ? disk.raw : null
    )
  }

  // Called when tutorial is completed - start the game
  const handleTutorialComplete = () => {
    tutorial.complete()
    handlePlay()
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
              <ClassicResumeCard />

              <NeonButton
                onClick={handlePlay}
                disabled={starting}
                variant="primary"
                hero
                emblem={getTileImagePath(TileSuit.Dragon, 3)}
                delay={650}
                show={showContent}
              >
                {t('menu.newRun')}
              </NeonButton>

              <div className="grid w-full grid-cols-2 gap-3">
                <NeonButton
                  compact
                  onClick={handleCodex}
                  variant="secondary"
                  delay={750}
                  show={showContent}
                  icon={<PavilionPageIcon page="codex" size="2em" />}
                >
                  {t('menu.codex', 'Codex')}
                </NeonButton>

                <NeonButton
                  compact
                  onClick={handleSettings}
                  variant="secondary"
                  delay={850}
                  show={showContent}
                  icon={<PavilionPageIcon page="settings" size="2em" />}
                >
                  {t('menu.settings')}
                </NeonButton>

                <NeonButton
                  compact
                  onClick={handleAchievements}
                  variant="secondary"
                  delay={950}
                  show={showContent}
                  icon={<PavilionPageIcon page="achievements" size="2em" />}
                >
                  {t('menu.achievements', 'Achievements')}
                </NeonButton>

                <NeonButton
                  compact
                  onClick={handleCollection}
                  variant="secondary"
                  delay={1050}
                  show={showContent}
                  icon={<PavilionPageIcon page="collection" size="2em" />}
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
                  {audio.isMuted ? (
                    <VolumeMutedIcon size={24} />
                  ) : (
                    <ControlIcon name="sound" size={24} />
                  )}
                </button>
                <span className="text-sm opacity-60 font-ui">
                  {audio.isMuted ? t('menu.musicOff') : t('menu.musicOn')}
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
