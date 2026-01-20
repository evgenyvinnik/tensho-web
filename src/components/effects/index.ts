/**
 * Effects Components Index for Tensho Mahjong Roguelike
 *
 * Central export point for all visual effect components.
 */

// Particle Effects
export {
  ParticleEffect,
  useParticleEffect,
  type ParticleType,
  type ParticleEffectProps,
} from './ParticleEffect';

// Glow Effects
export {
  GlowEffect,
  GlowOverlay,
  BorderGlow,
  useGlowEffect,
  type GlowVariant,
  type GlowEffectProps,
  type GlowOverlayProps,
  type BorderGlowProps,
} from './GlowEffect';

// Score Popups
export {
  ScorePopup,
  StackingScorePopup,
  TotalScoreReveal,
  useScorePopups,
  type ScorePopupProps,
  type StackingScorePopupProps,
  type TotalScoreRevealProps,
} from './ScorePopup';

// Yaku Reveal
export {
  YakuReveal,
  YakuRevealSequence,
  YakuBanner,
  type YakuRevealProps,
  type YakuRevealSequenceProps,
  type YakuBannerProps,
} from './YakuReveal';

// Screen Flash
export {
  ScreenFlash,
  YakumanFlash,
  VignetteFlash,
  GameOverOverlay,
  useScreenFlash,
  type FlashVariant,
  type ScreenFlashProps,
  type YakumanFlashProps,
  type VignetteFlashProps,
  type GameOverOverlayProps,
} from './ScreenFlash';
