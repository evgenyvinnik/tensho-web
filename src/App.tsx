/**
 * Tensho Mahjong Roguelike - Main Application Component
 * Balatro-inspired menu with retro CRT aesthetics
 */

import { useState, useEffect, useMemo, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSpring, animated, useSprings } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import Button from './components/ui/Button';
import { LanguageSelector } from './components/ui/LanguageSelector';
import { getTileImagePath, preloadMenuAssets, preloadTileImages } from './utils/assets';
import { useAudio } from './hooks/useAudio';
import { useGameStore } from './stores/gameStore';
import { TileSuit } from './core/Tile';

const queryClient = new QueryClient();

// Create animated components for React 19 compatibility
const AnimatedDiv = animated('div');
const AnimatedButton = animated('button');

/**
 * Loading fallback for Suspense while i18n loads
 */
function LoadingFallback() {
  return (
    <div className="viewport-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-[var(--color-vibrant-orange)] border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <p className="text-[var(--color-golden-yellow)] text-lg font-ui neon-text-subtle">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Floating tile configuration for background
 */
interface FloatingTile {
  suit: TileSuit;
  rank: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  duration: number;
}

/**
 * Generate random floating tiles for background
 */
function generateFloatingTiles(count: number): FloatingTile[] {
  const tiles: FloatingTile[] = [];
  const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu, TileSuit.Dragon];

  for (let i = 0; i < count; i++) {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const maxRank = suit === TileSuit.Dragon ? 3 : 9;

    tiles.push({
      suit,
      rank: Math.floor(Math.random() * maxRank) + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: (Math.random() - 0.5) * 30,
      scale: 0.6 + Math.random() * 0.4,
      delay: Math.random() * 2000,
      duration: 4000 + Math.random() * 2000,
    });
  }

  return tiles;
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
          await next({ y: -20, rotate: tile.rotation + 5 });
          await next({ y: 0, rotate: tile.rotation });
        }
      },
      config: { duration: tile.duration },
      delay: tile.delay,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {springs.map((spring, index) => {
        const tile = tiles[index];
        const imagePath = getTileImagePath(tile.suit, tile.rank);

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
              opacity: 0.15,
              filter: 'blur(1px)',
            }}
          >
            <img
              src={imagePath}
              alt=""
              className="w-16 h-20 md:w-20 md:h-24 object-contain"
              draggable={false}
            />
          </AnimatedDiv>
        );
      })}
    </div>
  );
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
  );

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
  );

  return (
    <div className="flex items-center gap-4 md:gap-8">
      {springs.map((spring, index) => {
        const tile = featuredTiles[index];
        const imagePath = getTileImagePath(tile.suit, tile.rank);

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
        );
      })}
    </div>
  );
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
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  delay?: number;
  show?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const spring = useSpring({
    from: { opacity: 0, scale: 0.8, y: 30 },
    to: {
      opacity: show ? 1 : 0,
      scale: show ? (isPressed ? 0.95 : isHovered ? 1.05 : 1) : 0.8,
      y: show ? 0 : 30,
    },
    config: { tension: 200, friction: 15 },
    delay: show ? delay : 0,
  });

  const isPrimary = variant === 'primary';
  const baseColor = isPrimary
    ? 'var(--color-vibrant-orange)'
    : 'var(--color-forest-green)';
  const glowColor = isPrimary
    ? 'rgba(255, 87, 34, 0.6)'
    : 'rgba(45, 95, 74, 0.6)';

  return (
    <AnimatedButton
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
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
  );
}

/**
 * Menu Screen Component
 * Displays the main menu with background, title, and buttons
 * Layout based on ARCHITECTURE.MD MainMenu specification
 */
