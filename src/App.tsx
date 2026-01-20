/**
 * Tensho Mahjong Roguelike - Main Application Component
 */

import { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import Button from './components/ui/Button';
import { LanguageSelector } from './components/ui/LanguageSelector';
import { menuAssets, preloadMenuAssets } from './utils/assets';
import { useAudio } from './hooks/useAudio';

const queryClient = new QueryClient();

// Create animated div component for React 19 compatibility
const AnimatedDiv = animated('div');

/**
 * Loading fallback for Suspense while i18n loads
 */
function LoadingFallback() {
  return (
    <div className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[var(--color-golden-yellow)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-beige-white)] text-lg font-ui">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Menu Screen Component
 * Displays the main menu with background, title, and buttons
 */
function MenuScreen() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

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

  // Play button animation
  const playButtonSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'scale(1)' : 'scale(0.8)',
    },
    config: { tension: 200, friction: 20 },
    delay: 500,
  });

  // Options button animation
  const optionsButtonSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: {
      opacity: showContent ? 1 : 0,
      transform: showContent ? 'scale(1)' : 'scale(0.8)',
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

  // Bottom decoration animation
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
    // TODO: Navigate to game screen
    console.log('Play clicked');
  };

  const handleOptions = () => {
    // Toggle music for now as options functionality
    audio.toggle();
    console.log('Options clicked');
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
        {/* Title section */}
        <AnimatedDiv
          style={titleSpring}
          className="flex-shrink-0 mt-8 md:mt-16"
        >
          <img
            src={menuAssets.title}
            alt="Tensho - Mahjong Roguelike"
            className="max-w-[280px] md:max-w-[400px] w-full h-auto drop-shadow-lg"
            draggable={false}
          />
        </AnimatedDiv>

        {/* Buttons section */}
        <div className="flex flex-col items-center gap-6 flex-shrink-0">
          <AnimatedDiv style={playButtonSpring}>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlay}
              className="w-[200px] md:w-[240px] text-xl font-bold"
            >
              {t('menu.play')}
            </Button>
          </AnimatedDiv>

          <AnimatedDiv style={optionsButtonSpring}>
            <Button
              variant="secondary"
              size="md"
              onClick={handleOptions}
              className="w-[160px] md:w-[200px]"
            >
              {t('menu.options')}
            </Button>
          </AnimatedDiv>

          {/* Audio indicator */}
          <div className="flex items-center gap-2 text-[var(--color-beige-white)] text-sm">
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

        {/* Bottom decoration */}
        <AnimatedDiv
          style={bottomSpring}
          className="flex-shrink-0 mb-4"
        >
          <img
            src={menuAssets.bottom}
            alt=""
            className="max-w-[300px] md:max-w-[400px] w-full h-auto opacity-90"
            draggable={false}
            aria-hidden="true"
          />
        </AnimatedDiv>
      </div>
    </div>
  );
}

/**
 * Main App Component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <MenuScreen />
      </Suspense>
    </QueryClientProvider>
  );
}

export default App;
