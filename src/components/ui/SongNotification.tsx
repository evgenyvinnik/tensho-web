/**
 * SongNotification Component
 *
 * Displays the currently playing song with different layouts:
 * - Desktop: Shows in the corner (bottom-right)
 * - Mobile: Shows as a toast (center bottom, slides up)
 *
 * Auto-dismisses after a configurable duration.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { AudioTrack, getTrackDisplayName } from '../../utils/assets'

export interface SongNotificationProps {
  /** The track that is now playing */
  track: AudioTrack | null
  /** Duration to show the notification in ms (default: 4000) */
  duration?: number
  /** Called when the notification is dismissed */
  onDismiss?: () => void
}

/**
 * Hook to detect if we're on a mobile device (based on viewport width)
 */
function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}

/**
 * Music note icon component
 */
const MusicNoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
)

/**
 * SongNotification - Shows currently playing track
 */
export const SongNotification: React.FC<SongNotificationProps> = ({
  track,
  duration = 4000,
  onDismiss,
}) => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [displayTrack, setDisplayTrack] = useState<AudioTrack | null>(null)
  const isMobile = useIsMobile()

  // Handle track changes
  useEffect(() => {
    if (track) {
      setDisplayTrack(track)
      setIsVisible(true)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [track, duration])

  // Handle dismiss after animation completes
  const handleAnimationRest = useCallback(() => {
    if (!isVisible && displayTrack) {
      onDismiss?.()
    }
  }, [isVisible, displayTrack, onDismiss])

  // Animation spring - different for mobile vs desktop
  const mobileSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    y: isVisible ? 0 : 50,
    scale: isVisible ? 1 : 0.9,
    config: { tension: 280, friction: 24 },
    onRest: handleAnimationRest,
  })

  const desktopSpring = useSpring({
    opacity: isVisible ? 1 : 0,
    x: isVisible ? 0 : 100,
    scale: isVisible ? 1 : 0.95,
    config: { tension: 260, friction: 26 },
    onRest: handleAnimationRest,
  })

  if (!displayTrack) return null

  const trackName = getTrackDisplayName(displayTrack)

  // Mobile toast layout
  if (isMobile) {
    return (
      <animated.div
        className="fixed bottom-24 left-1/2 z-50 pointer-events-auto"
        style={{
          opacity: mobileSpring.opacity,
          transform: mobileSpring.y.to(
            (y) => `translateX(-50%) translateY(${y}px) scale(${mobileSpring.scale.get()})`
          ),
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-full
                     bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)]
                     shadow-lg backdrop-blur-sm"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(200, 178, 115, 0.15)',
          }}
        >
          {/* Animated music icon */}
          <div className="relative">
            <MusicNoteIcon className="w-5 h-5 text-[var(--color-golden-yellow)]" />
            {/* Pulsing ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: 'var(--color-golden-yellow)',
                opacity: 0.2,
              }}
            />
          </div>

          {/* Track info */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-metallic-gold)] opacity-70">
              {t('menu.nowPlaying')}
            </span>
            <span className="text-sm font-medium text-[var(--color-beige-white)]">
              {trackName}
            </span>
          </div>
        </div>
      </animated.div>
    )
  }

  // Desktop corner layout
  return (
    <animated.div
      className="fixed bottom-6 right-6 z-50 pointer-events-auto"
      style={{
        opacity: desktopSpring.opacity,
        transform: desktopSpring.x.to(
          (x) => `translateX(${x}px) scale(${desktopSpring.scale.get()})`
        ),
      }}
    >
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-xl
                   bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)]
                   shadow-xl backdrop-blur-sm"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(200, 178, 115, 0.1)',
          minWidth: '240px',
        }}
      >
        {/* Music icon with animated bars */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--color-forest-green)]">
          <MusicNoteIcon className="w-6 h-6 text-[var(--color-golden-yellow)]" />
          {/* Audio visualizer bars */}
          <div className="absolute bottom-1 left-1 right-1 flex items-end justify-center gap-0.5 h-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 bg-[var(--color-golden-yellow)] rounded-sm"
                style={{
                  animation: `audio-bar 0.5s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`,
                  height: '40%',
                }}
              />
            ))}
          </div>
        </div>

        {/* Track info */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[var(--color-metallic-gold)] opacity-70 mb-0.5">
            {t('menu.nowPlaying')}
          </span>
          <span className="text-base font-medium text-[var(--color-beige-white)]">
            {trackName}
          </span>
        </div>

        {/* Decorative wave icon */}
        <div className="ml-auto opacity-30">
          <svg className="w-5 h-5 text-[var(--color-golden-yellow)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
          </svg>
        </div>
      </div>
    </animated.div>
  )
}

export default SongNotification