function MenuScreen() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const startNewRun = useGameStore((state) => state.startNewRun);

  // Audio hook for background music
  const audio = useAudio({
    initialVolume: 0.3,
    loop: true,
  });

  // Preload menu assets
  useEffect(() => {
    preloadMenuAssets()
      .then(() => {
        setIsLoading(false);
        // Delay showing content for smooth transition
        setTimeout(() => setShowContent(true), 100);
      })
      .catch((err) => {
        console.error('Failed to load menu assets:', err);
        setIsLoading(false);
        setShowContent(true);
      });
  }, []);

  // Title animation
  const titleSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(-50px)',
    },
    config: { tension: 120, friction: 14 },
    delay: 200,
  });

  // Play button animation (glowing effect)
  const playButtonSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'scale(1)' : 'scale(0.8)',
    },
    config: { tension: 200, friction: 20 },
    delay: 500,
  });

  // Secondary buttons animation
  const secondaryButtonsSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(20px)',
    },
    config: { tension: 200, friction: 20 },
    delay: 650,
  });

  // Language selector animation
  const langSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(-20px)',
    },
    config: { tension: 200, friction: 20 },
    delay: 300,
  });

  // Bottom bar animation
  const bottomSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(50px)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'translateY(0px)' : 'translateY(50px)',
    },
    config: { tension: 120, friction: 14 },
    delay: 800,
  });

  const handlePlay = () => {
    // Start music on first interaction (browser autoplay policy)
    audio.play('dragonDance');
    // Start new game run
    startNewRun();
  };

  const handleTutorial = () => {
    console.log('Tutorial clicked');
    // TODO: Navigate to tutorial
  };

  const handleCollection = () => {
    console.log('Collection clicked');
    // TODO: Navigate to collection
  };

  const handleSettings = () => {
    // Toggle music for now as settings functionality
    audio.toggle();
    console.log('Settings clicked');
  };

  if (isLoading) {
    return (
      <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-beige-white)] text-lg font-ui">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="viewport-full relative overflow-hidden"
      style={{
        backgroundImage: `url(${menuAssets.background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Language selector - top right */}
      <AnimatedDiv
        style={langSpring}
        className="absolute top-4 right-4 z-10 safe-area-top"
      >
        <LanguageSelector />
      </AnimatedDiv>

      {/* Content container - mobile first, portrait layout */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-8 px-4 safe-area-top safe-area-bottom">
        {/* Title section - 天翔 TENSHO */}
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
          {/* PLAY button - glowing primary */}
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

        {/* Bottom bar - trophy and version */}
        <AnimatedDiv
          style={bottomSpring}
          className="flex-shrink-0 w-full flex items-center justify-between px-4 mb-2"
        >
          {/* Trophy/Achievements button */}
          <button
            className="p-2 rounded-full hover:bg-[var(--color-forest-green)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-golden-yellow)]"
            aria-label="Achievements"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
          </button>

          {/* Version number */}
          <span className="text-[var(--color-beige-white)] text-sm opacity-50">
            v0.1.0
          </span>
        </AnimatedDiv>
      </div>
    </div>
  );
}

/**
 * Gameplay Screen Component
 * Layout based on ARCHITECTURE.MD GameScene specification
 */
function GameplayScreen() {
  const { t } = useTranslation();
  const { currentAct, currentRound, score, targetScore, gold, resetGame } = useGameStore();

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
        <span className="text-lg font-bold text-[var(--color-golden-yellow)]">¥{gold}</span>
        <span className="text-lg">ACT {currentAct} - R{currentRound}</span>
        <button
          onClick={resetGame}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center"
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
        <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-2">ROUND TARGET</p>
        <p className="text-4xl font-bold text-[var(--color-golden-yellow)] animate-pulse-glow">{targetScore}</p>
        <p className="text-lg text-[var(--color-beige-white)] mt-2">SCORE: {score}</p>
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
        <span>🍂Autumn</span>
        <span>Draws: 42</span>
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
        <Button variant="secondary" size="sm">
          DRAW
        </Button>
        <Button variant="secondary" size="sm">
          SORT
        </Button>
        <Button variant="primary" size="sm">
          TSUMO
        </Button>
      </div>
    </div>
  );
}

/**
 * Shop Screen Component (Tea House)
 * Layout based on ARCHITECTURE.MD Shop specification
 */
function ShopScreen() {
  const { t } = useTranslation();
  const { nextAct, gold } = useGameStore();

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-dark-forest)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-forest-green)]">
        <span className="text-lg font-bold text-[var(--color-golden-yellow)]">¥{gold}</span>
        <span className="text-lg text-[var(--color-beige-white)]">ROUND COMPLETE</span>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* Shop items */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Row 1 - Decrees and Seals */}
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {[
            { name: 'River Tax', type: 'DECREE', price: 5 },
            { name: 'Phantom Terminal', type: 'DECREE', price: 8 },
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
          REROLL ¥5
        </Button>
        <Button variant="primary" size="md" onClick={nextAct}>
          NEXT ROUND →
        </Button>
      </div>
    </div>
  );
}

/**
 * Game Over Screen Component
 */
function GameOverScreen() {
  const { t } = useTranslation();
  const { score, currentAct, resetGame } = useGameStore();

  return (
    <div className="viewport-full flex flex-col items-center justify-center bg-[var(--color-dark-forest)] p-4">
      <h1 className="text-4xl font-bold text-[var(--color-vibrant-orange)] mb-8">
        Game Over
      </h1>

      <div className="bg-[var(--color-forest-green)] rounded-lg p-6 mb-8 text-[var(--color-beige-white)] text-center">
        <p className="text-lg mb-2">Final Act: {currentAct}</p>
        <p className="text-2xl font-bold text-[var(--color-golden-yellow)]">Score: {score}</p>
      </div>

      <Button variant="primary" size="lg" onClick={resetGame}>
        {t('menu.play')} Again
      </Button>
    </div>
  );
}

/**
 * Main App Component with phase-based routing
 */
function AppContent() {
  const phase = useGameStore((state) => state.phase);

  switch (phase) {
    case 'menu':
      return <MenuScreen />;
    case 'gameplay':
      return <GameplayScreen />;
    case 'shop':
      return <ShopScreen />;
    case 'gameOver':
      return <GameOverScreen />;
    default:
      return <MenuScreen />;
  }
}

/**
 * Main App Component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <AppContent />
      </Suspense>
    </QueryClientProvider>
  );
}

export default App;
